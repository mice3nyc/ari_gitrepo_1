#!/bin/bash
# TM 색 상태 훅 디스패처 (§9)
# 클로드코드 훅 4종이 호출: Stop→done / Notification→attention* / UserPromptSubmit→working / PostToolUse→resume
#   settings.local.json 예: {"type":"command","command":".../tm-hook.sh done","async":true,"timeout":5}
# resume = 승인 복귀(§9): YES(권한 승인)→도구 실행→PostToolUse 발동. 지금 빨강일 때만 파랑으로(그 외 no-op).
#   PostToolUse는 매 툴콜 발동이므로 "attention일 때만" 조건이 필수(§6 안전선). UserPromptSubmit의 working은 무조건이라 별도 키로 분리.
# 동작: 훅 stdin(JSON) 흡수 → 자기 env의 터미널 앵커로 창 매핑 → tm.sh state.
#   매핑 실패(미등록 창·앵커 없음)면 조용히 종료(no-op). 훅은 무해해야 하므로 항상 exit 0.
#
# 상태 의미(피터공 모델 26.0709):
#   🔵 working   = 진행 중(실제 처리 중)          — UserPromptSubmit
#   🟢 done      = 시킨 일이 끝남(당신 차례)        — Stop
#   ⚫ idle       = 그냥 대기(중립, register 초기값)  — (유휴 알림은 상태 안 바꿈)
#   🔴 attention = YES 눌러야 넘어가는 블록(권한)   — Notification(권한)
# * Notification 훅은 (1)권한 프롬프트 와 (2)60초 유휴 알림 양쪽에 발동한다.
#   메시지를 보고 갈라, 권한은 attention(빨강), 유휴는 no-op(완료 초록을 안 덮음).
#   → "완료(초록)는 다음 지시 전까지 유지"(26.0709 피터공). idle은 register 초기 중립값으로만 남음.
STATE="${1:-working}"
JSON="$(cat 2>/dev/null)"   # 훅 stdin(JSON) 흡수 + 내용 검사용 보관
DIR="$(cd "$(dirname "$0")" && pwd)"
TM="$DIR/tm.sh"
JQ=/usr/bin/jq

anchor="${ITERM_SESSION_ID:-${TERM_SESSION_ID:-}}"
[ -z "$anchor" ] && exit 0
id="$("$TM" whoami-term "$anchor" 2>/dev/null)"
[ -z "$id" ] && exit 0

if [ "$STATE" = "resume" ]; then
  # 승인 복귀: 지금 빨강(attention)일 때만 파랑으로. 그 외(파랑·초록·검정)면 no-op → 매 툴콜 파일 쓰기 방지.
  cur="$("$JQ" -r '.state // ""' "$DIR/data/windows/$id.json" 2>/dev/null)"
  [ "$cur" = "attention" ] || exit 0
  "$TM" state "$id" working 2>/dev/null
  exit 0
fi

if [ "$STATE" = "attention" ]; then
  msg="$(printf '%s' "$JSON" | "$JQ" -r '.message // ""' 2>/dev/null)"
  # 진단 로그(실제 메시지 문자열 확인용, 가벼움). 패턴 확정되면 제거 가능.
  echo "$(date '+%F %T')  $id  :: $msg" >> "$DIR/data/notif.log" 2>/dev/null
  case "$msg" in
    *"waiting for your input"*|*"waiting for input"*|*"is idle"*|*"입력"*|*"기다리"*)
      exit 0 ;;   # 유휴 알림 = no-op. 완료(초록)를 덮지 않고 그대로 유지. 빨강도 아님.
  esac
fi

"$TM" state "$id" "$STATE" 2>/dev/null
exit 0
