"""
ドアドア30分シナリオ 調査スクリプト (scripts/scenario_search.py)

目的:
  条件（通勤時間、専有面積、築年数、建物種別、間取り）を引数で柔軟に変えて、
  段階的（selfcheck -> fetch -> stations -> parking -> report）に検証・集計する。
  本番資産（properties.js, station_commute.csv, parking_cache.json 等）は一切改変せず、
  すべての作業成果物は指定作業ディレクトリ（--work-dir）に隔離する。
"""

import argparse
import csv
import importlib.util
import json
import os
import random
import re
import statistics
import sys
import time
import urllib.parse
from types import ModuleType
from typing import Dict, List, Optional, Set, Tuple, Union

sys.stdout.reconfigure(encoding="utf-8")

# 本番資産のパス（読み取り専用）
BASE_PROPERTY_SEARCH_PATH = ".agents/skills/property_search/property_search.py"
BASE_STATION_COMMUTE_CSV_PATH = "data/station_commute.csv"
BASE_PROPERTIES_JS_PATH = "properties.js"
BASE_PARKING_CACHE_PATH = "data/parking_cache.json"

# 都道府県コード
PREFECTURES: Dict[str, str] = {
    "東京": "13",
    "神奈川": "14",
    "埼玉": "11",
    "千葉": "12",
    "茨城": "08"
}

# CSV ヘッダー列
CSV_HEADERS: List[str] = [
    "station_name",
    "primary_line",
    "train_min",
    "transfers",
    "arrival_station",
    "arrival_walk_min",
    "transit_walk_min",
    "station_to_office_min",
    "lines_used",
    "route_summary",
    "memo"
]


def load_ps_module(path: str = BASE_PROPERTY_SEARCH_PATH) -> ModuleType:
    """property_search.py を動的ロードしモジュールオブジェクトを返す"""
    if not os.path.exists(path):
        raise FileNotFoundError(f"property_search.py が見つかりません: {path}")
    spec = importlib.util.spec_from_file_location("property_search", path)
    if spec is None or spec.loader is None:
        raise ImportError(f"モジュールスペックの作成に失敗しました: {path}")
    ps_mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(ps_mod)
    return ps_mod


def modify_url_params(
    base_url: str,
    del_keys: Optional[List[str]] = None,
    **kwargs: Union[str, int, float, List[str]]
) -> str:
    """URL のクエリパラメータを安全に差し替え・削除して再構成する"""
    parsed = urllib.parse.urlparse(base_url)
    qs = urllib.parse.parse_qs(parsed.query)
    if del_keys:
        for k in del_keys:
            qs.pop(k, None)
    for k, v in kwargs.items():
        if isinstance(v, list):
            qs[k] = [str(x) for x in v]
        else:
            qs[k] = [str(v)]
    new_query = urllib.parse.urlencode(qs, doseq=True)
    return urllib.parse.urlunparse(parsed._replace(query=new_query))


def normalize_address(addr: str) -> str:
    """住所を「市区町村＋丁目」レベルまで正規化（番地以降を除去）"""
    m = re.match(r"(.+?[都道府県].+?[市区町村].+?[0-9０-９])", addr or "")
    return m.group(1) if m else (addr or "").strip()


def normalize_menseki(m: str) -> str:
    """面積文字列を小数2桁に正規化（例: '85.5m2' -> '85.50'）"""
    num = re.sub(r"[^0-9.]", "", m or "")
    try:
        return f"{float(num):.2f}"
    except ValueError:
        return num


def dedup_key(p: Dict[str, Union[str, float, int, None]]) -> Tuple[float, str, str, str]:
    """同一物件判定用のタプルキーを生成する"""
    self_pay_val = float(p.get("self_pay", 0.0) or 0.0)
    menseki_val = str(p.get("menseki", "") or "")
    age_floor_val = str(p.get("age_floor", "") or "").strip()
    address_val = str(p.get("address", "") or "")
    return (
        round(self_pay_val, 1),
        normalize_menseki(menseki_val),
        age_floor_val,
        normalize_address(address_val)
    )


def extract_bedrooms(madori: str) -> int:
    """間取り表記の先頭から居室数を抽出する（例: 3LDK -> 3, 2SLDK -> 2, ワンルーム -> 1）"""
    m = re.match(r"^(\d+)", madori.strip())
    if m:
        return int(m.group(1))
    if "ワンルーム" in madori or "1R" in madori.upper():
        return 1
    return 0


# ==============================================================================
# ステージ実装
# ==============================================================================

