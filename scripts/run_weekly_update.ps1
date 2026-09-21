# ==============================================================================
# 物件比較Webアプリ 週次データ一括自動更新バッチ
# ==============================================================================
# 役割:
#   1. SUUMOからの最新物件スクレイピング (.agents/skills/property_search/property_search.py)
#   2. Yahoo!路線情報による駅別通勤データ同期 (scripts/fetch_station_commute.js)
#   3. 新駅追加時の再判定スクレイピング
#   4. index.html のキャッシュバスター (?v=YYYYMMDD) および更新日時の更新
#   5. Gitコミット＆GitHub Pages (origin/main) への自動プッシュ
# ==============================================================================

$ErrorActionPreference = "Continue"

# 作業ディレクトリをリポジトリルートに固定
$scriptDir = $PSScriptRoot
$repoRoot = (Split-Path -Parent $scriptDir)
Set-Location $repoRoot

$logDir = Join-Path $repoRoot "data"
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}
$logFile = Join-Path $logDir "update_job.log"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $now = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    $formatted = "[$now] [$Level] $Message"
    Write-Host $formatted
    Add-Content -Path $logFile -Value $formatted -Encoding UTF8
}

Write-Log "=================================================="
Write-Log "週次物件データ自動更新バッチを開始します"
Write-Log "リポジトリパス: $repoRoot"

$env:PYTHONIOENCODING = "utf-8"

# ------------------------------------------------------------------------------
# ステップ1: SUUMO物件スクレイピング
# ------------------------------------------------------------------------------
Write-Log "--- ステップ1: SUUMO最新物件スクレイピングを実行中 ---"
$searchScript = Join-Path $repoRoot ".agents\skills\property_search\property_search.py"

if (-not (Test-Path $searchScript)) {
    Write-Log "エラー: $searchScript が存在しません。" "ERROR"
    exit 1
}

$pyProc = Start-Process -FilePath "py" -ArgumentList "`"$searchScript`"" -NoNewWindow -Wait -PassThru
if ($pyProc.ExitCode -ne 0) {
    Write-Log "警告: property_search.py の終了コードが $($pyProc.ExitCode) です。" "WARN"
} else {
    Write-Log "ステップ1完了: property_search.py が正常終了しました。"
}

# ------------------------------------------------------------------------------
# ステップ2: 新駅の通勤時間・乗換回数の自動取得とDB同期
# ------------------------------------------------------------------------------
Write-Log "--- ステップ2: 新駅通勤データ取得・station_commute.js生成を実行中 ---"
$fetchScript = Join-Path $repoRoot "scripts\fetch_station_commute.js"

if (-not (Test-Path $fetchScript)) {
    Write-Log "エラー: $fetchScript が存在しません。" "ERROR"
    exit 1
}

$nodeProc = Start-Process -FilePath "node" -ArgumentList "`"$fetchScript`"" -NoNewWindow -Wait -PassThru
if ($nodeProc.ExitCode -ne 0) {
    Write-Log "警告: fetch_station_commute.js の終了コードが $($nodeProc.ExitCode) です。" "WARN"
} else {
    Write-Log "ステップ2完了: fetch_station_commute.js が正常終了しました。"
}

# ------------------------------------------------------------------------------
# ステップ3: 新駅が追加された場合の再計算
# ------------------------------------------------------------------------------
$csvStatus = git status --porcelain data/station_commute.csv
if ($csvStatus) {
    Write-Log "新駅の通勤データ追加を検知しました。正確なドアドア時間で再判定するためステップ1を再実行します..."
    $pyProc2 = Start-Process -FilePath "py" -ArgumentList "`"$searchScript`"" -NoNewWindow -Wait -PassThru
    Write-Log "新駅反映の再判定完了 (終了コード: $($pyProc2.ExitCode))"
} else {
    Write-Log "新駅の追加はありませんでした。ステップ3をスキップします。"
}

# ------------------------------------------------------------------------------
# ステップ4: index.html のキャッシュバスターおよび更新日時表示の更新
# ------------------------------------------------------------------------------
Write-Log "--- ステップ4: index.html のキャッシュバスターおよび更新日時を更新中 ---"
$indexPath = Join-Path $repoRoot "index.html"
$today = (Get-Date).ToString("yyyyMMdd")
$todaySlash = (Get-Date).ToString("yyyy/MM/dd")
$todayHyphen = (Get-Date).ToString("yyyy-MM-dd")

if (Test-Path $indexPath) {
    $indexContent = Get-Content -Path $indexPath -Raw -Encoding UTF8
    $newIndexContent = [System.Text.RegularExpressions.Regex]::Replace($indexContent, '\?v=\d{8}', "?v=$today")
    $newIndexContent = [System.Text.RegularExpressions.Regex]::Replace(
        $newIndexContent,
        '<time id="lastUpdated" datetime="[^"]*">[^<]*</time>',
        "<time id=`"lastUpdated`" datetime=`"$todayHyphen`">$todaySlash</time>"
    )
    if ($indexContent -ne $newIndexContent) {
        Set-Content -Path $indexPath -Value $newIndexContent -Encoding UTF8 -NoNewline
        Write-Log "index.html のキャッシュバスター(?v=$today)および更新日時($todaySlash)を更新しました。"
    } else {
        Write-Log "index.html のキャッシュバスターおよび更新日時は既に最新です。"
    }
} else {
    Write-Log "警告: index.html が見つかりません。" "WARN"
}

# ------------------------------------------------------------------------------
# ステップ5: Gitコミット＆GitHub Pages (origin/main) へのプッシュ
# ------------------------------------------------------------------------------
Write-Log "--- ステップ5: 変更差分の確認とGitプッシュ ---"

$targetFiles = @(
    "index.html",
    "properties.js",
    "station_commute.js",
    "rail_lines.js",
    "data/station_commute.csv",
    "data/geocoding_cache.json",
    "doc/物件検索結果.md",
    "doc/物件数推移.md"
)

$hasDiff = $false
foreach ($file in $targetFiles) {
    $status = git status --porcelain $file
    if ($status) {
        $hasDiff = $true
        Write-Log "差分検知: $file"
    }
}

if ($hasDiff) {
    Write-Log "変更対象ファイルをステージングします..."
    foreach ($file in $targetFiles) {
        git add $file
    }

    $commitMsg = "feat(data): 週次物件データおよび物件数推移の更新 ($today)"
    Write-Log "Gitコミットを実行中: '$commitMsg'"
    git commit -m $commitMsg

    Write-Log "GitHub Pages (origin/main) へプッシュを実行中..."
    $pushOutput = git push origin main 2>&1
    Write-Log "Push結果:`n$pushOutput"
    Write-Log "ステップ5完了: GitHub Pages への自動反映が完了しました。"
} else {
    Write-Log "更新対象ファイルに差分はありませんでした。Gitプッシュは不要です。"
}

Write-Log "週次物件データ自動更新バッチが正常に完了しました。"
Write-Log "=================================================="
