---
name: property_search
description: 指定エリアのSUUMO賃貸から条件に合致する戸建て物件を抽出し、Yahoo!路線情報による正確な通勤データ連携・Markdownレポート化・物件比較Webアプリのデータ同期およびGitHubへの自動反映を行うスキル。
---
# 物件検索・比較データ更新スキル (property_search)

このスキルは、大手町・東京サンケイビル勤務に向けた候補エリアから、指定要件（賃料、広さ、間取り、駅徒歩、駐車場有無など）に合致する賃貸一戸建て物件を定期的に自動検索・再集計し、新規物件の差分レポート作成と物件比較Webアプリ（GitHub Pages）へのデータ反映を行うためのものです。

## 1. ディレクトリ構造

* `skills/property_search/property_search.py` : SUUMO物件検索・データ抽出・駐車場詳細スクレイピングの本体スクリプト。
* `scripts/fetch_station_commute.js` : Yahoo!路線情報から各駅〜東京サンケイビル（直近月曜8:45着）の正確な乗車時間・乗換回数・到着駅・徒歩時間を自動取得・DB更新するスクリプト。
* `skills/property_search/build_rail_lines.py` : 国土数値情報「鉄道データ(N02)」から関東圏の実路線ジオメトリを抽出し、`rail_lines.js` を生成するスクリプト。
* `properties.js` / `物件比較アプリ/properties.js` : 抽出された物件データ一覧。
* `station_commute.js` / `物件比較アプリ/station_commute.js` : 駅別通勤時間データベース。
* `station_commute.csv` / `物件比較アプリ/station_commute.csv` : 駅別通勤データCSV。
* `物件検索結果.md` : 検索結果および前回差分（🆕 新規追加物件）のレポート。
* `物件数推移.md` : 更新日ごとの駅別物件数推移とエリア供給分析レポート。
* `物件比較アプリ/` : Webアプリ関連ファイル（`index.html`, `style.css`, `app.js`, `properties.js`, `station_commute.js`）。

---

## 2. 定期再集計・更新ワークフロー（チャットからの実行手順）

ユーザーから「物件を最新化して」「今週分の物件を再集計して」と依頼された際は、以下のステップを順次実行します。

### ステップ1: SUUMOからの最新物件スクレイピング
```powershell
$env:PYTHONIOENCODING="utf-8"
py skills/property_search/property_search.py --output 物件検索結果.md
```
- 駐車場料金・距離の詳細取得、安全マージ、新規物件の差分判定、および `物件数推移.md` への駅別件数記録が自動実行され、`properties.js`、`物件検索結果.md`、`物件数推移.md` が更新されます。

### ステップ2: 新駅の通勤時間・乗換回数の自動取得とDB同期
```powershell
node scripts/fetch_station_commute.js
```
- 新たに検出された駅について、Yahoo!路線情報から「乗車時間」「乗換回数」「到着駅（大手町/東京）」「出口〜サンケイビルの実徒歩時間」を取得し、`station_commute.js` / `station_commute.csv` を自動更新します。

### ステップ3: 必須カットオフ条件の確認
- Webアプリ（`app.js`）により、以下の**必須カットオフ条件**が自動適用されます：
  - **ドアドア通勤時間**: **59分以下** (`doorToDoor <= 59`)
  - **総徒歩時間**: **15分以内** (`totalWalkMin <= 15` / 物件〜駅 ＋ 到着駅〜オフィス)
- 自己負担額（18万円以下 / 自己負担5.2万円以下）

### ステップ4: Gitコミット＆GitHub Pagesへの自動反映
```powershell
git add properties.js station_commute.js station_commute.csv 物件検索結果.md 物件数推移.md 物件比較アプリ/properties.js 物件比較アプリ/station_commute.js 物件比較アプリ/station_commute.csv
git commit -m "feat(data): 週次物件データおよび物件数推移の更新"
git push origin main
```
- リモートへのプッシュ完了後、GitHub Pages（https://day0817.github.io/Moving/ ）に数分で自動反映されます。

---

## 3. 物件比較Webアプリの仕様概要

- **Solarized / Solarized Dark テーマ**:
  - Ethan Schoonover公式パレットに完全準拠し、ヘッダー右上のボタンで Dark / Light を即座に切り替え可能。
- **自己負担額の4段階カラーリング**:
  - `〜 3.20万円`: シアン（通常・安価）
  - `3.21 〜 4.00万円`: イエロー（軽度注意）
  - `4.01 〜 5.00万円`: ウォームアンバー（中間注意）
  - `5.01万円 〜`: ソフトコーラルレッド（上限域注意）
- **到着駅アイコン（`🗼`）**:
  - 到着駅が東京駅の物件（サンケイビルまで徒歩7〜10分）には、総徒歩バッジ内に `🗼` アイコンを表示。
- **通勤詳細ポップオーバー**:
  - カードの通勤バッジにホバーまたはタップすることで、①物件徒歩 ②乗車 ③乗換待ち ④到着後徒歩の完全な内訳と他駅比較ルートを瞬時に確認可能。

