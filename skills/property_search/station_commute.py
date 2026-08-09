"""
駅 → 大手町駅 の実測通勤時間・乗換回数を Google Maps Directions API で取得し、
station_commute_cache.json （リポジトリ直下）にキャッシュとして保存するスクリプト。

【目的】
property_search.py が算出する「ドアドア通勤時間」は、従来SUUMOの通勤検索バッジ値
（複数の候補駅のうち"どの駅発の経路か"が特定できない）に依存しており、駅までの徒歩時間
の起点駅とズレるケースがあった（例: 支線の駅の徒歩時間 + 本線駅発の乗車時間、を誤って合算）。
本スクリプトは駅ごとにGoogle Mapsで実際の経路を1回だけ取得してキャッシュに保存することで、
property_search.py 側が「候補駅ごとの正しい徒歩時間+実測乗車時間」を突き合わせられるようにする。

【重要】このスクリプトは property_search.py の実行毎には呼び出さない。
     駅の追加時など、必要なタイミングで手動実行し、一度キャッシュに保存した駅は
     (--force を付けない限り) 再取得しない。

使い方:
    export GOOGLE_MAPS_API_KEY="xxxxx"
    python skills/property_search/station_commute.py

    # 特定の駅だけ更新したい場合
    python skills/property_search/station_commute.py --station 大師前 --station 西新井

    # 既存キャッシュも含め全駅を再取得したい場合
    python skills/property_search/station_commute.py --force
"""

import os
import sys
import re
import json
import time
import argparse
import datetime
import requests

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# 本スクリプトはリポジトリルートで実行する前提 (property_search.py と同じ規約)
CACHE_FILE_PATH = "station_commute_cache.json"
GEOCODING_CACHE_PATH = "geocoding_cache.json"
PROPERTIES_JS_PATHS = ["properties.js", os.path.join("物件比較アプリ", "properties.js")]

DESTINATION_NAME = "大手町"
API_URL = "https://maps.googleapis.com/maps/api/directions/json"

# property_search.py の STATIC_STATION_COORDS を再利用 (同一ディレクトリなので直接importできる)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from property_search import STATIC_STATION_COORDS

DESTINATION_COORDS = STATIC_STATION_COORDS[DESTINATION_NAME]


def load_json(path, default):
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"{path} のロードに失敗: {e}", file=sys.stderr)
    return default


def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def next_weekday_9am_epoch():
    """直近の「平日(月〜金) 朝9:00に大手町駅へ到着する」通勤時間帯を想定した
    UNIXタイムスタンプ(未来日時)を返す。曜日・時間帯による所要時間のブレを抑え、
    駅ごとの比較可能性を保つため、全駅で同じ到着時刻条件を使う。"""
    now = datetime.datetime.now()
    candidate = now.replace(hour=9, minute=0, second=0, microsecond=0)
    days_ahead = 0
    while True:
        d = candidate + datetime.timedelta(days=days_ahead)
        if d > now and d.weekday() < 5:  # 0=月 ... 4=金
            return int(d.timestamp())
        days_ahead += 1


def extract_station_names_from_properties():
    """properties.js の station_walk から、記載されている全ての駅名を抽出する。"""
    names = set()
    for path in PROPERTIES_JS_PATHS:
        if not os.path.exists(path):
            continue
        try:
            content = open(path, "r", encoding="utf-8").read()
        except Exception as e:
            print(f"{path} の読み込みに失敗: {e}", file=sys.stderr)
            continue
        m = re.search(r"const\s+bukkenData\s*=\s*(.*);\s*$", content.strip(), re.DOTALL)
        if not m:
            continue
        try:
            data = json.loads(m.group(1))
        except Exception as e:
            print(f"{path} のJSON解析に失敗: {e}", file=sys.stderr)
            continue
        for p in data:
            for lm in re.finditer(r"([^/]+駅)\s*歩\d+分", p.get("station_walk", "")):
                names.add(lm.group(1).replace("駅", "").strip())
    return names


