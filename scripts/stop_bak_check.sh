#!/bin/bash
# Stop hook — 어시스턴트 응답 완료 시 마지막 메시지에서 금지 어휘('박' 활용형) 검출
# 검출 시: (a) /tmp 로그 기록 (b) 다음 턴 시스템 메시지 inject (모델 재실행 안 함)
# 어시스턴트 텍스트 자기 검열 실패 사후 알림용 — PreToolUse hook은 도구 입력만 검사하므로 응답 텍스트 못 막음

WORDS_FILE="/Users/p.air15/Neo-Obsi-Sync/_dev/scripts/blocked_bak_words.txt"
LOG_FILE="/tmp/bak_violations.log"

input=$(cat)
transcript_path=$(echo "$input" | jq -r '.transcript_path // ""')

if [ ! -f "$transcript_path" ] || [ ! -f "$WORDS_FILE" ]; then
  exit 0
fi

# 마지막 assistant 메시지의 text content 전체 추출 (도구 호출 제외)
last_text=$(jq -s 'map(select(.type == "assistant")) | last | .message.content[]? | select(.type == "text") | .text' "$transcript_path" 2>/dev/null | tr -d '\n' | sed 's/\\n/ /g')

if [ -z "$last_text" ] || [ "$last_text" = "null" ]; then
  exit 0
fi

WORDS=$(awk -F'\t' '$0 !~ /^[[:space:]]*#/ && NF>0 && $1 !~ /^[[:space:]]*$/ {print $1}' "$WORDS_FILE" | paste -sd '|' -)
if [ -z "$WORDS" ]; then
  exit 0
fi

JOSA="(은|는|이|가|을|를|에|에서|의|도|와|과|로|으로|만|이라|이라는|이다|이며|이지|이고|이라고|에게|한테|보다|마저|조차|밖에|뿐|에선|이란)"
PATTERN="(^|[^가-힣])(${WORDS})${JOSA}?([^가-힣]|$)"

matched=$(echo "$last_text" | grep -oE "$PATTERN" | head -5)
if [ -n "$matched" ]; then
  ts=$(date '+%Y-%m-%d %H:%M:%S')
  words_found=$(echo "$matched" | grep -oE "(${WORDS})" | sort -u | paste -sd ', ' -)
  echo "[$ts] detected: ${words_found} | sample: $(echo "$matched" | head -2 | tr '\n' ' / ')" >> "$LOG_FILE"

  reason="직전 응답 자기 검열 실패 — 금지 어휘 검출: ${words_found}. 다음 응답은 의식적으로 다른 표현 선택. 대체어: 기록·적음·자리잡음·추가·새겨짐 등 문맥에 맞게."
  jq -n --arg c "$reason" '{continue:true, hookSpecificOutput:{hookEventName:"Stop", additionalContext:$c}}'
fi
exit 0
