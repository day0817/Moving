# 既知の問題: Google Maps Directions/Routes API の transitモードが日本国内で機能しない（2026-08-09調査・保留）

## 背景

物件の「ドアドア通勤時間」精緻化のため、駅→大手町駅の実測所要時間をGoogle Maps Directions API
（`mode=transit`）で取得しキャッシュ化する施策（`station_commute.py`）を実装したが、**この施策は
下記の理由により保留・断念した**。関連コード（`station_commute.py`、`station_commute_cache.json`、
専用の手順書）はリポジトリから削除済み。この文書のみ、調査結果の記録として残す。

## 症状

`station_commute.py` を実行すると、対象駅（100件以上）が**すべて例外なく** `ZERO_RESULTS` で失敗する。
座標・APIキー・課金・クォータ・API有効化状況はすべて正常に見えるにもかかわらず発生する。

## 調査で確認したこと（2026-08-09、実際にAPIキーを発行してテスト済み）

- Google Cloud Console上で Directions API・Routes API とも「有効なAPI」に表示されており、APIキーの「APIの制限」にも両方を追加済み
- 課金アカウントは「有料のアカウント」（無料トライアルではない）、クォータ使用率0%
- `mode=driving` は正常に結果が返る（同一APIキー・同一スクリプト経路で確認）
- `mode=transit` は、東京駅→新宿駅のような実在が確実な鉄道ルートでも `ZERO_RESULTS`。
  レスポンスの `available_travel_modes` に `TRANSIT` が含まれず、`DRIVING`/`WALKING`/`BICYCLING` のみが返る
- 駅名（例:「渋谷駅」「池袋駅」）を直接指定してジオコーディングさせても、`transit_station` として正しく認識されるがルートは0件
- 新しい **Routes API**（`routes.googleapis.com/directions/v2:computeRoutes`）でも同様に0件（`geocodingResults` のみで `routes` が空）
- 比較として、**海外（ニューヨーク: Times Square→Central Park）のtransitルートは同じAPIキーで正常に取得できた** → 日本国内の鉄道transitデータだけが取得できない状態
- Google Developer Forumsに完全に同一症状の未解決の投稿あり（Googleからの公式回答なし）:
  [Directions API transit mode returns ZERO_RESULTS](https://discuss.google.dev/t/directions-api-transit-mode-returns-zero-results/378267)
  この投稿でも「無料試用版→正式アカウントに切り替え済みでも解消しない」ことが報告されており、
  今回の調査結果と一致する。Google Mapsアプリ自体では同区間のtransitルートが表示されるとの報告もあり、
  API側だけがこの機能を提供できていない状態と考えられる。

## 結論

これは `.env`・APIキー設定・Google Cloud Consoleの設定ミスではなく、**Google Maps Platform側の
（少なくとも2026-08時点で）未解決の問題または日本の鉄道transitデータに関する制約**である可能性が高い。
Console側の設定を再確認しても解決しない可能性が高いため、闇雲に設定変更を繰り返さないこと。

## 現在の運用方針

この施策（Google Maps実測キャッシュによるドアドア通勤時間の精緻化）は**断念**。
`property_search.py` は従来通りSUUMOバッジ値のみでドアドア通勤時間を算出する。
「複数候補駅が併記される物件で、SUUMOバッジがどの駅発の経路か特定できない」問題自体は未解決のまま残るが、
実害があるのは一部の物件（支線・盲腸線の駅が最寄りとして併記されるケースなど）に限られる。

## 再挑戦する場合の入り口

1. 上記フォーラムのスレッドや [Google Maps Platform の障害情報](https://developers.google.com/maps/incident-management?hl=ja) で解消報告がないか確認する
2. 解消していなければ、Google Cloud のサポート窓口 / [Issue Tracker](https://issuetracker.google.com/) に起票する
3. それでも解消しない場合は、Google以外の日本国内交通機関API（駅すぱあとAPI、NAVITIME APIなど）への
   切り替えを検討する（大きめの書き直しになる）
