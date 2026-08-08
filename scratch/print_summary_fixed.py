import json
import subprocess
import io

def get_git_file_content(revision, filepath):
    try:
        result = subprocess.run(
            ['git', 'show', f'{revision}:{filepath}'],
            capture_output=True,
            text=True,
            encoding='utf-8'
        )
        if result.returncode == 0:
            return result.stdout
        return ""
    except Exception:
        return ""

# HEAD~1 の properties.js
old_js = get_git_file_content('HEAD~1', 'properties.js')
# HEAD の properties.js
new_js = get_git_file_content('HEAD', 'properties.js')

def extract_json(js_str):
    if not js_str: return []
    # const bukkenData = [...]; の中身を抽出
    start = js_str.find('[')
    end = js_str.rfind(']') + 1
    if start != -1 and end != -1:
        try:
            return json.loads(js_str[start:end])
        except:
            return []
    return []

old_data = extract_json(old_js)
new_data = extract_json(new_js)

old_urls = {p.get('url') for p in old_data if p.get('url')}
new_urls = {p.get('url') for p in new_data if p.get('url')}

added_urls = new_urls - old_urls

added_properties = [p for p in new_data if p.get('url') in added_urls]

recommended = []
for p in added_properties:
    spec = p.get('age_floor', '') + " " + p.get('station_walk', '')
    door_to_door = p.get('door_to_door', 99)
    walk_min = p.get('walk_min', 99)
    
    is_rec = False
    reasons = []
    
    if p.get('age_floor') == '新築' or '新築' in p.get('age_floor', ''):
        is_rec = True
        reasons.append('新築')
    if walk_min <= 5:
        is_rec = True
        reasons.append('駅徒歩5分以内')
    if door_to_door <= 54:
        is_rec = True
        reasons.append('ドアドア54分以内')
        
    if is_rec:
        p['reasons'] = ', '.join(reasons)
        recommended.append(p)

md = []
md.append('# 【修正版】新規追加物件サマリー\n\n')
md.append(f'**追加された物件**: {len(added_properties)} 件\n\n')

md.append('## 🌟 おすすめの追加物件\n\n')
md.append('| エリア | 物件名 | 自己負担額 | 通勤時間 | 徒歩・立地 | おすすめ理由 | リンク |\n')
md.append('|---|---|---|---|---|---|---|\n')
for p in recommended:
    commute_info = f"{p.get('door_to_door')}分 (徒歩{p.get('walk_min')}分+乗車{p.get('train_min')}分, 乗換{p.get('transfers')}回)"
    self_pay_str = f"**{p.get('self_pay'):.2f}万円**"
    link = f"[詳細を表示]({p.get('url')})"
    md.append(f"| {p.get('station')} | {p.get('title')} | {self_pay_str} | {commute_info} | {p.get('station_walk')} ({p.get('age_floor')}) | **{p.get('reasons')}** | {link} |\n")

md.append('\n## 📄 追加された物件一覧 (全件)\n\n')
md.append('| エリア | 物件名 | 自己負担額 | 通勤時間 | 徒歩・立地 | リンク |\n')
md.append('|---|---|---|---|---|---|\n')
for p in added_properties:
    commute_info = f"{p.get('door_to_door')}分 (徒歩{p.get('walk_min')}分+乗車{p.get('train_min')}分, 乗換{p.get('transfers')}回)"
    self_pay_str = f"**{p.get('self_pay'):.2f}万円**"
    link = f"[詳細を表示]({p.get('url')})"
    md.append(f"| {p.get('station')} | {p.get('title')} | {self_pay_str} | {commute_info} | {p.get('station_walk')} ({p.get('age_floor')}) | {link} |\n")

out_path = r'C:\Users\dh081\.gemini\antigravity-ide\brain\42a5c19d-d20d-430c-b688-c6c37c8e98d6\added_summary_fixed.md'
with io.open(out_path, 'w', encoding='utf-8') as f:
    f.write(''.join(md))

print(f"Generated {out_path} with {len(added_properties)} properties.")
