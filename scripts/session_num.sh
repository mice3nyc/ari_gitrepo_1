#!/bin/bash
# session_num — 클로드코드 세션 번호를 원자적으로 발급하고 엔트리를 상단에 꽂는다
#
# 왜 스크립트인가:
#   ① race — 창 여럿이 동시에 /recall 하면 같은 번호를 읽고 둘 다 그 번호를 쓴다 (2026-07-29 규명, P60)
#   ② 꼬리 채번 — 세션 로그는 최신이 위인데 tail로 찾으면 가장 오래된 번호가 잡힌다 (2026-08-05 사고)
#   ③ 삽입 위치 — 새 엔트리가 파일 맨 아래에 붙던 사고
#   셋 다 "스킬 텍스트에 규칙으로" 적어 왔지만 백도가 프롬프트를 못 받으면 그대로 재발했다.
#   락(mkdir은 원자적)과 파싱을 코드로 옮겨 지킬 수밖에 없게 만든다.
#
# 사용법:
#   session_num.sh next                          # 번호만 발급 (엔트리는 안 만듦)
#   session_num.sh new "창B" "제목"               # 발급 + 상단에 엔트리 삽입, 번호 출력
#   session_num.sh peek                          # 현재 최신 번호 조회 (발급 안 함)
#
# 출력: 발급된 번호 하나 (숫자만). 실패 시 stderr + exit 1

set -euo pipefail

VAULT="/Users/p.air15/Neo-Obsi-Sync"
LOG="$VAULT/_클로드코드노트/클로드코드 세션 로그.md"
COUNTER="$VAULT/_클로드코드노트/.session_counter"
LOCK="$VAULT/_클로드코드노트/.session_num.lock"

[ -f "$LOG" ] || { echo "세션 로그가 없다: $LOG" >&2; exit 1; }

# 로그 머리에서 최신 번호를 딴다 (첫 매치 = 최신). 두 형식 모두 허용.
head_num() {
  grep -m 1 -oE '^#{2,3} 세션 ?[0-9]+' "$LOG" | grep -oE '[0-9]+' || echo 0
}

case "${1:-}" in
  peek)
    head_num; exit 0 ;;
  next|new) ;;
  *) echo "사용법: $(basename "$0") {next|new|peek} [창] [제목]" >&2; exit 1 ;;
esac

# ── 락 획득 (mkdir은 원자적) ─────────────────────────────
acquired=0
for _ in $(seq 1 50); do
  if mkdir "$LOCK" 2>/dev/null; then acquired=1; break; fi
  # 60초 넘은 락은 죽은 창이 남긴 것으로 보고 걷어낸다
  if [ -d "$LOCK" ] && [ -z "$(find "$LOCK" -maxdepth 0 -mmin -1 2>/dev/null)" ]; then
    rmdir "$LOCK" 2>/dev/null || true
  fi
  sleep 0.2
done
[ "$acquired" = 1 ] || { echo "락 획득 실패 — $LOCK 을 확인하라" >&2; exit 1; }
trap 'rmdir "$LOCK" 2>/dev/null || true' EXIT

# ── 발급: 카운터와 로그 머리 중 큰 쪽 +1 (손으로 고쳐도 자가 치유) ──
prev_counter=0
[ -f "$COUNTER" ] && prev_counter=$(tr -dc '0-9' < "$COUNTER" || echo 0)
prev_head=$(head_num)
prev=$(( prev_counter > prev_head ? prev_counter : prev_head ))
num=$(( prev + 1 ))
printf '%s\n' "$num" > "$COUNTER"

# ── new면 엔트리를 첫 세션 헤딩 바로 위에 꽂는다 ──────────
if [ "${1}" = "new" ]; then
  WIN="${2:-}"; TITLE="${3:-/recall로 복원}"
  NUM="$num" WIN="$WIN" TITLE="$TITLE" LOGP="$LOG" python3 - <<'PY'
import os, re, datetime
log=os.environ['LOGP']; num=os.environ['NUM']
win=os.environ['WIN']; title=os.environ['TITLE']
today=datetime.date.today().isoformat()
s=open(log,encoding='utf-8').read()
m=re.search(r'(?m)^#{2,3} 세션 ?\d+', s)
head = f"## 세션 {num} — {today}" + (f" ({win})" if win else "") + f" | {title}"
entry = f"{head}\n\n- {title}\n\n"
if m:
    s = s[:m.start()] + entry + s[m.start():]
else:
    s = s.rstrip('\n') + '\n\n' + entry
open(log,'w',encoding='utf-8').write(s)
PY
fi

printf '%s\n' "$num"
