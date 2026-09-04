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
#
# ── 빈 엔트리 재사용 (2026-08-16 신설) ────────────────────
#   new에 창 이름이 주어지면, 그 창의 «오늘» 엔트리 중 본문이 씨앗 한 줄뿐인 것을
#   찾아 새 번호를 발급하지 않고 그것을 돌려준다.
#   왜: /recall이 엔트리를 만들고 /memento가 채우는데, 화면을 비우려고 /clear만 하면
#       그 엔트리는 빈 채로 남고 다음 /recall이 새 번호를 판다. 창 하나가 하루 네 번
#       비우면 빈 엔트리가 셋 생긴다(8/15 창C 882·886·889·890이 그 모양).
#       피터공 판단(8/16): 창을 연 횟수는 정보가 아니다. 빈 자리는 유지할 이유가 없다.
#   안전선: ①창 이름을 모르면(빈 값·`?` 포함) 재사용하지 않는다 — 남의 자리를 집을 수 있다
#          ②본문이 씨앗 한 줄일 때만. 한 줄이라도 더 적혔으면 그 창이 일한 것이라 안 건드린다
#          ③재사용 시 헤딩을 고치지 않는다 — 제목은 /memento가 마지막에 쓴다

set -euo pipefail

VAULT="/Users/p.air15/Neo-Obsi-Sync"
# SESSION_LOG_DIR은 픽스처 테스트용 우회로다 (평소엔 비워 둔다)
BASE="${SESSION_LOG_DIR:-$VAULT/_클로드코드노트}"
LOG="$BASE/클로드코드 세션 로그.md"
COUNTER="$BASE/.session_counter"
LOCK="$BASE/.session_num.lock"

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
# ⚠️ 이 락은 vault_write.py와 «공유»한다 (2026-08-23). 세션 로그 한 파일에 락이
#    둘이면 상호 배제가 성립하지 않아, recall의 채번과 memento의 본문 채우기가
#    그대로 겹친다. 프로토콜도 맞춘다: 락 안에 PID를 적고, 회수 전에 그 PID가
#    살아 있는지 본다(맥북이 쓰기 도중 잠들면 «1분 지났으니 죽었다»가 틀린 판정).
#    사양: _dev/scripts/SPEC-vault_write.md §5
acquired=0
for _ in $(seq 1 50); do
  if mkdir "$LOCK" 2>/dev/null; then echo $$ > "$LOCK/pid"; acquired=1; break; fi
  if [ -d "$LOCK" ]; then
    lpid=$(cat "$LOCK/pid" 2>/dev/null || true)
    if [ -n "$lpid" ]; then
      # PID가 있으면 «살아 있는가»만 본다
      kill -0 "$lpid" 2>/dev/null || rm -rf "$LOCK"
    elif [ -z "$(find "$LOCK" -maxdepth 0 -mmin -1 2>/dev/null)" ]; then
      # PID 없는 옛 형식 — 60초 넘었으면 죽은 것으로 본다
      rm -rf "$LOCK" 2>/dev/null || true
    fi
  fi
  sleep 0.2
done
[ "$acquired" = 1 ] || { echo "락 획득 실패 — $LOCK 을 확인하라" >&2; exit 1; }
trap 'rm -rf "$LOCK" 2>/dev/null || true' EXIT

# ── new: 이 창의 오늘 빈 엔트리가 있으면 재사용하고 끝낸다 ──
if [ "${1}" = "new" ]; then
  WIN_CHK="${2:-}"
  case "$WIN_CHK" in
    ""|*"?"*) ;;   # 창 이름을 모르면 재사용하지 않는다
    *)
      reuse=$(WIN="$WIN_CHK" LOGP="$LOG" python3 - <<'PY'
import os, re, datetime
log=os.environ['LOGP']; win=os.environ['WIN']
today=datetime.date.today().isoformat()
s=open(log,encoding='utf-8').read()
heads=[(m.start(), m.end(), m.group(0), int(m.group(1)))
       for m in re.finditer(r'(?m)^#{2,3} 세션 ?(\d+).*$', s)]
for i,(st,en,txt,num) in enumerate(heads):
    if today not in txt or f"({win})" not in txt:
        continue
    nxt = heads[i+1][0] if i+1 < len(heads) else len(s)
    lines=[l for l in s[en:nxt].strip().splitlines()
           if l.strip() and l.strip() != '---']
    # 씨앗 줄은 헤딩 제목과 글자가 같다 — 이 스크립트가 `| {제목}` + `- {제목}`으로 꽂기 때문.
    # 「한 줄뿐」로 판정하면 «- 완료: 배포» 한 줄 적고 닫은 창까지 집는다(픽스처에서 실측).
    title = txt.split('|', 1)[1].strip() if '|' in txt else None
    if title and len(lines)==1 and lines[0].strip() == f"- {title}":
        print(num)
    break          # 첫 매치(=가장 최신)만 본다. 그 아래는 지난 세션이다
PY
)
      if [ -n "$reuse" ]; then
        echo "재사용: 세션 $reuse — $WIN_CHK 의 오늘 빈 엔트리를 다시 쓴다 (새 번호 발급 안 함)" >&2
        printf '%s\n' "$reuse"
        exit 0
      fi ;;
  esac
fi

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
