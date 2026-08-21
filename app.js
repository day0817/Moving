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

    // 並び替え条件の定義
    const SORT_CRITERIA = {
        'walk-asc': { label: '徒歩時間（短い順）', compare: (a, b) => a.walk_min - b.walk_min },
        'commute-asc': { label: 'ドアドア時間（短い順）', compare: (a, b) => a.door_to_door - b.door_to_door },
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
    
    // モーダル要素
    const compareModal = document.getElementById("compareModal");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const compareTable = document.getElementById("compareTable");

    // 現在のフィルタ・ソート状態
    const state = {
        prefecture: "all",
        city: "all",
        onlyNew: false,
        sortPriority: ['walk-asc', 'commute-asc', 'age-asc', 'rent-asc', 'menseki-desc'],
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

        // 全体の候補対象（NEWのみ表示状態を反映）
        const baseProps = state.onlyNew ? properties.filter(p => p.is_new) : properties;

        // 都道府県一覧
        const prefCounts = {};
        baseProps.forEach(p => {
            const pref = getPrefecture(p.address);
            if (pref) {
                prefCounts[pref] = (prefCounts[pref] || 0) + 1;
            }
        });

        // 都道府県タブHTML
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

        // 市区町村タブの描画
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

        // 選択中都道府県内の物件
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
            const colorClass = getCommuteColorClass(p.door_to_door);
            const selfPayClass = getSelfPayColorClass(p.self_pay);

            // 駐車場警告バッジ（100m以上離れている場合）
            const parkingBadge = (p.parking_dist && p.parking_dist >= 100)
                ? `<span class="parking-badge warning">駐車場 ${p.parking_dist}m先</span>`
                : '';

            // NEWバッジ
            const newBadge = p.is_new
                ? `<span class="card-new-badge">NEW</span>`
                : '';

            const progressPct = Math.min(100, (p.door_to_door / 60) * 100);

            return `
                <div class="bukken-card glass" data-url="${p.url}">
                    <div class="card-header">
                        <div class="header-badges">
                            ${newBadge}
                            <span class="station-badge">${p.station}駅 (${p.line})</span>
                            ${parkingBadge}
                        </div>
                        <label class="compare-checkbox-label">
                            <input type="checkbox" class="compare-check" ${isSelected ? 'checked' : ''} data-url="${p.url}">
                            比較
                        </label>
                    </div>

                    <h2 class="bukken-title" title="${p.title}">${p.title}</h2>

                    <div class="rent-box">
                        <div class="self-pay-row ${selfPayClass}">
                            自己負担: <strong>${p.self_pay.toFixed(2)}</strong> 万円/月
                        </div>
                        <div class="rent-total-row">
                            家賃: <strong>${p.rent}</strong> (管理費: ${p.admin || '-'})
                        </div>
                        <div class="rent-breakdown">
                            駐車場代: ${p.parking_fee > 0 ? (p.parking_fee + '万円') : (p.parking_text || '-')} / 敷金: ${p.deposit} / 礼金: ${p.gratuity}
                        </div>
                    </div>

                    <div class="commute-visual">
                        <div class="commute-header">
                            <span class="commute-total ${colorClass}">
                                徒歩${p.walk_min}分 → 乗車${p.train_min}分 (計${p.door_to_door}分)
                            </span>
                            <span class="commute-breakdown">
                                乗換: ${p.transfers}回
                            </span>
                        </div>
                        <div class="progress-bar-container">
                            <div class="progress-bar ${colorClass}" style="width: ${progressPct}%;"></div>
                        </div>
                    </div>

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
                        <div><strong>立地:</strong> ${p.station_walk}</div>
                    </div>

                    <div class="card-footer">
                        <a href="${p.url}" target="_blank" rel="noopener noreferrer" class="detail-btn">
                            SUUMOで詳細を見る &rarr;
                        </a>
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

            // ▲▼ ボタンイベント
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

        const headers = selectedProperties.map(p => `
            <th>
                <div style="margin-bottom: 0.3rem;">
                    ${p.is_new ? '<span class="card-new-badge" style="margin-right: 4px;">NEW</span>' : ''}
                    <strong>${p.station}駅</strong>
                </div>
                <div style="font-size: 0.85rem; font-weight: normal; max-width: 220px; word-break: break-all;">${p.title}</div>
            </th>
        `).join('');

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
            const colorClass = getCommuteColorClass(p.door_to_door);
            return `
                <td class="commute-val ${colorClass}">
                    <strong>計 ${p.door_to_door}分</strong><br>
                    <span style="font-size: 0.78rem;">(徒歩${p.walk_min}分 + 乗車${p.train_min}分, 乗換${p.transfers}回)</span>
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
                state.city = "all"; // 都道府県変更時は市区町村リセット
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

    // 初期化実行
    updateNewCount();
    renderSortPriorityList();
    renderProperties();
});
