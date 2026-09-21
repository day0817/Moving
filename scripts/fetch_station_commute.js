const fs = require('fs');
const path = require('path');
const https = require('https');
const puppeteer = require('puppeteer-core');

const CSV_PATH = path.join(__dirname, '..', 'data', 'station_commute.csv');
// Webアプリ（GitHub Pages）が <script src> で読み込む駅別通勤DB。CSVから機械生成する。
const JS_PATH = path.join(__dirname, '..', 'station_commute.js');
// 掲載物件データ。ここに含まれる駅で station_commute.csv に無いものを新規取得対象として追加する。
const PROPERTIES_JS_PATH = path.join(__dirname, '..', 'properties.js');
// properties.js の各物件の最寄り駅のうち、これ以下の徒歩分の駅を通勤DBの取得対象に含める
// （駅徒歩上限15分緩和に合わせて15に変更）
const CANDIDATE_STATION_MAX_WALK = 15;

// Chrome / Edge のパスを検出
function getChromePath() {
    const paths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
    ];
    for (const p of paths) {
        if (fs.existsSync(p)) return p;
    }
    throw new Error('Chrome/Edge executable not found in standard paths.');
}

// 直近月曜日の日付 (YYYY, MM, DD)
function getNextMonday() {
    const now = new Date();
    const day = now.getDay(); // 0: Sun, 1: Mon, ...
    let daysUntilMonday = (1 - day + 7) % 7;
    if (daysUntilMonday === 0) {
        daysUntilMonday = 7;
    }
    const target = new Date(now.getTime() + daysUntilMonday * 24 * 60 * 60 * 1000);
    const y = target.getFullYear();
    const m = String(target.getMonth() + 1).padStart(2, '0');
    const d = String(target.getDate()).padStart(2, '0');
    return { y, m, d };
}

// 同名異駅の対策。
const STATION_QUERY_OVERRIDES = {
    '平和台': '平和台(千葉県)'
};

