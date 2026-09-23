---
name: property_search
description: 指定エリアのSUUMO賃貸から条件に合致する戸建て物件を抽出し、Yahoo!路線情報による正確な通勤データ連携・Markdownレポート化・物件比較Webアプリのデータ同期およびGitHubへの自動反映を行うスキル。
---
# 物件検索・比較データ更新スキル (property_search)

このスキルは、大手町・東京サンケイビル勤務に向けた候補エリアから、指定要件（賃料、広さ、間取り、駅徒歩、駐車場有無など）に合致する賃貸一戸建て物件を定期的に自動検索・再集計し、新規物件の差分レポート作成と物件比較Webアプリ（GitHub Pages）へのデータ反映を行うためのものです。

## 1. ディレクトリ構造

すべてのスクリプトは**リポジトリルートを作業ディレクトリ**として実行する前提です。役割ごとに以下のディレクトリへ分離しています。

**スクリプト**
* `.agents/skills/property_search/property_search.py` : SUUMO物件検索・データ抽出・駐車場詳細スクレイピングの本体スクリプト。
* `scripts/fetch_station_commute.js` : `properties.js` の最寄り駅で未登録のものをCSVへ追加し、Googleマップ（Puppeteer / 直近月曜8:45着、Yahooフォールバック付）から各駅〜東京サンケイビルの正確な所要時間・乗換回数・到着駅・徒歩時間を取得して `data/station_commute.csv` を更新、そこから Webアプリ用 `station_commute.js` を再生成するスクリプト。
* `.agents/skills/property_search/build_rail_lines.py` : 国土数値情報「鉄道データ(N02)」から関東圏の実路線ジオメトリを抽出し、`rail_lines.js` を生成するスクリプト。
* `scripts/check_flood_risk.py` : `properties.js` の各物件の住所（丁目単位）と最寄駅について、国土地理院「重ねるハザードマップ」のタイル画像（洪水・家屋倒壊等氾濫想定区域・高潮・津波・内水・土砂災害警戒区域）を読み取って浸水リスクを判定し、Webアプリ用の `flood_risk.js` を生成するスクリプト（標準ライブラリ＋requestsのみ）。
* `scripts/run_weekly_update.ps1` : ステップ1〜ステップ6（スクレイピング、通勤同期、浸水リスク判定、キャッシュバスターおよび更新日時の更新、Gitプッシュ）を一括全自動実行する週次更新バッチ。
* `scripts/register_task.ps1` : Windowsタスクスケジューラに「毎週金曜日 20:30」の定期実行タスク（`Moving_Weekly_Property_Update`）を登録するスクリプト。

**データ (`data/`)**
* `data/station_commute.csv` : 駅別通勤データCSV（`fetch_station_commute.js` の入出力）。
* `data/geocoding_cache.json` : 駅座標のジオコーディング結果キャッシュ。
* `data/flood_risk_cache.json` : 浸水リスク判定結果のキャッシュ（`check_flood_risk.py` が生成。180日間は再判定しない）。
* `data/flood_risk_notes.json` : 浸水リスクの手動評価と被害実績（**手で編集**）。`manual` は自動判定できないときの代わりの評価、`history` は地図に載らない被害実績で、`level` を書くと表示レベルの下限になる。

**ドキュメント (`doc/`)**
* `doc/物件検索結果.md` : 検索結果および前回差分（🆕 新規追加物件）のレポート。
* `doc/物件数推移.md` : 更新日ごとの駅別物件数推移とエリア供給分析レポート。

**Webアプリ配信ファイル（リポジトリルート直下 = GitHub Pages 公開対象）**
* `index.html` / `style.css` / `app.js` : 物件比較WebアプリのUI（ヘッダー右上に最終更新日時バッジを表示）。
* `properties.js` : 抽出された物件データ一覧および最終更新日 `bukkenUpdatedAt`（`property_search.py` が生成）。
* `station_commute.js` : 駅別通勤時間データベース（Webアプリ用）。`data/station_commute.csv` から機械生成するため直接編集しない。
* `rail_lines.js` : 通勤アクセスマップ用の実路線ジオメトリ（`build_rail_lines.py` が生成）。
* `flood_risk.js` : 物件住所・最寄駅の浸水リスク判定結果（`check_flood_risk.py` が生成。直接編集しない）。
* `Image/` : favicon・アプリアイコン類。`site.webmanifest` はルート直下。

