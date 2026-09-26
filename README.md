# Moving — 引越先物件 比較・検討ナビ

大手町・東京サンケイビル通勤を前提に、条件（自己負担5.0万円以下 / 80m²以上 / 一戸建て /
駅徒歩15分以下 / 築30年以下 / ドアドア59分以下 / 総徒歩18分以内 / 駐車場あり）に
合致する賃貸一戸建てを定期的にスクレイピングして集計し、Webアプリで比較検討するためのリポジトリ。

自己負担額は「借上げ社宅の自己負担上限17万（管理費込み・超過分は全額）＋駐車場代全額」で算出する。

公開URL: <https://day0817.github.io/Moving/>

## ディレクトリ構成

```
.
├── docs/                             公開するWebアプリ一式（GitHub Pages が公開するフォルダ）
│   ├── index.html / style.css / app.js
│   ├── site.webmanifest
│   ├── images/                       アイコン（favicon など）
│   └── data/                         アプリが読む生成データ（直接編集しない）
│       ├── properties.js             物件データ（property_search.py が生成）
│       ├── station_commute.js        駅別通勤時間DB（fetch_station_commute.js が data/station_commute.csv から生成）
│       └── flood_risk.js             物件・駅の浸水リスク判定結果（check_flood_risk.py が生成）
├── research/                         調査・検討資料（下の「資料一覧」）
│   └── images/                       資料用の図
├── data/                             スクリプトが読み書きするデータ・キャッシュ（下記）
├── scripts/                          データ更新・調査スクリプト（下記）
├── .agents/skills/property_search/   物件検索・データ更新スキル（→ SKILL.md）
├── tmp/                              一時フォルダ（Git管理外。中身はいつ消してもよい）
├── AGENTS.md / CLAUDE.md             AIエージェント向けの作業ルール
├── USER_REVIEW.md                    人へのレビュー依頼（作業ごとに作り直す）
├── package.json                      Node スクリプトの依存（puppeteer-core）
└── Moving.code-workspace             VS Code ワークスペース
```

`docs/` は公開サイト（Webアプリ）、`research/` は読むための資料、という分け方にしている。

### data/

| ファイル | 中身 | 読み書きするもの |
| :--- | :--- | :--- |
| `station_commute.csv` | 駅別通勤データ | `fetch_station_commute.js`（取得）、`property_search.py` |
| `geocoding_cache.json` | 駅座標キャッシュ | `property_search.py`、`check_flood_risk.py` |
| `parking_cache.json` | 物件ごとの駐車場情報キャッシュ | `property_search.py`、`scenario_search.py` |
| `flood_risk_cache.json` | 浸水リスク判定キャッシュ（180日間は再判定しない） | `check_flood_risk.py` |
| `flood_risk_notes.json` | 浸水リスクの手動評価・被害実績（**手で編集**） | `check_flood_risk.py` |

### scripts/

| ファイル | 役割 |
| :--- | :--- |
| `run_weekly_update.ps1` | 週次データ一括自動更新バッチ（スクレイピング → 通勤同期 → 浸水判定 → キャッシュバスター更新 → Gitプッシュ） |
| `register_task.ps1` | 上のバッチをタスクスケジューラに登録（毎週金曜 20:30） |
| `fetch_station_commute.js` | 未登録の駅の通勤時間を取得して `data/station_commute.csv` と `docs/data/station_commute.js` を更新 |
| `check_flood_risk.py` | 重ねるハザードマップから浸水リスクを判定して `docs/data/flood_risk.js` を生成 |
| `scenario_search.py` | 条件を変えたシナリオ検索（作業データは `tmp/<作業名>/`） |
| `fetch_extra_station_commute.js` | シナリオ検索用CSVの未取得駅だけ通勤時間を取得 |

物件検索の本体 `property_search.py` は `.agents/skills/property_search/` にある。

## Webアプリ

物件をカードで一覧し、エリア（都道府県・市区町村）、浸水リスク、NEWで絞り込んで、並び順を入れ替えて検討する。

- **浸水リスク高を除く**: 既定でオン。浸水リスク「高」「極高」の物件を一覧から外す
- **★評価**: 自己負担・ドアドア・駅徒歩をそれぞれ★0〜3で採点し、合計（総★数、最大9）をカード左上に出す。
  浸水リスク「高」「極高」の物件は総★数0。基準は画面の「★の基準」、または `docs/app.js` の `STAR_RULES`

  | 項目 | ★3 | ★2 | ★1 |
  | :--- | :--- | :--- | :--- |
  | 自己負担 | 3.4万円以下 | 4.2万円以下 | 5万円以下 |
  | 駅徒歩 | 5分以下 | 10分以下 | 15分以下 |
  | ドアドア | 40分以下 | 50分以下 | 60分以下 |

