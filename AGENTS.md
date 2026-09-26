# 作業ルール（AIエージェント向け）

このリポジトリで作業するときのルール。フォルダ構成の詳細は [README.md](README.md) を参照。

## ファイルの置き場所

- Webアプリ（GitHub Pages で公開するもの）は `docs/`。アプリが読む生成データは `docs/data/`、アイコンは `docs/images/`。
- 残すレポートは `research/`（README の「資料一覧」にも1行追加）、その図は `research/images/`。
- 繰り返し使うスクリプトは `scripts/`、スクリプトが読み書きするデータ・キャッシュは `data/`。
- 一時ファイル（調査の中間データ、確認用の使い捨てスクリプト、スクリーンショット、デザイン案、ログ）は `tmp/<作業名>/` に置く。
  ルート直下や `scratch/`・`.work/` のような新しいフォルダには作らない。
- ルート直下にファイルやフォルダを増やさない。README はルートの `README.md` だけにし、フォルダごとの README は作らない。

## 触るときに注意するファイル

- `docs/data/` の `properties.js` / `station_commute.js` / `flood_risk.js` は生成物。直接編集しない。
- `docs/index.html` の `?v=YYYYMMDD` と `<time id="lastUpdated" …>` は週次バッチ（`scripts/run_weekly_update.ps1`）が正規表現で書き換える。形式を変えない。
  CSS・JSを変えたときは `?v=` を作業日の日付に上げる（上げないと公開後に古いファイルがキャッシュから読まれる）。
- `docs/style.css` の `THEME TOKENS` / `DESIGN SYSTEM` の区間は、design-theme-solarized / design-system-digital-agency の原本の写し。
  アプリ独自のスタイルはその後ろに書く。
- フォルダやファイルを動かしたら、`scripts/`・`.agents/skills/property_search/`（`property_search.py` と `SKILL.md`）・`README.md` のパスもそろえる。
  週次バッチは無人で動いてコミット・プッシュまでするため、パスがずれると公開サイトが壊れる。
- 人へのレビュー依頼は、作業ごとに `USER_REVIEW.md` を作り直す。
