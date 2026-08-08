import io

try:
    with io.open('added_properties.md', 'r', encoding='utf-8') as f:
        lines = f.readlines()
except Exception as e:
    lines = []

added_properties = []

for line in lines:
    if line.startswith('|') and not line.startswith('| :---') and not 'エリア' in line:
        parts = line.split('|')
        if len(parts) > 9:
            area = parts[1].strip()
            title = parts[3].strip()
            self_pay = parts[5].strip()
            commute = parts[6].strip()
            spec = parts[8].strip()
            link = parts[9].strip()
            added_properties.append({
                'area': area,
                'title': title,
                'self_pay': self_pay,
                'commute': commute,
                'spec': spec,
                'link': link
            })

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
        reasons.append('駅徒歩5分以内')
    if '50分' in commute or '51分' in commute or '52分' in commute or '53分' in commute or '54分' in commute:
        is_rec = True
        reasons.append('ドアドア54分以内')
        
    if is_rec:
        p['reasons'] = ', '.join(reasons)
        recommended.append(p)

md = []
md.append('# 新規追加物件サマリー\n\n')
md.append(f'**追加された物件**: {len(added_properties)} 件\n\n')

md.append('## 🌟 おすすめの追加物件\n\n')
md.append('> [!TIP]\n> 追加された物件の中から「新築」「駅徒歩5分以内」「通勤54分以内」のいずれかを満たす物件をピックアップしました。\n\n')
md.append('| エリア | 物件名 | 自己負担額 | 通勤時間 | 徒歩・立地 | おすすめ理由 | リンク |\n')
md.append('|---|---|---|---|---|---|---|\n')
for p in recommended:
    md.append(f"| {p['area']} | {p['title']} | {p['self_pay']} | {p['commute']} | {p['spec']} | **{p['reasons']}** | {p['link']} |\n")

md.append('\n## 📄 追加された物件一覧 (全件)\n\n')
md.append('| エリア | 物件名 | 自己負担額 | 通勤時間 | 徒歩・立地 | リンク |\n')
md.append('|---|---|---|---|---|---|\n')
for p in added_properties:
    md.append(f"| {p['area']} | {p['title']} | {p['self_pay']} | {p['commute']} | {p['spec']} | {p['link']} |\n")

out_path = r'C:\Users\dh081\.gemini\antigravity-ide\brain\42a5c19d-d20d-430c-b688-c6c37c8e98d6\added_summary.md'
with io.open(out_path, 'w', encoding='utf-8') as f:
    f.write(''.join(md))
