import os
import sys
import argparse
import urllib.parse
import requests
from bs4 import BeautifulSoup
import time
import random
import subprocess
import json

# 対象の6駅のSUUMOシステムパラメータ（路線コード・駅コード・エリアコード）
STATIONS = {
    "matsudo": {"name": "松戸", "rn": "0500", "ek": "050035990", "ra": "012"},
    "koshigaya": {"name": "越谷", "rn": "0440", "ek": "044014820", "ra": "011"},
    "myoden": {"name": "妙典", "rn": "0025", "ek": "002538520", "ra": "012"},
    "tsudanuma": {"name": "津田沼", "rn": "0580", "ek": "058024780", "ra": "012"},
    "motoyawata": {"name": "本八幡", "rn": "0065", "ek": "006539350", "ra": "012"},
    "moriya": {"name": "守谷", "rn": "0760", "ek": "076039550", "ra": "008"}
}

# 各駅から大手町までの標準乗車時間（分）
TRAIN_TIMES = {
    "松戸": 30,
    "越谷": 40,
    "妙典": 25,
    "津田沼": 40,
    "本八幡": 35,
    "守谷": 45
}

import re

def extract_walk_minutes(station_walk_str, target_station_name):
    # 駅名に続く「歩X分」を抽出
    pattern = rf"{target_station_name}(?:駅)?\s*歩(\d+)分"
    match = re.search(pattern, station_walk_str)
    if match:
        return int(match.group(1))
    
    # マッチしない場合は、最初の「歩X分」をフォールバックとして使用
    fallback_match = re.search(r"歩(\d+)分", station_walk_str)
    if fallback_match:
        return int(fallback_match.group(1))
        
    return 15  # デフォルト値


def calculate_self_pay(rent_str, admin_str, parking_fee=0.0):
    # 家賃総額の算出
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
    # デフォルト値
    parking_fee = 0.0  # 万円
    parking_dist = 0   # メートル
    parking_text = "-"
    
    if not detail_html or detail_html == "BLOCKED":
        return parking_fee, parking_dist, parking_text
        
    soup = BeautifulSoup(detail_html, "html.parser")
    # thのテキストが「駐車場」のものを探す
    th_el = soup.find(lambda tag: tag.name == "th" and tag.text and "駐車場" in tag.text.strip())
    if th_el:
        td_el = th_el.find_next_sibling("td")
        if td_el:
            parking_text = td_el.text.strip()
            # parking_text の例: "近隣600m16500円", "付無料", "無", "敷地内10000円"
            # 1. 距離の解析
            if "敷地内" in parking_text or "付" in parking_text:
                parking_dist = 0
            else:
                dist_match = re.search(r"(?:近隣|徒歩|約)?(\d+)\s*m", parking_text)
                if dist_match:
                    parking_dist = int(dist_match.group(1))
            
            # 2. 料金の解析
            if "無料" in parking_text:
                parking_fee = 0.0
            else:
                fee_match = re.search(r"(\d+)\s*円", parking_text)
                if fee_match:
                    parking_fee = float(fee_match.group(1)) / 10000.0  # 円を万円に変換
                else:
                    parking_fee = 0.0
                    
    return parking_fee, parking_dist, parking_text