def fetch_transit_route(origin_coords, api_key, arrival_epoch):
    params = {
        "origin": f"{origin_coords['lat']},{origin_coords['lng']}",
        "destination": f"{DESTINATION_COORDS['lat']},{DESTINATION_COORDS['lng']}",
        "mode": "transit",
        "arrival_time": arrival_epoch,
        "language": "ja",
        "region": "jp",
        "key": api_key,
    }
    res = requests.get(API_URL, params=params, timeout=15)
    res.raise_for_status()
    data = res.json()
    status = data.get("status")
    if status != "OK":
        return None, status
    if not data.get("routes"):
        return None, "NO_ROUTES"

    leg = data["routes"][0]["legs"][0]
    duration_min = round(leg["duration"]["value"] / 60)
    transit_steps = [s for s in leg["steps"] if s.get("travel_mode") == "TRANSIT"]
    transfers = max(0, len(transit_steps) - 1)
    return {
        "duration_min": duration_min,
        "transfers": transfers,
        "duration_text": leg["duration"]["text"],
        "num_transit_legs": len(transit_steps),
    }, status


def main():
    parser = argparse.ArgumentParser(
        description="駅→大手町駅の実測通勤時間・乗換回数をGoogle Maps Directions APIで取得し、station_commute_cache.jsonに保存する"
    )
    parser.add_argument(
        "--api-key", type=str, default=os.environ.get("GOOGLE_MAPS_API_KEY"),
        help="Google Maps APIキー（省略時は環境変数 GOOGLE_MAPS_API_KEY を使用）"
    )
    parser.add_argument("--force", action="store_true", help="既にキャッシュ済みの駅も再取得する")
    parser.add_argument(
        "--station", type=str, action="append",
        help="特定の駅名のみ更新する（複数指定可、例: --station 大師前 --station 西新井）"
    )
    args = parser.parse_args()

    if not args.api_key:
        print(
            "エラー: Google Maps APIキーが指定されていません。"
            "--api-key オプション、または環境変数 GOOGLE_MAPS_API_KEY を設定してください。",
            file=sys.stderr,
        )
        sys.exit(1)

    geocoding_cache = load_json(GEOCODING_CACHE_PATH, {})
    commute_cache = load_json(CACHE_FILE_PATH, {})

    if args.station:
        target_names = set(args.station)
    else:
        target_names = extract_station_names_from_properties()
        # properties.js に載っていない駅でも、座標が既知なら対象に含める
        target_names |= set(STATIC_STATION_COORDS.keys())
        target_names |= set(geocoding_cache.keys())

    target_names.discard(DESTINATION_NAME)
    target_names = sorted(target_names)

    print(f"対象駅数: {len(target_names)} 件", file=sys.stderr)

    updated = 0
    skipped = 0
    failed = 0

    for name in target_names:
        if not args.force and name in commute_cache:
            skipped += 1
            continue

        coords = STATIC_STATION_COORDS.get(name) or geocoding_cache.get(name)
        if not coords:
            print(f"  [スキップ] 座標不明のため取得できません: {name}駅", file=sys.stderr)
            failed += 1
            continue

        print(f"  [取得中] {name}駅 → 大手町駅 ... ", end="", flush=True, file=sys.stderr)
        arrival_epoch = next_weekday_9am_epoch()
        try:
            time.sleep(0.2)  # APIレート制御（簡易）
            result, status = fetch_transit_route(coords, args.api_key, arrival_epoch)
        except Exception as e:
            print(f"エラー ({e})", file=sys.stderr)
            failed += 1
            continue

        if result is None:
            print(f"経路が見つかりませんでした (status={status})", file=sys.stderr)
            failed += 1
            continue

        commute_cache[name] = {
            "duration_min": result["duration_min"],
            "transfers": result["transfers"],
            "duration_text": result["duration_text"],
            "fetched_at": datetime.datetime.now().isoformat(timespec="seconds"),
        }
        save_json(CACHE_FILE_PATH, commute_cache)  # 逐次保存（途中失敗してもロストしない）
        print(f"完了 ({result['duration_min']}分・乗換{result['transfers']}回)", file=sys.stderr)
        updated += 1

    print(
        f"\n完了: 新規/再取得 {updated}件 / スキップ(既存キャッシュ利用) {skipped}件 / 失敗 {failed}件",
        file=sys.stderr,
    )
    print(f"キャッシュファイル: {CACHE_FILE_PATH}", file=sys.stderr)


if __name__ == "__main__":
    main()
