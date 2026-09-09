const fs = require('fs');
const path = require('path');
const https = require('https');

const CSV_PATH = path.join(__dirname, '..', 'data', 'station_commute.csv');
// Webアプリ（GitHub Pages）が <script src> で読み込む駅別通勤DB。CSVから機械生成する。
const JS_PATH = path.join(__dirname, '..', 'station_commute.js');

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

// Yahoo!路線情報を取得
function fetchTransitHtml(stationName) {
    return new Promise((resolve, reject) => {
        const { y, m, d } = getNextMonday();
        const url = `https://transit.yahoo.co.jp/search/result?from=${encodeURIComponent(stationName)}&to=${encodeURIComponent('東京サンケイビル')}&type=4&ticket=ic&expkind=1&y=${y}&m=${m}&d=${d}&hh=08&m1=4&m2=5`;

        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            }
        };

        https.get(url, options, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                // リダイレクト処理
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

// 時間文字列（例: "45分", "1時間0分", "1時間15分"）を分数（整数）に変換
function parseTimeToMinutes(str) {
    if (!str) return null;
    const hourMatch = str.match(/(\d+)時間/);
    const minMatch = str.match(/(\d+)分/);
    let total = 0;
    if (hourMatch) {
        total += parseInt(hourMatch[1], 10) * 60;
    }
    if (minMatch) {
        total += parseInt(minMatch[1], 10);
    }
    return total > 0 ? total : null;
}

// HTMLからroute01をパース
function parseRoute01(html) {
    if (!html.includes('id="route01"')) {
        return null;
    }

    const startPos = html.indexOf('id="route01"');
    const endPos = html.indexOf('id="route02"');
    const route01Html = html.substring(startPos, endPos > 0 ? endPos : undefined);

    // 1. サマリー情報
    // 例: <span>07:37発→08:37着</span>1時間0分（乗車51分）
    // または: <span>07:52発→08:37着</span>45分（乗車29分）
    const timeMatch = route01Html.match(/<li class="time">[\s\S]*?<\/span>([^（<]+)<!-- -->（乗車<!-- -->([^）<]+)<!-- -->）/)
        || route01Html.match(/<li class="time">[\s\S]*?<\/span>([^（<]+)（乗車([^）]+)）/)
        || route01Html.match(/<li class="time">[\s\S]*?<\/span>([^（<]+)/);

    let totalTime = null;
    let trainTime = null;
    if (timeMatch) {
        totalTime = parseTimeToMinutes(timeMatch[1]);
        trainTime = timeMatch[2] ? parseTimeToMinutes(timeMatch[2]) : totalTime;
    }

    const transferMatch = route01Html.match(/<li class="transfer">[\s\S]*?(\d+)\s*(?:<!-- -->)?\s*回/);
    const transfers = transferMatch ? parseInt(transferMatch[1], 10) : 0;

    // 2. 停車駅一覧
    const stations = [];
    const stationMatches = route01Html.matchAll(/<div class="station"[^>]*>[\s\S]*?<dt[^>]*>([\s\S]*?)<\/dt>/g);
    for (const m of stationMatches) {
        const text = m[1].replace(/<[^>]+>/g, '').trim();
        stations.push(text);
    }

    // 3. 路線・移動手段
    const transports = [];
    const transportMatches = route01Html.matchAll(/<li class="transport"[\s\S]*?>([\s\S]*?)<\/li>/g);
    let arrivalWalkMin = 0;
    let exitInfo = '';

    for (const m of transportMatches) {
        const fullTransportHtml = m[1];
        const walkMatch = fullTransportHtml.match(/徒歩(\d+)分/);
        const exitMatch = fullTransportHtml.match(/出口：([^<]+)/);
        if (exitMatch) {
            exitInfo = exitMatch[1].trim();
        }

        if (fullTransportHtml.includes('icnWalk') || walkMatch) {
            if (walkMatch) {
                arrivalWalkMin = parseInt(walkMatch[1], 10);
            }
        } else {
            // 電車路線名
            const lineMatch = fullTransportHtml.match(/<span class="icon [^"]*"><\/span>([^<]+)/);
            if (lineMatch) {
                transports.push(lineMatch[1].trim());
            } else {
                const text = fullTransportHtml.replace(/<[^>]+>/g, '').replace(/\[.*\]/g, '').trim();
                if (text) transports.push(text);
            }
        }
    }

    // 到着駅
    let arrivalStation = '';
    if (stations.length >= 2) {
        arrivalStation = stations[stations.length - 2];
    }

    // 乗換徒歩・待ち時間
    const transitWalkMin = Math.max(0, (totalTime || 0) - (trainTime || 0) - arrivalWalkMin);

    // 経路サマリー
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
        memo: exitInfo ? `出口:${exitInfo}` : ''
    };
}

// CSVの読み書きヘルパー
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

// station_commute.csv の1行を、Webアプリが期待する駅DBエントリ形式へ変換する。
// 数値列は整数化し、未取得（空文字）の場合は 0 を入れる。memo（"出口:XXX"）からは出口情報のみ取り出す。
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

// data/station_commute.csv から station_commute.js（const stationCommuteData = {...}）を生成する。
// 通勤時間が未取得の駅（station_to_office_min が空）は Webアプリのフォールバック計算に委ねるため除外する。
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

// メイン実行関数
async function run(options = {}) {
    const maxFetch = options.limit || 999;
    const delayMs = options.delayMs || 3000; // 3秒ウェイト（ブロック対策）

    console.log(`Loading CSV from: ${CSV_PATH}`);
    const { headers, data } = loadCsv(CSV_PATH);
    if (!data || data.length === 0) {
        console.error('CSV data is empty.');
        return;
    }

    let fetchedCount = 0;
    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        // 既にデータが入っていればスキップ
        if (row.train_min && row.station_to_office_min) {
            continue;
        }

        if (fetchedCount >= maxFetch) {
            console.log(`Reached fetch limit (${maxFetch}). Stopping.`);
            break;
        }

        const stName = row.station_name;
        console.log(`[${i + 1}/${data.length}] Fetching commute data for: ${stName}...`);

        try {
            const html = await fetchTransitHtml(stName);
            const parsed = parseRoute01(html);

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
                console.warn(`  -> Failed to parse route01 for ${stName}`);
            }
        } catch (err) {
            console.error(`  -> Error fetching ${stName}:`, err.message);
        }

        // 次のリクエストまで待機
        console.log(`  Waiting ${delayMs}ms before next request...`);
        await new Promise(res => setTimeout(res, delayMs));
    }

    // 取得有無に関わらず、最新CSVから station_commute.js を再生成して整合させる
    buildStationCommuteJs();
    console.log(`Done! Fetched ${fetchedCount} stations. CSV / station_commute.js updated.`);
}

// コマンドライン引数処理
const args = process.argv.slice(2);
const limitArg = args.find(a => a.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 999;
const delayArg = args.find(a => a.startsWith('--delay='));
const delayMs = delayArg ? parseInt(delayArg.split('=')[1], 10) : 3000;

if (require.main === module) {
    if (args.includes('--build-js-only')) {
        // スクレイピングをせず、既存CSVから station_commute.js だけを再生成する
        buildStationCommuteJs();
    } else {
        run({ limit, delayMs });
    }
}

module.exports = { run, fetchTransitHtml, parseRoute01, loadCsv, saveCsv, buildStationCommuteJs };