// ==============================================================================
// 1. Googleマップ スクレイピングエンジン (Puppeteer)
// ==============================================================================
async function fetchGoogleMapsTransit(browser, stationName) {
    const page = await browser.newPage();
    try {
        await page.setViewport({ width: 1280, height: 900 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

        const cleanStation = (STATION_QUERY_OVERRIDES[stationName] || stationName).replace(/駅$/, '').trim() + '駅';
        const url = `https://www.google.co.jp/maps/dir/${encodeURIComponent(cleanStation)}/${encodeURIComponent('東京サンケイビル')}/data=!4m2!4m1!3e3`;

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 35000 });

        // 「すぐに出発」等のボタンをクリックしてドロップダウンを展開
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const b = btns.find(x => x.innerText && (x.innerText.includes('すぐに出発') || x.innerText.includes('出発時刻')));
            if (b) b.click();
        });
        await new Promise(r => setTimeout(r, 600));

        // 「到着時刻」を選択
        await page.evaluate(() => {
            const all = Array.from(document.querySelectorAll('div, li, span, a'));
            const target = all.find(el => el.innerText && el.innerText.trim() === '到着時刻');
            if (target) target.click();
        });
        await new Promise(r => setTimeout(r, 800));

        // input[name="transit-time"] に 08:45 を安全に設定
        await page.evaluate(() => {
            const inp = document.querySelector('input[name="transit-time"]');
            if (!inp) return;
            inp.focus();
            inp.value = '08:45';
            inp.dispatchEvent(new Event('input', { bubbles: true }));
            inp.dispatchEvent(new Event('change', { bubbles: true }));
            // 入力確定トリガー
            const optBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('オプション'));
            if (optBtn) optBtn.focus();
        });

        // ルート再描画を待機
        await new Promise(r => setTimeout(r, 2500));

        // 第1候補ルートのパース
        const parsed = await page.evaluate((stName) => {
            const trips = Array.from(document.querySelectorAll('[data-trip-index]'));
            if (trips.length === 0) return null;
            const firstTrip = trips[0];
            const fullText = firstTrip.innerText;

            const timeMatch = fullText.match(/(?:(\d+)\s*時間\s*)?(\d+)\s*分/);
            if (!timeMatch) return null;
            const h = timeMatch[1] ? parseInt(timeMatch[1], 10) : 0;
            const totalTime = h * 60 + parseInt(timeMatch[2], 10);

            // 到着後の徒歩時間（例: "590円  2 分"）
            let arrivalWalkMin = 2;
            const walkMatch = fullText.match(/\s*(\d+)\s*分/);
            if (walkMatch) {
                arrivalWalkMin = parseInt(walkMatch[1], 10);
            }

            // 利用路線名と乗換回数
            const linesText = fullText.split('\n').find(l => l.includes('線') || l.includes('ライン') || l.includes('エクスプレス')) || '';
            let transfers = 0;
            const lines = [];
            if (linesText.includes('')) {
                const parts = linesText.split('').map(s => s.trim()).filter(Boolean);
                transfers = Math.max(0, parts.length - 1);
                parts.forEach(p => { if (!lines.includes(p)) lines.push(p); });
            } else if (linesText) {
                transfers = 0;
                lines.push(linesText.trim());
            }

            let arrivalStation = '大手町(東京都)';
            if (arrivalWalkMin >= 8 && (linesText.includes('総武') || linesText.includes('横須賀') || fullText.includes('東京駅'))) {
                arrivalStation = '東京';
            }

            const cleanLines = lines.join(',');
            const trainTime = Math.max(1, totalTime - arrivalWalkMin - (transfers * 3));
            const transitWalkMin = Math.max(0, totalTime - trainTime - arrivalWalkMin);
            const routeSummary = transfers === 0 
                ? `${stName.replace(/駅$/, '')}→${arrivalStation}` 
                : `${stName.replace(/駅$/, '')}→[乗換${transfers}回]→${arrivalStation}`;

            return {
                totalTime,
                trainTime,
                transfers,
                arrivalStation,
                arrivalWalkMin,
                transitWalkMin,
                linesUsed: cleanLines || '電車',
                routeSummary,
                memo: 'Googleマップ(08:45着)'
            };
        }, stationName);

        return parsed;
    } finally {
        await page.close();
    }
}

