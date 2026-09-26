# レビュー依頼: フォルダ構成の整理（成果物フォルダ docs/・資料 research/・一時フォルダ tmp/）

## 確認依頼の目的

ルート直下に散らばっていたファイルを役割ごとのフォルダに分け、READMEをルートの1つにまとめました。
更新スキル（`property_search.py`・`SKILL.md`）と週次バッチも新しい構成に合わせています。

前回の「浸水リスク高を除く」の既定オンと `tmp/` の新設も、まだコミットしていないので今回の確認に含みます。
見た目の刷新（前々回）は確認済みです。

## 公開前に必ず行うこと（順番どおりに）

1. **次の週次バッチ（金曜 10/2 20:30）より前に、変更をすべてコミットしてプッシュする**
   - 未コミットのままバッチが動くと、ステージ済みのファイル移動とバッチの更新分だけがコミットされます
   - その結果、新しい `index.html` と古い `style.css` のような中途半端な状態が公開されるおそれがあります
2. **プッシュしたら、すぐに GitHub の Pages の公開フォルダを切り替える**
   - Settings → Pages → Build and deployment
   - Source は「Deploy from a branch」のまま、Branch を `main` / **`/docs`** にして Save
   - 切り替えるまでの間は、公開URLにアプリではなく README が表示されます
3. 数分後に <https://day0817.github.io/Moving/> を開き、アプリが表示されることを確認する

## 主要な観点

1. **新しい構成がわかりやすいか**（README の「ディレクトリ構成」「置き場所のルール」）
2. **週次バッチと更新スキルが新しいパスで動くか**（下の「確認したこと」）
3. **消してよいものだけを消したか**
   - `rail_lines.js`、`build_rail_lines.py`、`鉄道路線データ_実装引継ぎ.md`：ご判断どおり削除しました
   - `doc/README.md`：ルートの README の「資料一覧」に統合しました
   - `tmp/README.md`：ルートの README の「置き場所のルール」に統合しました

### フォルダの対応

| 移動前 | 移動後 |
| :--- | :--- |
| `index.html` / `style.css` / `app.js` / `site.webmanifest`（ルート） | `docs/` |
| `properties.js` / `station_commute.js` / `flood_risk.js`（ルート） | `docs/data/` |
| `Image/` のアイコン | `docs/images/` |
| `doc/` | `research/`（`docs/` と紛らわしいため改名） |
| `Image/` の資料用の図 | `research/images/` |
| `.work/`、`data/update_job.log` | `tmp/`、`tmp/logs/`（Git管理外） |

ルート直下に残るのは、フォルダ（`docs/` `research/` `data/` `scripts/` `tmp/`）と、`README.md`・`AGENTS.md`・`CLAUDE.md`・`USER_REVIEW.md`・`package.json`・`Moving.code-workspace` です。

### 確認したこと

- `docs/` をルートにしたローカルサーバーでアプリが表示され、コンソールエラーはなし
  - アイコン・マニフェスト・CSS・データの全13ファイルが読み込めることを確認
- `fetch_station_commute.js --build-js-only`：新しい場所に、以前と同一の `station_commute.js` を生成
- `check_flood_risk.py --offline`：新しい場所に `flood_risk.js` を生成
  - 違いは日付と改行コードだけです（週次バッチと同じ挙動）
  - 確認後、ファイルは元の内容に戻しました
- `property_search.py`：パス定数の指す先がすべて存在すること、NEW判定の元になる物件データ（36件）を読めることを確認
  - スクレイピング自体は実行していません
- `scenario_search.py --stage selfcheck`：36件すべて一致
- `run_weekly_update.ps1`：PowerShellのパーサーで構文を確認
  - 実行はしていません。スクレイピングとプッシュまで走るためです

## 重点的にレビューしてほしい箇所

- `scripts/run_weekly_update.ps1`
  - `index.html` の場所を `docs\index.html` に変えました
  - コミット対象の一覧（`$targetFiles`）を新しいパスにしました。`rail_lines.js` を外し、`data/parking_cache.json` を追加しています
- `.agents/skills/property_search/property_search.py`
  - パス定数3つを変えました: `PROPERTIES_JS_PATH`、`TREND_REPORT_PATH`、`DEFAULT_SEARCH_RESULT_PATH`
  - NEW判定は `git show HEAD:docs/data/properties.js` と比べます。そのため**移動をコミットしてから**次のバッチを動かす必要があります（上の手順1）
- `scripts/check_flood_risk.py`、`scripts/fetch_station_commute.js`、`scripts/scenario_search.py`：読み書きするパス定数
- `.agents/skills/property_search/SKILL.md`
  - ディレクトリ構造と手順内のパスを直しました
  - 古くなっていた「Webアプリの仕様概要」（色分け・絵文字・比較表など）も、今の画面に合わせて書き直しました
- `research/` の文書：本文中の `doc/…` を `research/…` に置き換えました（引継ぎ文書の過去の記述も含む）
- `data/flood_risk_notes.json`：説明文の中の資料パスを1か所直しました（JSONとして読めることを確認済み）
- `.gitignore`：`tmp/` を丸ごと除外
