import io
import json
from collections import defaultdict

try:
    with io.open('diff.txt', 'r', encoding='utf-16') as f:
        lines = f.readlines()
except Exception as e:
    with io.open('diff.txt', 'r', encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()

added_count = 0
removed_count = 0
area_added = defaultdict(int)
area_removed = defaultdict(int)

added_properties = []

for line in lines:
    if line.startswith('+') and not line.startswith('+++'):
        added_count += 1
        parts = line.split('|')
        if len(parts) > 9:
            area = parts[1].strip()
            title = parts[3].strip()
            self_pay = parts[5].strip()
            commute = parts[6].strip()
            spec = parts[8].strip()
            link = parts[9].strip()
            area_added[area] += 1
            added_properties.append({
                'area': area,
                'title': title,
                'self_pay': self_pay,
                'commute': commute,
                'spec': spec,
                'link': link
            })
    elif line.startswith('-') and not line.startswith('---'):
        removed_count += 1
        parts = line.split('|')
        if len(parts) > 2:
            area = parts[1].strip()
            area_removed[area] += 1

recommended = []
for p in added_properties:
    spec = p['spec']
    commute = p['commute']
    is_rec = False
    reasons = []
    
    if '新築' in spec:
        is_rec = True
        reasons.append('新築')
    if '歩1分' in spec or '歩2分' in spec or '歩3分' in spec or '歩4分' in spec or '歩5分' in spec:
        is_rec = True
        reasons.append('駅近')
    if '50分' in commute or '51分' in commute or '52分' in commute or '53分' in commute or '54分' in commute:
        is_rec = True
        reasons.append('通勤短い')
        
    if is_rec:
        p['reasons'] = ', '.join(reasons)
        recommended.append(p)

md = []
md.append('# 物件情報更新サマリー\n')
md.append(f'**増えた物件**: {added_count} 件\n')
md.append(f'**減った物件**: {removed_count} 件\n\n')

md.append('## エリアごとの増減\n')
md.append('| エリア | 増 | 減 | 増減 |\n')
md.append('|---|---|---|---|\n')
all_areas = sorted(list(set(area_added.keys()) | set(area_removed.keys())))
for area in all_areas:
    a_count = area_added.get(area, 0)
    r_count = area_removed.get(area, 0)
    diff = a_count - r_count
    diff_str = f'+{diff}' if diff > 0 else str(diff)
    md.append(f'| {area} | {a_count} | {r_count} | {diff_str} |\n')

md.append('\n## 🌟 おすすめの新規物件\n')
md.append('| エリア | 物件名 | 自己負担額 | 通勤時間 | 徒歩・立地 | おすすめ理由 | リンク |\n')
md.append('|---|---|---|---|---|---|---|\n')
for p in recommended:
    md.append(f"| {p['area']} | {p['title']} | {p['self_pay']} | {p['commute']} | {p['spec']} | **{p['reasons']}** | {p['link']} |\n")

md.append('\n## 📄 増えた物件一覧 (全件)\n')
md.append('| エリア | 物件名 | 自己負担額 | 通勤時間 | 徒歩・立地 | リンク |\n')
md.append('|---|---|---|---|---|---|\n')
for p in added_properties:
    md.append(f"| {p['area']} | {p['title']} | {p['self_pay']} | {p['commute']} | {p['spec']} | {p['link']} |\n")

import sys
# utf-8で標準出力へ
sys.stdout.buffer.write(''.join(md).encode('utf-8'))