- **到着駅**: 「ドアドア」の横のアイコンで、大手町駅着か東京駅着かを示す
- **通勤の内訳**: 数字の段にマウスを乗せる（スマホはタップ）と、最速ルートの内訳と他の駅を使う場合を表示
- **物件名**: SUUMOの物件ページへのリンク

見た目は design-standard-html の構成（配色: Solarized、造形: デジタル庁デザインシステム）で作っている。
`docs/style.css` の `THEME TOKENS` / `DESIGN SYSTEM` の区間は元の定義をそのまま写したもので、アプリ独自のスタイルはその後ろに書く。

### 公開（GitHub Pages）

GitHub の Settings → Pages で「Deploy from a branch」、ブランチ `main`、フォルダ `/docs` を指定している。
`main` にプッシュすると、`docs/` の中身が数分で公開URLに反映される。

ローカルで確認するときは `docs/` をサーバーのルートにして開く。

```
python -m http.server 8731 --directory docs
```

## 資料一覧（research/）

| 知りたいこと | 見るファイル |
| :--- | :--- |
| なぜ引越すのか・新居の要件（予算/通勤/教育） | [背景.md](research/背景.md) |
| 賃貸継続 vs 持ち家購入の生涯費用・経済合理性・老後必要資金の比較 | [賃貸・持家比較.md](research/賃貸・持家比較.md) |
| 候補エリアごとの通勤・住環境・供給状況の比較 | [エリア比較.md](research/エリア比較.md) |
| 直近スクレイピングでヒットした物件の一覧と前回差分 | [物件検索結果.md](research/物件検索結果.md) |
| 更新日ごとの駅別物件数の推移と冬に向けた候補エリア推測 | [物件数推移.md](research/物件数推移.md) |
| 候補駅・物件の浸水リスク（2026年千葉豪雨・台風25号を踏まえた評価） | [浸水リスク評価.md](research/浸水リスク評価.md) |
| 面積・築年数を捨ててドアドア30分以内を優先した場合の妥協量（調査手順） | [ドアドア30分シナリオ_調査引継ぎ.md](research/ドアドア30分シナリオ_調査引継ぎ.md) |
| 面積・築年数を捨ててドアドア30分以内を優先した場合の妥協量（結果レポート） | [ドアドア30分シナリオ.md](research/ドアドア30分シナリオ.md) |
| 通勤近さを優先しマンションを含めた居室3以上・60m²・敷地内P物件（結果レポート・検索方法） | [近さ優先シナリオ_全種別居室3以上.md](research/近さ優先シナリオ_全種別居室3以上.md) |

- **物件検索結果.md / 物件数推移.md** は `property_search.py` が自動生成・追記する。手で直した内容は次回の週次更新で上書きされることがある。
- それ以外は、手作業またはシナリオ検索で作った要件・分析資料。

## 置き場所のルール

散らからないように、新しく作るファイルは次の場所に置く。

| 作るもの | 置き場所 | コミット |
| :--- | :--- | :---: |
| Webアプリの画面・スタイル・スクリプト | `docs/` | する |
| Webアプリが読む生成データ | `docs/data/` | する |
| 残すレポート・調査結果 | `research/`（上の「資料一覧」にも1行追加） | する |
| 資料用の図 | `research/images/` | する |
| 繰り返し使うスクリプト | `scripts/` | する |
| スクリプトが読み書きするデータ・キャッシュ | `data/` | する |
| 作業データ・ログ・使い捨てスクリプト・スクリーンショット・デザイン案など | `tmp/<作業名>/` | しない |

- ルート直下には「ディレクトリ構成」にあるもの以外を増やさない（`scratch/` や `.work/` のような作業フォルダも作らない）。
- READMEはこのファイルだけにする。フォルダごとの説明はここに書く。
- `tmp/` は1つの作業に1つのフォルダを切る（例: `tmp/d2d30/`、`tmp/design-mock/`）。残す価値がある結果は `research/` や `scripts/` に移してからコミットする。
- `tmp/` の中身はいつ消してもよい。アプリとバッチは `tmp/` の中身がなくても動く（バッチのログ用フォルダは実行時に作る）。

## データ更新

- **定期自動更新**:
  - Windowsタスクスケジューラ（`Moving_Weekly_Property_Update`）により、**毎週金曜日 20:30** に自動実行され、最新物件取得・通勤データ同期・GitHub Pages への反映まで完了します。
  - 実行ログは `tmp/logs/update_job.log` に追記されます。
- **手動全自動更新**:
  - `powershell -NoProfile -ExecutionPolicy Bypass -File "scripts/run_weekly_update.ps1"`
- **詳細手順**:
  - [.agents/skills/property_search/SKILL.md](.agents/skills/property_search/SKILL.md) を参照。
