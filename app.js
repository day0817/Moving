document.addEventListener("DOMContentLoaded", () => {
    // データ初期化 (properties.jsから読み込まれたbukkenDataを使用)
    let properties = typeof bukkenData !== 'undefined' ? bukkenData : [];
    let selectedProperties = [];
    let map = null;
    let mapMarkers = [];
    let mapPolylines = [];
    
    // 大手町駅の座標
    const OTEMACHI_COORDS = [35.6848, 139.7661];

    // 要素取得
    const bukkenGrid = document.getElementById("bukkenGrid");
    const areaTabs = document.getElementById("areaTabs");
    const rentFilter = document.getElementById("rentFilter");
    const rentValue = document.getElementById("rentValue");
    const commuteFilter = document.getElementById("commuteFilter");
    const commuteValue = document.getElementById("commuteValue");
    const areaSizeFilter = document.getElementById("areaSizeFilter");
    const areaSizeValue = document.getElementById("areaSizeValue");
    const sortSelect = document.getElementById("sortSelect");
    const openCompareBtn = document.getElementById("openCompareBtn");
    const compareCount = document.getElementById("compareCount");
    
    // モーダル要素
    const compareModal = document.getElementById("compareModal");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const compareTable = document.getElementById("compareTable");

    // スプレッドシート要素
    const sheetTable = document.getElementById("sheetTable");
    const sheetSearchInput = document.getElementById("sheetSearchInput");
    const sheetWalkFilter = document.getElementById("sheetWalkFilter");
    const sheetAgeFilter = document.getElementById("sheetAgeFilter");
    const sheetSelfPayFilter = document.getElementById("sheetSelfPayFilter");

    // 現在のフィルタ状態
    const state = {
        area: "all",
        maxRent: 18.0,
        maxCommute: 60,
        minArea: 80,
        sortBy: "walk-asc",
        // スプレッドシート専用状態
        sheetSortKey: "walk_min",
        sheetSortOrder: "asc",
        sheetSearchQuery: "",
        sheetWalkLimit: "all",
        sheetAgeLimit: "all",
        sheetSelfPayLimit: "all"
    };

    // タブ切り替え処理
    const tabButtons = document.querySelectorAll(".nav-tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            tabButtons.forEach(b => b.classList.remove("active"));
            tabContents.forEach(c => c.classList.remove("active"));

            btn.classList.add("active");
            const targetId = btn.dataset.target;
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.add("active");
            }

            // 地図タブが選ばれた場合、Leaflet地図を初期化・再計算
            if (targetId === "map-section") {
                initMap();
                if (map) {
                    setTimeout(() => {
                        map.invalidateSize();
                        updateMapData();
                    }, 100);
                }
            } else if (targetId === "sheet-section") {
                renderSheetTable();
            }
        });
    });

    // フィルタ・ソートのイベントリスナー
    areaTabs.addEventListener("click", (e) => {
        if (e.target.classList.contains("tab-btn")) {
            state.area = e.target.dataset.area;
            render();
            updateMapData();
            renderSheetTable();
        }
    });

    rentFilter.addEventListener("input", (e) => {
        state.maxRent = parseFloat(e.target.value);
        rentValue.textContent = state.maxRent.toFixed(1);
        render();
        updateMapData();
        renderSheetTable();
    });

    commuteFilter.addEventListener("input", (e) => {
        state.maxCommute = parseInt(e.target.value);
        commuteValue.textContent = state.maxCommute;
        render();
        updateMapData();
        renderSheetTable();
    });

    areaSizeFilter.addEventListener("input", (e) => {
        state.minArea = parseInt(e.target.value);
        areaSizeValue.textContent = state.minArea;
        render();
        updateMapData();
        renderSheetTable();
    });

    sortSelect.addEventListener("change", (e) => {
        state.sortBy = e.target.value;
        render();
        updateMapData();
        renderSheetTable();
    });

    // スプレッドシート専用フィルタのイベントリスナー
    sheetSearchInput.addEventListener("input", (e) => {
        state.sheetSearchQuery = e.target.value.toLowerCase().trim();
        renderSheetTable();
    });

    sheetWalkFilter.addEventListener("change", (e) => {
        state.sheetWalkLimit = e.target.value;
        renderSheetTable();
    });

    sheetAgeFilter.addEventListener("change", (e) => {
        state.sheetAgeLimit = e.target.value;
        renderSheetTable();
    });

    sheetSelfPayFilter.addEventListener("change", (e) => {
        state.sheetSelfPayLimit = e.target.value;
        renderSheetTable();
    });

    openCompareBtn.addEventListener("click", () => {
        buildCompareTable();
        compareModal.classList.add("active");
    });

    closeModalBtn.addEventListener("click", () => {
        compareModal.classList.remove("active");
    });

    compareModal.addEventListener("click", (e) => {
        if (e.target === compareModal) {
            compareModal.classList.remove("active");
        }
    });

    // 築年数を数値に変換
    function parseAge(ageStr) {
        if (ageStr.includes("新築")) return 0;
        const match = ageStr.match(/築(\d+)年/);
        return match ? parseInt(match[1]) : 99;
    }

    // 専有面積を数値に変換
    function parseAreaSize(mensekiStr) {
        const match = mensekiStr.match(/([\d.]+)/);
        return match ? parseFloat(match[1]) : 0;
    }

    // 家賃総額
    function parseTotalRent(rentStr, adminStr, parkingFee = 0) {
        const rentMatch = rentStr.match(/([\d.]+)/);
        const rent = rentMatch ? parseFloat(rentMatch[1]) : 0;
        
        let admin = 0;
        if (adminStr && adminStr !== "-") {
            const adminMatch = adminStr.match(/(\d+)/);
            admin = adminMatch ? parseInt(adminMatch[1]) / 10000 : 0;
        }
        return rent + admin + parkingFee;
    }

    // 自己負担額の計算
    function calculateSelfPay(rentStr, adminStr, parkingFee = 0) {
        const houseTotal = parseTotalRent(rentStr, adminStr, 0);
        let houseSelfPay = 0;
        if (houseTotal <= 16.0) {
            houseSelfPay = houseTotal * 0.2;
        } else {
            houseSelfPay = 3.2 + (houseTotal - 16.0);
        }
        return houseSelfPay + parkingFee;
    }

    // 自己負担額に応じた色分け
    function getSelfPayColorClass(selfPayVal) {
        const val = parseFloat(selfPayVal);
        if (val > 5.0) return "color-red";
        if (val > 4.0) return "color-orange";
        if (val > 3.2) return "color-yellow";
        return "color-default";
    }

    // フィルタに合致する物件リストを抽出
    function getFilteredProperties(includeAreaFilter = true) {
        return properties.filter(item => {
            // エリアフィルタ
            if (includeAreaFilter && state.area !== "all" && item.station !== state.area) return false;
            
            // 家賃
            const totalRent = parseTotalRent(item.rent, item.admin, item.parking_fee || 0);
            if (totalRent > state.maxRent) return false;
            
            // 通勤時間
            if (item.door_to_door > state.maxCommute) return false;
            
            // 専有面積
            const size = parseAreaSize(item.menseki);
            if (size < state.minArea) return false;
            
            return true;
        });
    }

    // メインのカード一覧レンダリング
    function render() {
        // エリア切替ボタン用の件数（エリアフィルタ適用前）
        const allFiltered = getFilteredProperties(false);
        
        // 存在する駅の一覧を取得
        const uniqueStations = [...new Set(properties.map(p => p.station))].filter(s => s && s !== "不明");
        uniqueStations.sort();

        // タブ生成
        let tabsHtml = `<button class="tab-btn ${state.area === "all" ? "active" : ""}" data-area="all">すべて (${allFiltered.length})</button>`;
        uniqueStations.forEach(stationName => {
            const count = allFiltered.filter(p => p.station === stationName).length;
            if (count > 0 || state.area === stationName) {
                tabsHtml += `<button class="tab-btn ${state.area === stationName ? "active" : ""}" data-area="${stationName}">${stationName} (${count})</button>`;
            }
        });
        areaTabs.innerHTML = tabsHtml;

        // フィルタ適用後の物件
        const filtered = getFilteredProperties(true);

        // ソート適用
        filtered.sort((a, b) => {
            if (state.sortBy === "walk-asc") {
                return a.walk_min - b.walk_min;
            } else if (state.sortBy === "commute-asc") {
                return a.door_to_door - b.door_to_door;
            } else if (state.sortBy === "rent-asc") {
                return a.self_pay - b.self_pay;
            } else if (state.sortBy === "menseki-desc") {
                return parseAreaSize(b.menseki) - parseAreaSize(a.menseki);
            } else if (state.sortBy === "age-asc") {
                return parseAge(a.age_floor) - parseAge(b.age_floor);
            }
            return 0;
        });

        // DOM描画
        bukkenGrid.innerHTML = "";
        
        if (filtered.length === 0) {
            bukkenGrid.innerHTML = `<div class="no-results">条件に合致する物件がありません。</div>`;
            return;
        }

        filtered.forEach((item) => {
            const card = document.createElement("div");
            card.className = "bukken-card glass";
            
            const pFee = item.parking_fee || 0;
            const pDist = item.parking_dist || 0;
            const pText = item.parking_text || "-";
            const totalRent = parseTotalRent(item.rent, item.admin, pFee).toFixed(2);
            const selfPay = calculateSelfPay(item.rent, item.admin, pFee).toFixed(2);
            const selfPayColorClass = getSelfPayColorClass(selfPay);
            const isChecked = selectedProperties.some(sp => sp.url === item.url);
            
            let parkingWarningBadge = "";
            if (pDist >= 100) {
                parkingWarningBadge = `<span class="parking-badge warning">（駐車場 ${pDist}m先）</span>`;
            }
            
            let walkColor = "green";
            if (item.walk_min >= 15) walkColor = "red";
            else if (item.walk_min >= 11) walkColor = "yellow";
            
            const barWidth = Math.min(100, (item.walk_min / 15) * 100);

            card.innerHTML = `
                <div class="card-header">
                    <div class="header-badges">
                        <span class="station-badge">${item.station} (${item.line})</span>
                        ${parkingWarningBadge}
                    </div>
                    <label class="compare-checkbox-label">
                        <input type="checkbox" class="compare-checkbox" data-url="${item.url}" ${isChecked ? 'checked' : ''}>
                        比較に追加
                    </label>
                </div>
                <h2 class="bukken-title" title="${item.title}">${item.title}</h2>
                
                <div class="rent-box">
                    <div class="self-pay-row ${selfPayColorClass}">自己負担: <strong>${selfPay}万円</strong> <span class="period">/月</span></div>
                    <div class="rent-total-row">総額: <strong>${totalRent}万円</strong> <span class="period">/月</span></div>
                    <div class="rent-breakdown">内訳：家賃 ${item.rent} / 管理費: ${item.admin} / 駐車場: ${pText}</div>
                </div>

                <div class="commute-visual">
                    <div class="commute-header">
                        <span class="commute-total ${walkColor}">徒歩 ${item.walk_min}分</span>
                        <span class="commute-breakdown">（電車 ${item.train_min}分, 乗換${item.transfers || 0}回 → 計 ${item.door_to_door}分）</span>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar ${walkColor}" style="width: ${barWidth}%"></div>
                    </div>
                </div>

                <div class="room-details">
                    <div>間取り: <strong>${item.madori}</strong></div>
                    <div>広さ: <strong>${item.menseki}</strong></div>
                    <div>築年数: <strong>${item.age_floor.split(" ")[0]}</strong></div>
                    <div>住所: <strong>${item.address.substring(0, 8)}...</strong></div>
                </div>

                <div class="walk-details" title="${item.station_walk}">
                    ${item.address}<br>
                    ${item.station_walk}
                </div>

                <a href="${item.url}" target="_blank" class="action-btn">SUUMOで詳細を見る</a>
            `;

            const checkbox = card.querySelector(".compare-checkbox");
            checkbox.addEventListener("change", (e) => {
                if (e.target.checked) {
                    if (selectedProperties.length >= 3) {
                        alert("比較できるのは最大3件までです。");
                        e.target.checked = false;
                        return;
                    }
                    selectedProperties.push(item);
                } else {
                    selectedProperties = selectedProperties.filter(sp => sp.url !== item.url);
                }
                updateCompareButton();
            });

            bukkenGrid.appendChild(card);
        });
    }

    // 比較ボタン
    function updateCompareButton() {
        const count = selectedProperties.length;
        compareCount.textContent = count;
        openCompareBtn.disabled = count < 2;
        if (count >= 2) {
            openCompareBtn.classList.add("active");
        } else {
            openCompareBtn.classList.remove("active");
        }
    }

    // 比較テーブル
    function buildCompareTable() {
        if (selectedProperties.length === 0) return;
        
        let html = `
            <thead>
                <tr>
                    <th>項目</th>
                    ${selectedProperties.map(p => `<th class="bukken-header">${p.title}</th>`).join("")}
                </tr>
            </thead>
            <tbody>
                <tr>
                    <th>最寄り駅 (路線)</th>
                    ${selectedProperties.map(p => `<td>${p.station} (${p.line})</td>`).join("")}
                </tr>
                <tr>
                    <th>家賃 (総額)</th>
                    ${selectedProperties.map(p => {
                        const pFee = p.parking_fee || 0;
                        const total = parseTotalRent(p.rent, p.admin, pFee).toFixed(2);
                        return `<td class="rent-val">${p.rent} <span class="rent-admin">(管理費:${p.admin} / 総額:${total}万)</span></td>`;
                    }).join("")}
                </tr>
                <tr>
                    <th>自己負担額</th>
                    ${selectedProperties.map(p => {
                        const pFee = p.parking_fee || 0;
                        const selfPay = calculateSelfPay(p.rent, p.admin, pFee);
                        const colorClass = getSelfPayColorClass(selfPay);
                        return `<td class="self-pay-val ${colorClass}">${selfPay.toFixed(2)}万円/月</td>`;
                    }).join("")}
                </tr>
                <tr>
                    <th>駐車場</th>
                    ${selectedProperties.map(p => {
                        const dist = p.parking_dist || 0;
                        const text = p.parking_text || "-";
                        let warn = "";
                        if (dist >= 100) {
                            warn = ` <span class="parking-badge warning">（遠い: ${dist}m）</span>`;
                        }
                        return `<td>${text}${warn}</td>`;
                    }).join("")}
                </tr>
                <tr>
                    <th>徒歩時間 (通勤時間)</th>
                    ${selectedProperties.map(p => {
                        let c = "green";
                        if (p.walk_min >= 15) c = "red";
                        else if (p.walk_min >= 11) c = "yellow";
                        return `<td class="commute-val ${c}">徒歩 ${p.walk_min}分 <span class="rent-admin">(電車 ${p.train_min}分, 乗換${p.transfers || 0}回 → 計 ${p.door_to_door}分)</span></td>`;
                    }).join("")}
                </tr>
                <tr>
                    <th>間取り</th>
                    ${selectedProperties.map(p => `<td>${p.madori}</td>`).join("")}
                </tr>
                <tr>
                    <th>専有面積</th>
                    ${selectedProperties.map(p => `<td>${p.menseki}</td>`).join("")}
                </tr>
                <tr>
                    <th>築年数 / 階数</th>
                    ${selectedProperties.map(p => `<td>${p.age_floor}</td>`).join("")}
                </tr>
                <tr>
                    <th>最寄り駅・立地</th>
                    ${selectedProperties.map(p => `<td>${p.station_walk}</td>`).join("")}
                </tr>
                <tr>
                    <th>詳細リンク</th>
                    ${selectedProperties.map(p => `<td><a href="${p.url}" target="_blank" class="action-btn">SUUMOで開く</a></td>`).join("")}
                </tr>
            </tbody>
        `;
        compareTable.innerHTML = html;
    }

    // Leaflet地図の初期化
    function initMap() {
        if (map !== null) return; // すでに初期化済みの場合はスキップ
        
        // 大手町駅を中心に地図を設定
        map = L.map('map').setView(OTEMACHI_COORDS, 11);
        
        // スモークグレー調に合うCartoDB Dark Matterタイルレイヤーを設定
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a> | 鉄道路線: <a href="https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N02-2025.html">国土交通省 国土数値情報（鉄道データ N02, CC BY 4.0）</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(map);
        
        // 大手町駅に特別なピン（赤色）を常時配置
        L.circleMarker(OTEMACHI_COORDS, {
            radius: 8,
            color: '#ff453a',
            fillColor: '#ff453a',
            fillOpacity: 1,
            weight: 3
        }).addTo(map).bindPopup('<strong>大手町駅 (起点)</strong>');
    }

    // 2点間の直線距離（簡易ユークリッド距離）を計算する関数 (ソート用)
    function getDistanceSq(coords1, coords2) {
        return Math.pow(coords1[0] - coords2[0], 2) + Math.pow(coords1[1] - coords2[1], 2);
    }

    // 地図データのプロット更新
    function updateMapData() {
        if (!map) return;
        
        // 既存のマーカーとポリラインを削除
        mapMarkers.forEach(m => map.removeLayer(m));
        mapPolylines.forEach(p => map.removeLayer(p));
        mapMarkers = [];
        mapPolylines = [];
        
        // フィルタリングされた物件
        const filtered = getFilteredProperties(true);
        if (filtered.length === 0) return;
        
        // 1. 最寄り駅ごとに物件をグループ化
        const stationGroups = {};
        filtered.forEach(p => {
            if (!p.lat || !p.lng || p.station === "不明") return;
            if (!stationGroups[p.station]) {
                stationGroups[p.station] = {
                    name: p.station,
                    line: p.line,
                    lat: p.lat,
                    lng: p.lng,
                    items: [],
                    avgCommute: 0,
                    avgTransfers: 0
                };
            }
            stationGroups[p.station].items.push(p);
        });
        
        // 各駅ごとの集計処理とピンのプロット
        Object.values(stationGroups).forEach(st => {
            const count = st.items.length;
            const totalCommute = st.items.reduce((sum, item) => sum + item.train_min, 0);
            const totalTransfers = st.items.reduce((sum, item) => sum + item.transfers, 0);
            st.avgCommute = Math.round(totalCommute / count);
            st.avgTransfers = Math.round(totalTransfers / count);
            
            // 物件数に応じて半径を変化させる (最小6px, 最大20px)
            const radius = Math.min(20, 6 + count * 1.5);
            
            // 平均自己負担額を計算
            const avgSelfPay = st.items.reduce((sum, item) => sum + parseFloat(calculateSelfPay(item.rent, item.admin, item.parking_fee || 0)), 0) / count;
            
            // 平均自己負担額に応じた色分け (水色: 3.2万以下, 黄色: 4.0万以下, オレンジ: 5.0万以下, 赤: 5.0万超)
            let color = '#3b82f6';
            if (avgSelfPay > 5.0) color = '#f87171';
            else if (avgSelfPay > 4.0) color = '#fb923c';
            else if (avgSelfPay > 3.2) color = '#fbbf24';

            const marker = L.circleMarker([st.lat, st.lng], {
                radius: radius,
                color: color,
                fillColor: color,
                fillOpacity: 0.7,
                weight: 2
            }).addTo(map);
            
            // ポップアップ内容の作成
            const popupContent = `
                <h4>${st.name}駅 <span style="font-size:0.75rem; color:#9ca3af; font-weight:normal;">(${st.line})</span></h4>
                <div class="popup-route">
                    <span>大手町まで: <strong>約 ${st.avgCommute}分</strong> (乗換 ${st.avgTransfers}回)</span>
                    <span>平均自己負担: <strong>${avgSelfPay.toFixed(2)}万円/月</strong></span>
                </div>
                <div class="popup-count">該当物件数: ${count} 件</div>
                <a href="#properties-section" class="popup-link" onclick="focusOnStation('${st.name}')">この駅の物件を見る</a>
            `;
            
            marker.bindPopup(popupContent);
            mapMarkers.push(marker);
        });

        // 2. 同一路線（line）の駅を結ぶ一本化された折れ線（Polyline）の常時描画
        // 路線ごとに駅をグループ化
        const lineGroups = {};
        Object.values(stationGroups).forEach(st => {
            if (!lineGroups[st.line]) {
                lineGroups[st.line] = {
                    name: st.line,
                    stations: [],
                    avgTransfers: 0
                };
            }
            lineGroups[st.line].stations.push(st);
        });

        // 各路線ごとに折れ線を描画
        // rail_lines.js (国土数値情報 由来の実際の路線ジオメトリ、build_rail_lines.pyで生成) に
        // 該当路線のデータがあればそちらを描画し、無い場合のみ大手町からの直線で代用する。
        Object.values(lineGroups).forEach(lg => {
            // 路線全体の平均乗換回数を調べる
            const totalTransfers = lg.stations.reduce((sum, st) => sum + st.avgTransfers, 0);
            const avgTransfers = totalTransfers / lg.stations.length;

            // 乗換0回なら実線（青）、1回なら破線（オレンジ）
            const lineColor = avgTransfers >= 0.5 ? '#ff9f0a' : '#3b82f6';
            const lineDash = avgTransfers >= 0.5 ? '5, 10' : '';
            const tooltipBase = `${lg.name} (${avgTransfers >= 0.5 ? '乗換あり' : '直通'})`;

            const realGeometry = (typeof railLinesData !== 'undefined') ? railLinesData[lg.name] : null;
            let layer;

            if (realGeometry) {
                // 実際の路線ジオメトリを描画
                layer = L.geoJSON(
                    { type: 'Feature', properties: {}, geometry: realGeometry },
                    { style: { color: lineColor, weight: 3, opacity: 0.8, dashArray: lineDash } }
                ).addTo(map);
                layer.eachLayer(l => l.bindTooltip(tooltipBase, { permanent: false, sticky: true, direction: 'top' }));
            } else {
                // 実データが無い路線は、大手町から近い順（直線距離順）にソートして結んだ直線(概算)で代用する
                const sortedStations = [...lg.stations];
                sortedStations.sort((a, b) => {
                    const distA = getDistanceSq(OTEMACHI_COORDS, [a.lat, a.lng]);
                    const distB = getDistanceSq(OTEMACHI_COORDS, [b.lat, b.lng]);
                    return distA - distB;
                });
                const polylinePoints = [OTEMACHI_COORDS];
                sortedStations.forEach(st => polylinePoints.push([st.lat, st.lng]));

                layer = L.polyline(polylinePoints, {
                    color: lineColor,
                    weight: 3,
                    opacity: 0.8,
                    dashArray: lineDash
                }).addTo(map);
                layer.bindTooltip(`${tooltipBase}・概算`, { permanent: false, sticky: true, direction: 'top' });
            }

            mapPolylines.push(layer);
        });
    }

    // スプレッドシートテーブルの描画
    function renderSheetTable() {
        // 共通フィルタを通過したデータを取得
        let filtered = getFilteredProperties(true);

        // 1. スプレッドシート独自フィルタの適用
        // フリーワード検索 (物件名、駅名、路線名、住所)
        if (state.sheetSearchQuery) {
            const q = state.sheetSearchQuery;
            filtered = filtered.filter(p => 
                (p.title && p.title.toLowerCase().includes(q)) ||
                (p.station && p.station.toLowerCase().includes(q)) ||
                (p.line && p.line.toLowerCase().includes(q)) ||
                (p.address && p.address.toLowerCase().includes(q))
            );
        }

        // 徒歩上限
        if (state.sheetWalkLimit !== "all") {
            const limit = parseInt(state.sheetWalkLimit);
            filtered = filtered.filter(p => p.walk_min <= limit);
        }

        // 築年数上限
        if (state.sheetAgeLimit !== "all") {
            const limit = parseInt(state.sheetAgeLimit);
            filtered = filtered.filter(p => parseAge(p.age_floor) <= limit);
        }

        // 自己負担上限
        if (state.sheetSelfPayLimit !== "all") {
            const limit = parseFloat(state.sheetSelfPayLimit);
            filtered = filtered.filter(p => p.self_pay <= limit);
        }

        // 2. ソートの適用
        filtered.sort((a, b) => {
            let valA, valB;
            
            // 各種キーに対する値の抽出
            if (state.sheetSortKey === "station") {
                valA = a.station;
                valB = b.station;
            } else if (state.sheetSortKey === "line") {
                valA = a.line;
                valB = b.line;
            } else if (state.sheetSortKey === "title") {
                valA = a.title;
                valB = b.title;
            } else if (state.sheetSortKey === "rent") {
                valA = parseTotalRent(a.rent, a.admin, a.parking_fee || 0);
                valB = parseTotalRent(b.rent, b.admin, b.parking_fee || 0);
            } else if (state.sheetSortKey === "self_pay") {
                valA = a.self_pay;
                valB = b.self_pay;
            } else if (state.sheetSortKey === "walk_min") {
                valA = a.walk_min;
                valB = b.walk_min;
            } else if (state.sheetSortKey === "train_min") {
                valA = a.train_min;
                valB = b.train_min;
            } else if (state.sheetSortKey === "door_to_door") {
                valA = a.door_to_door;
                valB = b.door_to_door;
            } else if (state.sheetSortKey === "menseki") {
                valA = parseAreaSize(a.menseki);
                valB = parseAreaSize(b.menseki);
            } else if (state.sheetSortKey === "age") {
                valA = parseAge(a.age_floor);
                valB = parseAge(b.age_floor);
            } else {
                valA = a.walk_min;
                valB = b.walk_min;
            }

            // 比較処理 (文字列と数値に対応)
            if (typeof valA === "string") {
                return state.sheetSortOrder === "asc" 
                    ? valA.localeCompare(valB, "ja") 
                    : valB.localeCompare(valA, "ja");
            } else {
                return state.sheetSortOrder === "asc" ? valA - valB : valB - valA;
            }
        });

        // 3. HTMLの生成
        if (filtered.length === 0) {
            sheetTable.innerHTML = `<thead><tr><th>物件データなし</th></tr></thead><tbody><tr><td style="text-align:center; padding: 2rem; color: var(--text-secondary);">該当する物件がありません。</td></tr></tbody>`;
            return;
        }

        // ヘッダー生成
        const columns = [
            { key: "station", label: "駅名" },
            { key: "line", label: "路線" },
            { key: "title", label: "物件名" },
            { key: "self_pay", label: "自己負担額" },
            { key: "rent", label: "総家賃" },
            { key: "walk_min", label: "駅徒歩" },
            { key: "door_to_door", label: "通勤時間" },
            { key: "menseki", label: "面積" },
            { key: "age", label: "築年数" },
            { key: "action", label: "リンク", noSort: true }
        ];

        let theadHtml = "<tr>";
        columns.forEach(col => {
            if (col.noSort) {
                theadHtml += `<th>${col.label}</th>`;
            } else {
                const isActive = state.sheetSortKey === col.key;
                const activeClass = isActive ? "active-sort" : "";
                const icon = isActive ? (state.sheetSortOrder === "asc" ? " ▲" : " ▼") : " ⇅";
                theadHtml += `<th class="${activeClass}" data-key="${col.key}">${col.label}<span class="sort-icon">${icon}</span></th>`;
            }
        });
        theadHtml += "</tr>";

        // ボディ生成
        let tbodyHtml = "";
        filtered.forEach(p => {
            const pFee = p.parking_fee || 0;
            const totalRent = parseTotalRent(p.rent, p.admin, pFee).toFixed(2);
            const selfPay = p.self_pay.toFixed(2);
            const selfPayColorClass = getSelfPayColorClass(selfPay);
            
            let walkColor = "green";
            if (p.walk_min >= 15) walkColor = "red";
            else if (p.walk_min >= 11) walkColor = "yellow";

            let commuteColor = "green";
            if (p.door_to_door >= 55) commuteColor = "red";
            else if (p.door_to_door >= 45) commuteColor = "yellow";

            tbodyHtml += `
                <tr>
                    <td><strong>${p.station}駅</strong></td>
                    <td><span style="color: var(--text-secondary);">${p.line}</span></td>
                    <td title="${p.title}" style="max-width: 180px; overflow: hidden; text-overflow: ellipsis;">${p.title}</td>
                    <td class="self-pay-cell ${selfPayColorClass}">${selfPay}万円</td>
                    <td class="rent-cell">${totalRent}万円 <span style="font-size:0.75rem; font-weight:normal; color:var(--text-secondary);">(${p.rent})</span></td>
                    <td class="commute-cell ${walkColor}">${p.walk_min}分</td>
                    <td class="commute-cell ${commuteColor}">${p.door_to_door}分 <span style="font-size:0.75rem; font-weight:normal; color:var(--text-secondary);">(電:${p.train_min} / 換:${p.transfers})</span></td>
                    <td>${p.menseki} (${p.madori})</td>
                    <td class="age-cell">${p.age_floor.split(" ")[0]}</td>
                    <td><a href="${p.url}" target="_blank" class="table-action-btn">詳細</a></td>
                </tr>
            `;
        });

        sheetTable.innerHTML = `<thead>${theadHtml}</thead><tbody>${tbodyHtml}</tbody>`;

        // ヘッダークリックイベントの設定
        const headers = sheetTable.querySelectorAll("thead th[data-key]");
        headers.forEach(th => {
            th.addEventListener("click", () => {
                const key = th.dataset.key;
                if (state.sheetSortKey === key) {
                    // ソート方向を反転
                    state.sheetSortOrder = state.sheetSortOrder === "asc" ? "desc" : "asc";
                } else {
                    // 新しいキーでソート（デフォルト昇順）
                    state.sheetSortKey = key;
                    state.sheetSortOrder = "asc";
                }
                renderSheetTable();
            });
        });
    }

    // グローバルスコープに駅フィルター関数を展開（ポップアップから呼べるようにする）
    window.focusOnStation = function(stationName) {
        state.area = stationName;
        // 物件カードタブをアクティブにする
        tabButtons[0].click();
        render();
    };

    // 初期レンダリング
    render();
    renderSheetTable();
    updateCompareButton();
});