def stage_selfcheck(ps_mod: ModuleType, js_path: str = BASE_PROPERTIES_JS_PATH, csv_path: str = BASE_STATION_COMMUTE_CSV_PATH) -> bool:
    """
    Step 1: properties.js の全36件を用い、本番ロジックとの完全一致をオフライン検証する。
    """
    print("=== Stage: selfcheck（オフライン整合性検証） ===")
    if not os.path.exists(js_path):
        print(f"エラー: {js_path} が見つかりません。", file=sys.stderr)
        return False
    if not os.path.exists(csv_path):
        print(f"エラー: {csv_path} が見つかりません。", file=sys.stderr)
        return False

    station_db = ps_mod.load_station_commute_db(csv_path)
    print(f"通勤DB読み込み完了: {len(station_db)} 駅")

    with open(js_path, "r", encoding="utf-8") as f:
        content = f.read()
    m = re.search(r"const\s+bukkenData\s*=\s*(.*);", content, re.DOTALL)
    if not m:
        print(f"エラー: {js_path} から bukkenData を抽出できませんでした。", file=sys.stderr)
        return False
    items: List[Dict[str, Union[str, float, int, None]]] = json.loads(m.group(1).strip())
    print(f"properties.js 読み込み完了: {len(items)} 件")

    all_matched = True
    for i, p in enumerate(items):
        title = str(p.get("title", ""))
        rent = str(p.get("rent", ""))
        admin = str(p.get("admin", ""))
        p_fee = float(p.get("parking_fee", 0.0) or 0.0)

        calc_sp = round(ps_mod.calculate_self_pay(rent, admin, p_fee), 1)
        exp_sp = round(float(p.get("self_pay", 0.0) or 0.0), 1)
        if calc_sp != exp_sp:
            print(f"[{i+1}] self_pay 不一致: {title} (計算値={calc_sp}, 期待値={exp_sp})", file=sys.stderr)
            all_matched = False

        param_dict = {
            "station": p.get("station"),
            "line": p.get("line"),
            "station_walk": p.get("station_walk"),
            "walk_min": p.get("walk_min"),
            "train_min": p.get("train_min"),
            "transfers": p.get("transfers"),
        }
        res = ps_mod.evaluate_best_commute(param_dict, station_db)
        d2d = res["door_to_door"]
        tw = res["total_walk_min"]
        exp_d2d = p.get("door_to_door")
        exp_tw = p.get("total_walk_min")

        if d2d != exp_d2d or tw != exp_tw:
            print(f"[{i+1}] 通勤時間不一致: {title} (計算: d2d={d2d}, tw={tw} / 期待: d2d={exp_d2d}, tw={exp_tw})", file=sys.stderr)
            all_matched = False

    if all_matched:
        print(f"SUCCESS: {len(items)}件すべてにおいて自己負担額・ドアドア・総徒歩が完全一致しました。")
    else:
        print("FAILURE: 不一致が検出されました。", file=sys.stderr)
    return all_matched


def stage_fetch(
    ps_mod: ModuleType,
    work_dir: str,
    tj: int,
    min_area: int,
    max_rent: float,
    max_walk: int,
    refresh: bool,
    all_types: bool = False,
    min_bedrooms: int = 0
) -> bool:
    """
    Stage: fetch (SUUMO一覧の取得)
    5都県から指定条件の一覧ページを順次取得し、raw_listings.json に保存する。
    """
    print(f"=== Stage: fetch（SUUMO一覧取得: tj={tj}, ct={max_rent}, 全種別={all_types}, 居室{min_bedrooms}以上） ===")
    os.makedirs(work_dir, exist_ok=True)
    raw_path = os.path.join(work_dir, "raw_listings.json")

    if os.path.exists(raw_path) and not refresh:
        print(f"既存の取得データが見つかりました: {raw_path}")
        print("再取得を行う場合は --refresh を指定してください。")
        return True

    all_properties: List[Dict[str, Union[str, int, float, None]]] = []

    del_keys = ["ts"] if all_types else []
    query_kwargs: Dict[str, Union[str, int, float, List[str]]] = {"tj": tj}
    if min_bedrooms >= 3:
        query_kwargs["md"] = ["07", "08", "09", "10", "11", "12", "13"]

    for pref_name, pref_code in PREFECTURES.items():
        print(f"\n[{pref_name}] 検索開始...", file=sys.stderr)
        base_url = ps_mod.build_suumo_url(pref_code, max_rent=max_rent, min_area=min_area, max_walk=max_walk)
        target_url = modify_url_params(base_url, del_keys=del_keys, **query_kwargs)
        print(f"  URL: {target_url}", file=sys.stderr)

        first_html = ps_mod.fetch_properties(target_url)
        if first_html == "BLOCKED":
            print(f"重大エラー: {pref_name} でアクセスブロック (403) が発生しました。即時停止します。", file=sys.stderr)
            return False
        if not first_html:
            print(f"警告: {pref_name} の1ページ目取得に失敗しました。", file=sys.stderr)
            continue

        max_pages = ps_mod.parse_max_pages(first_html)
        print(f"  -> 最大ページ数: {max_pages}", file=sys.stderr)

        pref_props = ps_mod.parse_suumo_html(first_html)
        if isinstance(pref_props, list):
            print(f"  -> ページ 1: {len(pref_props)} 件取得", file=sys.stderr)
            all_properties.extend(pref_props)

        for page in range(2, max_pages + 1):
            time.sleep(random.uniform(2.0, 4.0))
            page_url = f"{target_url}&page={page}"
            print(f"  -> ページ {page}/{max_pages} 取得中... ", end="", flush=True, file=sys.stderr)
            page_html = ps_mod.fetch_properties(page_url)
            if page_html == "BLOCKED":
                print("アクセスブロック (403) 発生！即時停止します。", file=sys.stderr)
                return False
            if not page_html:
                print("エラー（スキップ）", file=sys.stderr)
                continue

            props = ps_mod.parse_suumo_html(page_html)
            if isinstance(props, list):
                print(f"{len(props)} 件取得", file=sys.stderr)
                all_properties.extend(props)
            else:
                print("エラー（パース失敗）", file=sys.stderr)

        time.sleep(random.uniform(3.0, 5.0))

    print(f"\n合計取得件数: {len(all_properties)} 件（重複除去前）")
    with open(raw_path, "w", encoding="utf-8") as f:
        json.dump(all_properties, f, ensure_ascii=False, indent=2)
    print(f"保存完了: {raw_path}")
    return True


