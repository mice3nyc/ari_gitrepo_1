#!/bin/bash
# DMZ v4 sequential 빌드
# shared/index_sequential.html + dmz_blanks.csv 매핑 → sequential/index.html
# 사용: cd _dev/DMZ_v5 && bash scripts/build_sequential.sh

set -e
cd "$(dirname "$0")/.."

mkdir -p sequential

python3 << 'PYEOF'
import csv, json
mapping = {}
with open('shared/dmz_blanks.csv') as f:
    for row in csv.DictReader(f):
        if row.get('answer_from'):
            key = f"{row['episode_id']}_{row['blank_id']}"
            mapping[key] = row['answer_from']
js = json.dumps(mapping, ensure_ascii=False, indent=2)
content = open('shared/index_sequential.html').read()
old = 'const BLANK_SOURCE_LOOKUP = /* __BLANK_SOURCE_LOOKUP__ */ {};'
new = f'const BLANK_SOURCE_LOOKUP = {js};'
if old not in content:
    raise SystemExit("ERROR: BLANK_SOURCE_LOOKUP placeholder not found in shared/index_sequential.html")
content = content.replace(old, new)
open('sequential/index.html', 'w').write(content)
print(f"Mappings injected: {len(mapping)}")
PYEOF

# photos 동기화
rm -rf sequential/photos
cp -R shared/photos sequential/photos

# JS syntax 검증
node -e "new Function(require('fs').readFileSync('sequential/index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1])" \
  && echo "JS syntax OK" \
  || { echo "JS syntax FAILED"; exit 1; }

ls -la sequential/index.html
