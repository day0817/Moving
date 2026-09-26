document.addEventListener("DOMContentLoaded", () => {
    // データ初期化 (properties.jsから読み込まれたbukkenDataを使用)
    let properties = typeof bukkenData !== 'undefined' ? bukkenData : [];

    // 更新日時の反映
    const lastUpdatedEl = document.getElementById("lastUpdated");
    if (lastUpdatedEl && typeof bukkenUpdatedAt !== "undefined" && bukkenUpdatedAt) {
        lastUpdatedEl.textContent = bukkenUpdatedAt;
        lastUpdatedEl.setAttribute("datetime", bukkenUpdatedAt.replace(/\//g, "-"));
    }

    // 関東7都県（住所の先頭一致でどの都道府県かを判定）
    const KANTO_PREFECTURES = ['東京都', '神奈川県', '埼玉県', '千葉県', '茨城県', '群馬県', '栃木県'];

    // 住所文字列から都道府県を取り出す
    function getPrefecture(address) {
        if (!address) return null;
        return KANTO_PREFECTURES.find(pref => address.startsWith(pref)) || null;
    }

    // 住所文字列から市区町村を取り出す
    function getCity(address) {
        const pref = getPrefecture(address);
        if (!pref) return null;
        const rest = address.slice(pref.length);
        const m = rest.match(/^(.+?[市区町村])/);
        return m ? m[1] : null;
    }

    // 物件の station_walk から最寄り駅一覧をパースする
    function parseStationWalks(stationWalkStr) {
        if (!stationWalkStr) return [];
        const segments = stationWalkStr.split(/\s*\/\s*/);
        const res = [];
        segments.forEach(seg => {
            const match = seg.match(/(?:([^/]+)\/)?([^/駅]+)駅\s*歩(\d+)分/);
            if (match) {
                res.push({
                    line: match[1] ? match[1].trim() : '',
                    station: match[2].trim(),
                    walkMin: parseInt(match[3], 10)
                });
            }
        });
        return res;
    }

    // 駅DB（stationCommuteData）を用いて物件の最適ルートおよび各駅候補を算出
    function getCommuteRouteInfo(p) {
        const candidates = parseStationWalks(p.station_walk);
        const stDb = typeof stationCommuteData !== 'undefined' ? stationCommuteData : {};

        const evaluated = [];
        candidates.forEach(cand => {
            const stInfo = stDb[cand.station];
            if (stInfo && stInfo.station_to_office_min) {
                const doorToDoor = cand.walkMin + stInfo.station_to_office_min;
                const totalWalk = cand.walkMin + (stInfo.arrival_walk_min || 1);
                evaluated.push({
                    station: cand.station,
                    line: cand.line || stInfo.line || p.line,
                    propWalkMin: cand.walkMin,
                    trainMin: stInfo.train_min,
                    transfers: stInfo.transfers,
                    arrivalStation: stInfo.arrival_station || '大手町(東京都)',
                    arrivalWalkMin: stInfo.arrival_walk_min || 1,
                    transitWalkMin: stInfo.transit_walk_min || 0,
                    stationToOfficeMin: stInfo.station_to_office_min,
                    doorToDoor: doorToDoor,
                    totalWalkMin: totalWalk,
                    linesUsed: stInfo.lines_used || cand.line || p.line,
                    routeSummary: stInfo.route_summary || `${cand.station}→大手町`,
                    memo: stInfo.memo,
                    isDb: true
                });
            } else {
                // DB未登録時は既存のプロパティ値で補完
                const isPrimary = (cand.station === p.station);
                const trainM = isPrimary ? p.train_min : (p.train_min || 30);
                const transf = isPrimary ? p.transfers : (p.transfers || 1);
                const arrWalk = 1;
                const transWalk = 4;
                const d2d = cand.walkMin + trainM + arrWalk + transWalk;
                evaluated.push({
                    station: cand.station,
                    line: cand.line || p.line,
                    propWalkMin: cand.walkMin,
                    trainMin: trainM,
                    transfers: transf,
                    arrivalStation: '大手町(東京都)',
                    arrivalWalkMin: arrWalk,
                    transitWalkMin: transWalk,
                    stationToOfficeMin: trainM + arrWalk + transWalk,
                    doorToDoor: d2d,
                    totalWalkMin: cand.walkMin + arrWalk,
                    linesUsed: cand.line || p.line,
                    routeSummary: `${cand.station}→大手町`,
                    memo: '',
                    isDb: false
                });
            }
        });

        if (evaluated.length === 0) {
            evaluated.push({
                station: p.station,
                line: p.line,
                propWalkMin: p.walk_min,
                trainMin: p.train_min,
                transfers: p.transfers,
                arrivalStation: '大手町(東京都)',
                arrivalWalkMin: 1,
                transitWalkMin: 4,
                stationToOfficeMin: p.door_to_door - p.walk_min,
                doorToDoor: p.door_to_door,
                totalWalkMin: p.walk_min + 1,
                linesUsed: p.line,
                routeSummary: `${p.station}→大手町`,
                memo: '',
                isDb: false
            });
        }

        // 最短ドアドア時間のルートを選出（同点なら乗換回数少ない方、総徒歩短い方）
        evaluated.sort((a, b) => {
            if (a.doorToDoor !== b.doorToDoor) return a.doorToDoor - b.doorToDoor;
            if (a.transfers !== b.transfers) return a.transfers - b.transfers;
            return a.totalWalkMin - b.totalWalkMin;
        });

        const best = evaluated[0];
        const others = evaluated.slice(1);

        return { best, others, all: evaluated };
    }

    // 全物件にあらかじめ通勤情報をアタッチ
    properties.forEach(p => {
        p._commuteInfo = getCommuteRouteInfo(p);
    });

    // 浸水リスクデータ（flood_risk.js を scripts/check_flood_risk.py が生成。未生成なら空）
    const floodData = typeof floodRiskData !== 'undefined'
        ? floodRiskData
        : { properties: {}, stations: {}, layers: {}, depth_labels: {} };

    const FLOOD_LEVELS = {
        low: { label: '低', rank: 0 },
        medium: { label: '中', rank: 1 },
        unknown: { label: '要確認', rank: 2 },
        high: { label: '高', rank: 3 },
        extreme: { label: '極高', rank: 4 },
    };
    const HAZARD_MAP_URL = 'https://disaportal.gsi.go.jp/maps/';

    // 物件住所の判定結果と、最寄駅（最速ルートの駅を優先）周辺の判定結果を取り出す
    function getFloodInfo(p) {
        const entry = floodData.properties?.[p.address] || null;
        const bestStation = p._commuteInfo?.best?.station;
        const stationName = floodData.stations?.[bestStation] ? bestStation : p.station;
        return {
            entry,
            level: entry?.level || null,
            station: floodData.stations?.[stationName] || null,
            stationName,
        };
    }

    properties.forEach(p => {
        p._flood = getFloodInfo(p);
    });

    // 判定なしは「要確認」と同じ順位で並べる
    function getFloodRank(p) {
        return FLOOD_LEVELS[p._flood?.level]?.rank ?? FLOOD_LEVELS.unknown.rank;
    }

    function isHighFloodRisk(p) {
        return p._flood?.level === 'high' || p._flood?.level === 'extreme';
    }

    function escapeHtml(str) {
        return String(str ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
    }

    // ========================================================
    // ★評価（自己負担・駅徒歩・ドアドアを各★0〜3で採点し、合計を総★数とする）
    // 浸水リスク「高」「極高」の物件は、他の評価に関係なく総★数を0にする
    // ========================================================
    const STAR_RULES = {
        selfPay: { label: '自己負担', unit: '万円', steps: [[3.4, 3], [4.2, 2], [5.0, 1]] },
        walk: { label: '駅徒歩', unit: '分', steps: [[5, 3], [10, 2], [15, 1]] },
        doorToDoor: { label: 'ドアドア', unit: '分', steps: [[40, 3], [50, 2], [60, 1]] },
    };

    // 上限値以下に入った最初の段の★数。どの段にも入らなければ★0
    function starsFor(ruleKey, value) {
        const rule = STAR_RULES[ruleKey];
        if (!rule) throw new Error(`★評価の基準が未定義です: ${ruleKey}`);
        if (typeof value !== 'number' || Number.isNaN(value)) return 0;
        const hit = rule.steps.find(([max]) => value <= max);
        return hit ? hit[1] : 0;
    }

    function starRuleText(ruleKey) {
        const { label, unit, steps } = STAR_RULES[ruleKey];
        return `${label}: ` + steps.map(([max, stars]) => `${max}${unit}以下★${stars}`).join(' / ');
    }

    function getStarInfo(p) {
        const best = p._commuteInfo?.best || {};
        // 自己負担は小数の誤差（例: 3.4000000000000004）で段を取り違えないよう、表示と同じ小数2桁で比べる
        const selfPay = starsFor('selfPay', Math.round(p.self_pay * 100) / 100);
        const walk = starsFor('walk', best.propWalkMin ?? p.walk_min);
        const doorToDoor = starsFor('doorToDoor', best.doorToDoor ?? p.door_to_door);
        const zeroByFlood = isHighFloodRisk(p);
        return { selfPay, walk, doorToDoor, zeroByFlood, total: zeroByFlood ? 0 : selfPay + walk + doorToDoor };
    }

    properties.forEach(p => {
        p._stars = getStarInfo(p);
    });

    // ========================================================
    // アイコン（単色インラインSVG・色は currentColor で親から受け取る）
    // ========================================================
    const ICON_PATHS = {
        star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
        train: '<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 10h14"/><path d="M9 14h.01"/><path d="M15 14h.01"/><path d="M8 21l2-4"/><path d="M16 21l-2-4"/>',
        home: '<path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
        office: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01"/><path d="M10 21v-3h4v3"/>',
        // 到着駅: 大手町＝地下鉄（トンネルと車両）、東京＝丸の内駅舎（両端のドーム）
        otemachi: '<path d="M3 21V11a9 9 0 0 1 18 0v10"/><rect x="8" y="9" width="8" height="8" rx="2"/><path d="M8 13h8"/><path d="M2 21h20"/>',
        tokyo: '<path d="M2 21h20"/><path d="M3 21V9h5v12"/><path d="M16 21V9h5v12"/><path d="M3 9a2.5 2.5 0 0 1 5 0"/><path d="M16 9a2.5 2.5 0 0 1 5 0"/><path d="M8 13h8"/><path d="M10 13l2-2 2 2"/><path d="M12 21v-4"/>',
        external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
        chevronDown: '<polyline points="6 9 12 15 18 9"/>',
        chevronUp: '<polyline points="18 15 12 9 6 15"/>',
        grip: '<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>',
        alert: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
        car: '<path d="M5 16v-5l2-5h10l2 5v5"/><path d="M3 16h18"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/>',
    };

    function icon(name, extraClass = '') {
        const paths = ICON_PATHS[name];
        if (!paths) throw new Error(`未定義のアイコンです: ${name}`);
        return `<svg class="icon-svg ${extraClass}" viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>`;
    }

    // 到着駅（大手町 / 東京）の見分け。東京駅着はサンケイビルまでの徒歩が長い
    function getArrivalInfo(best) {
        const isTokyo = Boolean(best.arrivalStation && best.arrivalStation.startsWith('東京'));
        return isTokyo
            ? { key: 'tokyo', label: '東京駅着', name: '東京' }
            : { key: 'otemachi', label: '大手町駅着', name: (best.arrivalStation || '大手町').replace(/\(.*\)/, '') };
    }

    // ★3つの並び（塗り＝獲得、線＝未獲得）
    function renderStars(count, ruleKey) {
        const stars = [0, 1, 2].map(i => icon('star', i < count ? 'star-on' : 'star-off')).join('');
        return `<span class="stars" role="img" aria-label="★${count}（3段階中）" title="${escapeHtml(starRuleText(ruleKey))}">${stars}</span>`;
    }

    // 必須カットオフ条件の適用（ドアドア 59分以下 かつ 総徒歩 18分以内）
    properties = properties.filter(p => {
        const best = p._commuteInfo?.best;
        if (!best) return false;
        return (best.doorToDoor <= 59) && (best.totalWalkMin <= 18);
    });

    // 並び替え条件の定義
    // label: 並び順リストの表示 / dir: 並ぶ向き / short: 件数の横に出す短い名前
    const SORT_CRITERIA = {
        'walk-asc': { label: '物件〜駅徒歩', dir: '短い順', short: '駅徒歩', compare: (a, b) => (a._commuteInfo?.best?.propWalkMin ?? a.walk_min) - (b._commuteInfo?.best?.propWalkMin ?? b.walk_min) },
        'total-walk-asc': { label: '総徒歩時間', dir: '短い順', short: '総徒歩', compare: (a, b) => (a._commuteInfo?.best?.totalWalkMin ?? a.walk_min) - (b._commuteInfo?.best?.totalWalkMin ?? b.walk_min) },
        'commute-asc': { label: 'ドアドア時間', dir: '短い順', short: 'ドアドア', compare: (a, b) => (a._commuteInfo?.best?.doorToDoor ?? a.door_to_door) - (b._commuteInfo?.best?.doorToDoor ?? b.door_to_door) },
        'age-asc': { label: '築年数', dir: '浅い順', short: '築年数', compare: (a, b) => parseAge(a.age_floor) - parseAge(b.age_floor) },
        'rent-asc': { label: '自己負担額', dir: '低い順', short: '自己負担', compare: (a, b) => a.self_pay - b.self_pay },
        'menseki-desc': { label: '専有面積', dir: '広い順', short: '面積', compare: (a, b) => parseAreaSize(b.menseki) - parseAreaSize(a.menseki) },
        'flood-asc': { label: '浸水リスク', dir: '低い順', short: '浸水', compare: (a, b) => getFloodRank(a) - getFloodRank(b) },
        'stars-desc': { label: '総★数', dir: '多い順', short: '総★数', compare: (a, b) => b._stars.total - a._stars.total },
    };

    // 要素取得
    const bukkenGrid = document.getElementById("bukkenGrid");
    const areaTabs = document.getElementById("areaTabs");
    const cityTabs = document.getElementById("cityTabs");
    const cityTabsRow = document.getElementById("cityTabsRow");
    const sortPriorityList = document.getElementById("sortPriorityList");
    const sortSummary = document.getElementById("sortSummary");
    const resultCount = document.getElementById("resultCount");
    const legend = document.getElementById("legend");
    const onlyNewCheck = document.getElementById("onlyNewCheck");
    const newBukkenCount = document.getElementById("newBukkenCount");
    const hideFloodRiskCheck = document.getElementById("hideFloodRiskCheck");
    const floodRiskCount = document.getElementById("floodRiskCount");
    const themeToggleBtn = document.getElementById("themeToggleBtn");

    // ========================================================
    // テーマ管理（Solarized Light / Dark）。既定はライト
    // ========================================================
    // 利用者が切り替えたときだけ保存する。旧キー "bukken_theme" は、旧デザインが
    // 起動のたびに既定の "dark" を書き込んでいたため読まない（新しい既定のライトで開くように）
    // ※ index.html の <head> でも同じキーを読んで、描画前に外観を決めている
    const THEME_STORAGE_KEY = "bukken_theme_v2";

    function getInitialTheme() {
        try {
            return localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
        } catch (e) {
            console.warn("外観の設定を読み込めませんでした（ライト表示で開きます）", e);
            return "light";
        }
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute("data-theme", theme);
        if (themeToggleBtn) {
            themeToggleBtn.setAttribute("aria-label", theme === "dark" ? "ライト表示に切り替え" : "ダーク表示に切り替え");
        }
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute("data-theme") || "light";
        const next = current === "light" ? "dark" : "light";
        applyTheme(next);
        try {
            localStorage.setItem(THEME_STORAGE_KEY, next);
        } catch (e) {
            console.warn("外観の設定を保存できませんでした（次回はライト表示で開きます）", e);
        }
    }

    // テーマ初期適用
    applyTheme(getInitialTheme());

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", toggleTheme);
    }

    // 現在のフィルタ・ソート状態
    const state = {
        prefecture: "all",
        city: "all",
        onlyNew: false,
        hideHighFlood: true, // 既定で浸水リスク「高」「極高」を除く（index.html のチェック初期値と合わせる）
        openFlood: new Set(), // 浸水リスク詳細を開いている物件URL（再描画しても開いたままにする）
        sortPriority: ['walk-asc', 'commute-asc', 'total-walk-asc', 'age-asc', 'rent-asc', 'menseki-desc', 'flood-asc', 'stars-desc'],
    };

    // ヘルパー関数: 築年数の数値をパース
    function parseAge(ageFloorStr) {
        if (!ageFloorStr) return 99;
        if (ageFloorStr.includes("新築")) return 0;
        const m = ageFloorStr.match(/築(\d+)年/);
        return m ? parseInt(m[1], 10) : 99;
    }

    // ヘルパー関数: 専有面積の数値をパース
    function parseAreaSize(mensekiStr) {
        if (!mensekiStr) return 0;
        const m = mensekiStr.match(/([\d.]+)m/);
        return m ? parseFloat(m[1]) : 0;
    }

    // フィルタリング処理
    function getFilteredProperties() {
        return properties.filter(p => {
            // NEW物件のみ表示
            if (state.onlyNew && !p.is_new) {
                return false;
            }

            // 浸水リスク「高」「極高」を除く
            if (state.hideHighFlood && isHighFloodRisk(p)) {
                return false;
            }

            // 都道府県フィルタ
            if (state.prefecture !== "all") {
                const pref = getPrefecture(p.address);
                if (pref !== state.prefecture) return false;
            }

            // 市区町村フィルタ
            if (state.city !== "all") {
                const city = getCity(p.address);
                if (city !== state.city) return false;
            }

            return true;
        });
    }

    // ソート処理（優先順位順）
    function sortProperties(list) {
        return [...list].sort((a, b) => {
            for (const key of state.sortPriority) {
                const criterion = SORT_CRITERIA[key];
                if (!criterion) continue;
                const diff = criterion.compare(a, b);
                if (diff !== 0) return diff;
            }
            return 0;
        });
    }

    // NEW物件・浸水リスク高の物件の総数を更新
    function updateNewCount() {
        const count = properties.filter(p => p.is_new).length;
        if (newBukkenCount) {
            newBukkenCount.textContent = count;
        }
        if (floodRiskCount) {
            floodRiskCount.textContent = properties.filter(isHighFloodRisk).length;
        }
    }

    // 都道府県タブ・市区町村タブの描画
    function renderAreaTabs() {
        if (!areaTabs) return;

        const baseProps = properties.filter(p =>
            (!state.onlyNew || p.is_new) && (!state.hideHighFlood || !isHighFloodRisk(p)));

        const prefCounts = {};
        baseProps.forEach(p => {
            const pref = getPrefecture(p.address);
            if (pref) {
                prefCounts[pref] = (prefCounts[pref] || 0) + 1;
            }
        });

        let html = chipHtml('pref', 'all', 'すべて', baseProps.length, state.prefecture === 'all');

        KANTO_PREFECTURES.forEach(pref => {
            const count = prefCounts[pref] || 0;
            if (count > 0 || state.prefecture === pref) {
                html += chipHtml('pref', pref, pref, count, state.prefecture === pref);
            }
        });

        areaTabs.innerHTML = html;
        renderCityTabs(baseProps);
    }

    // エリアのチップ1つ分（kind: 'pref' = 都道府県 / 'city' = 市区町村）
    function chipHtml(kind, value, label, count, isActive) {
        const subClass = kind === 'city' ? ' chip--sub' : '';
        return `<button type="button" class="chip${subClass}" data-${kind}="${escapeHtml(value)}" aria-pressed="${isActive}">${escapeHtml(label)}<span class="chip-count">${count}</span></button>`;
    }

    // 市区町村タブの描画
    function renderCityTabs(baseProps) {
        if (!cityTabs) return;

        if (state.prefecture === 'all') {
            if (cityTabsRow) cityTabsRow.hidden = true;
            cityTabs.innerHTML = '';
            return;
        }

        if (cityTabsRow) cityTabsRow.hidden = false;
        const prefProps = baseProps.filter(p => getPrefecture(p.address) === state.prefecture);

        const cityCounts = {};
        prefProps.forEach(p => {
            const city = getCity(p.address);
            if (city) {
                cityCounts[city] = (cityCounts[city] || 0) + 1;
            }
        });

        let html = chipHtml('city', 'all', '全域', prefProps.length, state.city === 'all');

        Object.keys(cityCounts).sort().forEach(city => {
            html += chipHtml('city', city, city, cityCounts[city], state.city === city);
        });

        cityTabs.innerHTML = html;
    }

    // 通勤の内訳ポップオーバー（上段: 自宅→駅→到着駅→会社の流れ ＋ 下段: 所要時間の内訳・他の駅）
    function renderPopoverHtml(best, others) {
        const arrival = getArrivalInfo(best);
        const station = escapeHtml(best.station);

        return `
            <div class="commute-popover" role="tooltip">
                <div class="pop-head">
                    <span class="pop-title">${icon('train', 'icon-sm')}最速ルートの内訳（${escapeHtml(best.line)}）</span>
                </div>
                <ol class="pop-flow" aria-label="通勤ルート">
                    <li class="pop-node"><span class="pop-dot">${icon('home', 'icon-sm')}</span>自宅</li>
                    <li class="pop-leg">徒歩${best.propWalkMin}分</li>
                    <li class="pop-node"><span class="pop-dot">${icon('train', 'icon-sm')}</span>${station}</li>
                    <li class="pop-leg is-train">電車${best.trainMin}分・乗換${best.transfers}回</li>
                    <li class="pop-node"><span class="pop-dot">${icon(arrival.key, 'icon-sm')}</span>${escapeHtml(arrival.name)}</li>
                    <li class="pop-leg">徒歩${best.arrivalWalkMin}分</li>
                    <li class="pop-node"><span class="pop-dot">${icon('office', 'icon-sm')}</span>会社</li>
                </ol>
                <ul class="pop-breakdown">
                    <li><span>① 物件〜${station}駅 徒歩</span><strong>${best.propWalkMin}分</strong></li>
                    <li><span>② 電車乗車（${escapeHtml(best.linesUsed || best.line)}）</span><strong>${best.trainMin}分</strong></li>
                    <li><span>③ 乗換・構内移動・待ち（乗換${best.transfers}回）</span><strong>${best.transitWalkMin}分</strong></li>
                    <li><span>④ ${escapeHtml(best.arrivalStation)}〜サンケイビル 徒歩</span><strong>${best.arrivalWalkMin}分</strong></li>
                    <li class="total-row"><span>合計ドアドア / 総徒歩</span><strong>${best.doorToDoor}分 / ${best.totalWalkMin}分</strong></li>
                </ul>
                ${others && others.length > 0 ? `
                    <div class="pop-others">
                        <p class="pop-label">他の利用可能駅</p>
                        ${others.map(o => `
                            <div class="pop-other">
                                <span><strong>${escapeHtml(o.station)}駅</strong>（歩${o.propWalkMin}分＋電車${o.trainMin}分）</span>
                                <span>計 <strong>${o.doorToDoor}分</strong>（総徒歩${o.totalWalkMin}分・乗換${o.transfers}回）</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    // 数字の段（自己負担・ドアドア・駅徒歩＋各★）。ホバー/タップで通勤の内訳ポップオーバーを出す
    function renderCommuteVisual(p) {
        const { best, others } = p._commuteInfo;
        const arrival = getArrivalInfo(best);
        const stars = p._stars;
        const arrivalTitle = `${arrival.label}（サンケイビルまで徒歩${best.arrivalWalkMin}分）`;
        const arrivalIconHtml = arrival.key === 'tokyo'
            ? `<span class="arrival-icon" role="img" aria-label="${escapeHtml(arrivalTitle)}" title="${escapeHtml(arrivalTitle)}">${icon(arrival.key, 'icon-sm')}</span>`
            : '';

        return `
            <div class="commute-visual-container" tabindex="0" role="group" aria-label="自己負担・ドアドア・駅徒歩。フォーカスすると通勤の内訳を表示します">
                <div class="stat">
                    <span class="stat-label">自己負担</span>
                    <span class="stat-value">${p.self_pay.toFixed(2)}<span class="stat-unit">万円/月</span></span>
                    ${renderStars(stars.selfPay, 'selfPay')}
                </div>
                <div class="stat">
                    <span class="stat-label">ドアドア${arrivalIconHtml}</span>
                    <span class="stat-value">${best.doorToDoor}<span class="stat-unit">分</span></span>
                    ${renderStars(stars.doorToDoor, 'doorToDoor')}
                </div>
                <div class="stat">
                    <span class="stat-label">駅徒歩</span>
                    <span class="stat-value">${best.propWalkMin}<span class="stat-unit">分</span></span>
                    ${renderStars(stars.walk, 'walk')}
                </div>
                ${renderPopoverHtml(best, others)}
            </div>
        `;
    }

    // カード左上の総★数。浸水リスク「高」「極高」は★0（理由をツールチップに出す）
    function renderStarTotal(p) {
        const s = p._stars;
        const detail = `自己負担★${s.selfPay}・駅徒歩★${s.walk}・ドアドア★${s.doorToDoor}`;
        const title = s.zeroByFlood
            ? `浸水リスク「${FLOOD_LEVELS[p._flood.level].label}」のため総★数は0（${detail}）`
            : `総★数 ${s.total}（${detail}）`;
        const isZero = s.total === 0;
        return `
            <span class="star-total${isZero ? ' is-zero' : ''}" role="img" aria-label="${escapeHtml(title)}" title="${escapeHtml(title)}">
                ${icon('star', isZero ? 'icon-sm' : 'icon-sm star-on')}<span class="num">${s.total}</span>
            </span>
        `;
    }

    // 浸水リスクの1レイヤー分の表示文言
    function formatFloodLayer(key, v) {
        const kind = floodData.layers?.[key]?.kind || 'depth';
        if (!v || v.status === 'unavailable') return { text: '未取得', cls: 'na' };
        if (v.status === 'error') return { text: '取得失敗', cls: 'na' };
        const depthText = rank => rank === -1 ? '区域内（深さは地図で確認）' : (floodData.depth_labels?.[rank] || '区域内');
        if (v.center) return { text: kind === 'area' ? '区域内' : depthText(v.center), cls: 'hit' };
        if (v.nearby) {
            const text = kind === 'area' || v.nearby === -1 ? '周辺に区域あり' : `周辺に ${depthText(v.nearby)}`;
            return { text, cls: 'near' };
        }
        return { text: 'なし', cls: 'none' };
    }

    function floodLevelPill(level) {
        const meta = FLOOD_LEVELS[level];
        return meta ? `<span class="flood-tag lv-${level}">${meta.label}</span>` : '';
    }

    // 評価の根拠となる一文（自動判定の先頭理由 or 手動評価の理由）
    function getFloodReason(entry) {
        if (!entry) return '';
        if (entry.source === 'auto') return entry.auto?.reasons?.[0] || '';
        return entry.manual?.reason || entry.history?.[0]?.text || '';
    }

    function getFloodSourceText(entry) {
        if (entry.source === 'auto') return `ハザードマップ自動判定（${entry.auto.checked_at}）`;
        if (entry.source === 'manual') return `手動評価（${entry.manual.date}）・ハザードマップ自動判定は未実施`;
        return '被害実績のみ';
    }

    function renderFloodBadge(p) {
        const { entry, level } = p._flood;
        if (!level) return '';
        const isOpen = state.openFlood.has(p.url);
        const srcTag = entry.source === 'auto' ? '' : '<span class="flood-src">手動</span>';
        return `
            <button type="button" class="flood-tag flood-toggle lv-${level}" data-flood-toggle aria-expanded="${isOpen}" title="押すと浸水リスクの内訳を表示">
                浸水 ${FLOOD_LEVELS[level].label}${srcTag}${icon('chevronDown', 'icon-xs chev')}
            </button>
        `;
    }

    function renderFloodDetail(p) {
        const { entry, level, station, stationName } = p._flood;
        if (!level) return '';
        const isOpen = state.openFlood.has(p.url);

        const reasons = entry.source === 'auto' ? (entry.auto.reasons || []) : [getFloodReason(entry)].filter(Boolean);
        const raisedNote = entry.source === 'auto' && entry.auto.level !== level
            ? `<div class="flood-raised">※ 地図の判定は「${FLOOD_LEVELS[entry.auto.level]?.label}」。下の被害実績を踏まえて引き上げています</div>`
            : '';

        const layersHtml = entry.source === 'auto'
            ? `<dl class="flood-layer-grid">${Object.keys(floodData.layers || {}).map(key => {
                const f = formatFloodLayer(key, entry.auto.layers?.[key]);
                return `<dt>${escapeHtml(floodData.layers[key].label)}</dt><dd class="flood-layer-${f.cls}">${escapeHtml(f.text)}</dd>`;
            }).join('')}</dl>`
            : '';

        const historyHtml = (entry.history || []).map(h => `
            <li>
                <span class="flood-history-date">${escapeHtml(h.date || '')}</span>
                ${escapeHtml(h.text)}
                ${h.url ? `<a href="${escapeHtml(h.url)}" target="_blank" rel="noopener noreferrer">出典${icon('external', 'icon-xs')}</a>` : ''}
            </li>
        `).join('');

        const stationHtml = station && station.level
            ? `<div class="flood-station">${icon('train', 'icon-xs')}${escapeHtml(stationName)}駅周辺: ${floodLevelPill(station.level)} <span>${escapeHtml(getFloodReason(station))}</span></div>`
            : '';

        // 地図リンク: 判定位置 → 最寄駅 → トップページの順
        let mapUrl = 'https://disaportal.gsi.go.jp/';
        let positionText = '住所で検索して建物の位置を確認してください。';
        if (entry.point) {
            mapUrl = entry.point.map_url;
            const precision = entry.point.precision === 'chome' ? '丁目の代表点' : '町・大字の代表点';
            positionText = `判定位置は${precision}（${escapeHtml(entry.point.title || p.address)}）で、実際の建物の位置とは異なります。`;
        } else if (p.lat && p.lng) {
            mapUrl = `${HAZARD_MAP_URL}?ll=${p.lat},${p.lng}&z=16&base=pale`;
            positionText = '地図は最寄駅周辺を表示します。住所で検索して建物の位置を確認してください。';
        }

        return `
            <div class="flood-detail lv-${level}" ${isOpen ? '' : 'hidden'}>
                <div class="flood-detail-head">
                    ${floodLevelPill(level)}
                    <span class="flood-source">${escapeHtml(getFloodSourceText(entry))}</span>
                </div>
                <ul class="flood-reasons">${reasons.map(r => `<li>${escapeHtml(r)}</li>`).join('')}</ul>
                ${raisedNote}
                ${layersHtml}
                ${historyHtml ? `<div class="flood-history-label">${icon('alert', 'icon-xs')}被害実績など</div><ul class="flood-history">${historyHtml}</ul>` : ''}
                ${stationHtml}
                <div class="flood-foot">
                    <span>${positionText}</span>
                    <a href="${escapeHtml(mapUrl)}" target="_blank" rel="noopener noreferrer" class="flood-map-link">重ねるハザードマップで確認${icon('external', 'icon-xs')}</a>
                </div>
            </div>
        `;
    }

    // 間取り・面積・築年数・階建を1行に（例: 4LDK ・ 84.18m² ・ 築21年 ・ 2階建）
    function formatSpec(p) {
        const area = String(p.menseki || '').replace(/m2$/, 'm²');
        const ageFloor = String(p.age_floor || '').replace('地上', '').split(/\s+/).filter(Boolean);
        return [p.madori, area, ...ageFloor].filter(Boolean).map(escapeHtml).join(' ・ ');
    }

    // 駐車場の注意（有料・100m以上離れている）。問題なければ空文字
    function renderParkingNotes(p) {
        const isPaidParking = (p.parking_fee && p.parking_fee > 0) ||
            (p.parking_text && !p.parking_text.includes('無料') && !p.parking_text.includes('付') && p.parking_text !== '-');
        const notes = [
            isPaidParking ? `駐車場 ${p.parking_fee > 0 ? (p.parking_fee + '万円') : '有料'}` : null,
            (p.parking_dist && p.parking_dist >= 100) ? `駐車場 ${p.parking_dist}m先` : null,
        ].filter(Boolean);
        return notes.length
            ? `<div class="card-notes">${notes.map(t => `<span class="note-tag">${icon('car', 'icon-sm')}${escapeHtml(t)}</span>`).join('')}</div>`
            : '';
    }

    // 物件カード1枚。物件名が SUUMO へのリンクを兼ねる
    function renderCard(p) {
        const best = p._commuteInfo?.best || {};
        const title = escapeHtml(p.title);
        return `
            <article class="c-card bukken-card" data-url="${escapeHtml(p.url)}">
                <div class="card-top">
                    ${renderStarTotal(p)}
                    <span class="card-station">${icon('train', 'icon-sm')}${escapeHtml(best.station || p.station)}駅 <span class="line">${escapeHtml(best.line || p.line)}</span></span>
                    <span class="card-tags">
                        ${p.is_new ? '<span class="new-tag">NEW</span>' : ''}
                        ${renderFloodBadge(p)}
                    </span>
                </div>

                ${renderFloodDetail(p)}

                <h3 class="card-title">
                    <a href="${escapeHtml(p.url)}" target="_blank" rel="noopener noreferrer" title="${title}（SUUMOで開く）">${title}${icon('external', 'icon-xs title-ext')}</a>
                </h3>

                ${renderCommuteVisual(p)}

                <div>
                    <p class="card-meta">${formatSpec(p)}</p>
                    <p class="card-sub">総徒歩${best.totalWalkMin ?? '-'}分・乗換${best.transfers ?? '-'}回 ／ ${escapeHtml(p.address)}</p>
                </div>

                ${renderParkingNotes(p)}
            </article>
        `;
    }

    // 物件カード一覧の描画
    function renderProperties() {
        const filtered = getFilteredProperties();
        const sorted = sortProperties(filtered);

        updateNewCount();
        renderAreaTabs();

        if (resultCount) resultCount.textContent = sorted.length;
        if (sortSummary) {
            const firstThree = state.sortPriority.slice(0, 3).map(key => SORT_CRITERIA[key]?.short).filter(Boolean);
            sortSummary.textContent = `並び順: ${firstThree.join(' → ')} → …`;
        }

        if (!bukkenGrid) return;

        bukkenGrid.innerHTML = sorted.length > 0
            ? sorted.map(renderCard).join('')
            : '<p class="no-results">該当する条件の物件が見つかりませんでした。</p>';
    }

    // 件数の横の凡例: 到着駅アイコンと★の基準（押すと基準表を開く）
    function renderLegend() {
        if (!legend) return;
        const header = [3, 2, 1].map(n => `<th scope="col">★${n}</th>`).join('');
        const rows = Object.entries(STAR_RULES).map(([, rule]) => `
            <tr><th scope="row">${rule.label}</th>${rule.steps.map(([max]) => `<td>${max}${rule.unit}以下</td>`).join('')}</tr>
        `).join('');
        legend.innerHTML = `
            <span class="legend-item">${icon('tokyo', 'icon-sm')}東京駅着</span>
            <details class="sort-pop legend-pop">
                <summary class="legend-item legend-link">${icon('star', 'icon-sm star-on')}★の基準</summary>
                <div class="sort-panel">
                    <table class="rule-table">
                        <thead><tr><th></th>${header}</tr></thead>
                        <tbody>${rows}</tbody>
                    </table>
                    <p class="sort-panel-note">総★数は3項目の★の合計（最大9）。どの段にも入らない項目は★0。浸水リスク「高」「極高」の物件は総★数0。</p>
                </div>
            </details>
        `;
    }

    // 優先順位ソートリストの描画
    function renderSortPriorityList() {
        if (!sortPriorityList) return;

        sortPriorityList.innerHTML = state.sortPriority.map((key, index) => {
            const criterion = SORT_CRITERIA[key];
            if (!criterion) return '';
            const isFirst = index === 0;
            const isLast = index === state.sortPriority.length - 1;

            return `
                <li class="sort-priority-item" draggable="true" data-key="${key}" data-index="${index}">
                    <span class="drag-handle" aria-hidden="true">${icon('grip', 'icon-sm')}</span>
                    <span class="priority-rank">${index + 1}</span>
                    <span class="priority-label">${criterion.label}<small>${criterion.dir}</small></span>
                    <div class="priority-arrows">
                        <button type="button" class="priority-arrow-btn priority-arrow-up" data-action="up" data-index="${index}" ${isFirst ? 'disabled' : ''} title="優先度を上げる" aria-label="${criterion.label}の優先度を上げる">${icon('chevronUp', 'icon-sm')}</button>
                        <button type="button" class="priority-arrow-btn priority-arrow-down" data-action="down" data-index="${index}" ${isLast ? 'disabled' : ''} title="優先度を下げる" aria-label="${criterion.label}の優先度を下げる">${icon('chevronDown', 'icon-sm')}</button>
                    </div>
                </li>
            `;
        }).join('');

        setupSortPriorityDragAndDrop();
    }

    // ソート順序の変更
    function moveSortPriority(fromIndex, toIndex) {
        if (fromIndex < 0 || fromIndex >= state.sortPriority.length) return;
        if (toIndex < 0 || toIndex >= state.sortPriority.length) return;
        if (fromIndex === toIndex) return;

        const newPriority = [...state.sortPriority];
        const [moved] = newPriority.splice(fromIndex, 1);
        newPriority.splice(toIndex, 0, moved);
        state.sortPriority = newPriority;

        renderSortPriorityList();
        renderProperties();
    }

    // ドラッグ＆ドロップイベントの設定
    function setupSortPriorityDragAndDrop() {
        const items = sortPriorityList.querySelectorAll(".sort-priority-item");
        let draggedItem = null;

        items.forEach(item => {
            item.addEventListener("dragstart", (e) => {
                draggedItem = item;
                item.classList.add("dragging");
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", item.getAttribute("data-index"));
            });

            item.addEventListener("dragend", () => {
                if (draggedItem) {
                    draggedItem.classList.remove("dragging");
                    draggedItem = null;
                }
                items.forEach(i => i.classList.remove("drag-over"));
            });

            item.addEventListener("dragover", (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                item.classList.add("drag-over");
            });

            item.addEventListener("dragleave", () => {
                item.classList.remove("drag-over");
            });

            item.addEventListener("drop", (e) => {
                e.preventDefault();
                item.classList.remove("drag-over");
                const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
                const toIndex = parseInt(item.getAttribute("data-index"), 10);
                if (!isNaN(fromIndex) && !isNaN(toIndex) && fromIndex !== toIndex) {
                    moveSortPriority(fromIndex, toIndex);
                }
            });

            item.querySelectorAll(".priority-arrow-btn").forEach(btn => {
                btn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    const action = btn.getAttribute("data-action");
                    const index = parseInt(btn.getAttribute("data-index"), 10);
                    if (action === "up") {
                        moveSortPriority(index, index - 1);
                    } else if (action === "down") {
                        moveSortPriority(index, index + 1);
                    }
                });
            });
        });
    }

    // イベントリスナー設定
    // 1. 都道府県タブクリック
    if (areaTabs) {
        areaTabs.addEventListener("click", (e) => {
            const btn = e.target.closest("[data-pref]");
            if (!btn) return;
            const pref = btn.getAttribute("data-pref");
            if (pref) {
                state.prefecture = pref;
                state.city = "all";
                renderProperties();
            }
        });
    }

    // 2. 市区町村タブクリック
    if (cityTabs) {
        cityTabs.addEventListener("click", (e) => {
            const btn = e.target.closest("[data-city]");
            if (!btn) return;
            const city = btn.getAttribute("data-city");
            if (city) {
                state.city = city;
                renderProperties();
            }
        });
    }

    // 3. NEW物件のみ表示トグル
    if (onlyNewCheck) {
        onlyNewCheck.addEventListener("change", (e) => {
            state.onlyNew = e.target.checked;
            renderProperties();
        });
    }

    // 3b. 浸水リスク高を除くトグル
    if (hideFloodRiskCheck) {
        hideFloodRiskCheck.addEventListener("change", (e) => {
            state.hideHighFlood = e.target.checked;
            renderProperties();
        });
    }

    // 3c. 浸水リスクバッジで詳細パネルを開閉
    if (bukkenGrid) {
        bukkenGrid.addEventListener("click", (e) => {
            const btn = e.target.closest("[data-flood-toggle]");
            if (!btn) return;
            const card = btn.closest(".bukken-card");
            const panel = card?.querySelector(".flood-detail");
            if (!panel) return;
            const willOpen = panel.hasAttribute("hidden");
            panel.toggleAttribute("hidden", !willOpen);
            btn.setAttribute("aria-expanded", String(willOpen));
            const url = card.getAttribute("data-url");
            if (willOpen) state.openFlood.add(url); else state.openFlood.delete(url);
        });
    }

    // 4. 並び順・★の基準のポップオーバー: 外側のクリックと ESC キーで閉じる
    // （並び替えで押したボタンが再描画で消えても判定できるよう、発火時の経路で内外を見る）
    document.addEventListener("click", (e) => {
        const path = e.composedPath();
        document.querySelectorAll("details.sort-pop[open]").forEach(pop => {
            if (!path.includes(pop)) pop.open = false;
        });
    });
    document.addEventListener("keydown", (e) => {
        if (e.key !== "Escape") return;
        document.querySelectorAll("details.sort-pop[open]").forEach(pop => { pop.open = false; });
    });

    // 5. ポップオーバーの画面端はみ出し防止・動的位置調整
    function adjustPopoverPosition(container) {
        if (!container) return;
        const popover = container.querySelector('.commute-popover');
        if (!popover) return;

        const rect = container.getBoundingClientRect();
        const popoverWidth = Math.min(520, window.innerWidth - 32);
        const viewportWidth = window.innerWidth;

        // 親コンテナ中央揃えを基準とした left オフセット
        let leftOffset = (rect.width - popoverWidth) / 2;

        // 画面左端チェック（余白16px確保）
        if (rect.left + leftOffset < 16) {
            leftOffset = 16 - rect.left;
        }
        // 画面右端チェック（余白16px確保）
        else if (rect.left + leftOffset + popoverWidth > viewportWidth - 16) {
            leftOffset = (viewportWidth - 16) - (rect.left + popoverWidth);
        }

        popover.style.left = `${leftOffset}px`;
        popover.style.transform = 'none';

        // 吹き出し矢印をコンテナの中央に合わせる（端から最低20px内側）
        const arrowCenter = (rect.width / 2) - leftOffset;
        const clampedArrow = Math.max(20, Math.min(popoverWidth - 20, arrowCenter));
        popover.style.setProperty('--arrow-left', `${clampedArrow}px`);
    }

    document.addEventListener('mouseover', (e) => {
        const container = e.target.closest('.commute-visual-container');
        if (container) adjustPopoverPosition(container);
    });

    document.addEventListener('focusin', (e) => {
        const container = e.target.closest('.commute-visual-container');
        if (container) adjustPopoverPosition(container);
    });

    // 初期化実行
    // ブラウザが再読み込み時にチェック状態を復元することがあるため、画面のチェックを状態に合わせる
    if (hideFloodRiskCheck) hideFloodRiskCheck.checked = state.hideHighFlood;
    if (onlyNewCheck) onlyNewCheck.checked = state.onlyNew;
    renderLegend();
    updateNewCount();
    renderSortPriorityList();
    renderProperties();
});
