document.addEventListener("DOMContentLoaded", () => {
    // データ初期化 (properties.jsから読み込まれたbukkenDataを使用)
    let properties = typeof bukkenData !== 'undefined' ? bukkenData : [];
    let selectedProperties = [];

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

    // 必須カットオフ条件の適用（ドアドア 59分以下 かつ 総徒歩 15分以内）
    properties = properties.filter(p => {
        const best = p._commuteInfo?.best;
        if (!best) return false;
        return (best.doorToDoor <= 59) && (best.totalWalkMin <= 15);
    });

    // 並び替え条件の定義
    const SORT_CRITERIA = {
        'walk-asc': { label: '物件〜駅徒歩（短い順）', compare: (a, b) => (a._commuteInfo?.best?.propWalkMin ?? a.walk_min) - (b._commuteInfo?.best?.propWalkMin ?? b.walk_min) },
        'total-walk-asc': { label: '総徒歩時間（短い順）', compare: (a, b) => (a._commuteInfo?.best?.totalWalkMin ?? a.walk_min) - (b._commuteInfo?.best?.totalWalkMin ?? b.walk_min) },
        'commute-asc': { label: 'ドアドア時間（短い順）', compare: (a, b) => (a._commuteInfo?.best?.doorToDoor ?? a.door_to_door) - (b._commuteInfo?.best?.doorToDoor ?? b.door_to_door) },
        'age-asc': { label: '築年数（浅い順）', compare: (a, b) => parseAge(a.age_floor) - parseAge(b.age_floor) },
        'rent-asc': { label: '自己負担額（低い順）', compare: (a, b) => a.self_pay - b.self_pay },
        'menseki-desc': { label: '専有面積（広い順）', compare: (a, b) => parseAreaSize(b.menseki) - parseAreaSize(a.menseki) },
    };

    // 要素取得
    const bukkenGrid = document.getElementById("bukkenGrid");
    const areaTabs = document.getElementById("areaTabs");
    const cityTabs = document.getElementById("cityTabs");
    const sortPriorityList = document.getElementById("sortPriorityList");
    const openCompareBtn = document.getElementById("openCompareBtn");
    const compareCount = document.getElementById("compareCount");
    const onlyNewCheck = document.getElementById("onlyNewCheck");
    const onlyNewFilterBtn = document.getElementById("onlyNewFilterBtn");
    const newBukkenCount = document.getElementById("newBukkenCount");
    const themeToggleBtn = document.getElementById("themeToggleBtn");
    const themeLabel = document.getElementById("themeLabel");
    
    // モーダル要素
    const compareModal = document.getElementById("compareModal");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const compareTable = document.getElementById("compareTable");

    // ========================================================
    // テーマ管理（Solarized / Solarized Dark）
    // ========================================================
    const THEME_STORAGE_KEY = "bukken_theme";

    function getInitialTheme() {
        const saved = localStorage.getItem(THEME_STORAGE_KEY);
        if (saved === "light" || saved === "dark") return saved;
        return "dark"; // デフォルトは Solarized Dark
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute("data-theme", theme);
        document.body.setAttribute("data-theme", theme);
        localStorage.setItem(THEME_STORAGE_KEY, theme);
        if (themeLabel) {
            themeLabel.textContent = theme === "light" ? "Solarized Light" : "Solarized Dark";
        }
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute("data-theme") || "dark";
        const next = current === "light" ? "dark" : "light";
        applyTheme(next);
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
        sortPriority: ['walk-asc', 'commute-asc', 'total-walk-asc', 'age-asc', 'rent-asc', 'menseki-desc'],
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

    // ヘルパー関数: 自己負担額のカラークラス判定
    function getSelfPayColorClass(val) {
        if (val <= 3.2) return "color-default";
        if (val <= 4.0) return "color-yellow";
        if (val <= 5.0) return "color-orange";
        return "color-red";
    }

    // ヘルパー関数: 通勤時間のカラークラス判定
    function getCommuteColorClass(minutes) {
        if (minutes <= 40) return "green";
        if (minutes <= 50) return "yellow";
        return "red";
    }

    // フィルタリング処理
    function getFilteredProperties() {
        return properties.filter(p => {
            // NEW物件のみ表示
            if (state.onlyNew && !p.is_new) {
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

    // NEW物件の総数を更新
    function updateNewCount() {
        const count = properties.filter(p => p.is_new).length;
        if (newBukkenCount) {
            newBukkenCount.textContent = count;
        }
    }

    // 都道府県タブ・市区町村タブの描画
    function renderAreaTabs() {
        if (!areaTabs) return;

        const baseProps = state.onlyNew ? properties.filter(p => p.is_new) : properties;

        const prefCounts = {};
        baseProps.forEach(p => {
            const pref = getPrefecture(p.address);
            if (pref) {
                prefCounts[pref] = (prefCounts[pref] || 0) + 1;
            }
        });

        let html = `
            <button class="tab-btn ${state.prefecture === 'all' ? 'active' : ''}" data-pref="all">
                すべて (${baseProps.length})
            </button>
        `;

        KANTO_PREFECTURES.forEach(pref => {
            const count = prefCounts[pref] || 0;
            if (count > 0 || state.prefecture === pref) {
                html += `
                    <button class="tab-btn ${state.prefecture === pref ? 'active' : ''}" data-pref="${pref}">
                        ${pref} (${count})
                    </button>
                `;
            }
        });

        areaTabs.innerHTML = html;
        renderCityTabs(baseProps);
    }

    // 市区町村タブの描画
    function renderCityTabs(baseProps) {
        if (!cityTabs) return;

        if (state.prefecture === 'all') {
            cityTabs.style.display = 'none';
            cityTabs.innerHTML = '';
            return;
        }

        cityTabs.style.display = 'flex';
        const prefProps = baseProps.filter(p => getPrefecture(p.address) === state.prefecture);

        const cityCounts = {};
        prefProps.forEach(p => {
            const city = getCity(p.address);
            if (city) {
                cityCounts[city] = (cityCounts[city] || 0) + 1;
            }
        });

        let html = `
            <button class="tab-btn tab-btn--sub ${state.city === 'all' ? 'active' : ''}" data-city="all">
                全域 (${prefProps.length})
            </button>
        `;

        Object.keys(cityCounts).sort().forEach(city => {
            const count = cityCounts[city];
            html += `
                <button class="tab-btn tab-btn--sub ${state.city === city ? 'active' : ''}" data-city="${city}">
                    ${city} (${count})
                </button>
            `;
        });

        cityTabs.innerHTML = html;
    }

    // ポップオーバーHTMLの生成（上段: ステップタイムライン案B ＋ 下段: 詳細内訳案A）
    function renderPopoverHtml(best, others) {
        const arrStationShort = (best.arrivalStation || '大手町').replace(/\(.*\)/, '');

        return `
            <div class="commute-popover glass">
                <div class="popover-header">
                    <span class="popover-title">🚆 最適通勤ルート詳細</span>
                    <span class="popover-badge">最速ルート</span>
                </div>

                <!-- 上段: ステップタイムライン (案B) -->
                <div class="popover-timeline-box">
                    <div class="popover-flow">
                        <div class="popover-node">🏠 家</div>
                        <div class="popover-leg walk">
                            <span class="popover-leg-label">歩${best.propWalkMin}分</span>
                        </div>
                        <div class="popover-node">🚉 ${best.station}</div>
                        <div class="popover-leg train">
                            <span class="popover-leg-label">電車${best.trainMin}分 (乗換${best.transfers})</span>
                        </div>
                        <div class="popover-node office">🚉 ${arrStationShort}</div>
                        <div class="popover-leg walk">
                            <span class="popover-leg-label">歩${best.arrivalWalkMin}分</span>
                        </div>
                        <div class="popover-node office">🏢 会社</div>
                    </div>
                </div>

                <!-- 下段: 詳細内訳 (案A) -->
                <div class="popover-section">
                    <div class="popover-section-label">■ ${best.station}駅ルート詳細 (${best.line})</div>
                    <ul class="popover-breakdown-list">
                        <li><span>① 物件〜${best.station}駅 徒歩</span><strong>${best.propWalkMin} 分</strong></li>
                        <li><span>② 電車乗車 (${best.linesUsed || best.line})</span><strong>${best.trainMin} 分</strong></li>
                        <li><span>③ 乗換・構内移動・待ち (乗換${best.transfers}回)</span><strong>${best.transitWalkMin} 分</strong></li>
                        <li><span>④ ${best.arrivalStation}〜サンケイビル 徒歩</span><strong>${best.arrivalWalkMin} 分</strong></li>
                        <li class="total-row">
                            <span>合計ドアドア / 総徒歩</span>
                            <span style="color:var(--primary-blue,#2E4FB5);">${best.doorToDoor} 分 / ${best.totalWalkMin} 分</span>
                        </li>
                    </ul>
                </div>

                ${others && others.length > 0 ? `
                    <div class="popover-section" style="border-top: 1px solid var(--border-color); padding-top: 0.45rem;">
                        <div class="popover-section-label">■ 他の利用可能駅ルート比較</div>
                        ${others.map(o => `
                            <div class="popover-other-route-item">
                                <span><strong>${o.station}駅</strong> (歩${o.propWalkMin}分 + 電車${o.trainMin}分)</span>
                                <span>計 <strong>${o.doorToDoor}分</strong> (総徒歩${o.totalWalkMin}分/乗換${o.transfers}回)</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    // 通勤ビジュアル部分のHTML生成（通常: 案C 3連バッジ ＋ ホバー: ポップオーバー）
    function renderCommuteVisual(p) {
        const { best, others } = p._commuteInfo;
        const popoverHtml = renderPopoverHtml(best, others);
        const isTokyoArrival = Boolean(best.arrivalStation && best.arrivalStation.startsWith('東京'));
        const tokyoIconHtml = isTokyoArrival
            ? `<span class="tokyo-icon" title="到着駅: 東京駅（サンケイビルまで徒歩${best.arrivalWalkMin}分）">🗼</span>`
            : '';

        return `
            <div class="commute-visual-container" tabindex="0" title="ホバーまたはタップで詳細内訳を表示">
                <div class="commute-badges-box">
                    <div class="commute-badge-row">
                        <div class="c-badge primary">
                            <span class="c-badge-label">🚪 ドアドア</span>
                            <span class="c-badge-val">${best.doorToDoor}分</span>
                        </div>
                        <div class="c-badge walk">
                            <span class="c-badge-label">🚶 物件〜駅</span>
                            <span class="c-badge-val">${best.propWalkMin}分</span>
                        </div>
                        <div class="c-badge total-walk">
                            <span class="c-badge-label">👣 総徒歩${tokyoIconHtml}</span>
                            <span class="c-badge-val">${best.totalWalkMin}分</span>
                        </div>
                    </div>
                    <div class="commute-badge-sub">
                        <span>乗車 <strong>${best.trainMin}分</strong> / 乗換 <strong>${best.transfers}回</strong></span>
                    </div>
                </div>
                ${popoverHtml}
            </div>
        `;
    }

    // 物件カード一覧の描画
    function renderProperties() {
        const filtered = getFilteredProperties();
        const sorted = sortProperties(filtered);

        updateNewCount();
        renderAreaTabs();

        if (!bukkenGrid) return;

        if (sorted.length === 0) {
            bukkenGrid.innerHTML = `
                <div class="no-results glass">
                    <p>該当する条件の物件が見つかりませんでした。</p>
                </div>
            `;
            return;
        }

        bukkenGrid.innerHTML = sorted.map(p => {
            const isSelected = selectedProperties.some(item => item.url === p.url);
            const selfPayClass = getSelfPayColorClass(p.self_pay);
            const best = p._commuteInfo?.best || {};

            // 駐車場代が有料の場合のみ強調バッジ表示
            const isPaidParking = (p.parking_fee && p.parking_fee > 0) || 
                (p.parking_text && !p.parking_text.includes('無料') && !p.parking_text.includes('付') && p.parking_text !== '-');
            const parkingFeeBadge = isPaidParking
                ? `<span class="parking-badge fee-warning">駐車場 ${p.parking_fee > 0 ? (p.parking_fee + '万円') : '有料'}</span>`
                : '';

            // 駐車場が100m以上離れている場合の警告バッジ
            const parkingDistBadge = (p.parking_dist && p.parking_dist >= 100)
                ? `<span class="parking-badge warning">駐車場 ${p.parking_dist}m先</span>`
                : '';

            // NEWバッジ
            const newBadge = p.is_new
                ? `<span class="card-new-badge">NEW</span>`
                : '';

            return `
                <div class="bukken-card glass" data-url="${p.url}">
                    <div class="card-header">
                        <div class="header-badges">
                            ${newBadge}
                            <span class="station-badge">${best.station || p.station}駅 (${best.line || p.line})</span>
                            ${parkingFeeBadge}
                            ${parkingDistBadge}
                        </div>
                        <label class="compare-checkbox-label">
                            <input type="checkbox" class="compare-check" ${isSelected ? 'checked' : ''} data-url="${p.url}">
                            比較
                        </label>
                    </div>

                    <a href="${p.url}" target="_blank" rel="noopener noreferrer" class="bukken-title-btn" title="${p.title}">
                        <span class="bukken-title-text">${p.title}</span>
                        <span class="bukken-title-icon">↗</span>
                    </a>

                    <div class="rent-box">
                        <div class="self-pay-row ${selfPayClass}">
                            自己負担: <strong>${p.self_pay.toFixed(2)}</strong> 万円/月
                        </div>
                    </div>

                    ${renderCommuteVisual(p)}

                    <div class="room-details">
                        <div>
                            <span class="label">間取り / 面積</span>
                            <span class="value">${p.madori} (${p.menseki})</span>
                        </div>
                        <div>
                            <span class="label">築年数 / 階建</span>
                            <span class="value">${p.age_floor}</span>
                        </div>
                    </div>

                    <div class="location-info">
                        <div><strong>住所:</strong> ${p.address}</div>
                    </div>
                </div>
            `;
        }).join('');

        // 比較チェックボックスのイベント設定
        bukkenGrid.querySelectorAll(".compare-check").forEach(chk => {
            chk.addEventListener("change", (e) => {
                const url = e.target.getAttribute("data-url");
                const prop = properties.find(p => p.url === url);
                if (e.target.checked) {
                    if (!selectedProperties.some(p => p.url === url) && prop) {
                        selectedProperties.push(prop);
                    }
                } else {
                    selectedProperties = selectedProperties.filter(p => p.url !== url);
                }
                updateCompareControls();
            });
        });
    }

    // 比較ボタンの更新
    function updateCompareControls() {
        if (compareCount) {
            compareCount.textContent = selectedProperties.length;
        }
        if (openCompareBtn) {
            openCompareBtn.disabled = selectedProperties.length < 2;
        }
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
                    <span class="drag-handle" aria-hidden="true">⋮⋮</span>
                    <span class="priority-rank">${index + 1}</span>
                    <span class="priority-label">${criterion.label}</span>
                    <div class="priority-arrows">
                        <button class="priority-arrow-btn priority-arrow-up" data-action="up" data-index="${index}" ${isFirst ? 'disabled' : ''} title="優先度を上げる">▲</button>
                        <button class="priority-arrow-btn priority-arrow-down" data-action="down" data-index="${index}" ${isLast ? 'disabled' : ''} title="優先度を下げる">▼</button>
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

    // 比較モーダルの描画
    function renderCompareTable() {
        if (!compareTable || selectedProperties.length === 0) return;

        const headers = selectedProperties.map(p => {
            const best = p._commuteInfo?.best || {};
            return `
                <th>
                    <div style="margin-bottom: 0.3rem;">
                        ${p.is_new ? '<span class="card-new-badge" style="margin-right: 4px;">NEW</span>' : ''}
                        <strong>${best.station || p.station}駅</strong>
                    </div>
                    <div style="font-size: 0.85rem; font-weight: normal; max-width: 220px; word-break: break-all;">${p.title}</div>
                </th>
            `;
        }).join('');

        const selfPayRow = selectedProperties.map(p => {
            const selfPayClass = getSelfPayColorClass(p.self_pay);
            return `<td class="self-pay-val ${selfPayClass}"><strong>${p.self_pay.toFixed(2)}</strong> 万円/月</td>`;
        }).join('');

        const rentRow = selectedProperties.map(p => `
            <td><strong>${p.rent}</strong> (管理費: ${p.admin || '-'})</td>
        `).join('');

        const parkingRow = selectedProperties.map(p => `
            <td>${p.parking_fee > 0 ? (p.parking_fee + '万円') : (p.parking_text || '-')} ${p.parking_dist ? `(${p.parking_dist}m先)` : ''}</td>
        `).join('');

        const commuteRow = selectedProperties.map(p => {
            const best = p._commuteInfo?.best || {};
            const colorClass = getCommuteColorClass(best.doorToDoor || p.door_to_door);
            const isTokyo = Boolean(best.arrivalStation && best.arrivalStation.startsWith('東京'));
            const tokyoIcon = isTokyo ? ' <span class="tokyo-icon" title="到着駅: 東京駅（サンケイビルまで徒歩' + best.arrivalWalkMin + '分）">🗼</span>' : '';
            return `
                <td class="commute-val ${colorClass}">
                    <strong>計 ${best.doorToDoor || p.door_to_door}分</strong><br>
                    <span style="font-size: 0.78rem;">(乗車${best.trainMin || p.train_min}分, 乗換${best.transfers ?? p.transfers}回)</span><br>
                    <span style="font-size: 0.74rem; color: var(--color-cyan);">総徒歩: ${best.totalWalkMin || (p.walk_min + 1)}分${tokyoIcon}</span>
                </td>
            `;
        }).join('');

        const spaceRow = selectedProperties.map(p => `
            <td>${p.madori} (${p.menseki})</td>
        `).join('');

        const ageRow = selectedProperties.map(p => `
            <td>${p.age_floor}</td>
        `).join('');

        const addressRow = selectedProperties.map(p => `
            <td style="font-size: 0.82rem;">${p.address}</td>
        `).join('');

        const linkRow = selectedProperties.map(p => `
            <td>
                <a href="${p.url}" target="_blank" rel="noopener noreferrer" class="detail-btn">
                    詳細を見る &rarr;
                </a>
            </td>
        `).join('');

        compareTable.innerHTML = `
            <thead>
                <tr>
                    <th>項目</th>
                    ${headers}
                </tr>
            </thead>
            <tbody>
                <tr>
                    <th>自己負担額</th>
                    ${selfPayRow}
                </tr>
                <tr>
                    <th>家賃 / 管理費</th>
                    ${rentRow}
                </tr>
                <tr>
                    <th>駐車場</th>
                    ${parkingRow}
                </tr>
                <tr>
                    <th>ドアドア通勤時間</th>
                    ${commuteRow}
                </tr>
                <tr>
                    <th>間取り / 面積</th>
                    ${spaceRow}
                </tr>
                <tr>
                    <th>築年数 / 階建</th>
                    ${ageRow}
                </tr>
                <tr>
                    <th>住所</th>
                    ${addressRow}
                </tr>
                <tr>
                    <th>SUUMOリンク</th>
                    ${linkRow}
                </tr>
            </tbody>
        `;
    }

    // イベントリスナー設定
    // 1. 都道府県タブクリック
    if (areaTabs) {
        areaTabs.addEventListener("click", (e) => {
            const btn = e.target.closest(".tab-btn");
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
            const btn = e.target.closest(".tab-btn--sub");
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
            if (onlyNewFilterBtn) {
                if (state.onlyNew) {
                    onlyNewFilterBtn.classList.add("active");
                } else {
                    onlyNewFilterBtn.classList.remove("active");
                }
            }
            renderProperties();
        });
    }

    // 4. 比較モーダル
    if (openCompareBtn) {
        openCompareBtn.addEventListener("click", () => {
            renderCompareTable();
            if (compareModal) compareModal.classList.add("active");
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", () => {
            if (compareModal) compareModal.classList.remove("active");
        });
    }

    if (compareModal) {
        compareModal.addEventListener("click", (e) => {
            if (e.target === compareModal) {
                compareModal.classList.remove("active");
            }
        });
    }

    // ESCキーでモーダルを閉じる
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && compareModal && compareModal.classList.contains("active")) {
            compareModal.classList.remove("active");
        }
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
    updateNewCount();
    renderSortPriorityList();
    renderProperties();
});
