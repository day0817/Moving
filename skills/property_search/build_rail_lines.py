"""
build_rail_lines.py

国土数値情報(KSJ)「鉄道データ(N02)」を読み込み、関東圏に絞り込んだ上で
物件比較サイトが実際に使っている路線名ごとにジオメトリを統合し、
Webアプリ(app.js)が読み込む軽量な rail_lines.geojson を生成するスクリプト。

【前提】
このスクリプトは、あらかじめローカルでダウンロード済みのN02データ
(Shapefile一式、またはGeoJSON)を入力として使う。ダウンロード手順は
`鉄道路線データ_実装引継ぎ.md` を参照。

【使い方】
    # 1. まず属性列の構造を確認する（路線名・事業者名の列名を特定するため。
    #    N02データのバージョンによって列名が異なる可能性があるので必須の確認ステップ）
    python skills/property_search/build_rail_lines.py --input path/to/N02.shp --inspect

    # 2. 列名を指定して本実行（--line-col / --operator-col は1.の結果を見て指定）
    #    出力は properties.js と同じ形式(<script src>読み込み用のJSファイル)で
    #    rail_lines.js (ルート / 物件比較アプリ の両方) に書き出される
    python skills/property_search/build_rail_lines.py --input path/to/N02.shp \\
        --line-col N02_003 --operator-col N02_004

    # マッチしなかった路線がある場合は、標準エラー出力にレポートされるので、
    # MANUAL_LINE_NAME_MAP に手動で対応関係を追記して再実行する。
"""

import os
import re
import sys
import json
import argparse
import unicodedata

# 関東地方をやや広めに囲む範囲 (property_search.py の KANTO_BOUNDS と同一)
KANTO_BOUNDS = {"min_lat": 34.5, "max_lat": 37.2, "min_lng": 138.3, "max_lng": 141.2}

PROPERTIES_JS_PATHS = ["properties.js", os.path.join("物件比較アプリ", "properties.js")]

# 事業者名の表記ゆれを吸収するための簡易エイリアス表。
# KSJ側の「会社名」列の値 (またはその一部) に前方一致/包含で使う。
# 実データを見て過不足があれば適宜追記・修正すること。
OPERATOR_ALIASES = {
    "東日本旅客鉄道": ["ＪＲ", "JR"],
    "東京地下鉄": ["東京メトロ"],
    "東京都": ["都営"],
    "首都圏新都市鉄道": ["つくばエクスプレス"],
    "横浜市": ["ブルーライン", "横浜市営"],
    "埼玉高速鉄道": ["埼玉高速鉄道"],
    "東葉高速鉄道": ["東葉高速鉄道"],
}

# SUUMO表記(properties.js内のline)と、KSJ側の路線名(N02_003相当)がどうしても
# 自動マッチしない場合に、ここへ手動で対応関係を追記する。
# 例: "東武伊勢崎線": ["伊勢崎線"]  # KSJ側は事業者プレフィックス無しの場合がある
MANUAL_LINE_NAME_MAP = {
    # "SUUMO表記": ["KSJ側 N02_003 の値", ...],
}


def normalize(s):
    """全角/半角ゆれを吸収する正規化。"""
    if s is None:
        return ""
    return unicodedata.normalize("NFKC", str(s)).strip()


def load_target_line_names():
    """properties.js から、実際にサイトで使われている路線名の一覧を取得する。"""
    names = set()
    for path in PROPERTIES_JS_PATHS:
        if not os.path.exists(path):
            continue
        content = open(path, "r", encoding="utf-8").read()
        m = re.search(r"const\s+bukkenData\s*=\s*(.*);\s*$", content.strip(), re.DOTALL)
        if not m:
            continue
        data = json.loads(m.group(1))
        for p in data:
            line = p.get("line")
            if line and line != "不明":
                names.add(line)
    return sorted(names)


def guess_column(columns, keywords):
    """列名候補の中から、キーワードを含むものを推測する。"""
    for col in columns:
        for kw in keywords:
            if kw in str(col):
                return col
    return None


def build_candidate_names(line_raw, operator_raw):
    """KSJの1レコードから、SUUMO表記と突き合わせるための候補文字列群を作る。"""
    line_n = normalize(line_raw)
    operator_n = normalize(operator_raw)
    candidates = {line_n}

    aliases = [operator_n]
    for full_name, alias_list in OPERATOR_ALIASES.items():
        if full_name in operator_n:
            aliases.extend(alias_list)

    for alias in aliases:
        if alias:
            candidates.add(f"{alias}{line_n}")
            candidates.add(f"{alias}線{line_n}" if not line_n.startswith(alias) else line_n)

    return {c for c in candidates if c}


def match_target(target_name, candidate_names):
    target_n = normalize(target_name)
    for manual_source in MANUAL_LINE_NAME_MAP.get(target_name, []):
        if normalize(manual_source) in candidate_names:
            return True
    for cand in candidate_names:
        if cand == target_n or cand in target_n or target_n in cand:
            return True
    return False


