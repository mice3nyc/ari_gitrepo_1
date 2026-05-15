#!/bin/bash
# DMZ v5 pickone 빌드
# shared/index_pickone.html + data/topics/*.yaml + dmz_blanks.csv + data/first_source.csv → pickone/index.html
# 사용: cd _dev/DMZ_v5 && bash scripts/build_pickone.sh

set -e
cd "$(dirname "$0")/.."

mkdir -p pickone

python3 << 'PYEOF'
import csv, json, subprocess, sys
from pathlib import Path

# 1. shared HTML 읽기
content = Path('shared/index_pickone.html').read_text()

# 2. STORIES/ARCHIVIST_TYPES 주입
inject = subprocess.run(
    ['python3', 'scripts/build_stories_json.py'],
    capture_output=True, text=True, check=True
).stdout
placeholder = "// __STORIES_AND_TYPES__ (data/topics/*.yaml에서 빌드 시 주입)"
if placeholder not in content:
    sys.exit(f"ERROR: STORIES placeholder 없음: {placeholder}")
content = content.replace(placeholder, inject)

# 3. BLANK_SOURCE_LOOKUP 주입 (dmz_blanks.csv answer_from)
mapping = {}
with open('shared/dmz_blanks.csv') as f:
    for row in csv.DictReader(f):
        if row.get('answer_from'):
            key = f"{row['episode_id']}_{row['blank_id']}"
            mapping[key] = row['answer_from']
js = json.dumps(mapping, ensure_ascii=False, indent=2)
old = 'const BLANK_SOURCE_LOOKUP = /* __BLANK_SOURCE_LOOKUP__ */ {};'
new = f'const BLANK_SOURCE_LOOKUP = {js};'
if old not in content:
    sys.exit("ERROR: BLANK_SOURCE_LOOKUP placeholder 없음")
content = content.replace(old, new)

# 4. FIRST_SOURCE_LOOKUP 주입 (data/first_source.csv slot)
first_map = {}
with open('data/first_source.csv') as f:
    for row in csv.DictReader(f):
        eid = row.get('episode_id', '').strip()
        slot = row.get('slot', '').strip()
        if eid and slot in ('A','B','C','D'):
            first_map[eid] = slot
js2 = json.dumps(first_map, ensure_ascii=False, indent=2)
old2 = 'const FIRST_SOURCE_LOOKUP = /* __FIRST_SOURCE_LOOKUP__ */ {};'
new2 = f'const FIRST_SOURCE_LOOKUP = {js2};'
if old2 not in content:
    sys.exit("ERROR: FIRST_SOURCE_LOOKUP placeholder 없음")
content = content.replace(old2, new2)

Path('pickone/index.html').write_text(content)
print(f"injected: stories+types, {len(mapping)} blank source mappings, {len(first_map)} first source mappings, {len(content)} bytes")
PYEOF

# photos 동기화
rm -rf pickone/photos
cp -R shared/photos pickone/photos

# assets 동기화 (icons, fonts, images)
rm -rf pickone/assets
cp -R assets pickone/assets

# JS syntax 검증
node -e "new Function(require('fs').readFileSync('pickone/index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1])" \
  && echo "JS syntax OK" \
  || { echo "JS syntax FAILED"; exit 1; }

ls -la pickone/index.html
