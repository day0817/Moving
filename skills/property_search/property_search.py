import os
import sys
import argparse
import urllib.parse
import requests
from bs4 import BeautifulSoup
import time
import random
import json
import re

# 都道府県コード（SUUMOパラメータ ta）
PREFECTURES = {
    "東京": "13",
    "神奈川": "14",
    "埼玉": "11",
    "千葉": "12",
    "茨城": "08"
}

# 静的な駅座標辞書（ハブ駅や主要駅をあらかじめ定義）
STATIC_STATION_COORDS = {
    "大手町": {"lat": 35.6848, "lng": 139.7661},
    "東京": {"lat": 35.6812, "lng": 139.7671},
    "松戸": {"lat": 35.7845, "lng": 139.9007},
    "越谷": {"lat": 35.8897, "lng": 139.7891},
    "妙典": {"lat": 35.6924, "lng": 139.9251},
    "津田沼": {"lat": 35.6917, "lng": 140.0204},
    "本八幡": {"lat": 35.7208, "lng": 139.9273},
    "守谷": {"lat": 35.9503, "lng": 139.9755},
    "北千住": {"lat": 35.7444, "lng": 139.8044},
    "西船橋": {"lat": 35.7075, "lng": 139.9592},
    "船橋": {"lat": 35.7014, "lng": 139.9850},
    "浦安": {"lat": 35.6663, "lng": 139.8973},
    "柏": {"lat": 35.8622, "lng": 139.9711},
    "南越谷": {"lat": 35.8753, "lng": 139.7909},
    "新越谷": {"lat": 35.8753, "lng": 139.7909},
    "武蔵小杉": {"lat": 35.5758, "lng": 139.6631},
    "川崎": {"lat": 35.5313, "lng": 139.6969},
    "横浜": {"lat": 35.4658, "lng": 139.6222},
    "浦和": {"lat": 35.8597, "lng": 139.6572},
    "大宮": {"lat": 35.9063, "lng": 139.6233},
}

CACHE_FILE_PATH = "geocoding_cache.json"

def load_geocoding_cache():
    if os.path.exists(CACHE_FILE_PATH):
        try:
            with open(CACHE_FILE_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"キャッシュのロードに失敗: {e}", file=sys.stderr)
    return {}

def save_geocoding_cache(cache):
    try:
        with open(CACHE_FILE_PATH, "w", encoding="utf-8") as f:
            json.dump(cache, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"キャッシュの保存に失敗: {e}", file=sys.stderr)

# 関東地方をやや広めに囲む範囲。この範囲外の結果はジオコーディングの誤マッチとみなして棄却する
# (例: 「黒川」「塚田」「新田」等の全国に同名駅がある地名で、関東以外の地点が誤って返るケースがある)
KANTO_BOUNDS = {"min_lat": 34.5, "max_lat": 37.2, "min_lng": 138.3, "max_lng": 141.2}

def is_within_kanto_bounds(lat, lng):
    return (KANTO_BOUNDS["min_lat"] <= lat <= KANTO_BOUNDS["max_lat"] and
            KANTO_BOUNDS["min_lng"] <= lng <= KANTO_BOUNDS["max_lng"])

# 地理座標の解決（静的辞書 -> キャッシュ -> API）
def get_station_coords(station_name, cache):
    clean_name = station_name.replace("駅", "").strip()

    if clean_name in STATIC_STATION_COORDS:
        return STATIC_STATION_COORDS[clean_name]

    if clean_name in cache:
        return cache[clean_name]

    print(f"  [API] 駅の座標を取得中: {clean_name}... ", end="", flush=True, file=sys.stderr)
    headers = {
        "User-Agent": "AntigravityBukkenCompareMap/1.0 (dh081@gemini-agent)"
    }
    params = {
        "q": clean_name + "駅",
        "format": "json",
        "limit": 1,
        "countrycodes": "jp",              # 日本国内に限定
        "viewbox": "138.3,37.2,141.2,34.5", # 関東地方周辺 (left,top,right,bottom)
        "bounded": 0,                       # 見つからない場合は範囲外も許容し、後段のbounds検証で弾く
    }
    url = f"https://nominatim.openstreetmap.org/search?{urllib.parse.urlencode(params)}"
    try:
        time.sleep(1.5)
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code == 200:
            data = res.json()
            if data:
                lat = float(data[0]["lat"])
                lng = float(data[0]["lon"])
                if not is_within_kanto_bounds(lat, lng):
                    print(f"棄却 (関東地方外の座標: {lat},{lng})", file=sys.stderr)
                    return None
                coords = {"lat": lat, "lng": lng}
                cache[clean_name] = coords
                save_geocoding_cache(cache)
                print("完了", file=sys.stderr)
                return coords
        print("失敗", file=sys.stderr)
    except Exception as e:
        print(f"エラー ({e})", file=sys.stderr)

    return None

