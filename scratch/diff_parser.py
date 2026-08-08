import codecs
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
        if len(parts) > 2:
            area = parts[1].strip()
            area_added[area] += 1
            # name, rent/manage, self_pay, commute, spec, link
            added_properties.append((area, parts[3].strip(), parts[5].strip(), parts[6].strip(), parts[8].strip(), parts[9].strip()))
    elif line.startswith('-') and not line.startswith('---'):
        removed_count += 1
        parts = line.split('|')
        if len(parts) > 2:
            area = parts[1].strip()
            area_removed[area] += 1

print(f'ADDED_TOTAL: {added_count}')
print(f'REMOVED_TOTAL: {removed_count}')
print('AREA_ADDED:')
for k, v in area_added.items(): print(f'{k}: {v}')
print('AREA_REMOVED:')
for k, v in area_removed.items(): print(f'{k}: {v}')

print('RECOMMENDED:')
for p in added_properties:
    # 新築、またはドアドア通勤時間が短い（例：55分未満）、駅徒歩が短いなどを判定
    commute = p[3]
    spec = p[4]
    
    is_recommend = False
    if '新築' in spec:
        is_recommend = True
    elif '50分' in commute or '51分' in commute or '52分' in commute or '53分' in commute or '54分' in commute:
        is_recommend = True
    elif '歩1分' in spec or '歩2分' in spec or '歩3分' in spec or '歩4分' in spec or '歩5分' in spec:
        is_recommend = True
        
    if is_recommend:
        print(f'- [{p[0]}] {p[1]} (自己負担 {p[2]} / {p[3]} / {p[4]})')
