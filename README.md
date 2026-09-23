# Moving — 引越先物件 比較・検討ナビ

大手町・東京サンケイビル通勤を前提に、条件（自己負担5.0万円以下 / 80m²以上 / 一戸建て /
駅徒歩10分以下 / 築30年以下 / ドアドア59分以下 / 総徒歩15分以内 / 駐車場あり）に
合致する賃貸一戸建てを定期的にスクレイピングして集計し、Webアプリで比較検討するためのリポジトリ。

自己負担額は「借上げ社宅の自己負担上限17万（管理費込み・超過分は全額）＋駐車場代全額」で算出する。

公開URL: <https://day0817.github.io/Moving/>

## ディレクトリ構成

```
.
├── index.html / style.css / app.js   Webアプリ本体（GitHub Pages 公開対象）
├── properties.js                     物件データ（自動生成）
├── station_commute.js                駅別通勤時間DB（Webアプリ用）
├── rail_lines.js                     通勤アクセスマップの実路線ジオメトリ（自動生成）
├── flood_risk.js                     物件・駅の浸水リスク判定結果（自動生成）
├── site.webmanifest                  PWA マニフェスト
├── Image/                            favicon・アプリアイコン類
├── data/
│   ├── station_commute.csv           駅別通勤データ（スクレイパの入出力）
│   ├── geocoding_cache.json          駅座標キャッシュ
│   ├── flood_risk_cache.json         浸水リスク判定キャッシュ（自動生成）
│   └── flood_risk_notes.json         浸水リスクの手動評価・被害実績（手で編集）
├── doc/                              調査・検討ドキュメント（→ doc/README.md）
├── scripts/
│   ├── fetch_station_commute.js      Yahoo!路線情報から通勤データを取得
│   ├── check_flood_risk.py           重ねるハザードマップから浸水リスクを自動判定
│   ├── run_weekly_update.ps1         週次データ一括自動更新バッチ（ステップ1〜6）
│   └── register_task.ps1             タスクスケジューラ登録スクリプト（毎週金曜20:30）
└── .agents/skills/property_search/   物件検索・データ更新スキル（→ SKILL.md）
```

## データ更新

- **定期自動更新**:
  - Windowsタスクスケジューラ（`Moving_Weekly_Property_Update`）により、**毎週金曜日 20:30** に自動実行され、最新物件取得・通勤データ同期・GitHub Pages への反映まで完了します。
- **手動全自動更新**:
  - `powershell -NoProfile -ExecutionPolicy Bypass -File "scripts/run_weekly_update.ps1"`
- **詳細手順**:
  - [.agents/skills/property_search/SKILL.md](.agents/skills/property_search/SKILL.md) を参照。