def extract_walk_minutes(station_walk_str, target_station_name):
    pattern = rf"{target_station_name}(?:駅)?\s*歩(\d+)分"
    match = re.search(pattern, station_walk_str)
    if match:
        return int(match.group(1))
    fallback_match = re.search(r"歩(\d+)分", station_walk_str)
    if fallback_match:
        return int(fallback_match.group(1))
    return 10

def parse_age_num(age_floor_str):
    if "新築" in age_floor_str:
        return 0
    match = re.search(r"築(\d+)年", age_floor_str)
    if match:
        return int(match.group(1))
    return 99 # 不明な場合は安全のため築古扱い

def load_station_commute_db(csv_path="station_commute.csv"):
    """station_commute.csv から駅別通勤DBを読み込む"""
    import csv
    db = {}
    if not os.path.exists(csv_path):
        return db
    try:
        with open(csv_path, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                st = row.get("station_name", "").strip()
                if not st:
                    continue
                try:
                    db[st] = {
                        "primary_line": row.get("primary_line", ""),
                        "train_min": int(row.get("train_min", 0)),
                        "transfers": int(row.get("transfers", 0)),
                        "arrival_station": row.get("arrival_station", "大手町(東京都)"),
                        "arrival_walk_min": int(row.get("arrival_walk_min", 1)),
                        "transit_walk_min": int(row.get("transit_walk_min", 0)),
                        "station_to_office_min": int(row.get("station_to_office_min", 0)),
                        "lines_used": row.get("lines_used", ""),
                        "route_summary": row.get("route_summary", ""),
                        "memo": row.get("memo", "")
                    }
                except ValueError:
                    continue
    except Exception as e:
        print(f"通勤DBの読み込みに失敗: {e}", file=sys.stderr)
    return db

def parse_station_walk_candidates(station_walk_str):
    """station_walk 文字列から全最寄り駅候補 [(line, station, walk_min)] を抽出"""
    if not station_walk_str:
        return []
    segments = re.split(r"\s*/\s*", station_walk_str)
    res = []
    for seg in segments:
        m = re.search(r"(?:([^/]+)/)?([^/駅]+)駅\s*歩(\d+)分", seg)
        if m:
            l = m.group(1).strip() if m.group(1) else ""
            s = m.group(2).strip()
            w = int(m.group(3))
            res.append((l, s, w))
    return res

def evaluate_best_commute(p, station_db):
    """物件の最寄り駅候補から最短ドアドアルートを評価"""
    candidates = parse_station_walk_candidates(p.get("station_walk", ""))
    evaluated = []
    for cand_line, cand_st, cand_walk in candidates:
        if cand_st in station_db and station_db[cand_st]["station_to_office_min"] > 0:
            st_info = station_db[cand_st]
            d2d = cand_walk + st_info["station_to_office_min"]
            total_walk = cand_walk + st_info["arrival_walk_min"]
            evaluated.append({
                "station": cand_st,
                "line": cand_line or st_info["primary_line"] or p.get("line", ""),
                "prop_walk_min": cand_walk,
                "train_min": st_info["train_min"],
                "transfers": st_info["transfers"],
                "arrival_station": st_info["arrival_station"],
                "arrival_walk_min": st_info["arrival_walk_min"],
                "transit_walk_min": st_info["transit_walk_min"],
                "station_to_office_min": st_info["station_to_office_min"],
                "door_to_door": d2d,
                "total_walk_min": total_walk,
                "lines_used": st_info["lines_used"] or cand_line or p.get("line", ""),
                "route_summary": st_info["route_summary"] or f"{cand_st}→大手町",
                "is_db": True
            })
        else:
            is_primary = (cand_st == p.get("station"))
            train_m = p.get("train_min", 30) if is_primary else 30
            transf = p.get("transfers", 1) if is_primary else 1
            arr_walk = 1
            trans_walk = 4
            d2d = cand_walk + train_m + arr_walk + trans_walk
            total_walk = cand_walk + arr_walk
            evaluated.append({
                "station": cand_st,
                "line": cand_line or p.get("line", ""),
                "prop_walk_min": cand_walk,
                "train_min": train_m,
                "transfers": transf,
                "arrival_station": "大手町(東京都)",
                "arrival_walk_min": arr_walk,
                "transit_walk_min": trans_walk,
                "station_to_office_min": train_m + arr_walk + trans_walk,
                "door_to_door": d2d,
                "total_walk_min": total_walk,
                "lines_used": cand_line or p.get("line", ""),
                "route_summary": f"{cand_st}→大手町",
                "is_db": False
            })

    if not evaluated:
        st = p.get("station", "不明")
        w = p.get("walk_min", 10)
        tm = p.get("train_min", 30)
        tr = p.get("transfers", 1)
        evaluated.append({
            "station": st,
            "line": p.get("line", "不明"),
            "prop_walk_min": w,
            "train_min": tm,
            "transfers": tr,
            "arrival_station": "大手町(東京都)",
            "arrival_walk_min": 1,
            "transit_walk_min": 4,
            "station_to_office_min": tm + 5,
            "door_to_door": w + tm + 5,
            "total_walk_min": w + 1,
            "lines_used": p.get("line", ""),
            "route_summary": f"{st}→大手町",
            "is_db": False
        })

    # 最短ドアドア順でソート（同点なら乗換回数、総徒歩）
    evaluated.sort(key=lambda x: (x["door_to_door"], x["transfers"], x["total_walk_min"]))
    return evaluated[0]

def calculate_self_pay(rent_str, admin_str, parking_fee=0.0):
    rent_match = re.search(r"([\d.]+)", rent_str)
    rent = float(rent_match.group(1)) if rent_match else 0.0
    
    admin = 0.0
    if admin_str and admin_str != "-":
        admin_match = re.search(r"(\d+)", admin_str)
        admin = float(admin_match.group(1)) / 10000.0 if admin_match else 0.0
        
    house_total = rent + admin
    if house_total <= 16.0:
        house_self_pay = house_total * 0.2
    else:
        house_self_pay = 3.2 + (house_total - 16.0)
        
    return house_self_pay + parking_fee

def parse_parking_info(detail_html):
    parking_fee = 0.0
    parking_dist = 0
    parking_text = "-"
    
    if not detail_html or detail_html == "BLOCKED":
        return parking_fee, parking_dist, parking_text
        
    soup = BeautifulSoup(detail_html, "html.parser")
    th_el = soup.find(lambda tag: tag.name == "th" and tag.text and "駐車場" in tag.text.strip())
    if th_el:
        td_el = th_el.find_next_sibling("td")
        if td_el:
            parking_text = td_el.text.strip()
            if "敷地内" in parking_text or "付" in parking_text:
                parking_dist = 0
            else:
                dist_match = re.search(r"(?:近隣|徒歩|約)?(\d+)\s*m", parking_text)
                if dist_match:
                    parking_dist = int(dist_match.group(1))
            
            if "無料" in parking_text:
                parking_fee = 0.0
            else:
                fee_match = re.search(r"(\d+)\s*円", parking_text)
                if fee_match:
                    parking_fee = float(fee_match.group(1)) / 10000.0
                else:
                    parking_fee = 0.0
                    
    return parking_fee, parking_dist, parking_text

def build_suumo_url(pref_code, max_rent=18.0, min_area=80, max_walk=15):
    base_url = "https://suumo.jp/jj/chintai/ichiran/FR301FC001/"
    params = {
        "ar": "030",            # 関東
        "ta": pref_code,        # 都道府県コード
        "bs": "040",            # 賃貸
        "pc": "30",             # 表示件数
        "po1": "25",            # 標準順
        "po2": "99",
        "shkr1": "03",
        "shkr2": "03",
        "shkr3": "03",
        "shkr4": "03",
        "ekInput": "06050",     # 大手町駅起点
        "tj": "50",             # 通勤時間 50分以内
        "nk": "1",              # 乗換 1回以下
        "cb": "0.0",            # 賃料下限
        "ct": str(max_rent),    # 賃料上限
        "co": "1",              # 管理費込み
        "ts": "3",              # 一戸建て
        "et": str(max_walk),    # 駅徒歩上限 (徒歩10〜15分は後でフィルタリングするため15でリクエスト)
        "mb": str(min_area),    # 専有面積下限
        "mt": "9999999",
        "cn": "9999999",
        "tc": "0400901",        # 駐車場あり
    }
    
    query_str = urllib.parse.urlencode(params)
    return f"{base_url}?{query_str}"

def fetch_properties(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Accept-Language": "ja,en-US;q=0.9,en;q=0.8"
    }
    try:
        response = requests.get(url, headers=headers, timeout=15)
        if response.status_code == 403:
            return "BLOCKED"
        if response.status_code != 200:
            return None
        return response.text
    except Exception as e:
        print(f"エラー: リクエストに失敗しました ({e})", file=sys.stderr)
        return None

def parse_commute_info_from_row(item):
    """cassetteitem(物件全体)から、ekInput指定駅(大手町駅)までの所要時間・乗換回数を取得する。

    【重要】このバッジ(cassetteitem_transfer)は部屋単位のtr要素(js-cassette_link)の
    中には存在せず、物件(cassetteitem)全体につき1つだけ存在する。以前はtr要素を
    渡していたため常にHTML要素が見つからず、フォールバック値(50分・乗換1回)を
    全物件が例外なく返す状態になっていた(実測値ではなかった)。呼び出し側もitem単位で
    1回だけ呼ぶよう修正すること。

    実際のバッジ文言は "1)大手町駅（25分・0回）" のような形式(全角括弧、
    「・」区切り、"乗換"という文字は含まれない)。
    """
    commute_text = ""
    transfer_el = item.find(class_=re.compile(r"cassetteitem_transfer"))
    if transfer_el:
        commute_text = transfer_el.text.strip()

    minutes = 50  # 取得できなかった場合のフォールバック(実測値ではない点に注意)
    transfers = 1

    m = re.search(r"(\d+)分[・･](\d+)回", commute_text)
    if m:
        minutes = int(m.group(1))
        transfers = int(m.group(2))
    else:
        # フォーマットが想定と異なる場合の緩いフォールバック
        m_min = re.search(r"(\d+)分", commute_text)
        if m_min:
            minutes = int(m_min.group(1))
        m_tr = re.search(r"(\d+)回", commute_text)
        if m_tr:
            transfers = int(m_tr.group(1))

    return minutes, transfers

def parse_suumo_html(html_content):
    if html_content == "BLOCKED":
        return "BLOCKED"
    
    soup = BeautifulSoup(html_content, "html.parser")
    items = soup.find_all("div", class_="cassetteitem")
    properties = []
    
    for item in items:
        title_el = item.find("div", class_="cassetteitem_content-title")
        title = title_el.text.strip() if title_el else "不明"
        
        prop_type_el = item.find("span", class_="cassetteitem_content-label")
        prop_type = prop_type_el.text.strip() if prop_type_el else "不明"
        
        # 駅徒歩情報の抽出
        stations_el = item.find_all("div", class_="cassetteitem_detail-text")
        station_info = []
        for s in stations_el:
            station_info.append(s.text.strip())
        station_str = " / ".join(station_info)
        
        # 住所
        address_el = item.find("li", class_="cassetteitem_detail-col1")
        address = address_el.text.strip() if address_el else ""
        
        # 築年数・階数
        col3_el = item.find("li", class_="cassetteitem_detail-col3")
        age_floor = ""
        if col3_el:
            divs = col3_el.find_all("div")
            age_floor = " ".join([d.text.strip() for d in divs])

        # 大手町への通勤時間・乗換回数の抽出（物件=item単位で1つだけ存在するバッジのため、
        # 部屋の行ループの外で1回だけ取得し、同一物件内の全部屋で使い回す）
        commute_min, commute_transfers = parse_commute_info_from_row(item)

        # 部屋情報
        table = item.find("table", class_="cassetteitem_other")
        if table:
            rows = table.find_all("tr", class_="js-cassette_link")
            for row in rows:
                cols = row.find_all("td")
                if len(cols) < 9:
                    continue
                
                # 家賃・管理費
                rent_el = cols[3].find("span", class_="cassetteitem_price--rent")
                rent = rent_el.text.strip() if rent_el else "0"
                
                admin_el = cols[3].find("span", class_="cassetteitem_price--administration")
                admin = admin_el.text.strip() if admin_el else "0"
                
                # 敷金・礼金
                deposit_el = cols[4].find("span", class_="cassetteitem_price--deposit")
                deposit = deposit_el.text.strip() if deposit_el else "0"
                
                gratuity_el = cols[4].find("span", class_="cassetteitem_price--gratuity")
                gratuity = gratuity_el.text.strip() if gratuity_el else "0"
                
                # 間取り・面積
                madori_el = cols[5].find("span", class_="cassetteitem_madori")
                madori = madori_el.text.strip() if madori_el else "不明"
                
                menseki_el = cols[5].find("span", class_="cassetteitem_menseki")
                menseki = menseki_el.text.strip() if menseki_el else "不明"
                
                # 詳細URL
                link_el = cols[8].find("a", class_="js-cassette_link_href")
                detail_url = ""
                if link_el and link_el.has_attr("href"):
                    detail_url = "https://suumo.jp" + link_el["href"]
                
                properties.append({
                    "title": title,
                    "type": prop_type,
                    "station_walk": station_str,
                    "address": address,
                    "age_floor": age_floor,
                    "rent": rent,
                    "admin": admin,
                    "deposit": deposit,
                    "gratuity": gratuity,
                    "madori": madori,
                    "menseki": menseki,
                    "url": detail_url,
                    "commute_min": commute_min,
                    "commute_transfers": commute_transfers
                })
                
    return properties

def parse_max_pages(html_content):
    if not html_content or html_content == "BLOCKED":
        return 1
    soup = BeautifulSoup(html_content, "html.parser")
    pagination = soup.find("ol", class_="pagination-parts")
    if not pagination:
        return 1
    page_links = pagination.find_all("a")
    pages = [1]
    for a in page_links:
        m = re.search(r"page=(\d+)", a.get("href", ""))
        if m:
            pages.append(int(m.group(1)))
        else:
            m2 = re.search(r"\d+", a.text)
            if m2:
                pages.append(int(m2.group(0)))
    return max(pages)

def load_existing_properties(js_path):
    if not os.path.exists(js_path):
        return []
    try:
        with open(js_path, "r", encoding="utf-8") as f:
            content = f.read().strip()
        match = re.search(r"const\s+bukkenData\s*=\s*(.*);", content, re.DOTALL)
        if match:
            return json.loads(match.group(1).strip())
    except Exception as e:
        print(f"既存データのロードに失敗: {e}", file=sys.stderr)
    return []

def main():
    parser = argparse.ArgumentParser(description="大手町起点通勤時間指定SUUMO一括物件検索スクリプト")
    parser.add_argument("--max-rent", type=float, default=18.0, help="家賃上限（万円）、管理費込み。デフォルト18.0")
    parser.add_argument("--min-area", type=int, default=80, help="最小専有面積（m2）。デフォルト80")
    parser.add_argument("--max-walk", type=int, default=15, help="駅徒歩上限（分）。デフォルト15")
    parser.add_argument("--output", type=str, default="物件検索結果.md", help="出力先のMarkdownファイルパス")
    
    args = parser.parse_args()
    
    geocoding_cache = load_geocoding_cache()
    dir_name = os.path.dirname(args.output) or "."
    station_commute_db = load_station_commute_db(os.path.join(dir_name, "station_commute.csv"))
    all_properties = []
    
    print("物件情報を各都県から検索中...", file=sys.stderr)
    for pref_name, pref_code in PREFECTURES.items():
        print(f"[{pref_name}] 検索中... ", file=sys.stderr)
        # 徒歩15分以内でリクエストを投げる ( et=15 )
        base_url = build_suumo_url(pref_code, max_rent=args.max_rent, min_area=args.min_area, max_walk=args.max_walk)
        
        # 1ページ目を取得して最大ページ数を確認
        first_page_html = fetch_properties(base_url)
        if first_page_html == "BLOCKED":
            print(f"  -> {pref_name}でアクセスブロックが発生しました。", file=sys.stderr)
            continue
        elif first_page_html is None:
            print(f"  -> {pref_name}の取得に失敗しました。", file=sys.stderr)
            continue
            
        max_pages = parse_max_pages(first_page_html)
        print(f"  -> 最大ページ数: {max_pages}", file=sys.stderr)
        
        pref_properties = parse_suumo_html(first_page_html)
        if isinstance(pref_properties, list):
            all_properties.extend(pref_properties)
            
        # 2ページ目以降をループ
        for page in range(2, max_pages + 1):
            time.sleep(random.uniform(2.0, 4.0)) # ウェイト
            print(f"  -> ページ {page} / {max_pages} を取得中... ", end="", flush=True, file=sys.stderr)
            page_url = f"{base_url}&page={page}"
            page_html = fetch_properties(page_url)
            if page_html == "BLOCKED":
                print("ブロック発生", file=sys.stderr)
                break
            elif page_html is None:
                print("エラー", file=sys.stderr)
                continue
                
            page_properties = parse_suumo_html(page_html)
            if isinstance(page_properties, list):
                print(f"{len(page_properties)}件取得", file=sys.stderr)
                all_properties.extend(page_properties)
            else:
                print("エラー", file=sys.stderr)
                
        # サーバー負荷防止用
        time.sleep(random.uniform(3.0, 5.0))
        
    print(f"\n合計取得レコード数: {len(all_properties)} 件 (重複排除前)", file=sys.stderr)

    # 1. 厳格な重複排除 (家賃、間取り、面積、住所が同じものは、物件名が異なっても同一物件とみなす)
    unique_properties = []
    seen_keys = set()
    for p in all_properties:
        key = (
            p["rent"].strip(),
            p["madori"].strip(),
            p["menseki"].strip(),
            p["address"].strip()
        )
        if key not in seen_keys:
            seen_keys.add(key)
            unique_properties.append(p)
            
    print(f"重複排除後のユニーク物件数: {len(unique_properties)} 件", file=sys.stderr)
    
    # 既存データの読み込み (駐車場情報のキャッシュ引き継ぎ用)
    dir_name = os.path.dirname(args.output) or "."
    existing_js_path = os.path.join(dir_name, "物件比較アプリ", "properties.js")
    old_properties = load_existing_properties(existing_js_path)
    
    # 2. 駐車場情報の取得とキャッシュ再利用、最寄り駅の路線名と駅名、および新フィルタリングルールの適用
    json_properties = []
    
    print("詳細情報・最寄り駅座標の処理とフィルタリング中...", file=sys.stderr)
    for idx, p in enumerate(unique_properties):
        # 最寄り駅のパース
        station_name = "不明"
        line_name = "不明"
        walk_min = 15
        
        # 最初の駅情報をメインとする
        first_walk_part = p["station_walk"].split("/")[0] if "/" in p["station_walk"] else p["station_walk"]
        
        # 正規表現で「路線名」と「駅名」「徒歩」を綺麗に抜く
        match = re.search(r"([^/]+)/([^/]+駅)\s*歩(\d+)分", p["station_walk"])
        if match:
            line_name = match.group(1).strip()
            station_name = match.group(2).replace("駅", "").strip()
            walk_min = int(match.group(3))
        else:
            match_fallback = re.search(r"([^/]+)歩(\d+)分", first_walk_part)
            if match_fallback:
                raw_station_line = match_fallback.group(1).strip()
                walk_min = int(match_fallback.group(2))
                if "駅" in raw_station_line:
                    station_name = raw_station_line.split("駅")[0].split("/")[-1].strip()
                    line_name = raw_station_line.split("/")[0].strip() if "/" in raw_station_line else "不明"
            else:
                station_name = "不明"
        
        # === 新フィルタリングルールの適用 ===
        # 1. 駅徒歩10分以下
        # 2. 築30年以下
        age_years = parse_age_num(p["age_floor"])
        
        if walk_min > 10 or age_years > 30:
            # 条件に合致しないためスキップ
            continue
            
        # 駅の座標を取得 (ハイブリッド方式)
        coords = None
        if station_name != "不明":
            coords = get_station_coords(station_name, geocoding_cache)
            
        # 駐車場情報のキャッシュ引き継ぎ
        old_p = next((x for x in old_properties if x.get("url") == p["url"]), None)
        p_fee = 0.0
        p_dist = 0
        p_text = "-"
        if old_p and "parking_fee" in old_p:
            p_fee = old_p["parking_fee"]
            p_dist = old_p.get("parking_dist", 0)
            p_text = old_p.get("parking_text", "-")
        else:
            # 新規物件のみ詳細ページを取得して駐車場情報を取得
            print(f"  [{idx+1}/{len(unique_properties)}] 駐車場情報を取得中: {p['title']} ({p['url']})... ", end="", flush=True, file=sys.stderr)
            time.sleep(random.uniform(2.5, 4.0)) # ウェイト
            detail_html = fetch_properties(p["url"])
            if detail_html == "BLOCKED" or not detail_html or "掲載を終了" in detail_html or "お探しの物件" in detail_html or "該当するページが見つかりません" in detail_html:
                print("スキップ（掲載終了または詳細取得不可）", file=sys.stderr)
                continue
            p_fee, p_dist, p_text = parse_parking_info(detail_html)
            print(f"完了 ({p_text})", file=sys.stderr)
            
        s_pay = calculate_self_pay(p['rent'], p['admin'], p_fee)
        if s_pay > 5.2:
            continue

        # 駅通勤DB（station_commute.csv）による正確な通勤ルート・所要時間の再計算
        commute_best = evaluate_best_commute({
            "station": station_name,
            "line": line_name,
            "station_walk": p["station_walk"],
            "walk_min": walk_min,
            "train_min": p.get("commute_min", 50),
            "transfers": p.get("commute_transfers", 1),
            "door_to_door": p.get("commute_min", 50) + walk_min
        }, station_commute_db)

        # 必須カットオフ条件の適用：ドアドア通勤時間59分以下 かつ 総徒歩時間15分以内
        if commute_best["door_to_door"] > 59 or commute_best["total_walk_min"] > 15:
            continue

        # 最適ルートの駅座標を解決
        best_station = commute_best["station"]
        coords = get_station_coords(best_station, geocoding_cache) if best_station != "不明" else None

        json_properties.append({
            "station": commute_best["station"],
            "line": commute_best["line"],
            "title": p['title'],
            "rent": p['rent'],
            "admin": p['admin'],
            "parking_fee": p_fee,
            "parking_dist": p_dist,
            "parking_text": p_text,
            "self_pay": s_pay,
            "deposit": p['deposit'],
            "gratuity": p['gratuity'],
            "madori": p['madori'],
            "menseki": p['menseki'],
            "station_walk": p['station_walk'],
            "address": p['address'],
            "age_floor": p['age_floor'],
            "url": p['url'],
            "walk_min": commute_best["prop_walk_min"],
            "train_min": commute_best["train_min"],
            "door_to_door": commute_best["door_to_door"],
            "total_walk_min": commute_best["total_walk_min"],
            "transfers": commute_best["transfers"],
            "arrival_station": commute_best["arrival_station"],
            "arrival_walk_min": commute_best["arrival_walk_min"],
            "lines_used": commute_best["lines_used"],
            "route_summary": commute_best["route_summary"],
            "lat": coords["lat"] if coords else None,
            "lng": coords["lng"] if coords else None
        })

    print(f"新ルールおよびドアドア再計算・カットオフ適用後の物件数: {len(json_properties)} 件", file=sys.stderr)

    # ========================================
    # 同一物件の自動統合（重複除去）
    # 判定キー: 自己負担額・面積・築年数/階建て・住所（市区町村＋丁目レベル）が全一致
    # 統合方針: 物件名が短い方（簡潔な方）に寄せる
    # ========================================
    def normalize_address(addr):
        """住所を「市区町村＋丁目」レベルまで正規化（番地以降を除去）"""
        import re
        # 「○○市○○区○○N丁目」または「○○市○○N」まで抽出
        m = re.match(r'(.+?[都道府県].+?[市区町村].+?[0-9０-９])', addr or '')
        return m.group(1) if m else (addr or '').strip()

    def normalize_menseki(m):
        """面積文字列を小数2桁に正規化（例: '85.5m2' → '85.50'）"""
        import re
        num = re.sub(r'[^0-9.]', '', m or '')
        try:
            return f"{float(num):.2f}"
        except ValueError:
            return num

    def dedup_key(p):
        return (
            round(p.get('self_pay', 0), 1),
            normalize_menseki(p.get('menseki', '')),
            (p.get('age_floor', '') or '').strip(),
            normalize_address(p.get('address', ''))
        )

    seen_keys = {}
    deduped_properties = []
    for p in json_properties:
        key = dedup_key(p)
        if key in seen_keys:
            # 既出の物件と同一キー → 物件名が短い方に統合（URLは最初に見つかった方を保持）
            existing_idx = seen_keys[key]
            existing = deduped_properties[existing_idx]
            if len(p.get('title', '')) < len(existing.get('title', '')):
                # 今回の方が短い物件名なので既存エントリのtitleだけ置き換え
                deduped_properties[existing_idx]['title'] = p['title']
            print(
                f"  [重複統合] 「{p.get('title')}」→「{deduped_properties[existing_idx]['title']}」"
                f" (key={key})", file=sys.stderr
            )
        else:
            seen_keys[key] = len(deduped_properties)
            deduped_properties.append(p)

    removed = len(json_properties) - len(deduped_properties)
    if removed > 0:
        print(f"  同一物件統合により {removed} 件を除去 → {len(deduped_properties)} 件", file=sys.stderr)
    json_properties = deduped_properties

    # 前回データとの差分判定（新規追加物件の抽出およびis_newフラグ設定）

    old_urls = {p.get("url") for p in old_properties if p.get("url")}
    old_keys = {(p.get("rent", "").strip(), p.get("madori", "").strip(), p.get("menseki", "").strip(), p.get("address", "").strip()) for p in old_properties}

    new_properties = []
    for p in json_properties:
        p_key = (p.get("rent", "").strip(), p.get("madori", "").strip(), p.get("menseki", "").strip(), p.get("address", "").strip())
        is_new = (p.get("url") not in old_urls and p_key not in old_keys)
        p["is_new"] = is_new
        if is_new:
            new_properties.append(p)

    print(f"前回からの新規追加物件数: {len(new_properties)} 件", file=sys.stderr)

    # 結果のMarkdown生成
    md_lines = []
    md_lines.append("# 物件検索結果一覧\n")
    md_lines.append(f"検索条件：管理費・駐車場込み {args.max_rent}万円以下 / 面積 {args.min_area}m²以上 / 一戸建て / 大手町まで50分・乗換1回以下\n")
    md_lines.append("※絞り込みルール：自己負担額5.2万円以下 / ドアドア通勤時間60分以下 / 駅徒歩10分以下 / 築30年以下\n")
    
    # 1. 新規追加物件セクション
    md_lines.append(f"## 🆕 新たに追加された物件 (前回からの差分: {len(new_properties)}件)\n")
    if new_properties:
        md_lines.append("| エリア | 最寄り路線 | 物件名 | 家賃/管理費 | 自己負担額 | ドアドア通勤時間 (乗換) | 間取り/面積 | 徒歩・立地 | リンク |")
        md_lines.append("| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |")
        for p in new_properties:
            rent_info = f"{p['rent']} / {p['admin']}"
            room_info = f"{p['madori']} / {p['menseki']}"
            link = f"[詳細を表示]({p['url']})" if p['url'] else "-"
            self_pay_str = f"**{p['self_pay']:.2f}万円**"
            commute_info = f"**{p['door_to_door']}分** (徒歩{p['walk_min']}分+乗車{p['train_min']}分, 乗換{p['transfers']}回)"
            md_lines.append(f"| {p['station']} | {p['line']} | {p['title']} | {rent_info} | {self_pay_str} | {commute_info} | {room_info} | {p['station_walk']} ({p['age_floor']}) | {link} |")
        md_lines.append("\n---\n")
    else:
        md_lines.append("前回からの新規追加物件はありません。\n\n---\n")

    # 2. 全物件一覧セクション
    md_lines.append(f"## 抽出された全物件一覧 (全{len(json_properties)}件)\n")
    if json_properties:
        md_lines.append("| エリア | 最寄り路線 | 物件名 | 家賃/管理費 | 自己負担額 | ドアドア通勤時間 (乗換) | 間取り/面積 | 徒歩・立地 | リンク |")
        md_lines.append("| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |")
        for p in json_properties:
            rent_info = f"{p['rent']} / {p['admin']}"
            room_info = f"{p['madori']} / {p['menseki']}"
            link = f"[詳細を表示]({p['url']})" if p['url'] else "-"
            self_pay_str = f"**{p['self_pay']:.2f}万円**"
            commute_info = f"**{p['door_to_door']}分** (徒歩{p['walk_min']}分+乗車{p['train_min']}分, 乗換{p['transfers']}回)"
            md_lines.append(f"| {p['station']} | {p['line']} | {p['title']} | {rent_info} | {self_pay_str} | {commute_info} | {room_info} | {p['station_walk']} ({p['age_floor']}) | {link} |")
    else:
        md_lines.append("条件に合致する物件が自動取得できませんでした。時間をおいて再試行してください。")
        
    md_content = "\n".join(md_lines)
    
    # ファイル書き出し
    with open(args.output, "w", encoding="utf-8") as f:
        f.write(md_content)
    print(f"\n結果を {args.output} に書き出しました。", file=sys.stderr)
    
    # properties.js の書き出し
    js_content = f"const bukkenData = {json.dumps(json_properties, ensure_ascii=False, indent=2)};"
    
    try:
        with open(existing_js_path, "w", encoding="utf-8") as f:
            f.write(js_content)
        print(f"properties.js を書き出しました ({existing_js_path})。", file=sys.stderr)
    except Exception as e:
        print(f"properties.js の書き出しに失敗: {e}", file=sys.stderr)

    root_js_path = os.path.join(dir_name, "properties.js")
    try:
        with open(root_js_path, "w", encoding="utf-8") as f:
            f.write(js_content)
        print(f"properties.js を書き出しました ({root_js_path})。", file=sys.stderr)
    except Exception as e:
        print(f"properties.js の書き出しに失敗: {e}", file=sys.stderr)

    # 物件数推移レポート（物件数推移.md）の自動更新
    trend_md_path = os.path.join(dir_name, "物件数推移.md")
    update_station_trend_report(json_properties, trend_md_path, len(new_properties))


def update_station_trend_report(json_properties, trend_md_path="物件数推移.md", new_properties_count=0):
    """物件数推移.md に当日の駅別物件数を自動追記・更新する"""
    import datetime
    today_str = datetime.date.today().strftime("%Y-%m-%d")

    if not os.path.exists(trend_md_path):
        return

    try:
        with open(trend_md_path, "r", encoding="utf-8") as f:
            content = f.read()

        # 集計: (line, station) -> count
        counts = {}
        for p in json_properties:
            l = p.get("line", "不明")
            s = p.get("station", "不明")
            counts[(l, s)] = counts.get((l, s), 0) + 1

        # 1. 更新履歴サマリー表の更新
        summary_row = f"| **{today_str}** | **{len(json_properties)}件** | **{len(counts)}駅** | {new_properties_count}件 | 定期スクレイピング更新 |"
        if f"**{today_str}**" in content:
            content = re.sub(rf"\|\s*\*\*{re.escape(today_str)}\*\*.*?\n", summary_row + "\n", content)
        else:
            match = re.search(r"(\|\s*更新日\s*\|\s*総物件数\s*\|.*?\n\|[\s:-]+\|\n)", content)
            if match:
                content = content[:match.end()] + summary_row + "\n" + content[match.end():]

        # 2. マトリクス表の更新
        match_table = re.search(r"(## 2\. 路線・駅別 物件数推移マトリクス\s*\n\s*)(\| 路線名 \| 駅名 \|[^\n]+\n\|[^\n]+\n)([\s\S]*?)(\n---|\n##|\Z)", content)
        if match_table:
            header_prefix = match_table.group(1)
            header_lines = match_table.group(2).splitlines()
            body_text = match_table.group(3)
            tail = match_table.group(4)

            headers = [h.strip() for h in header_lines[0].split("|")[1:-1]]
            date_cols = headers[2:]
            if today_str not in date_cols:
                date_cols.append(today_str)

            # 既存bodyのパース
            existing_matrix = {}
            for line in body_text.strip().splitlines():
                parts = [p.strip() for p in line.split("|")[1:-1]]
                if len(parts) >= 2:
                    l = re.sub(r"^\*\*(.*?)\*\*$", r"\1", parts[0])
                    s = parts[1]
                    existing_matrix[(l, s)] = {}
                    for i, d in enumerate(headers[2:]):
                        if i < len(parts[2:]):
                            existing_matrix[(l, s)][d] = parts[2 + i]

            # 今回の集計を反映
            all_keys = set(existing_matrix.keys()).union(counts.keys())
            for key in all_keys:
                if key not in existing_matrix:
                    existing_matrix[key] = {}
                c = counts.get(key, 0)
                existing_matrix[key][today_str] = str(c) if c > 0 else "-"

            for key in existing_matrix:
                for d in date_cols:
                    if d not in existing_matrix[key]:
                        existing_matrix[key][d] = "-"

            # ソート: 最新日付の件数(数値降順) -> 路線名 -> 駅名
            def sort_key(item):
                (l, s), date_dict = item
                val_str = date_dict.get(today_str, "-")
                val = int(val_str) if val_str.isdigit() else 0
                return (-val, l, s)

            sorted_matrix = sorted(existing_matrix.items(), key=sort_key)

            new_header_0 = "| 路線名 | 駅名 | " + " | ".join(date_cols) + " |"
            new_header_1 = "| :--- | :--- | " + " | ".join([":---:" for _ in date_cols]) + " |"

            new_body_lines = []
            for (l, s), date_dict in sorted_matrix:
                cols_str = " | ".join([date_dict.get(d, "-") for d in date_cols])
                new_body_lines.append(f"| **{l}** | {s} | {cols_str} |")

            new_table_content = f"{header_prefix}{new_header_0}\n{new_header_1}\n" + "\n".join(new_body_lines) + f"\n{tail}"
            content = content[:match_table.start()] + new_table_content + content[match_table.end():]

        with open(trend_md_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"物件数推移レポートを更新しました ({trend_md_path})。", file=sys.stderr)
    except Exception as e:
        print(f"物件数推移レポートの更新に失敗: {e}", file=sys.stderr)


if __name__ == "__main__":
    main()