---

## 2. 定期再集計・更新ワークフロー

### A. 全自動更新（推奨）
ステップ1〜6の一連のフロー（スクレイピング、通勤同期、新駅再計算、浸水リスク判定、キャッシュバスターおよびHTML更新日時の更新、Gitプッシュ）を1コマンドで一括実行できます。
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts/run_weekly_update.ps1"
```

> **Windowsタスクスケジューラ定期実行**:
> 毎週金曜日 20:30 にタスク `Moving_Weekly_Property_Update` により上記バッチが自動起動します。
> （タスク再登録・設定変更は `powershell -NoProfile -ExecutionPolicy Bypass -File "scripts/register_task.ps1"`）

---

### B. 個別ステップ手動実行手順
個別に調整や確認を行いながら実行する場合は、以下のステップを順次実行します。

### ステップ1: SUUMOからの最新物件スクレイピング
```powershell
$env:PYTHONIOENCODING="utf-8"
py .agents/skills/property_search/property_search.py
```
- 出力先は既定で `doc/物件検索結果.md`（`--output` で変更可）。
- 駐車場料金・距離の詳細取得、安全マージ、新規物件の差分判定、および `doc/物件数推移.md` への駅別件数記録が自動実行され、`properties.js`、`doc/物件検索結果.md`、`doc/物件数推移.md` が更新されます。

### ステップ2: 新駅の通勤時間・乗換回数の自動取得とDB同期
```powershell
node scripts/fetch_station_commute.js
```
1. `properties.js` の各物件の最寄り駅（徒歩15分以内）のうち `data/station_commute.csv` に無い駅を、空行としてCSVへ自動追加します。
2. 通勤データが空の駅について、Googleマップ（Puppeteerスクレイピング / 月曜8:45着）から「所要時間」「乗換回数」「到着駅（大手町/東京）」「出口〜サンケイビルの実徒歩時間」を取得し、`data/station_commute.csv` を更新します（Googleマップ失敗時はYahoo!路線情報へ自動フォールバック）。
3. `data/station_commute.csv` から Webアプリ用の `station_commute.js`（`const stationCommuteData`）を**自動再生成**します（逐次保存の都度＋実行終了時）。手動編集は不要です。
- スクレイピングせず JS だけ作り直したいときは `node scripts/fetch_station_commute.js --build-js-only`。
- 新駅が追加された場合は、正確なドアドア時間で再判定するため**ステップ1をもう一度実行**します（駐車場情報はキャッシュ済みのため高速）。
- 既存全駅をGoogleマップで再同期したい場合は `node scripts/fetch_station_commute.js --force-refresh`。

### ステップ3: 必須カットオフ条件の確認
- `property_search.py` が抽出・掲載判定する条件（`.agents/skills/property_search/property_search.py` 冒頭の定数）：
  - **自己負担額**: **5.0万円以下**（`MAX_SELF_PAY`）
    - 借上げ社宅の自己負担上限 **`COMPANY_SUBSIDY_CAP = 17.0`万**（〜17万は家賃2割負担、超過分は全額）。
    - **駐車場代は補助対象外**のため全額を自己負担へ加算。管理費は家賃に含む。
  - **駅徒歩15分以下 / 築30年以下 / 専有面積80m²以上**
- Webアプリ（`app.js`）側の**必須カットオフ条件**：
  - **ドアドア通勤時間**: **59分以下** (`doorToDoor <= 59`)
  - **総徒歩時間**: **18分以内** (`totalWalkMin <= 18` / 物件〜駅 ＋ 到着駅〜オフィス)

> 社内制度の改定（自己負担2割の上限額 16万→17万）で自己負担額の計算が変わっています。
> 制度が再度変わった場合は `property_search.py` の `COMPANY_SUBSIDY_CAP` / `MAX_SELF_PAY` を更新してください。

### ステップ4: 浸水リスク自動判定
```powershell
py scripts/check_flood_risk.py
```
- 未判定（または判定から180日以上たった）住所・駅だけ、国土地理院の住所検索で丁目の代表点を求め、重ねるハザードマップのタイルを読み取って判定します。初回は数分かかります。
- 代表点に加え、周囲（丁目: 150m以内 / 町・大字: 300m以内）も約100m間隔×8方向で調べます。周辺だけで見つかった区域は1段階下げて評価します。
- 判定基準（高い方を採用）:
  - **極高**: 洪水・高潮・津波で3m以上、または家屋倒壊等氾濫想定区域の区域内
  - **高**: 0.5〜3m、または内水0.5m以上
  - **中**: 0.5m未満、または土砂災害警戒区域の区域内
  - **低**: 調べた範囲に想定区域なし
- 表示レベルは「自動判定」と `data/flood_risk_notes.json` の被害実績（`history[].level`）の高い方。自動判定できない住所は手動評価（`manual`）を表示し、バッジに「手動」と付きます。
- レイヤーが取得できない（URL変更など）と疑われるときは `py scripts/check_flood_risk.py --check-layers` で確認し、スクリプト冒頭の `LAYERS` を直します。凡例にない色はログに出るので `DEPTH_PALETTE` を見直します。
- 洪水レイヤーが読めない場合は判定を中止し（終了コード1）、既存のキャッシュと手動評価で `flood_risk.js` を出力します（「想定区域なし」と誤判定しないため）。
- 通信せずに `flood_risk.js` だけ作り直す: `py scripts/check_flood_risk.py --offline`（`flood_risk_notes.json` を編集したとき）。全件再判定: `--force`。

### ステップ5: Gitコミット＆GitHub Pagesへの自動反映
まず `index.html` の 5 か所のキャッシュバスター `?v=YYYYMMDD`、およびヘッダーの最終更新日時表示（`<time id="lastUpdated">`）を当日日付へ更新します（ブラウザのキャッシュを回避し、画面上に最新更新日を表示させるため）。
※ 全自動更新バッチ（`scripts/run_weekly_update.ps1`）を実行した場合は自動置換されます。
```powershell
git add index.html properties.js station_commute.js rail_lines.js flood_risk.js data/station_commute.csv data/flood_risk_cache.json data/geocoding_cache.json doc/物件検索結果.md doc/物件数推移.md
git commit -m "feat(data): 週次物件データおよび物件数推移の更新"
git push origin main
```
- リモートへのプッシュ完了後、GitHub Pages（https://day0817.github.io/Moving/ ）に数分で自動反映されます。

---

## 3. 物件比較Webアプリの仕様概要

- **更新日時バッジ（ヘッダー右上）**:
  - ヘッダー右上にデータの最終更新日（例: `最終更新: 2026/09/09`）をピル型バッジで常時表示。
  - `properties.js` の `bukkenUpdatedAt` をもとに `app.js` で動的に同期反映。静的HTML側にもフォールバック値を保持。
- **Solarized / Solarized Dark テーマ**:
  - Ethan Schoonover公式パレットに完全準拠し、ヘッダー右上のボタンで Dark / Light を即座に切り替え可能。
- **自己負担額の4段階カラーリング**:
  - `〜 3.20万円`: シアン（通常・安価）
  - `3.21 〜 4.00万円`: イエロー（軽度注意）
  - `4.01 〜 5.00万円`: ウォームアンバー（中間注意）
  - `5.01万円 〜`: ソフトコーラルレッド（上限域注意）
- **浸水リスクバッジ（`🌊 浸水 低/中/要確認/高/極高`）**:
  - `flood_risk.js` をもとに、カード上部に浸水リスクを5段階の色（緑/黄/紫/橙/赤）で表示。タップすると判定理由・レイヤー別の結果・被害実績・最寄駅周辺の評価・「重ねるハザードマップ」へのリンクを表示。
  - 手動評価の物件はバッジに「手動」と表示。フィルタ「浸水リスク高を除く」、並び替え「浸水リスク（低い順）」、比較表の「浸水リスク」行に対応。
- **到着駅アイコン（`🗼`）**:
  - 到着駅が東京駅の物件（サンケイビルまで徒歩7〜10分）には、総徒歩バッジ内に `🗼` アイコンを表示。
- **通勤詳細ポップオーバー**:
  - カードの通勤バッジにホバーまたはタップすることで、①物件徒歩 ②乗車 ③乗換待ち ④到着後徒歩の完全な内訳と他駅比較ルートを瞬時に確認可能。

