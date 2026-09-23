/**
 * scripts/fetch_extra_station_commute.js
 * 
 * 目的:
 *   指定された外部CSV（例: .work/d2d30_all_3r/station_commute_extra.csv）の未取得行（station_to_office_min が空）のみを対象に、
 *   Googleマップ（およびYahoo!路線情報フォールバック）で月曜8:45着・東京サンケイビル着の通勤時間を取得・逐次保存する。
 *   本番の station_commute.csv や station_commute.js には一切触らない。
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const puppeteer = require('puppeteer-core');
const {
    fetchGoogleMapsTransit,
    parseRoute01,
    loadCsv,
    saveCsv,
    getChromePath
} = require('./fetch_station_commute');

// 同名異駅・曖昧駅名の上書き用辞書
const STATION_NAME_OVERRIDES = {
    '栄町': '栄町(東京都)'
};

// 安全な Yahoo! 路線情報取得（相対パスリダイレクト対応）
function fetchTransitHtmlSafe(stationName) {
    return new Promise((resolve, reject) => {
        const query = (STATION_NAME_OVERRIDES[stationName] || stationName).replace(/駅$/, '').trim();
        const now = new Date();
        const day = now.getDay();
        let daysUntilMonday = (1 - day + 7) % 7;
        if (daysUntilMonday === 0) daysUntilMonday = 7;
        const target = new Date(now.getTime() + daysUntilMonday * 24 * 60 * 60 * 1000);
        const y = target.getFullYear();
        const m = String(target.getMonth() + 1).padStart(2, '0');
        const d = String(target.getDate()).padStart(2, '0');

        const url = `https://transit.yahoo.co.jp/search/result?from=${encodeURIComponent(query)}&to=${encodeURIComponent('東京サンケイビル')}&type=4&ticket=ic&expkind=1&y=${y}&m=${m}&d=${d}&hh=08&m1=4&m2=5`;

        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };

        const fetchUrl = (targetUrl) => {
            let fullUrl = targetUrl;
            if (fullUrl.startsWith('/')) {
                fullUrl = 'https://transit.yahoo.co.jp' + fullUrl;
            }
            https.get(fullUrl, options, (res) => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    fetchUrl(res.headers.location);
                    return;
                }
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(data));
            }).on('error', reject);
        };

        fetchUrl(url);
    });
}

async function runExtra() {
    const args = process.argv.slice(2);
    const csvArg = args.find(a => a.startsWith('--csv=') || a === '--csv');
    let csvPath = '';
    if (csvArg) {
        if (csvArg.includes('=')) {
            csvPath = csvArg.split('=')[1];
        } else {
            const idx = args.indexOf(csvArg);
            if (idx !== -1 && idx + 1 < args.length) {
                csvPath = args[idx + 1];
            }
        }
    }
    if (!csvPath) {
        console.error('エラー: --csv オプションで対象CSVパスを指定してください。');
        process.exit(1);
    }

    const resolvedCsvPath = path.resolve(process.cwd(), csvPath);
    if (!fs.existsSync(resolvedCsvPath)) {
        console.error(`エラー: 指定されたCSVが存在しません: ${resolvedCsvPath}`);
        process.exit(1);
    }

    const delayArg = args.find(a => a.startsWith('--delay='));
    const delayMs = delayArg ? parseInt(delayArg.split('=')[1], 10) : 2500;

    const limitArg = args.find(a => a.startsWith('--limit='));
    const maxFetch = limitArg ? parseInt(limitArg.split('=')[1], 10) : 999;

    const forceRefresh = args.includes('--force-refresh');

    console.log(`=== 新規駅通勤時間取得開始 ===`);
    console.log(`対象CSV: ${resolvedCsvPath}`);
    console.log(`待機時間: ${delayMs}ms, 取得上限: ${maxFetch}件, 強制再取得: ${forceRefresh}`);

    const { headers, data } = loadCsv(resolvedCsvPath);
    if (!data || data.length === 0) {
        console.log('対象CSVにデータがありません。終了します。');
        return;
    }

    const chromePath = getChromePath();
    console.log(`Chromeパス: ${chromePath}`);

    const browser = await puppeteer.launch({
        executablePath: chromePath,
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--lang=ja-JP'
        ]
    });

    let fetchedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    try {
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const hasData = row.station_to_office_min && String(row.station_to_office_min).trim() !== '';

            if (hasData && !forceRefresh) {
                skippedCount++;
                continue;
            }

            if (fetchedCount >= maxFetch) {
                console.log(`上限件数 (${maxFetch}) に達したため中断します。`);
                break;
            }

            const rawStName = (row.station_name || '').trim();
            if (!rawStName) continue;

            // バス・バス停・無効な文字列のガード
            if (rawStName.includes('バス') || rawStName.includes('バス停') || rawStName.length <= 1) {
                console.log(`[${i + 1}/${data.length}] スキップ（無効な駅名）: ${rawStName}`);
                row.memo = '無効駅名';
                saveCsv(resolvedCsvPath, headers, data);
                continue;
            }

            const stName = STATION_NAME_OVERRIDES[rawStName] || rawStName;
            console.log(`[${i + 1}/${data.length}] 取得中: ${stName} (元駅名: ${rawStName})... `);

            let parsed = null;
            // 1. Google Maps 試行
            try {
                parsed = await fetchGoogleMapsTransit(browser, stName);
            } catch (err) {
                console.warn(`  -> Google Maps 取得失敗 (${err.message})。Yahoo!路線情報へフォールバックします...`);
            }

            // 2. Yahoo!路線情報 フォールバック
            if (!parsed || parsed.totalTime === null) {
                try {
                    const html = await fetchTransitHtmlSafe(stName);
                    parsed = parseRoute01(html);
                } catch (yErr) {
                    console.error(`  -> Yahoo!路線情報も失敗 (${yErr.message})`);
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
                row.memo = parsed.memo || '';

                console.log(`  -> 成功: 所要${parsed.totalTime}分 (乗車${parsed.trainTime}分), 乗換${parsed.transfers}回, 到着:${parsed.arrivalStation}, 路線:${parsed.linesUsed}`);
                fetchedCount++;
            } else {
                row.memo = '取得失敗';
                failedCount++;
                console.warn(`  -> 失敗: 通勤データを取得できませんでした (memoに記録)`);
            }

            saveCsv(resolvedCsvPath, headers, data);
            await new Promise(r => setTimeout(r, delayMs));
        }
    } finally {
        if (browser) {
            await browser.close();
        }
    }

    console.log(`\n=== 完了サマリ ===`);
    console.log(`新規取得成功: ${fetchedCount} 件`);
    console.log(`取得失敗: ${failedCount} 件`);
    console.log(`スキップ（取得済み）: ${skippedCount} 件`);
    console.log(`CSV保存先: ${resolvedCsvPath}`);
}

if (require.main === module) {
    runExtra().catch(err => {
        console.error('Fatal error:', err);
        process.exit(1);
    });
}

module.exports = { runExtra };
