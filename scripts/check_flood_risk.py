"""
浸水リスク自動判定スクリプト

properties.js の各物件の住所（丁目単位）と最寄駅について、国土地理院「重ねるハザードマップ」の
タイル画像（洪水・家屋倒壊等氾濫想定区域・高潮・津波・内水・土砂災害警戒区域）を読み取って
浸水リスクを判定し、Webアプリ用の flood_risk.js を生成する。

- 住所 → 座標: 国土地理院 住所検索API（失敗時は Nominatim）。丁目の代表点を使う。
- 代表点に加えて周囲（丁目: 150m以内 / 町・大字: 300m以内）を約100m間隔の同心円×8方向で調べ、
  建物位置のずれや、堤防沿いの細い区域（家屋倒壊等氾濫想定区域）の見落としを防ぐ。
- 判定結果は data/flood_risk_cache.json にキャッシュし、新しい住所だけを問い合わせる。
- 地図に載らない情報（2026年の被害実績など）と、自動判定できない場合の手動評価は
  data/flood_risk_notes.json に手で記入する。表示レベルは「自動判定」と「被害実績」の高い方。

使い方（リポジトリルートで実行）:
    py scripts/check_flood_risk.py                 # 未判定の住所・駅だけ判定して flood_risk.js を生成
    py scripts/check_flood_risk.py --force         # キャッシュを無視して全件再判定
    py scripts/check_flood_risk.py --offline       # 通信せず、キャッシュと手動評価から flood_risk.js だけ再生成
    py scripts/check_flood_risk.py --check-layers  # ハザードマップ各レイヤーの取得可否だけ確認
"""
import argparse
import datetime
import json
import math
import os
import re
import statistics
import struct
import sys
import time
import urllib.parse
import zlib

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PROPERTIES_JS_PATH = os.path.join(REPO_ROOT, "properties.js")
GEOCODING_CACHE_PATH = os.path.join(REPO_ROOT, "data", "geocoding_cache.json")  # 駅座標（property_search.py が生成）
CACHE_PATH = os.path.join(REPO_ROOT, "data", "flood_risk_cache.json")          # 判定結果キャッシュ
NOTES_PATH = os.path.join(REPO_ROOT, "data", "flood_risk_notes.json")          # 手動評価・被害実績（手で編集）
OUTPUT_JS_PATH = os.path.join(REPO_ROOT, "flood_risk.js")                      # Webアプリが読み込むデータ

TILE_BASE_URL = "https://disaportal.gsi.go.jp/data/raster"
GSI_ADDRESS_SEARCH_URL = "https://msearch.gsi.go.jp/address-search/AddressSearch"
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
HAZARD_MAP_VIEW_URL = "https://disaportal.gsi.go.jp/maps/"
USER_AGENT = "MovingFloodRiskChecker/1.0 (+https://github.com/day0817/Moving)"

SAMPLE_ZOOM = 16             # 1px ≒ 2m
RING_RADIUS_CHOME_M = 150    # 丁目まで分かる住所の周辺探索半径
RING_RADIUS_TOWN_M = 300     # 町・大字までしか分からない住所の周辺探索半径
ALPHA_MIN = 128              # これ以上不透明な画素を「区域内」とみなす
COLOR_TOLERANCE = 30         # 凡例色との許容距離（RGBユークリッド距離）
RECHECK_DAYS = 180           # 判定結果を再利用する期間
REQUEST_DELAY_SEC = 0.1
NOMINATIM_DELAY_SEC = 1.1    # Nominatim の利用規約（1秒1リクエスト）

KANTO_BOUNDS = {"min_lat": 34.5, "max_lat": 37.2, "min_lng": 138.3, "max_lng": 141.2}

# 浸水深の区分（ランク）。凡例の区切りは層によって異なるため、ランク単位にまとめて扱う。
DEPTH_RANK_LABELS = {
    1: "0.5m未満（床下程度）",
    2: "0.5〜3m（1階床上）",
    3: "3〜5m（2階床上）",
    4: "5〜10m（2階軒下以上）",
    5: "10〜20m",
    6: "20m以上",
}
# 重ねるハザードマップの浸水深の凡例色 → ランク
#  洪水・高潮: 0.5m未満 / 0.5〜3m / 3〜5m / 5〜10m / 10〜20m / 20m以上
#  津波など細かい区分の層: 0.3m未満・0.3〜0.5m（ランク1）、0.5〜1m・1〜3m（ランク2）が追加される
DEPTH_PALETTE = [
    ((255, 255, 179), 1),  # 0.3m未満
    ((247, 245, 169), 1),  # 0.5m未満（0.3〜0.5m）
    ((248, 225, 166), 2),  # 0.5〜1m
    ((255, 216, 192), 2),  # 0.5〜3m（1〜3m）
    ((255, 183, 183), 3),  # 3〜5m
    ((255, 145, 145), 4),  # 5〜10m
    ((242, 133, 201), 5),  # 10〜20m
    ((220, 122, 220), 6),  # 20m以上
]