def build_suumo_url(station_key, max_rent=18.0, min_area=80, max_walk=15):
    station = STATIONS.get(station_key)
    if not station:
        return None
    
    base_url = "https://suumo.jp/jj/chintai/ichiran/FR301FC001/"
    params = {
        "ar": "030",            # 関東
        "bs": "040",            # 賃貸
        "pc": "30",             # 表示件数
        "smk": "",
        "po1": "25",            # 表示順（標準）
        "po2": "99",
        "shkr1": "03",
        "shkr2": "03",
        "shkr3": "03",
        "shkr4": "03",
        "rn": station["rn"],    # 路線コード
        "ek": station["ek"],    # 駅コード
        "ra": station["ra"],    # エリアコード（都道府県）
        "cb": "0.0",            # 賃料下限
        "ct": str(max_rent),    # 賃料上限
        "co": "1",              # 管理費込み
        "ts": "3",              # 建物種別: 一戸建て
        "et": str(max_walk),    # 駅徒歩
        "mb": str(min_area),    # 専有面積下限
        "mt": "9999999",
        "cn": "9999999",
        "tc": "0400901",        # こだわり条件: 駐車場あり
        "fw2": ""
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

def parse_suumo_html(html_content, station_name):
    if html_content == "BLOCKED":
        return "BLOCKED"
    
    soup = BeautifulSoup(html_content, "html.parser")
    items = soup.find_all("div", class_="cassetteitem")
    properties = []
    
    for item in items:
        title_el = item.find("div", class_="cassetteitem_content-title")
        title = title_el.text.strip() if title_el else "不明"
        
        type_el = item.find("span", class_="cassetteitem_content-label")
        prop_type = type_el.text.strip() if type_el else "不明"
        
        # 駅徒歩情報の抽出
        stations_el = item.find_all("div", class_="cassetteitem_detail-text")
        station_info = []
        for s in stations_el:
            station_info.append(s.text.strip())
        station_str = " / ".join(station_info)
        
        # 築年数・階数
        col3_el = item.find("li", class_="cassetteitem_detail-col3")
        age_floor = ""
        if col3_el:
            divs = col3_el.find_all("div")
            age_floor = " ".join([d.text.strip() for d in divs])
            
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
                    "station_group": station_name,
                    "title": title,
                    "type": prop_type,
                    "station_walk": station_str,
                    "age_floor": age_floor,
                    "rent": rent,
                    "admin": admin,
                    "deposit": deposit,
                    "gratuity": gratuity,
                    "madori": madori,
                    "menseki": menseki,
                    "url": detail_url
                })
                
    return properties

def load_existing_properties(js_path):
    if not os.path.exists(js_path):
        return []
    try:
        with open(js_path, "r", encoding="utf-8") as f:
            content = f.read().strip()
        match = re.search(r"const\s+bukkenData\s*=\s*(.*);", content, re.DOTALL)
        if match:
            return json.loads(match.group(1).strip())
        if "=" in content:
            json_str = content.split("=", 1)[1].strip()
            if json_str.endswith(";"):
                json_str = json_str[:-1].strip()
            return json.loads(json_str)
    except Exception as e:
        print(f"既存データのロードに失敗: {e}", file=sys.stderr)
    return []

def compare_properties(old_props, new_props):
    def make_key(p):
        return (p.get("station", ""), p.get("title", ""), p.get("madori", ""))

    def parse_rent(rent_str):
        if not rent_str:
            return 0.0
        m = re.search(r"([\d.]+)", str(rent_str))
        return float(m.group(1)) if m else 0.0

    old_map = {make_key(p): p for p in old_props if make_key(p)[0]}
    new_map = {make_key(p): p for p in new_props if make_key(p)[0]}

    added = []
    removed = []
    changed = []

    for key, new_p in new_map.items():
        if key not in old_map:
            added.append(new_p)
        else:
            old_p = old_map[key]
            old_rent = parse_rent(old_p.get("rent"))
            new_rent = parse_rent(new_p.get("rent"))
            if old_rent != new_rent:
                changed.append({
                    "station": new_p["station"],
                    "title": new_p["title"],
                    "madori": new_p["madori"],
                    "old_rent": old_p.get("rent"),
                    "new_rent": new_p.get("rent"),
                    "old_self_pay": old_p.get("self_pay"),
                    "new_self_pay": new_p.get("self_pay"),
                    "url": new_p.get("url")
                })

    for key, old_p in old_map.items():
        if key not in new_map:
            removed.append(old_p)

    return added, removed, changed

