#!/bin/bash
# checklist_len — 세션 체크리스트의 프로젝트 줄이 800자 상한을 넘었는지 «잰다»
#
# 왜 스크립트인가:
#   상한 규칙은 2026-08-14에 도입됐는데 «재는 주체»가 없어서 계속 무너졌다.
#   7/28 정리 → 8/5 재발(53,884자) → 8/14 재발(124,805자, /recall의 Read가 실제로 잘림)
#   → 8/16 규칙을 아는 상태에서도 또 넘겼다(마니톡 줄 1,991자).
#   사람이 지키는 형태로는 네 번 무너졌으니 재는 일을 코드로 옮긴다.
#
# 무엇을 안 하는가 — 자동으로 자르지 않는다. 경고만 한다.
#   어느 문장을 덜어낼지는 그 프로젝트를 아는 창이 정해야 하고,
#   남의 줄을 임의 요약하면 다중 인스턴스 안전이 깨진다.
#
# ⚠️ 길이는 «문자 수»지 바이트가 아니다.
#   한글은 UTF-8에서 3바이트라 awk length·wc -c로 재면 957자짜리 줄이 1,661로 잡히고
#   한글 267자쯤에서 헛경보가 뜬다. 그래서 python3로 문자 수를 센다.
#
# 사용법:
#   checklist_len.sh                    # 기본 파일·기본 상한(800) 검사
#   checklist_len.sh --limit 600        # 상한 바꿔서 검사
#   checklist_len.sh --list             # 초과 여부와 무관하게 전 줄 길이 출력
#   checklist_len.sh /경로/다른파일.md   # 다른 파일 검사
#
# 출력: 초과 줄만 "N자 / 프로젝트명 (L줄번호)". 초과가 없으면 조용히 통과(무출력)
# exit: 0=통과  1=초과 있음  2=사용법·파일 오류

set -euo pipefail

VAULT="/Users/p.air15/Neo-Obsi-Sync"
TARGET="$VAULT/_init/세션 체크리스트.md"
LIMIT=800
MODE=check

while [ $# -gt 0 ]; do
  case "$1" in
    --limit) LIMIT="${2:-}"; shift 2
             [[ "$LIMIT" =~ ^[0-9]+$ ]] || { echo "--limit 은 숫자여야 한다: $LIMIT" >&2; exit 2; } ;;
    --list)  MODE=list; shift ;;
    -h|--help) sed -n '2,29p' "$0"; exit 0 ;;
    -*)      echo "모르는 옵션: $1" >&2; exit 2 ;;
    *)       TARGET="$1"; shift ;;
  esac
done

[ -f "$TARGET" ] || { echo "파일이 없다: $TARGET" >&2; exit 2; }

TARGET="$TARGET" LIMIT="$LIMIT" MODE="$MODE" python3 - <<'PY'
import os, re, sys

path  = os.environ['TARGET']
limit = int(os.environ['LIMIT'])
mode  = os.environ['MODE']

rows = []
for n, line in enumerate(open(path, encoding='utf-8'), 1):
    line = line.rstrip('\n')
    if not line.startswith('- **'):
        continue
    m = re.match(r'- \*\*(.+?)\*\*', line)
    name = m.group(1) if m else line[:40]
    rows.append((n, len(line), name))   # len() = 문자 수. 바이트가 아니다

if mode == 'list':
    for n, ln, name in rows:
        mark = ' ←초과' if ln > limit else ''
        print(f'  L{n:<4} {ln:>5}자  {name}{mark}')
    sys.exit(0)

over = [r for r in rows if r[1] > limit]
if not over:
    sys.exit(0)

print(f'[세션 체크리스트] {limit}자 상한 초과 {len(over)}건 — 해당 프로젝트를 아는 창이 직접 덜어낸다')
for n, ln, name in sorted(over, key=lambda r: -r[1]):
    print(f'  {ln}자 / {name}  (L{n})')
print('  경과·발견·검증 기록은 그 프로젝트의 요청 노트로. 여기는 «어디까지 왔고 다음에 무엇을 하는가»만.')
sys.exit(1)
PY