def main():
    parser = argparse.ArgumentParser(
        description="国土数値情報 鉄道データ(N02)からKanto圏の路線ジオメトリを抽出し、rail_lines.geojsonを生成する"
    )
    parser.add_argument("--input", required=True, help="N02データのパス (Shapefile(.shp)またはGeoJSON)")
    parser.add_argument("--inspect", action="store_true", help="属性列とサンプル値を表示して終了する")
    parser.add_argument("--line-col", type=str, default=None, help="路線名の列名 (省略時は自動推定)")
    parser.add_argument("--operator-col", type=str, default=None, help="事業者名の列名 (省略時は自動推定)")
    parser.add_argument("--simplify-tolerance", type=float, default=0.0003, help="ジオメトリ簡略化の許容誤差(度)。既定0.0003(約30m)")
    parser.add_argument(
        "--output", type=str, nargs="+",
        default=["rail_lines.js", os.path.join("物件比較アプリ", "rail_lines.js")],
        help="出力先ファイルパス(複数指定可。既定でルートと物件比較アプリの両方に書き出す)。"
             "properties.jsと同様、<script src>読み込み用のJSファイルとして書き出す"
    )
    args = parser.parse_args()

    try:
        import geopandas as gpd
        from shapely.geometry import box
        from shapely.ops import unary_union, linemerge
    except ImportError:
        print(
            "エラー: geopandas / shapely が必要です。`pip install geopandas shapely pyogrio` を実行してください。",
            file=sys.stderr,
        )
        sys.exit(1)

    print(f"入力ファイルを読み込み中: {args.input}", file=sys.stderr)
    gdf = gpd.read_file(args.input)

    if args.inspect:
        print("\n=== 列一覧 ===", file=sys.stderr)
        print(list(gdf.columns), file=sys.stderr)
        print("\n=== 先頭5件 ===", file=sys.stderr)
        print(gdf.head(5).to_string(), file=sys.stderr)
        print("\n=== 各列のユニーク値数(上位10列) ===", file=sys.stderr)
        for col in gdf.columns[:10]:
            try:
                print(f"  {col}: {gdf[col].nunique()} 種類 (例: {gdf[col].dropna().unique()[:5]})", file=sys.stderr)
            except Exception:
                pass
        return

    # 座標系をWGS84(EPSG:4326)に統一
    if gdf.crs is not None and str(gdf.crs) != "EPSG:4326":
        gdf = gdf.to_crs("EPSG:4326")

    line_col = args.line_col or guess_column(gdf.columns, ["路線名", "N02_003", "line"])
    operator_col = args.operator_col or guess_column(gdf.columns, ["会社名", "事業者", "N02_004", "operator"])

    if not line_col:
        print(
            "エラー: 路線名の列を特定できませんでした。--inspect で列一覧を確認し、--line-col で明示指定してください。",
            file=sys.stderr,
        )
        sys.exit(1)

    print(f"使用する列: 路線名={line_col} / 事業者名={operator_col}", file=sys.stderr)

    # 関東地方のバウンディングボックスで絞り込み
    kanto_box = box(KANTO_BOUNDS["min_lng"], KANTO_BOUNDS["min_lat"], KANTO_BOUNDS["max_lng"], KANTO_BOUNDS["max_lat"])
    gdf = gdf[gdf.geometry.intersects(kanto_box)].copy()
    gdf["geometry"] = gdf.geometry.intersection(kanto_box)
    gdf = gdf[~gdf.geometry.is_empty]
    print(f"関東圏に絞り込み後のレコード数: {len(gdf)}", file=sys.stderr)

    # 各レコードの候補名を計算
    gdf["_candidates"] = gdf.apply(
        lambda row: build_candidate_names(row[line_col], row[operator_col] if operator_col else None),
        axis=1,
    )

    target_names = load_target_line_names()
    print(f"サイト側の対象路線数: {len(target_names)}", file=sys.stderr)

    # line_name -> GeoJSON geometry の辞書として出力する。
    # properties.js (bukkenData) と同じく <script src> 読み込み前提のJSファイルとして書き出すことで、
    # file://で開くローカル利用時のCORS制約を回避する（fetchによるJSON読み込みは行わない）。
    rail_lines_dict = {}
    matched_targets = []
    unmatched_targets = []

    for target in target_names:
        mask = gdf["_candidates"].apply(lambda cands: match_target(target, cands))
        subset = gdf[mask]
        if subset.empty:
            unmatched_targets.append(target)
            continue

        geom = unary_union(subset.geometry.values)
        # 端点が接続している区間同士は1本のLineStringにマージし、描画・ファイルサイズ双方を改善する
        try:
            geom = linemerge(geom)
        except Exception:
            pass  # マージできない形状(枝分かれ等)の場合はunary_unionの結果(MultiLineString)のまま使う
        if args.simplify_tolerance > 0:
            geom = geom.simplify(args.simplify_tolerance, preserve_topology=True)

        matched_targets.append(target)
        rail_lines_dict[target] = json.loads(gpd.GeoSeries([geom]).to_json())["features"][0]["geometry"]

    js_content = f"const railLinesData = {json.dumps(rail_lines_dict, ensure_ascii=False)};"

    for out_path in args.output:
        out_dir = os.path.dirname(out_path)
        if out_dir:
            os.makedirs(out_dir, exist_ok=True)
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(js_content)
        print(f"書き出し完了: {out_path}", file=sys.stderr)

    print(f"\nマッチした路線 ({len(matched_targets)}/{len(target_names)}):", file=sys.stderr)
    for n in matched_targets:
        print(f"  ✓ {n}", file=sys.stderr)

    if unmatched_targets:
        print(f"\n未マッチの路線 ({len(unmatched_targets)}件) — app.js側は従来の直線描画にフォールバックします:", file=sys.stderr)
        for n in unmatched_targets:
            print(f"  ✗ {n}", file=sys.stderr)
        print(
            "\n未マッチ路線は、--inspect の出力でKSJ側の実際の路線名表記を確認し、"
            "このファイル冒頭の MANUAL_LINE_NAME_MAP に対応関係を追記して再実行してください。",
            file=sys.stderr,
        )


if __name__ == "__main__":
    main()