def push_to_github(compare_repo_path, js_content):
    if not os.path.exists(compare_repo_path):
        print(f"エラー: 指定されたリポジトリパス {compare_repo_path} が存在しません。", file=sys.stderr)
        return False

    dest_path = os.path.join(compare_repo_path, "properties.js")
    try:
        with open(dest_path, "w", encoding="utf-8") as f:
            f.write(js_content)
        print(f"[{compare_repo_path}] に properties.js を上書きコピーしました。", file=sys.stderr)
    except Exception as e:
        print(f"ファイルのコピーに失敗しました: {e}", file=sys.stderr)
        return False

    try:
        subprocess.run(["git", "add", "properties.js"], cwd=compare_repo_path, check=True)
        status_res = subprocess.run(["git", "status", "--porcelain"], cwd=compare_repo_path, capture_output=True, text=True, check=True)
        if not status_res.stdout.strip():
            print("変更がないため、GitHubへのプッシュをスキップします。", file=sys.stderr)
            return True
        
        subprocess.run(["git", "commit", "-m", "update: 物件データを最新情報に更新"], cwd=compare_repo_path, check=True)
        subprocess.run(["git", "push", "origin", "main"], cwd=compare_repo_path, check=True)
        print("GitHubへの自動プッシュが完了しました。", file=sys.stderr)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Gitコマンドの実行に失敗しました: {e}", file=sys.stderr)
        return False

