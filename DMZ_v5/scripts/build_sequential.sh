#!/bin/bash
# DMZ v5 sequential 빌드
# shared/index_sequential.html + data/topics/*.yaml + dmz_blanks.csv → sequential/index.html
# 사용: cd _dev/DMZ_v5 && bash scripts/build_sequential.sh

set -e
cd "$(dirname "$0")/.."

mkdir -p sequential

python3 << 'PYEOF'
import csv, json, subprocess, sys
from pathlib import Path

# 1. shared HTML 읽기
content = Path('shared/index_sequential.html').read_text()

# 2. STORIES/ARCHIVIST_TYPES 주입
inject = subprocess.run(
    ['python3', 'scripts/build_stories_json.py'],
    capture_output=True, text=True, check=True
).stdout
placeholder = "// __STORIES_AND_TYPES__ (data/topics/*.yaml에서 빌드 시 주입)"
if placeholder not in content:
    sys.exit(f"ERROR: placeholder 없음: {placeholder}")
content = content.replace(placeholder, inject)

# 3. BLANK_SOURCE_LOOKUP 주입 (dmz_blanks.csv)
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

Path('sequential/index.html').write_text(content)
print(f"injected: stories+types, {len(mapping)} blank source mappings, {len(content)} bytes")
PYEOF

# photos 동기화
rm -rf sequential/photos
cp -R shared/photos sequential/photos

# JS syntax 검증
node -e "new Function(require('fs').readFileSync('sequential/index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1])" \
  && echo "JS syntax OK" \
  || { echo "JS syntax FAILED"; exit 1; }

ls -la sequential/index.html
