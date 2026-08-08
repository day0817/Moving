import codecs
import os
from collections import defaultdict

try:
    with codecs.open('diff.txt', 'r', 'utf-16le') as f:
        lines = f.readlines()
except Exception as e:
    with codecs.open('diff.txt', 'r', 'utf8', errors='ignore') as f:
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

# おすすめ物件を抽出
recommended = []
for p in added_properties:
    spec = p['spec']
    commute = p['commute']
    is_rec = False
    reasons = []
    
    if '新築' in spec:
        is_rec = True
        reasons.append('新築')
    
    # 徒歩1〜5分
    if '歩1分' in spec or '歩2分' in spec or '歩3分' in spec or '歩4分' in spec or '歩5分' in spec:
        is_rec = True
        reasons.append('駅近(5分以内)')
        
    # 通勤時間50〜54分
    if '50分' in commute or '51分' in commute or '52分' in commute or '53分' in commute or '54分' in commute:
        is_rec = True
        reasons.append('通勤時間短い')
        
    if is_rec:
        p['reasons'] = ', '.join(reasons)
        recommended.append(p)

out_file = r'C:\Users\dh081\.gemini\antigravity-ide\brain\42a5c19d-d20d-430c-b688-c6c37c8e98d6\update_summary.md'

with codecs.open(out_file, 'w', 'utf8') as f:
    f.write('# 物件情報更新サマリー\n\n')
    f.write(f'**追加された物件数**: {added_count} 件\n')
    f.write(f'**削除された（条件外になった）物件数**: {removed_count} 件\n\n')
    
    f.write('## エリアごとの増減\n')
    f.write('| エリア | 追加 | 削除 | 増減 |\n')
    f.write('|---|---|---|---|\n')
    all_areas = sorted(list(set(area_added.keys()) | set(area_removed.keys())))
    for area in all_areas:
        a_count = area_added.get(area, 0)
        r_count = area_removed.get(area, 0)
        diff = a_count - r_count
        diff_str = f'+{diff}' if diff > 0 else str(diff)
        f.write(f'| {area} | {a_count} | {r_count} | {diff_str} |\n')
        
    f.write('\n## 🌟 おすすめの追加物件\n')
    f.write('> [!TIP]\n> 追加された物件の中から「新築」「駅徒歩5分以内」「通勤54分以内」のいずれかを満たす物件をピックアップしました。\n\n')
    
    f.write('| エリア | 物件名 | 自己負担額 | 通勤時間 | 徒歩・立地 | おすすめ理由 | リンク |\n')
    f.write('|---|---|---|---|---|---|---|\n')
    for p in recommended:
        f.write(f"| {p['area']} | {p['title']} | {p['self_pay']} | {p['commute']} | {p['spec']} | **{p['reasons']}** | {p['link']} |\n")
        
    f.write('\n## 📄 追加された物件一覧 (全件)\n')
    f.write('| エリア | 物件名 | 自己負担額 | 通勤時間 | 徒歩・立地 | リンク |\n')
    f.write('|---|---|---|---|---|---|\n')
    for p in added_properties:
        f.write(f"| {p['area']} | {p['title']} | {p['self_pay']} | {p['commute']} | {p['spec']} | {p['link']} |\n")

print("Generated update_summary.md")