def main():
    parser = argparse.ArgumentParser(description="SUUMO賃貸一戸建て物件検索スクリプト")
    parser.add_argument("--stations", type=str, help="カンマ区切りの駅キー（matsudo,koshigaya,myoden,tsudanuma,motoyawata,moriya,yashio）。未指定なら全駅")
    parser.add_argument("--max-rent", type=float, default=18.0, help="家賃上限（万円）、管理費込み。デフォルト18.0")
    parser.add_argument("--min-area", type=int, default=80, help="最小専有面積（m2）。デフォルト80")
    parser.add_argument("--max-walk", type=int, default=15, help="駅徒歩上限（分）。デフォルト15")
    parser.add_argument("--output", type=str, help="出力先のMarkdownファイルパス。未指定なら標準出力")
    parser.add_argument("--push", action="store_true", help="GitHubへの自動コピーとプッシュを実行")
    parser.add_argument("--compare-repo-path", type=str, default="scratch/bukken-compare", help="比較Webアプリ用リポジトリのパス")
    
    args = parser.parse_args()
    
    target_keys = list(STATIONS.keys())
    if args.stations:
        target_keys = [k.strip() for k in args.stations.split(",") if k.strip() in STATIONS]
        
    all_properties = []
    search_urls = {}
    blocked_any = False
    failed_stations = []
    
    print("物件情報を検索中...", file=sys.stderr)
    for key in target_keys:
        station_name = STATIONS[key]["name"]
        url = build_suumo_url(key, max_rent=args.max_rent, min_area=args.min_area, max_walk=args.max_walk)
        search_urls[station_name] = url
        
        print(f"[{station_name}] 検索中... ", end="", flush=True, file=sys.stderr)
        html = fetch_properties(url)
        
        station_success = False
        if html == "BLOCKED":
            print("ブロックされました（直URLをご利用ください）", file=sys.stderr)
            blocked_any = True
        elif html is None:
            print("エラー", file=sys.stderr)
        else:
            props = parse_suumo_html(html, station_name)
            if props == "BLOCKED":
                print("ブロックされました", file=sys.stderr)
                blocked_any = True
            else:
                print(f"{len(props)} 件取得", file=sys.stderr)
                all_properties.extend(props)
                station_success = True
                
        if not station_success:
            failed_stations.append(station_name)
        
        # サーバー負荷防止用のランダムウェイト
        time.sleep(random.uniform(2.0, 4.0))
        
    # 重複排除 (家賃、駅徒歩、間取りが一致するものを排除)
    unique_properties = []
    seen = set()
    for p in all_properties:
        station_name = p['station_group']
        walk_min = extract_walk_minutes(p['station_walk'], station_name)
        key = (p["rent"], station_name, walk_min, p["madori"])
        if key not in seen:
            seen.add(key)
            unique_properties.append(p)
    all_properties = unique_properties

    # 既存データのロードと新旧比較
    existing_js_path = ""
    if args.output:
        dir_name = os.path.dirname(args.output)
        existing_js_path = os.path.join(dir_name, "物件比較アプリ", "properties.js")
    
    old_properties = []
    if existing_js_path:
        old_properties = load_existing_properties(existing_js_path)

    # 駐車場情報の取得とキャッシュ（既存データ）再利用
    print("駐車場情報を解析中...", file=sys.stderr)
    for p in all_properties:
        # 既存データに駐車場情報があるかチェック
        old_p = next((x for x in old_properties if x.get("url") == p["url"]), None)
        if old_p and "parking_fee" in old_p:
            p["parking_fee"] = old_p["parking_fee"]
            p["parking_dist"] = old_p.get("parking_dist", 0)
            p["parking_text"] = old_p.get("parking_text", "-")
        else:
            # 詳細ページを取得して解析
            print(f"  詳細から駐車場情報を取得中: {p['title']} ({p['url']})... ", end="", flush=True, file=sys.stderr)
            time.sleep(random.uniform(2.5, 4.0)) # ウェイト
            detail_html = fetch_properties(p["url"])
            p_fee, p_dist, p_text = parse_parking_info(detail_html)
            p["parking_fee"] = p_fee
            p["parking_dist"] = p_dist
            p["parking_text"] = p_text
            print(f"完了 ({p_text})", file=sys.stderr)

    # Webアプリ形式 of データに変換
    json_properties = []
    for p in all_properties:
        st_name = p['station_group']
        w_min = extract_walk_minutes(p['station_walk'], st_name)
        t_min = TRAIN_TIMES.get(st_name, 30)
        d_to_d = w_min + t_min
        
        p_fee = p.get("parking_fee", 0.0)
        p_dist = p.get("parking_dist", 0)
        p_text = p.get("parking_text", "-")
        
        s_pay = calculate_self_pay(p['rent'], p['admin'], p_fee)
        json_properties.append({
            "station": st_name,
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
            "age_floor": p['age_floor'],
            "url": p['url'],
            "walk_min": w_min,
            "train_min": t_min,
            "door_to_door": d_to_d
        })

    # 取得に失敗した駅については、既存データから物件を引き継ぐ
    if failed_stations and old_properties:
        print(f"\n以下の駅のデータ取得に失敗したため、既存データを引き継ぎます: {', '.join(failed_stations)}", file=sys.stderr)
        for p in old_properties:
            if p.get("station") in failed_stations:
                # 重複して追加されないようにチェック（念のため）
                if not any(x.get("url") == p.get("url") for x in json_properties):
                    json_properties.append(p)

    added, removed, changed = compare_properties(old_properties, json_properties)
        
    # 結果のMarkdown生成
    md_lines = []
    md_lines.append("# 物件検索結果一覧\n")
    md_lines.append(f"検索条件：管理費・駐車場込み {args.max_rent}万円以下 / 面積 {args.min_area}m²以上 / 一戸建て / 駅徒歩 {args.max_walk}分以内\n")
    
    if old_properties:
        md_lines.append("## 前回からの変更点（差分）\n")
        if added:
            md_lines.append("### 新規掲載された物件")
            for p in added:
                link = f"[詳細を表示]({p['url']})" if p['url'] else "-"
                md_lines.append(f"- **[{p['station']}] {p['title']}** ({p['rent']} / {p['madori']} / {p['menseki']} / 徒歩: {p['station_walk']}) - {link}")
            md_lines.append("")
        if removed:
            md_lines.append("### 掲載終了した物件")
            for p in removed:
                md_lines.append(f"- **[{p['station']}] {p['title']}** ({p['rent']} / {p['madori']} / {p['menseki']})")
            md_lines.append("")
        if changed:
            md_lines.append("### 条件・家賃が変更された物件")
            for p in changed:
                link = f"[詳細を表示]({p['url']})" if p['url'] else "-"
                md_lines.append(f"- **[{p['station']}] {p['title']}** (家賃: {p['old_rent']} → {p['new_rent']} / 自己負担: {p['old_self_pay']:.2f}万円 → {p['new_self_pay']:.2f}万円) - {link}")
            md_lines.append("")
        if not added and not removed and not changed:
            md_lines.append("前回からの変更点はありません。\n")
        md_lines.append("---")
        md_lines.append("")

    if blocked_any:
        md_lines.append("> [!WARNING]")
        md_lines.append("> SUUMO側でアクセス制限（ブロック）が発生したため、一部またはすべての自動取得に失敗しました。以下の検索リンクから直接ブラウザでご確認ください。\n")
        
    md_lines.append("## 各エリアのSUUMO直リンク")
    for name, url in search_urls.items():
        md_lines.append(f"- [{name}駅エリアの検索結果URL]({url})")
    md_lines.append("")
    
    md_lines.append("## 抽出された物件一覧")
    if all_properties:
        md_lines.append("| エリア | 物件名 | 家賃/管理費 | 自己負担額 | ドアドア通勤時間 | 間取り/面積 | 徒歩・立地 | リンク |")
        md_lines.append("| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |")
        for p in json_properties:
            rent_info = f"{p['rent']} / {p['admin']}"
            room_info = f"{p['madori']} / {p['menseki']}"
            link = f"[詳細を表示]({p['url']})" if p['url'] else "-"
            self_pay_str = f"**{p['self_pay']:.2f}万円**"
            commute_info = f"**{p['door_to_door']}分** (徒歩{p['walk_min']}分+乗車{p['train_min']}分)"
            md_lines.append(f"| {p['station']} | {p['title']} | {rent_info} | {self_pay_str} | {commute_info} | {room_info} | {p['station_walk']} ({p['age_floor']}) | {link} |")
    else:
        md_lines.append("条件に合致する物件が自動取得できませんでした。上記の検索リンクから直接ブラウザでご確認いただくか、時間をおいて再試行してください。")
        
    md_content = "\n".join(md_lines)
    
    # 差分のコンソール出力
    if old_properties:
        print("\n=== 前回からの変更点 ===", file=sys.stderr)
        if added:
            print(f"新規掲載: {len(added)} 件", file=sys.stderr)
            for p in added:
                print(f"  + [{p['station']}] {p['title']} ({p['rent']})", file=sys.stderr)
        if removed:
            print(f"掲載終了: {len(removed)} 件", file=sys.stderr)
            for p in removed:
                print(f"  - [{p['station']}] {p['title']} ({p['rent']})", file=sys.stderr)
        if changed:
            print(f"条件変更: {len(changed)} 件", file=sys.stderr)
            for p in changed:
                print(f"  * [{p['station']}] {p['title']} ({p['old_rent']} -> {p['new_rent']})", file=sys.stderr)
        if not added and not removed and not changed:
            print("変更なし", file=sys.stderr)
        print("=======================\n", file=sys.stderr)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(md_content)
        print(f"\n結果を {args.output} に書き出しました。", file=sys.stderr)
        
        # properties.js を書き出す
        js_content = f"const bukkenData = {json.dumps(json_properties, ensure_ascii=False, indent=2)};"
        
        try:
            with open(existing_js_path, "w", encoding="utf-8") as f:
                f.write(js_content)
            print(f"properties.js を書き出しました ({existing_js_path})。", file=sys.stderr)
        except Exception as e:
            print(f"properties.js の書き出しに失敗: {e}", file=sys.stderr)

        # properties.js (ルート直下) にも書き出す
        root_js_path = os.path.join(dir_name, "properties.js")
        try:
            with open(root_js_path, "w", encoding="utf-8") as f:
                f.write(js_content)
            print(f"properties.js を書き出しました ({root_js_path})。", file=sys.stderr)
        except Exception as e:
            print(f"properties.js の書き出しに失敗: {e}", file=sys.stderr)

        # GitHubへのプッシュ
        if args.push:
            repo_path = args.compare_repo_path or "scratch/bukken-compare"
            push_to_github(repo_path, js_content)
    else:
        print(md_content)

if __name__ == "__main__":
    main()
