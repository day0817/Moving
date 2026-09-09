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
├── site.webmanifest                  PWA マニフェスト
├── Image/                            favicon・アプリアイコン類
├── data/
│   ├── station_commute.csv           駅別通勤データ（スクレイパの入出力）
│   └── geocoding_cache.json          駅座標キャッシュ
├── doc/                              調査・検討ドキュメント（→ doc/README.md）
├── scripts/
│   └── fetch_station_commute.js      Yahoo!路線情報から通勤データを取得
└── .agents/skills/property_search/   物件検索・データ更新スキル（→ SKILL.md）
```

## データ更新

手順は [.agents/skills/property_search/SKILL.md](.agents/skills/property_search/SKILL.md) を参照。
概略は「①`property_search.py` で SUUMO を再集計 → ②`fetch_station_commute.js` で新駅の通勤時間を取得
→ ③コミット & push で GitHub Pages に反映」。