def stage_stations(
    ps_mod: ModuleType,
    work_dir: str,
    max_walk: int,
    max_age: int,
    max_self_pay: float,
    min_bedrooms: int = 0,
    base_extra_csv: Optional[str] = None
) -> bool:
    """
    Stage: stations (通勤時間を取得する新規駅の洗い出し)
    """
    print("=== Stage: stations（新規駅の洗い出し） ===")
    raw_path = os.path.join(work_dir, "raw_listings.json")
    if not os.path.exists(raw_path):
        print(f"エラー: {raw_path} が存在しません。先に --stage fetch を実行してください。", file=sys.stderr)
        return False

    with open(raw_path, "r", encoding="utf-8") as f:
        all_properties: List[Dict[str, Union[str, int, float, None]]] = json.load(f)
    print(f"元レコード数: {len(all_properties)} 件")

    # 1. 厳格な重複排除 (rent, madori, menseki, address)
    unique_properties: List[Dict[str, Union[str, int, float, None]]] = []
    seen_keys: Set[Tuple[str, str, str, str]] = set()
    for p in all_properties:
        key = (
            str(p.get("rent", "")).strip(),
            str(p.get("madori", "")).strip(),
            str(p.get("menseki", "")).strip(),
            str(p.get("address", "")).strip()
        )
        if key not in seen_keys:
            seen_keys.add(key)
            unique_properties.append(p)
    print(f"重複排除後のユニーク物件数: {len(unique_properties)} 件")

    # 2. 既存DBおよび引き継ぎextraDBの既登録駅を把握
    base_station_db = ps_mod.load_station_commute_db(BASE_STATION_COMMUTE_CSV_PATH)
    known_stations: Set[str] = set(base_station_db.keys())

    if base_extra_csv and os.path.exists(base_extra_csv):
        imported_db = ps_mod.load_station_commute_db(base_extra_csv)
        known_stations |= set(imported_db.keys())
        print(f"引き継ぎextraDB ({base_extra_csv}) から {len(imported_db)} 駅を既知としてロード")

    extra_csv_path = os.path.join(work_dir, "station_commute_extra.csv")
    existing_extra_stations: Set[str] = set()
    existing_extra_rows: List[Dict[str, str]] = []
    if os.path.exists(extra_csv_path):
        with open(extra_csv_path, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                st = row.get("station_name", "").strip()
                if st:
                    existing_extra_stations.add(st)
                    existing_extra_rows.append(row)

    registered_stations = known_stations | existing_extra_stations
    print(f"合計登録済み駅数: {len(registered_stations)} 駅")

    # 3. 候補駅の抽出
    new_stations_dict: Dict[str, str] = {}
    passed_filter_props: int = 0

    for p in unique_properties:
        station_walk_str = str(p.get("station_walk", ""))
        first_walk_part = station_walk_str.split("/")[0] if "/" in station_walk_str else station_walk_str

        match = re.search(r"([^/]+)/([^/]+駅)\s*歩(\d+)分", station_walk_str)
        if match:
            walk_min = int(match.group(3))
        else:
            match_fallback = re.search(r"([^/]+)歩(\d+)分", first_walk_part)
            walk_min = int(match_fallback.group(2)) if match_fallback else 15

        age_years = ps_mod.parse_age_num(str(p.get("age_floor", "")))

        if walk_min > max_walk or age_years > max_age:
            continue

        if min_bedrooms > 0:
            madori_val = str(p.get("madori", ""))
            if extract_bedrooms(madori_val) < min_bedrooms:
                continue

        rent_str = str(p.get("rent", ""))
        admin_str = str(p.get("admin", ""))
        min_self_pay = ps_mod.calculate_self_pay(rent_str, admin_str, parking_fee=0.0)
        if min_self_pay > max_self_pay:
            continue

        passed_filter_props += 1

        candidates = ps_mod.parse_station_walk_candidates(station_walk_str)
        for cand_line, cand_st, cand_walk in candidates:
            # 1文字駅名やバス停表記（パース誤りゴミデータ）は除外
            if len(cand_st) <= 1 or "バス" in cand_st or "バス停" in cand_st:
                continue
            if cand_walk <= 15:
                if cand_st not in registered_stations and cand_st not in new_stations_dict:
                    new_stations_dict[cand_st] = cand_line

    print(f"基本条件通過物件数: {passed_filter_props} 件")
    print(f"新規追加対象駅数: {len(new_stations_dict)} 駅")

    new_rows: List[Dict[str, str]] = list(existing_extra_rows)
    for st_name, line_name in sorted(new_stations_dict.items()):
        new_rows.append({
            "station_name": st_name,
            "primary_line": line_name,
            "train_min": "",
            "transfers": "",
            "arrival_station": "",
            "arrival_walk_min": "",
            "transit_walk_min": "",
            "station_to_office_min": "",
            "lines_used": "",
            "route_summary": "",
            "memo": ""
        })

    with open(extra_csv_path, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_HEADERS)
        writer.writeheader()
        for r in new_rows:
            writer.writerow(r)

    print(f"保存完了: {extra_csv_path} (合計 {len(new_rows)} 行)")
    return True


def stage_parking(
    ps_mod: ModuleType,
    work_dir: str,
    d2d_bands_str: str,
    max_total_walk: int,
    max_self_pay: float,
    min_bedrooms: int = 0,
    base_extra_csv: Optional[str] = None
) -> bool:
    """
    Stage: parking (対象物件の駐車場代取得)
    """
    print("=== Stage: parking（対象物件の駐車場代取得） ===")
    raw_path = os.path.join(work_dir, "raw_listings.json")
    extra_csv_path = os.path.join(work_dir, "station_commute_extra.csv")
    extra_parking_path = os.path.join(work_dir, "parking_cache_extra.json")

    if not os.path.exists(raw_path):
        print(f"エラー: {raw_path} が見つかりません。", file=sys.stderr)
        return False

    d2d_bands = [int(b.strip()) for b in d2d_bands_str.split(",") if b.strip()]
    max_d2d_target = max(d2d_bands)

    # 1. 通勤DBのマージ
    merged_station_db: Dict[str, Dict[str, Union[str, int]]] = {}
    if base_extra_csv and os.path.exists(base_extra_csv):
        merged_station_db.update(ps_mod.load_station_commute_db(base_extra_csv))
    if os.path.exists(extra_csv_path):
        merged_station_db.update(ps_mod.load_station_commute_db(extra_csv_path))
    # 本番最優先
    merged_station_db.update(ps_mod.load_station_commute_db(BASE_STATION_COMMUTE_CSV_PATH))
    print(f"マージ後通勤DB駅数: {len(merged_station_db)} 駅")

    # 2. 駐車場キャッシュ
    base_parking_cache = ps_mod.load_parking_cache()
    extra_parking_cache: Dict[str, Dict[str, Union[float, int, str]]] = {}
    if os.path.exists(extra_parking_path):
        try:
            with open(extra_parking_path, "r", encoding="utf-8") as f:
                extra_parking_cache = json.load(f)
        except Exception as e:
            print(f"extra駐車場キャッシュ読み込み失敗: {e}", file=sys.stderr)

    with open(raw_path, "r", encoding="utf-8") as f:
        raw_properties: List[Dict[str, Union[str, int, float, None]]] = json.load(f)

    unique_properties: List[Dict[str, Union[str, int, float, None]]] = []
    seen_keys: Set[Tuple[str, str, str, str]] = set()
    for p in raw_properties:
        key = (
            str(p.get("rent", "")).strip(),
            str(p.get("madori", "")).strip(),
            str(p.get("menseki", "")).strip(),
            str(p.get("address", "")).strip()
        )
        if key not in seen_keys:
            seen_keys.add(key)
            unique_properties.append(p)

    target_listings: List[Dict[str, Union[str, int, float, None]]] = []
    for p in unique_properties:
        station_walk_str = str(p.get("station_walk", ""))
        first_walk_part = station_walk_str.split("/")[0] if "/" in station_walk_str else station_walk_str

        match = re.search(r"([^/]+)/([^/]+駅)\s*歩(\d+)分", station_walk_str)
        if match:
            line_name = match.group(1).strip()
            station_name = match.group(2).replace("駅", "").strip()
            walk_min = int(match.group(3))
        else:
            match_fallback = re.search(r"([^/]+)歩(\d+)分", first_walk_part)
            if match_fallback:
                raw_station_line = match_fallback.group(1).strip()
                walk_min = int(match_fallback.group(2))
                station_name = raw_station_line.split("駅")[0].split("/")[-1].strip() if "駅" in raw_station_line else "不明"
                line_name = raw_station_line.split("/")[0].strip() if "/" in raw_station_line else "不明"
            else:
                station_name = "不明"
                line_name = "不明"
                walk_min = 15

        if walk_min > 15:
            continue

        if min_bedrooms > 0 and extract_bedrooms(str(p.get("madori", ""))) < min_bedrooms:
            continue

        min_self_pay = ps_mod.calculate_self_pay(str(p.get("rent", "")), str(p.get("admin", "")), 0.0)
        if min_self_pay > max_self_pay:
            continue

        commute_best = ps_mod.evaluate_best_commute({
            "station": station_name,
            "line": line_name,
            "station_walk": station_walk_str,
            "walk_min": walk_min,
            "train_min": p.get("commute_min", 50),
            "transfers": p.get("commute_transfers", 1),
            "door_to_door": (p.get("commute_min", 50) or 50) + walk_min
        }, merged_station_db)

        if commute_best["door_to_door"] <= max_d2d_target and commute_best["total_walk_min"] <= max_total_walk:
            target_listings.append(p)

    print(f"ドアドア{max_d2d_target}分以下かつ総徒歩{max_total_walk}分以下の対象物件: {len(target_listings)} 件")

    fetched_count = 0
    for idx, p in enumerate(target_listings):
        url = str(p.get("url", ""))
        if not url:
            continue

        if url in base_parking_cache or url in extra_parking_cache:
            continue

        title = str(p.get("title", ""))
        print(f"  [{idx+1}/{len(target_listings)}] 駐車場取得中: {title} ({url})... ", end="", flush=True, file=sys.stderr)
        time.sleep(random.uniform(2.5, 4.0))

        detail_html = ps_mod.fetch_properties(url)
        if detail_html == "BLOCKED":
            print("アクセスブロック (403) 発生！即時停止します。", file=sys.stderr)
            return False

        if not detail_html or "掲載を終了" in detail_html or "お探しの物件" in detail_html or "該当するページが見つかりません" in detail_html:
            print("スキップ（掲載終了または取得不可）", file=sys.stderr)
            extra_parking_cache[url] = {
                "parking_fee": 0.0,
                "parking_dist": 0,
                "parking_text": "掲載終了/取得不可"
            }
            continue

        p_fee, p_dist, p_text = ps_mod.parse_parking_info(detail_html)
        extra_parking_cache[url] = {
            "parking_fee": p_fee,
            "parking_dist": p_dist,
            "parking_text": p_text
        }
        fetched_count += 1
        print(f"完了 ({p_text}, 料金:{p_fee}万)", file=sys.stderr)

        with open(extra_parking_path, "w", encoding="utf-8") as f:
            json.dump(extra_parking_cache, f, ensure_ascii=False, indent=2)

    print(f"駐車場情報取得完了: 新規取得 {fetched_count} 件, extraキャッシュ総数 {len(extra_parking_cache)} 件")
    return True


def stage_report(
    ps_mod: ModuleType,
    work_dir: str,
    d2d_bands_str: str,
    max_total_walk: int,
    max_self_pay: float,
    min_bedrooms: int = 0,
    base_extra_csv: Optional[str] = None
) -> bool:
    """
    Stage: report (集計・テーブル生成)
    """
    print("=== Stage: report（集計・テーブル生成） ===")
    raw_path = os.path.join(work_dir, "raw_listings.json")
    extra_csv_path = os.path.join(work_dir, "station_commute_extra.csv")
    extra_parking_path = os.path.join(work_dir, "parking_cache_extra.json")
    candidates_json_path = os.path.join(work_dir, "candidates.json")
    tables_md_path = os.path.join(work_dir, "tables.md")

    if not os.path.exists(raw_path):
        print(f"エラー: {raw_path} が見つかりません。", file=sys.stderr)
        return False

    d2d_bands = sorted([int(b.strip()) for b in d2d_bands_str.split(",") if b.strip()])
    max_d2d = max(d2d_bands)

    # 1. DB読み込み
    merged_station_db: Dict[str, Dict[str, Union[str, int]]] = {}
    if base_extra_csv and os.path.exists(base_extra_csv):
        merged_station_db.update(ps_mod.load_station_commute_db(base_extra_csv))
    if os.path.exists(extra_csv_path):
        merged_station_db.update(ps_mod.load_station_commute_db(extra_csv_path))
    merged_station_db.update(ps_mod.load_station_commute_db(BASE_STATION_COMMUTE_CSV_PATH))

    # 駐車場キャッシュ
    base_parking_cache = ps_mod.load_parking_cache()
    extra_parking_cache: Dict[str, Dict[str, Union[float, int, str]]] = {}
    if os.path.exists(extra_parking_path):
        try:
            with open(extra_parking_path, "r", encoding="utf-8") as f:
                extra_parking_cache = json.load(f)
        except Exception as e:
            print(f"extra駐車場キャッシュ読み込み失敗: {e}", file=sys.stderr)
    merged_parking_cache = dict(base_parking_cache)
    merged_parking_cache.update(extra_parking_cache)

    with open(raw_path, "r", encoding="utf-8") as f:
        raw_properties: List[Dict[str, Union[str, int, float, None]]] = json.load(f)

    unique_properties: List[Dict[str, Union[str, int, float, None]]] = []
    seen_raw_keys: Set[Tuple[str, str, str, str]] = set()
    for p in raw_properties:
        key = (
            str(p.get("rent", "")).strip(),
            str(p.get("madori", "")).strip(),
            str(p.get("menseki", "")).strip(),
            str(p.get("address", "")).strip()
        )
        if key not in seen_raw_keys:
            seen_raw_keys.add(key)
            unique_properties.append(p)

    evaluated_list: List[Dict[str, Union[str, float, int, bool, None]]] = []
    for p in unique_properties:
        station_walk_str = str(p.get("station_walk", ""))
        first_walk_part = station_walk_str.split("/")[0] if "/" in station_walk_str else station_walk_str

        match = re.search(r"([^/]+)/([^/]+駅)\s*歩(\d+)分", station_walk_str)
        if match:
            line_name = match.group(1).strip()
            station_name = match.group(2).replace("駅", "").strip()
            walk_min = int(match.group(3))
        else:
            match_fallback = re.search(r"([^/]+)歩(\d+)分", first_walk_part)
            if match_fallback:
                raw_station_line = match_fallback.group(1).strip()
                walk_min = int(match_fallback.group(2))
                station_name = raw_station_line.split("駅")[0].split("/")[-1].strip() if "駅" in raw_station_line else "不明"
                line_name = raw_station_line.split("/")[0].strip() if "/" in raw_station_line else "不明"
            else:
                station_name = "不明"
                line_name = "不明"
                walk_min = 15

        if walk_min > 15:
            continue

        madori_str = str(p.get("madori", ""))
        bedrooms = extract_bedrooms(madori_str)
        if min_bedrooms > 0 and bedrooms < min_bedrooms:
            continue

        url = str(p.get("url", ""))
        p_fee = 0.0
        p_dist = 0
        p_text = "-"
        if url in merged_parking_cache:
            c = merged_parking_cache[url]
            p_fee = float(c.get("parking_fee", 0.0) or 0.0)
            p_dist = int(c.get("parking_dist", 0) or 0)
            p_text = str(c.get("parking_text", "-") or "-")

        self_pay = ps_mod.calculate_self_pay(str(p.get("rent", "")), str(p.get("admin", "")), p_fee)
        if self_pay > max_self_pay:
            continue

        commute_best = ps_mod.evaluate_best_commute({
            "station": station_name,
            "line": line_name,
            "station_walk": station_walk_str,
            "walk_min": walk_min,
            "train_min": p.get("commute_min", 50),
            "transfers": p.get("commute_transfers", 1),
            "door_to_door": (p.get("commute_min", 50) or 50) + walk_min
        }, merged_station_db)

        if commute_best["door_to_door"] > max_d2d or commute_best["total_walk_min"] > max_total_walk:
            continue

        is_estimated = not bool(commute_best["is_db"])

        evaluated_list.append({
            "station": commute_best["station"],
            "line": commute_best["line"],
            "title": p.get("title", ""),
            "type": p.get("type", "不明"),
            "rent": p.get("rent", ""),
            "admin": p.get("admin", ""),
            "parking_fee": p_fee,
            "parking_dist": p_dist,
            "parking_text": p_text,
            "self_pay": round(self_pay, 2),
            "deposit": p.get("deposit", ""),
            "gratuity": p.get("gratuity", ""),
            "madori": madori_str,
            "bedrooms": bedrooms,
            "menseki": p.get("menseki", ""),
            "station_walk": station_walk_str,
            "address": p.get("address", ""),
            "age_floor": p.get("age_floor", ""),
            "url": url,
            "walk_min": commute_best["prop_walk_min"],
            "train_min": commute_best["train_min"],
            "door_to_door": commute_best["door_to_door"],
            "total_walk_min": commute_best["total_walk_min"],
            "transfers": commute_best["transfers"],
            "arrival_station": commute_best["arrival_station"],
            "arrival_walk_min": commute_best["arrival_walk_min"],
            "lines_used": commute_best["lines_used"],
            "route_summary": commute_best["route_summary"],
            "is_estimated": is_estimated
        })

    # 同一物件統合
    seen_dedup: Dict[Tuple[float, str, str, str], int] = {}
    deduped_list: List[Dict[str, Union[str, float, int, bool, None]]] = []
    for item in evaluated_list:
        key = dedup_key(item)
        if key in seen_dedup:
            existing_idx = seen_dedup[key]
            existing = deduped_list[existing_idx]
            if len(str(item.get("title", ""))) < len(str(existing.get("title", ""))):
                existing["title"] = item["title"]
        else:
            seen_dedup[key] = len(deduped_list)
            deduped_list.append(item)

    print(f"同一物件統合後: {len(deduped_list)} 件 (統合前: {len(evaluated_list)} 件)")

    with open(candidates_json_path, "w", encoding="utf-8") as f:
        json.dump(deduped_list, f, ensure_ascii=False, indent=2)
    print(f"保存完了: {candidates_json_path}")

    # 集計計算
    confirmed_items = [x for x in deduped_list if not x.get("is_estimated")]
    estimated_items = [x for x in deduped_list if x.get("is_estimated")]

    def compute_stats(items: List[Dict[str, Union[str, float, int, bool, None]]]) -> Dict[str, Union[int, float, str]]:
        if not items:
            return {
                "count": 0, "area_min": 0, "area_med": 0, "area_max": 0,
                "age_min": 0, "age_med": 0, "age_max": 0,
                "self_pay_med": 0.0, "walk_med": 0.0,
                "park_site": 0, "park_near": 0, "park_unknown": 0
            }

        areas: List[float] = []
        for x in items:
            m_a = re.search(r"[\d.]+", str(x.get("menseki", "")))
            if m_a:
                areas.append(float(m_a.group(0)))

        ages: List[int] = []
        for x in items:
            af = str(x.get("age_floor", ""))
            ages.append(ps_mod.parse_age_num(af))

        self_pays: List[float] = [float(x.get("self_pay", 0.0) or 0.0) for x in items]
        walks: List[int] = [int(x.get("walk_min", 0) or 0) for x in items]

        park_site = sum(1 for x in items if int(x.get("parking_dist", 0) or 0) == 0 and str(x.get("parking_text", "")) not in ["-", "掲載終了/取得不可"])
        park_near = sum(1 for x in items if int(x.get("parking_dist", 0) or 0) > 0)
        park_unknown = sum(1 for x in items if str(x.get("parking_text", "")) in ["-", "掲載終了/取得不可"])

        return {
            "count": len(items),
            "area_min": round(min(areas), 2) if areas else 0,
            "area_med": round(statistics.median(areas), 2) if areas else 0,
            "area_max": round(max(areas), 2) if areas else 0,
            "age_min": min(ages) if ages else 0,
            "age_med": round(statistics.median(ages), 1) if ages else 0,
            "age_max": max(ages) if ages else 0,
            "self_pay_med": round(statistics.median(self_pays), 2) if self_pays else 0,
            "walk_med": round(statistics.median(walks), 1) if walks else 0,
            "park_site": park_site,
            "park_near": park_near,
            "park_unknown": park_unknown
        }

    band_stats: Dict[int, Dict[str, Union[int, float, str]]] = {}
    for band in d2d_bands:
        band_items = [x for x in confirmed_items if int(x.get("door_to_door", 0) or 0) <= band]
        band_stats[band] = compute_stats(band_items)

    # 7. tables.md の構築
    md_lines: List[str] = []
    md_lines.append("# 集計テーブル（全種別・居室3以上・大手町30分圏・家賃18万以下）\n")
    md_lines.append("## 1. 帯別集計表（累積）\n")
    md_lines.append("| 指標 | ドアドア30分以下 | ドアドア35分以下 | ドアドア40分以下 |")
    md_lines.append("| :--- | :---: | :---: | :---: |")

    def format_stat_row(label: str, key_min: str, key_med: str, key_max: str, unit: str = "") -> str:
        s30 = f"{band_stats[30][key_min]} / {band_stats[30][key_med]} / {band_stats[30][key_max]}" if band_stats[30]["count"] > 0 else "-"
        s35 = f"{band_stats[35][key_min]} / {band_stats[35][key_med]} / {band_stats[35][key_max]}" if band_stats[35]["count"] > 0 else "-"
        s40 = f"{band_stats[40][key_min]} / {band_stats[40][key_med]} / {band_stats[40][key_max]}" if band_stats[40]["count"] > 0 else "-"
        return f"| {label} | {s30}{unit} | {s35}{unit} | {s40}{unit} |"

    md_lines.append(f"| 件数（統合後） | **{band_stats[30]['count']}件** | **{band_stats[35]['count']}件** | **{band_stats[40]['count']}件** |")
    md_lines.append(format_stat_row("専有面積（最小/中央/最大 m²）", "area_min", "area_med", "area_max"))
    md_lines.append(format_stat_row("築年数（最小/中央/最大 年）", "age_min", "age_med", "age_max"))
    md_lines.append(f"| 自己負担 中央値 | {band_stats[30]['self_pay_med']}万円 | {band_stats[35]['self_pay_med']}万円 | {band_stats[40]['self_pay_med']}万円 |")
    md_lines.append(f"| 駅徒歩 中央値 | {band_stats[30]['walk_med']}分 | {band_stats[35]['walk_med']}分 | {band_stats[40]['walk_med']}分 |")
    md_lines.append(f"| 駐車場（敷地内 / 近隣 / 記載なし） | {band_stats[30]['park_site']} / {band_stats[30]['park_near']} / {band_stats[30]['park_unknown']} | {band_stats[35]['park_site']} / {band_stats[35]['park_near']} / {band_stats[35]['park_unknown']} | {band_stats[40]['park_site']} / {band_stats[40]['park_near']} / {band_stats[40]['park_unknown']} |")
    md_lines.append("")

    # 物件一覧
    d2d30_items = [x for x in confirmed_items if int(x.get("door_to_door", 0) or 0) <= 30]
    md_lines.append(f"## 2. ドアドア30分以下の物件一覧（全 {len(d2d30_items)} 件）\n")
    if d2d30_items:
        md_lines.append("| 種別 | 駅 | 路線 | 物件名 | 家賃/管理費 | 自己負担 | ドアドア (徒歩+乗車) | 間取り/面積 | 築年数・構造 | 駐車場 | リンク |")
        md_lines.append("| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |")
        for x in sorted(d2d30_items, key=lambda it: (int(it.get("door_to_door", 0) or 0), float(it.get("self_pay", 0.0) or 0.0))):
            rent_adm = f"{x['rent']} / {x['admin']}"
            d2d_breakdown = f"{x['door_to_door']}分 (歩{x['walk_min']}+乗{x['train_min']})"
            madori_menseki = f"{x['madori']} / {x['menseki']}"
            ptype = x.get("type", "不明")
            md_lines.append(f"| {ptype} | {x['station']} | {x['line']} | {x['title']} | {rent_adm} | {x['self_pay']}万 | {d2d_breakdown} | {madori_menseki} | {x['age_floor']} | {x['parking_text']} | [詳細]({x['url']}) |")
    else:
        md_lines.append("該当物件はありません。\n")
    md_lines.append("")

    with open(tables_md_path, "w", encoding="utf-8") as f:
        f.write("\n".join(md_lines))
    print(f"集計完了: {tables_md_path}")
    return True


def main() -> None:
    parser = argparse.ArgumentParser(description="シナリオ検索スクリプト")
    parser.add_argument("--stage", choices=["selfcheck", "fetch", "stations", "parking", "report"], required=True,
                        help="実行ステージ: selfcheck, fetch, stations, parking, report")
    parser.add_argument("--tj", type=int, default=40, help="大手町までの通勤時間フィルタ (分)")
    parser.add_argument("--min-area", type=int, default=0, help="専有面積下限 (m2, 0=制限なし)")
    parser.add_argument("--max-age", type=int, default=999, help="築年数上限 (年, 999=制限なし)")
    parser.add_argument("--max-walk", type=int, default=15, help="駅徒歩上限 (分)")
    parser.add_argument("--max-rent", type=float, default=19.0, help="家賃上限 (万円)")
    parser.add_argument("--max-self-pay", type=float, default=5.0, help="自己負担上限 (万円)")
    parser.add_argument("--max-total-walk", type=int, default=18, help="総徒歩上限 (分)")
    parser.add_argument("--d2d-bands", type=str, default="30,35,40", help="集計するドアドア帯 (分, カンマ区切り)")
    parser.add_argument("--work-dir", type=str, default=".work/d2d30", help="作業データ格納ディレクトリ")
    parser.add_argument("--refresh", action="store_true", help="raw_listings.json が存在しても再取得する")
    parser.add_argument("--all-types", action="store_true", help="一戸建てだけでなく全種別（マンション・アパート含む）を対象にする")
    parser.add_argument("--min-bedrooms", type=int, default=0, help="最小居室数 (例: 3で3K/3DK/3LDK/4K以上)")
    parser.add_argument("--base-extra-csv", type=str, default=None, help="引き継ぐ過去の extra 駅通勤CSVパス")

    args = parser.parse_args()

    ps_mod = load_ps_module(BASE_PROPERTY_SEARCH_PATH)

    if args.stage == "selfcheck":
        ok = stage_selfcheck(ps_mod)
    elif args.stage == "fetch":
        ok = stage_fetch(
            ps_mod, args.work_dir, args.tj, args.min_area, args.max_rent, args.max_walk,
            args.refresh, all_types=args.all_types, min_bedrooms=args.min_bedrooms
        )
    elif args.stage == "stations":
        ok = stage_stations(
            ps_mod, args.work_dir, args.max_walk, args.max_age, args.max_self_pay,
            min_bedrooms=args.min_bedrooms, base_extra_csv=args.base_extra_csv
        )
    elif args.stage == "parking":
        ok = stage_parking(
            ps_mod, args.work_dir, args.d2d_bands, args.max_total_walk, args.max_self_pay,
            min_bedrooms=args.min_bedrooms, base_extra_csv=args.base_extra_csv
        )
    elif args.stage == "report":
        ok = stage_report(
            ps_mod, args.work_dir, args.d2d_bands, args.max_total_walk, args.max_self_pay,
            min_bedrooms=args.min_bedrooms, base_extra_csv=args.base_extra_csv
        )
    else:
        ok = False

    if not ok:
        sys.exit(1)


if __name__ == "__main__":
    main()