# 判定に使うレイヤー。URLやズームが変わって取得できなくなった場合は --check-layers で確認し、ここを直す。
#  kind: depth=凡例色から浸水深を読む / area=区域の内外だけを見る
#  check_points: レイヤーが取得できるかを確かめるための「確実に区域内のデータがある地点」
LAYERS = [
    {"key": "flood", "label": "洪水（想定最大規模）", "kind": "depth",
     "paths": ["01_flood_l2_shinsuishin_data"],
     "check_points": [(35.7423, 139.8835)]},                       # 江戸川区北小岩（荒川・江戸川の低地）
    {"key": "hanran", "label": "家屋倒壊等氾濫想定区域（氾濫流）", "kind": "area",
     "paths": ["01_flood_l2_kaokutoukai_hanran_data"],
     "check_points": [(35.7800, 139.8930), (35.7550, 139.8150)]},  # 江戸川（松戸）、荒川（足立区）沿い
    {"key": "kagan", "label": "家屋倒壊等氾濫想定区域（河岸侵食）", "kind": "area",
     "paths": ["01_flood_l2_kaokutoukai_kagan_data"],
     "check_points": [(35.6280, 139.5650), (35.7800, 139.8930)]},  # 多摩川（登戸）、江戸川（松戸）沿い
    {"key": "hightide", "label": "高潮（想定最大規模）", "kind": "depth",
     "paths": ["03_hightide_l2_shinsuishin_data"],
     "check_points": [(35.6700, 139.8300)]},                       # 江東区南砂
    {"key": "tsunami", "label": "津波", "kind": "depth",
     "paths": ["04_tsunami_newlegend_data"],
     "check_points": [(35.3150, 139.4750)]},                       # 藤沢市鵠沼海岸
    {"key": "naisui", "label": "内水（下水があふれる浸水）", "kind": "depth",
     "paths": ["02_naisui_data"],
     "check_points": [(35.5750, 139.6600), (35.7800, 139.9000), (35.7000, 139.8700)]},
    {"key": "dosya", "label": "土砂災害警戒区域", "kind": "area",
     "paths": ["05_dosekiryukeikaikuiki", "05_kyukeishakeikaikuiki", "05_jisuberikeikaikuiki"],
     "check_points": [(35.6050, 139.5050), (35.4600, 139.6000)]},  # 川崎市麻生区、横浜市保土ケ谷区
]
LAYER_BY_KEY = {layer["key"]: layer for layer in LAYERS}

LEVEL_ORDER = {"low": 0, "medium": 1, "unknown": 2, "high": 3, "extreme": 4}
LEVEL_LABELS = {"low": "低", "medium": "中", "unknown": "要確認", "high": "高", "extreme": "極高"}
UNKNOWN_RANK = -1  # 区域内だが凡例色を読み取れなかった


def max_level(*levels):
    levels = [lv for lv in levels if lv]
    if not levels:
        return None
    return max(levels, key=lambda lv: LEVEL_ORDER[lv])


def level_down(level):
    """周辺点の結果は建物位置の不確かさを考慮して1段階下げて扱う"""
    return {"extreme": "high", "high": "medium"}.get(level, "low")


def log(msg):
    print(msg, file=sys.stderr, flush=True)


# ------------------------------------------------------------------------------
# PNGデコーダ（標準ライブラリのみ。重ねるハザードマップのタイルで使われる8bit以下の非インターレースPNGに対応）
# ------------------------------------------------------------------------------
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
PNG_CHANNELS = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}