// ==============================================================================
// 2. Yahoo!路線情報 フォールバックエンジン (HTTP)
// ==============================================================================
function fetchTransitHtml(stationName) {
    return new Promise((resolve, reject) => {
        const { y, m, d } = getNextMonday();
        const query = STATION_QUERY_OVERRIDES[stationName] || stationName;
        const url = `https://transit.yahoo.co.jp/search/result?from=${encodeURIComponent(query)}&to=${encodeURIComponent('東京サンケイビル')}&type=4&ticket=ic&expkind=1&y=${y}&m=${m}&d=${d}&hh=08&m1=4&m2=5`;

        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            }
        };

        https.get(url, options, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                https.get(res.headers.location, options, (r2) => {
                    let data = '';
                    r2.on('data', chunk => data += chunk);
                    r2.on('end', () => resolve(data));
                }).on('error', reject);
                return;
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

function parseTimeToMinutes(str) {
    if (!str) return null;
    const hourMatch = str.match(/(\d+)時間/);
    const minMatch = str.match(/(\d+)分/);
    let total = 0;
    if (hourMatch) total += parseInt(hourMatch[1], 10) * 60;
    if (minMatch) total += parseInt(minMatch[1], 10);
    return total > 0 ? total : null;
}

function parseRoute01(html) {
    if (!html || !html.includes('id="route01"')) return null;

    const startPos = html.indexOf('id="route01"');
    const endPos = html.indexOf('id="route02"');
    const route01Html = html.substring(startPos, endPos > 0 ? endPos : undefined);

    const timeMatch = route01Html.match(/<li class="time">[\s\S]*?<\/span>([^（<]+)<!-- -->（乗車<!-- -->([^）<]+)<!-- -->）/)
        || route01Html.match(/<li class="time">[\s\S]*?<\/span>([^（<]+)（乗車([^）]+)）/)
        || route01Html.match(/<li class="time">[\s\S]*?<\/span>([^（<]+)/);

    let totalTime = null;
    let trainTime = null;
    if (timeMatch) {
        totalTime = parseTimeToMinutes(timeMatch[1]);
        if (timeMatch[2]) trainTime = parseTimeToMinutes(timeMatch[2]);
    }

    const transferMatch = route01Html.match(/<li class="transfer">[\s\S]*?(\d+)回/);
    const transfers = transferMatch ? parseInt(transferMatch[1], 10) : 0;

    const stationRegex = /<dt>(?:<a[^>]*>)?([^<]+?)(?:<\/a>)?<\/dt>/g;
    const stations = [];
    let match;
    while ((match = stationRegex.exec(route01Html)) !== null) {
        const name = match[1].replace(/<!--.*?-->/g, '').trim();
        if (name && !stations.includes(name)) stations.push(name);
    }

    let arrivalWalkMin = 1;
    let exitInfo = '';
    const transports = [];
    const transportRegex = /<li class="transport">([\s\S]*?)<\/li>/g;
    let tm;
    while ((tm = transportRegex.exec(route01Html)) !== null) {
        const full = tm[1];
        const wm = full.match(/徒歩(\d+)分/);
        const em = full.match(/出口：([^<]+)/);
        if (em) exitInfo = em[1].trim();
        if (full.includes('icnWalk') || wm) {
            if (wm) arrivalWalkMin = parseInt(wm[1], 10);
        } else {
            const lm = full.match(/<span class="icon [^"]*"><\/span>([^<]+)/);
            if (lm) transports.push(lm[1].trim());
        }
    }

    let arrivalStation = stations.length >= 2 ? stations[stations.length - 2] : '大手町(東京都)';
    const transitWalkMin = Math.max(0, (totalTime || 0) - (trainTime || 0) - arrivalWalkMin);
    const routeSummary = stations.slice(0, stations.length - 1).join('→');

    return {
        totalTime,
        trainTime,
        transfers,
        arrivalStation,
        arrivalWalkMin,
        transitWalkMin,
        linesUsed: transports.join(','),
        routeSummary,
        memo: exitInfo ? `出口:${exitInfo}` : 'Yahoo路線情報'
    };
}

// ==============================================================================
// 3. CSV / JS 読み書き・データ同期
// ==============================================================================
function loadCsv(filePath) {
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
    const lines = content.split(/\r?\n/).filter(l => l.trim());
    if (lines.length === 0) return [];
    
    const headers = parseCsvLine(lines[0]);
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const row = parseCsvLine(lines[i]);
        if (row.length >= headers.length) {
            const obj = {};
            headers.forEach((h, idx) => {
                obj[h] = row[idx] || '';
            });
            data.push(obj);
        }
    }
    return { headers, data };
}

function parseCsvLine(text) {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '"') {
            if (inQuotes && text[i + 1] === '"') {
                cur += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (c === ',' && !inQuotes) {
            result.push(cur);
            cur = '';
        } else {
            cur += c;
        }
    }
    result.push(cur);
    return result;
}

function saveCsv(filePath, headers, data) {
    const lines = [headers.map(h => `"${h}"`).join(',')];
    data.forEach(item => {
        const row = headers.map(h => {
            const val = String(item[h] ?? '').replace(/"/g, '""');
            return `"${val}"`;
        });
        lines.push(row.join(','));
    });
    const content = '\uFEFF' + lines.join('\r\n');
    fs.writeFileSync(filePath, content, 'utf8');
}

function csvRowToCommuteEntry(row) {
    const toInt = (v) => {
        const n = parseInt(String(v ?? '').trim(), 10);
        return Number.isFinite(n) ? n : 0;
    };
    const memo = String(row.memo ?? '').trim();
    const exitPrefix = '出口:';
    const exitInfo = memo.startsWith(exitPrefix) ? memo.slice(exitPrefix.length) : '';
    return {
        line: row.primary_line || '',
        train_min: toInt(row.train_min),
        station_to_office_min: toInt(row.station_to_office_min),
        transfers: toInt(row.transfers),
        arrival_station: row.arrival_station || '',
        arrival_walk_min: toInt(row.arrival_walk_min),
        transit_walk_min: toInt(row.transit_walk_min),
        route_summary: row.route_summary || '',
        lines_used: row.lines_used || '',
        exit_info: exitInfo
    };
}

function buildStationCommuteJs(csvPath = CSV_PATH, jsPath = JS_PATH) {
    const loaded = loadCsv(csvPath);
    const rows = Array.isArray(loaded) ? [] : (loaded.data || []);
    const db = {};
    let skipped = 0;
    rows.forEach((row) => {
        const name = String(row.station_name ?? '').trim();
        if (!name) return;
        if (!String(row.station_to_office_min ?? '').trim()) {
            skipped++;
            return;
        }
        db[name] = csvRowToCommuteEntry(row);
    });

    const content =
        '// 駅別通勤時間データベース (data/station_commute.csv から自動生成 / 手動編集不可)\n' +
        'const stationCommuteData = ' + JSON.stringify(db, null, 4) + ';\n\n' +
        "if (typeof module !== 'undefined') {\n    module.exports = stationCommuteData;\n}\n";
    fs.writeFileSync(jsPath, content, 'utf8');
    console.log(`Generated ${jsPath} (${Object.keys(db).length} stations${skipped ? `, ${skipped} skipped: no commute time` : ''}).`);
    return db;
}

function extractStationsFromProperties(propsJsPath = PROPERTIES_JS_PATH) {
    if (!fs.existsSync(propsJsPath)) return [];
    const raw = fs.readFileSync(propsJsPath, 'utf8');
    const m = raw.match(/const\s+bukkenData\s*=\s*(\[[\s\S]*?\]);(?:\s*$|\s*[\r\n])/) || raw.match(/const\s+bukkenData\s*=\s*(\[[\s\S]*\]);?\s*$/);
    let list;
    try {
        list = JSON.parse(m ? m[1] : raw);
    } catch (e) {
        console.warn(`properties.js のパースに失敗: ${e.message}`);
        return [];
    }
    const stations = new Set();
    for (const p of list) {
        if (p && p.station) stations.add(String(p.station).trim());
        const sw = String(p && p.station_walk || '');
        for (const seg of sw.split(/\s*\/\s*/)) {
            const mm = seg.match(/(?:[^/]+\/)?([^/駅]+)駅\s*歩(\d+)分/);
            if (mm && parseInt(mm[2], 10) <= CANDIDATE_STATION_MAX_WALK) {
                stations.add(mm[1].trim());
            }
        }
    }
    return [...stations].filter(Boolean);
}

function addMissingStationsToCsv(csvPath = CSV_PATH, propsJsPath = PROPERTIES_JS_PATH) {
    const loaded = loadCsv(csvPath);
    if (Array.isArray(loaded)) return [];
    const { headers, data } = loaded;
    const known = new Set(data.map(r => r.station_name));
    const missing = extractStationsFromProperties(propsJsPath).filter(s => !known.has(s));
    if (missing.length === 0) return [];
    for (const name of missing) {
        const row = {};
        headers.forEach(h => { row[h] = ''; });
        row.station_name = name;
        data.push(row);
    }
    saveCsv(csvPath, headers, data);
    console.log(`properties.js から新規駅 ${missing.length} 件をCSVへ追加: ${missing.join(', ')}`);
    return missing;
}

// ==============================================================================
// 4. メイン実行関数
// ==============================================================================
async function run(options = {}) {
    const maxFetch = options.limit || 999;
    const delayMs = options.delayMs || 2500;
    const engine = options.engine || 'gmaps'; // 'gmaps' | 'yahoo'
    const forceRefresh = options.forceRefresh || false;

    // properties.js に登場する未登録の駅をCSVへ追加
    addMissingStationsToCsv();

    console.log(`Loading CSV from: ${CSV_PATH} (Engine: ${engine}, forceRefresh: ${forceRefresh})`);
    const { headers, data } = loadCsv(CSV_PATH);
    if (!data || data.length === 0) {
        console.error('CSV data is empty.');
        return;
    }

    let browser = null;
    if (engine === 'gmaps') {
        const chromePath = getChromePath();
        console.log(`Launching Chrome for Google Maps scraping: ${chromePath}`);
        browser = await puppeteer.launch({
            executablePath: chromePath,
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled', '--lang=ja-JP']
        });
    }

    let fetchedCount = 0;
    try {
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            // 既にデータがあり、かつ強制再取得でない場合はスキップ
            if (!forceRefresh && row.train_min && row.station_to_office_min) {
                continue;
            }

            if (fetchedCount >= maxFetch) {
                console.log(`Reached fetch limit (${maxFetch}). Stopping.`);
                break;
            }

            const stName = row.station_name;
            console.log(`[${i + 1}/${data.length}] Fetching commute data for: ${stName} via ${engine}...`);

            let parsed = null;
            if (engine === 'gmaps' && browser) {
                try {
                    parsed = await fetchGoogleMapsTransit(browser, stName);
                } catch (gErr) {
                    console.warn(`  -> Google Maps fetch failed (${gErr.message}), falling back to Yahoo...`);
                }
            }

            // Google Maps で取得できなかった、または yahoo 指定の場合は Yahoo 路線情報でフォールバック
            if (!parsed || parsed.totalTime === null) {
                try {
                    const html = await fetchTransitHtml(stName);
                    parsed = parseRoute01(html);
                } catch (yErr) {
                    console.error(`  -> Yahoo fetch also failed for ${stName}:`, yErr.message);
                }
            }

            if (parsed && parsed.totalTime !== null) {
                row.train_min = parsed.trainTime;
                row.transfers = parsed.transfers;
                row.arrival_station = parsed.arrivalStation;
                row.arrival_walk_min = parsed.arrivalWalkMin;
                row.transit_walk_min = parsed.transitWalkMin;
                row.station_to_office_min = parsed.totalTime;
                row.lines_used = parsed.linesUsed;
                row.route_summary = parsed.routeSummary;
                row.memo = parsed.memo;

                console.log(`  -> OK: 所要${parsed.totalTime}分(乗車${parsed.trainTime}分), 乗換${parsed.transfers}回, 到着:${parsed.arrivalStation}, 路線:${parsed.linesUsed}`);
                fetchedCount++;

                // 逐次保存（CSV + Webアプリ用JSを都度同期）
                saveCsv(CSV_PATH, headers, data);
                buildStationCommuteJs();
            } else {
                console.warn(`  -> Failed to obtain commute data for ${stName}`);
            }

            // 次のリクエストまで待機
            await new Promise(res => setTimeout(res, delayMs));
        }
    } finally {
        if (browser) {
            await browser.close();
        }
    }

    buildStationCommuteJs();
    console.log(`Done! Fetched ${fetchedCount} stations. CSV / station_commute.js updated.`);
}

// コマンドライン引数処理
const args = process.argv.slice(2);
const limitArg = args.find(a => a.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 999;
const delayArg = args.find(a => a.startsWith('--delay='));
const delayMs = delayArg ? parseInt(delayArg.split('=')[1], 10) : 2500;
const engineArg = args.find(a => a.startsWith('--engine='));
const engine = engineArg ? engineArg.split('=')[1] : 'gmaps';
const forceRefresh = args.includes('--force-refresh');

if (require.main === module) {
    if (args.includes('--build-js-only')) {
        buildStationCommuteJs();
    } else {
        run({ limit, delayMs, engine, forceRefresh });
    }
}

module.exports = {
    run, fetchGoogleMapsTransit, fetchTransitHtml, parseRoute01, loadCsv, saveCsv,
    buildStationCommuteJs, addMissingStationsToCsv, extractStationsFromProperties, getChromePath
};