class PngImage:
    def __init__(self, data):
        if data[:8] != PNG_SIGNATURE:
            raise ValueError("PNGではありません")
        pos = 8
        idat = []
        self.palette = None
        self.trns = None
        header = None
        while pos + 8 <= len(data):
            length = struct.unpack(">I", data[pos:pos + 4])[0]
            chunk_type = data[pos + 4:pos + 8]
            body = data[pos + 8:pos + 8 + length]
            pos += 12 + length
            if chunk_type == b"IHDR":
                header = struct.unpack(">IIBBBBB", body)
            elif chunk_type == b"PLTE":
                self.palette = [tuple(body[i:i + 3]) for i in range(0, len(body) - 2, 3)]
            elif chunk_type == b"tRNS":
                self.trns = body
            elif chunk_type == b"IDAT":
                idat.append(body)
            elif chunk_type == b"IEND":
                break
        if header is None:
            raise ValueError("IHDRがありません")
        self.width, self.height, self.bit_depth, self.color_type, _, _, interlace = header
        if interlace:
            raise ValueError("インターレースPNGは未対応です")
        if self.color_type not in PNG_CHANNELS:
            raise ValueError(f"未対応のカラータイプです: {self.color_type}")
        if self.color_type == 3:
            if self.bit_depth not in (1, 2, 4, 8) or not self.palette:
                raise ValueError("パレットPNGの形式が不正です")
        elif self.bit_depth != 8:
            raise ValueError(f"未対応のビット深度です: {self.bit_depth}")

        bits_per_pixel = PNG_CHANNELS[self.color_type] * self.bit_depth
        stride = (self.width * bits_per_pixel + 7) // 8
        bpp = max(1, bits_per_pixel // 8)
        raw = zlib.decompress(b"".join(idat))
        if len(raw) < (stride + 1) * self.height:
            raise ValueError("画像データが不足しています")

        self.rows = []
        prev = bytearray(stride)
        offset = 0
        for _ in range(self.height):
            filter_type = raw[offset]
            line = bytearray(raw[offset + 1:offset + 1 + stride])
            offset += stride + 1
            self._unfilter(filter_type, line, prev, bpp)
            self.rows.append(line)
            prev = line

    @staticmethod
    def _unfilter(filter_type, line, prev, bpp):
        n = len(line)
        if filter_type == 0:
            return
        if filter_type == 1:
            for i in range(bpp, n):
                line[i] = (line[i] + line[i - bpp]) & 0xFF
        elif filter_type == 2:
            for i in range(n):
                line[i] = (line[i] + prev[i]) & 0xFF
        elif filter_type == 3:
            for i in range(n):
                left = line[i - bpp] if i >= bpp else 0
                line[i] = (line[i] + ((left + prev[i]) >> 1)) & 0xFF
        elif filter_type == 4:
            for i in range(n):
                a = line[i - bpp] if i >= bpp else 0
                b = prev[i]
                c = prev[i - bpp] if i >= bpp else 0
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                if pa <= pb and pa <= pc:
                    pred = a
                elif pb <= pc:
                    pred = b
                else:
                    pred = c
                line[i] = (line[i] + pred) & 0xFF
        else:
            raise ValueError(f"不正なフィルタ種別です: {filter_type}")

    def rgba(self, x, y):
        row = self.rows[y]
        ct = self.color_type
        if ct == 3:
            if self.bit_depth == 8:
                idx = row[x]
            else:
                per_byte = 8 // self.bit_depth
                shift = 8 - self.bit_depth * (x % per_byte + 1)
                idx = (row[x // per_byte] >> shift) & ((1 << self.bit_depth) - 1)
            r, g, b = self.palette[idx] if idx < len(self.palette) else (0, 0, 0)
            a = self.trns[idx] if self.trns is not None and idx < len(self.trns) else 255
            return r, g, b, a
        if ct == 6:
            return tuple(row[4 * x:4 * x + 4])
        if ct == 2:
            r, g, b = row[3 * x:3 * x + 3]
            a = 255
            if self.trns is not None and len(self.trns) >= 6 and (r, g, b) == struct.unpack(">HHH", self.trns[:6]):
                a = 0
            return r, g, b, a
        if ct == 4:
            v, a = row[2 * x:2 * x + 2]
            return v, v, v, a
        v = row[x]
        a = 0 if self.trns is not None and len(self.trns) >= 2 and v == struct.unpack(">H", self.trns[:2])[0] else 255
        return v, v, v, a

    def has_opaque_pixel(self):
        for y in range(0, self.height, 2):
            for x in range(0, self.width, 2):
                if self.rgba(x, y)[3] >= ALPHA_MIN:
                    return True
        return False


# ------------------------------------------------------------------------------
# 通信
# ------------------------------------------------------------------------------
class FetchError(Exception):
    pass


class HttpClient:
    def __init__(self, delay=REQUEST_DELAY_SEC):
        import requests  # --offline では不要なので遅延インポート
        self.session = requests.Session()
        self.session.headers["User-Agent"] = USER_AGENT
        self.delay = delay
        self.request_count = 0

    def get(self, url, timeout=15):
        last_error = None
        for attempt in range(3):
            if self.delay:
                time.sleep(self.delay)
            self.request_count += 1
            try:
                return self.session.get(url, timeout=timeout)
            except Exception as e:  # 接続エラーは少し待って再試行
                last_error = e
                time.sleep(1.5 * (attempt + 1))
        raise FetchError(f"通信に失敗しました: {url} ({last_error})")


class TileFetcher:
    """タイル取得と復号のキャッシュ。404（データなし）は None を返す"""

    def __init__(self, http):
        self.http = http
        self.cache = {}

    def get(self, path, z, x, y):
        key = (path, z, x, y)
        if key in self.cache:
            cached = self.cache[key]
            if isinstance(cached, FetchError):
                raise cached
            return cached
        url = f"{TILE_BASE_URL}/{path}/{z}/{x}/{y}.png"
        try:
            res = self.http.get(url)
            if res.status_code == 404:
                tile = None
            elif res.status_code != 200:
                raise FetchError(f"HTTP {res.status_code}: {url}")
            else:
                try:
                    tile = PngImage(res.content)
                except Exception as e:
                    raise FetchError(f"PNGの読み取りに失敗しました: {url} ({e})")
        except FetchError as e:
            self.cache[key] = e
            raise
        self.cache[key] = tile
        return tile


# ------------------------------------------------------------------------------
# 座標計算
# ------------------------------------------------------------------------------
def latlng_to_global_pixel(lat, lng, zoom):
    scale = 256 * (2 ** zoom)
    x = (lng + 180.0) / 360.0 * scale
    lat_rad = math.radians(lat)
    y = (1.0 - math.log(math.tan(lat_rad) + 1.0 / math.cos(lat_rad)) / math.pi) / 2.0 * scale
    return x, y


def offset_latlng(lat, lng, distance_m, bearing_deg):
    rad = math.radians(bearing_deg)
    dlat = distance_m * math.cos(rad) / 111320.0
    dlng = distance_m * math.sin(rad) / (111320.0 * math.cos(math.radians(lat)))
    return lat + dlat, lng + dlng


def ring_points(lat, lng, radius_m):
    """半径 radius_m 以内を約100m以下の間隔の同心円で8方向に調べる点（例: 150m → 75m・150m）"""
    rings = math.ceil(radius_m / 100)
    return [offset_latlng(lat, lng, radius_m * k / rings, bearing)
            for k in range(1, rings + 1) for bearing in range(0, 360, 45)]


def within_kanto(lat, lng):
    return (KANTO_BOUNDS["min_lat"] <= lat <= KANTO_BOUNDS["max_lat"] and
            KANTO_BOUNDS["min_lng"] <= lng <= KANTO_BOUNDS["max_lng"])


# ------------------------------------------------------------------------------
# ハザードマップの読み取り
# ------------------------------------------------------------------------------
def match_depth_rank(rgb):
    best_rank, best_dist = None, None
    for color, rank in DEPTH_PALETTE:
        dist = math.sqrt(sum((a - b) ** 2 for a, b in zip(rgb, color)))
        if best_dist is None or dist < best_dist:
            best_rank, best_dist = rank, dist
    return best_rank if best_dist <= COLOR_TOLERANCE else None


def sample_layer_at(fetcher, layer, lat, lng, unknown_colors):
    """1地点のレイヤー値。depth: 0=区域外 / 1〜6=浸水深ランク / UNKNOWN_RANK=区域内だが色不明。area: 0/1"""
    gx, gy = latlng_to_global_pixel(lat, lng, SAMPLE_ZOOM)
    tx, ty = int(gx // 256), int(gy // 256)
    px, py = int(gx) % 256, int(gy) % 256
    result = 0
    for path in layer["paths"]:
        tile = fetcher.get(path, SAMPLE_ZOOM, tx, ty)
        if tile is None:
            continue
        # 境界のにじみを避けるため 3x3 画素の中で最も深い値を採る
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                x = min(max(px + dx, 0), tile.width - 1)
                y = min(max(py + dy, 0), tile.height - 1)
                r, g, b, a = tile.rgba(x, y)
                if a < ALPHA_MIN:
                    continue
                if layer["kind"] == "area":
                    return 1
                rank = match_depth_rank((r, g, b))
                if rank is None:
                    unknown_colors.add("#%02X%02X%02X" % (r, g, b))
                    if result == 0:
                        result = UNKNOWN_RANK
                elif rank > max(result, 0):
                    result = rank
    return result


def check_layer_availability(fetcher):
    """各レイヤーのタイルが取得できるか（確実にデータがある地点の周辺で区域が見つかるか）を確かめる"""
    status = {}
    for layer in LAYERS:
        found = False
        errors = []
        for path in layer["paths"]:
            for lat, lng in layer["check_points"]:
                gx, gy = latlng_to_global_pixel(lat, lng, SAMPLE_ZOOM)
                cx, cy = int(gx // 256), int(gy // 256)
                for dx, dy in [(0, 0), (-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (1, -1), (-1, 1), (1, 1)]:
                    try:
                        tile = fetcher.get(path, SAMPLE_ZOOM, cx + dx, cy + dy)
                    except FetchError as e:
                        errors.append(str(e))
                        continue
                    if tile is not None and tile.has_opaque_pixel():
                        found = True
                        break
                if found:
                    break
            if found:
                break
        status[layer["key"]] = "available" if found else "unavailable"
        mark = "OK" if found else "取得不可"
        log(f"  [{mark}] {layer['label']} ({', '.join(layer['paths'])})")
        if not found and errors:
            log(f"      例: {errors[0]}")
    return status


def evaluate_point(fetcher, lat, lng, radius_m, layer_status):
    """代表点＋周辺の点を調べ、レイヤーごとの結果とリスクレベルを返す"""
    points = [(lat, lng)] + ring_points(lat, lng, radius_m)
    layers = {}
    unknown_colors = set()
    for layer in LAYERS:
        key = layer["key"]
        if layer_status.get(key) != "available":
            layers[key] = {"status": "unavailable"}
            continue
        try:
            values = [sample_layer_at(fetcher, layer, la, ln, unknown_colors) for la, ln in points]
        except FetchError as e:
            log(f"    {layer['label']}: {e}")
            layers[key] = {"status": "error"}
            continue
        layers[key] = {"status": "ok", "center": values[0], "nearby": max(values, key=severity)}
    level, reasons = compute_level(layers, radius_m)
    # unavailable（レイヤー自体が取得不可）は毎回同じ結果になるため ok 扱い。通信エラー時だけ次回再判定する
    status = "partial" if any(v["status"] == "error" for v in layers.values()) else "ok"
    if layers["flood"]["status"] != "ok":
        status = "failed"  # 洪水が読めないと判定の根幹が欠けるため手動評価に回す
    return {
        "status": status,
        "level": level if status != "failed" else None,
        "reasons": reasons,
        "layers": layers,
        "unknown_colors": sorted(unknown_colors),
    }


def severity(value):
    """周辺点の中で最も危険な値を選ぶための順序。色不明の区域内は 0.5〜3m 相当、同順位なら深さの分かる方を優先"""
    return (2 if value == UNKNOWN_RANK else value, value != UNKNOWN_RANK)


def depth_level(rank):
    if rank == UNKNOWN_RANK:
        return "high"
    if rank >= 3:
        return "extreme"
    if rank == 2:
        return "high"
    if rank == 1:
        return "medium"
    return "low"


def naisui_level(rank):
    if rank == UNKNOWN_RANK:
        return "medium"
    if rank >= 2:
        return "high"
    if rank == 1:
        return "medium"
    return "low"


def describe_depth(rank):
    if rank == UNKNOWN_RANK:
        return "区域内（深さは地図で要確認）"
    return DEPTH_RANK_LABELS.get(rank, "")


def compute_level(layers, radius_m):
    """代表点の結果と、周辺点の結果（1段階下げる）の高い方をレベルとする"""
    center_levels, nearby_levels, reasons = [], [], []

    def ok(key):
        return layers.get(key, {}).get("status") == "ok"

    for key in ("flood", "hightide", "tsunami", "naisui"):
        if not ok(key):
            continue
        to_level = naisui_level if key == "naisui" else depth_level
        label = LAYER_BY_KEY[key]["label"]
        center, nearby = layers[key]["center"], layers[key]["nearby"]
        if center:
            center_levels.append(to_level(center))
            reasons.append(f"{label}: {describe_depth(center)}")
        if nearby and nearby != center:
            nearby_levels.append(to_level(nearby))
            if not center or LEVEL_ORDER[to_level(nearby)] > LEVEL_ORDER[to_level(center)]:
                if nearby == UNKNOWN_RANK:
                    reasons.append(f"周辺{radius_m}m以内に {label} の区域（深さは地図で要確認）")
                else:
                    reasons.append(f"周辺{radius_m}m以内に {label} {describe_depth(nearby)} の区域")

    for key in ("hanran", "kagan"):
        if not ok(key):
            continue
        label = LAYER_BY_KEY[key]["label"]
        if layers[key]["center"]:
            center_levels.append("extreme")
            reasons.append(f"{label}の区域内（家屋が流失・倒壊するおそれ）")
        elif layers[key]["nearby"]:
            nearby_levels.append("extreme")
            reasons.append(f"周辺{radius_m}m以内に{label}")

    if ok("dosya"):
        if layers["dosya"]["center"]:
            center_levels.append("medium")
            reasons.append("土砂災害警戒区域の区域内")
        elif layers["dosya"]["nearby"]:
            reasons.append(f"周辺{radius_m}m以内に土砂災害警戒区域")

    level = max_level("low", *center_levels, *[level_down(lv) for lv in nearby_levels])
    if not reasons:
        reasons.append("調べた範囲に浸水・土砂災害の想定区域はありません")
    return level, reasons


# ------------------------------------------------------------------------------
# ジオコーディング
# ------------------------------------------------------------------------------
ZEN_TO_HAN = str.maketrans("０１２３４５６７８９", "0123456789")
KANJI_DIGITS = "〇一二三四五六七八九"


def to_kanji_number(n):
    if n < 10:
        return KANJI_DIGITS[n]
    tens, ones = divmod(n, 10)
    return ("" if tens == 1 else KANJI_DIGITS[tens]) + "十" + (KANJI_DIGITS[ones] if ones else "")


def normalize_address(text):
    return text.translate(ZEN_TO_HAN).replace("大字", "").replace("ヶ", "ケ").replace("ヵ", "ケ").replace(" ", "").strip()


def address_queries(address):
    """SUUMOの住所（例: 東京都江戸川区北小岩５）を住所検索向けの候補に変換する。戻り値: [(検索語, 精度)]"""
    text = address.translate(ZEN_TO_HAN).strip()
    queries = []
    m = re.match(r"^(.*?[^\d])(\d{1,2})$", text)
    if m:
        base, num = m.group(1), int(m.group(2))
        queries += [(f"{base}{to_kanji_number(num)}丁目", "chome"), (f"{base}{num}丁目", "chome")]
    queries.append((text, "town"))
    expanded = []
    for q, precision in queries:
        expanded.append((q, precision))
        if "大字" in q:
            expanded.append((q.replace("大字", ""), precision))
    return expanded


def is_same_town(title, target):
    """検索語と同じ町・丁目の結果か（「登戸」に「登戸新町」を含めない。続きは番地・丁目・字だけ許す）"""
    if not title.startswith(target):
        return False
    rest = title[len(target):]
    return rest == "" or re.match(r"^[0-9一二三四五六七八九十丁番字の\-−]", rest) is not None


def geocode_gsi(http, query):
    url = f"{GSI_ADDRESS_SEARCH_URL}?q={urllib.parse.quote(query)}"
    res = http.get(url)
    if res.status_code != 200:
        return None
    try:
        features = res.json()
    except ValueError:
        return None
    target = normalize_address(query)
    matched = []
    for feat in features or []:
        title = feat.get("properties", {}).get("title", "")
        coords = feat.get("geometry", {}).get("coordinates", [])
        if len(coords) < 2 or not is_same_town(normalize_address(title), target):
            continue
        lng, lat = float(coords[0]), float(coords[1])
        if within_kanto(lat, lng):
            matched.append((lat, lng, title))
    if not matched:
        return None
    # 番地単位の結果が複数返る場合は中央値を丁目・町の代表点とする
    lat = statistics.median(m[0] for m in matched)
    lng = statistics.median(m[1] for m in matched)
    return {"lat": round(lat, 6), "lng": round(lng, 6), "title": matched[0][2] if len(matched) == 1 else query,
            "matches": len(matched)}


def geocode_nominatim(http, query):
    params = {"q": query, "format": "json", "limit": 1, "countrycodes": "jp"}
    time.sleep(NOMINATIM_DELAY_SEC)
    res = http.get(f"{NOMINATIM_URL}?{urllib.parse.urlencode(params)}")
    if res.status_code != 200:
        return None
    try:
        data = res.json()
    except ValueError:
        return None
    if not data:
        return None
    lat, lng = float(data[0]["lat"]), float(data[0]["lon"])
    if not within_kanto(lat, lng):
        return None
    return {"lat": round(lat, 6), "lng": round(lng, 6), "title": data[0].get("display_name", query), "matches": 1}


def geocode_address(http, address):
    for query, precision in address_queries(address):
        try:
            hit = geocode_gsi(http, query)
        except FetchError as e:
            log(f"    住所検索に失敗: {e}")
            hit = None
        if hit:
            return {**hit, "source": "gsi", "query": query, "precision": precision}
    for query, precision in address_queries(address)[:1]:
        try:
            hit = geocode_nominatim(http, query)
        except FetchError as e:
            log(f"    Nominatimに失敗: {e}")
            hit = None
        if hit:
            return {**hit, "source": "nominatim", "query": query, "precision": precision}
    return None


# ------------------------------------------------------------------------------
# 入出力
# ------------------------------------------------------------------------------
def load_json(path, default):
    if not os.path.exists(path):
        return default
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def load_properties():
    with open(PROPERTIES_JS_PATH, "r", encoding="utf-8") as f:
        content = f.read()
    m = re.search(r"const\s+bukkenData\s*=\s*(.*);", content, re.DOTALL)
    if not m:
        raise ValueError("properties.js から bukkenData を読み取れません")
    return json.loads(m.group(1))


STATION_WALK_RE = re.compile(r"(?:([^/]+)/)?([^/駅]+)駅\s*歩(\d+)分")


def collect_stations(properties):
    """各物件の最寄駅候補（徒歩20分以内）と座標。座標は properties.js と駅座標キャッシュから取る"""
    geocoding_cache = load_json(GEOCODING_CACHE_PATH, {})
    stations = {}
    for p in properties:
        if p.get("lat") and p.get("lng") and p.get("station"):
            stations.setdefault(p["station"], (p["lat"], p["lng"]))
        for m in STATION_WALK_RE.finditer(p.get("station_walk", "")):
            name = m.group(2).strip()
            if int(m.group(3)) > 20 or "バス" in name or "(" in name:
                continue
            coords = geocoding_cache.get(name)
            if name not in stations and coords:
                stations[name] = (coords["lat"], coords["lng"])
    return stations


def is_fresh(entry, force):
    if force or not entry or entry.get("hazard", {}).get("status") != "ok":
        return False
    try:
        checked = datetime.date.fromisoformat(entry["checked_at"])
    except (KeyError, ValueError):
        return False
    return (datetime.date.today() - checked).days < RECHECK_DAYS


def hazard_map_url(lat, lng):
    return f"{HAZARD_MAP_VIEW_URL}?ll={lat:.6f},{lng:.6f}&z=16&base=pale"


def build_entry(cached, manual, history):
    """自動判定・手動評価・被害実績をまとめ、表示用の1件分を作る"""
    history = history or []
    history_level = max_level(*[h.get("level") for h in history])
    entry = {"level": None, "source": "none", "history": history}

    hazard = (cached or {}).get("hazard")
    geocode = (cached or {}).get("geocode")
    if hazard and hazard.get("status") in ("ok", "partial"):
        entry["auto"] = {
            "status": hazard["status"],
            "level": hazard["level"],
            "checked_at": cached["checked_at"].replace("-", "/"),
            "reasons": hazard["reasons"],
            "layers": {k: v for k, v in hazard["layers"].items()},
            "unknown_colors": hazard.get("unknown_colors", []),
        }
        entry["level"] = max_level(hazard["level"], history_level)
        entry["source"] = "auto"
    elif manual:
        entry["level"] = max_level(manual.get("level"), history_level)
        entry["source"] = "manual"
    elif history_level:
        entry["level"] = history_level
        entry["source"] = "history"

    if manual:
        entry["manual"] = manual
    if geocode:
        entry["point"] = {
            "lat": geocode["lat"], "lng": geocode["lng"], "title": geocode.get("title"),
            "source": geocode.get("source"), "precision": geocode.get("precision"),
            "map_url": hazard_map_url(geocode["lat"], geocode["lng"]),
        }
    return entry


def write_output_js(properties, station_names, cache, notes):
    today = datetime.date.today().strftime("%Y/%m/%d")
    out = {"layers": {layer["key"]: {"label": layer["label"], "kind": layer["kind"]} for layer in LAYERS},
           "depth_labels": {str(k): v for k, v in DEPTH_RANK_LABELS.items()},
           "properties": {}, "stations": {}}
    prop_notes = notes.get("properties", {})
    station_notes = notes.get("stations", {})

    for address in sorted({p["address"] for p in properties if p.get("address")}):
        note = prop_notes.get(address, {})
        out["properties"][address] = build_entry(cache["addresses"].get(address), note.get("manual"), note.get("history"))

    for name in sorted(set(station_names) | set(station_notes)):
        note = station_notes.get(name, {})
        cached = cache["stations"].get(name)
        entry = build_entry(cached, note.get("manual"), note.get("history"))
        if entry["level"]:
            out["stations"][name] = entry

    js = ("// 自動生成ファイル（scripts/check_flood_risk.py）。直接編集しないこと。\n"
          "// 手動評価・被害実績は data/flood_risk_notes.json を編集して再生成する。\n"
          f"const floodRiskUpdatedAt = \"{today}\";\n"
          f"const floodRiskData = {json.dumps(out, ensure_ascii=False, indent=2)};\n")
    with open(OUTPUT_JS_PATH, "w", encoding="utf-8") as f:
        f.write(js)
    counts = {}
    for entry in out["properties"].values():
        key = f"{entry['level'] or 'なし'}({entry['source']})"
        counts[key] = counts.get(key, 0) + 1
    log(f"flood_risk.js を書き出しました（住所 {len(out['properties'])} 件 / 駅 {len(out['stations'])} 件）: {counts}")


def main():
    parser = argparse.ArgumentParser(description="重ねるハザードマップから物件・駅の浸水リスクを判定し flood_risk.js を生成する")
    parser.add_argument("--offline", action="store_true", help="通信せず、キャッシュと手動評価から flood_risk.js だけ再生成する")
    parser.add_argument("--force", action="store_true", help="キャッシュを無視して全件再判定する")
    parser.add_argument("--check-layers", action="store_true", help="各レイヤーが取得できるかだけ確認する")
    parser.add_argument("--no-stations", action="store_true", help="駅の判定を省略する")
    parser.add_argument("--delay", type=float, default=REQUEST_DELAY_SEC, help="リクエスト間隔（秒）")
    args = parser.parse_args()

    properties = load_properties()
    notes = load_json(NOTES_PATH, {})
    cache = load_json(CACHE_PATH, {})
    cache.setdefault("addresses", {})
    cache.setdefault("stations", {})
    stations = {} if args.no_stations else collect_stations(properties)

    if args.offline:
        write_output_js(properties, stations.keys(), cache, notes)
        return 0

    http = HttpClient(delay=args.delay)
    fetcher = TileFetcher(http)

    log("ハザードマップ各レイヤーの取得可否を確認中...")
    layer_status = check_layer_availability(fetcher)
    cache["layer_check"] = {"checked_at": datetime.date.today().isoformat(), "layers": layer_status}
    if args.check_layers:
        save_json(CACHE_PATH, cache)
        return 0 if layer_status.get("flood") == "available" else 1
    if layer_status.get("flood") != "available":
        log("エラー: 洪水浸水想定区域のタイルを取得できません。判定を中止し、既存キャッシュと手動評価で出力します。")
        write_output_js(properties, stations.keys(), cache, notes)
        return 1

    today = datetime.date.today().isoformat()
    addresses = sorted({p["address"] for p in properties if p.get("address")})
    for i, address in enumerate(addresses, 1):
        entry = cache["addresses"].get(address)
        if is_fresh(entry, args.force):
            continue
        log(f"[{i}/{len(addresses)}] {address}")
        geocode = (entry or {}).get("geocode") if not args.force else None
        if not geocode:
            geocode = geocode_address(http, address)
        if not geocode:
            log("    座標を特定できませんでした（手動評価で表示します）")
            cache["addresses"][address] = {"checked_at": today, "geocode": None, "hazard": {"status": "failed"}}
            save_json(CACHE_PATH, cache)
            continue
        radius = RING_RADIUS_CHOME_M if geocode["precision"] == "chome" else RING_RADIUS_TOWN_M
        hazard = evaluate_point(fetcher, geocode["lat"], geocode["lng"], radius, layer_status)
        log(f"    → {LEVEL_LABELS.get(hazard['level'], '判定不可')} ({geocode['source']}: {geocode.get('title')}) / {' / '.join(hazard['reasons'])}")
        if hazard["unknown_colors"]:
            log(f"    凡例にない色: {', '.join(hazard['unknown_colors'])}（DEPTH_PALETTE の見直しが必要な可能性）")
        cache["addresses"][address] = {"checked_at": today, "geocode": geocode, "hazard": hazard}
        save_json(CACHE_PATH, cache)  # 途中で止まっても再開できるよう逐次保存

    for name, (lat, lng) in sorted(stations.items()):
        entry = cache["stations"].get(name)
        if is_fresh(entry, args.force):
            continue
        log(f"[駅] {name}")
        geocode = {"lat": lat, "lng": lng, "title": f"{name}駅", "source": "station", "precision": "station"}
        hazard = evaluate_point(fetcher, lat, lng, RING_RADIUS_CHOME_M, layer_status)
        log(f"    → {LEVEL_LABELS.get(hazard['level'], '判定不可')} / {' / '.join(hazard['reasons'])}")
        cache["stations"][name] = {"checked_at": today, "geocode": geocode, "hazard": hazard}
        save_json(CACHE_PATH, cache)

    save_json(CACHE_PATH, cache)
    write_output_js(properties, stations.keys(), cache, notes)
    log(f"完了（HTTPリクエスト {http.request_count} 回）")
    return 0


if __name__ == "__main__":
    sys.exit(main())
