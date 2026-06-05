#!/bin/bash
# PreToolUse hook — Edit/Write/MultiEdit에서 wordlist 단어 차단 + 문맥별 대체어 안내
# wordlist 형식: 단어<TAB>대체어들 (TSV)
# 양옆이 한글 아닐 때만 매칭 → 인명·명사 통과

WORDS_FILE="/Users/p.air15/Neo-Obsi-Sync/_dev/scripts/blocked_bak_words.txt"
SELF="/Users/p.air15/Neo-Obsi-Sync/_dev/scripts/block_bak_hook.sh"

input=$(cat)
file_path=$(echo "$input" | jq -r '.tool_input.file_path // ""')
case "$file_path" in
  "$WORDS_FILE"|"$SELF") exit 0 ;;
esac

if [ ! -f "$WORDS_FILE" ]; then
  exit 0
fi

# 첫 컬럼(단어)만 추출 패턴 생성
WORDS=$(awk -F'\t' '$0 !~ /^[[:space:]]*#/ && NF>0 && $1 !~ /^[[:space:]]*$/ {print $1}' "$WORDS_FILE" | paste -sd '|' -)
if [ -z "$WORDS" ]; then
  exit 0
fi

JOSA="(은|는|이|가|을|를|에|에서|의|도|와|과|로|으로|만|이라|이라는|이다|이며|이지|이고|이라고|에게|한테|보다|마저|조차|밖에|뿐|에선|이란)"
PATTERN="(^|[^가-힣])(${WORDS})${JOSA}?([^가-힣]|$)"

text=$(echo "$input" | jq -r '(.tool_input.new_string // "") + " " + (.tool_input.content // "") + " " + ((.tool_input.edits // []) | map(.new_string) | join(" "))')

matched=$(echo "$text" | grep -oE "$PATTERN" | head -1)
if [ -n "$matched" ]; then
  word=$(echo "$matched" | grep -oE "(${WORDS})" | head -1)
  # 매칭 단어의 대체어 후보 lookup
  alternatives=$(awk -F'\t' -v w="$word" '$1 == w {print $2; exit}' "$WORDS_FILE")
  if [ -z "$alternatives" ]; then
    alternatives="기록·적음·자리잡음 등 문맥에 맞는 어휘"
  fi
  reason="금지 어휘 '${word}' 검출. 의도된 의미를 정확히: ${alternatives}. 단순 대체가 아니라 문맥에 맞는 어휘로 다시 표현."
  jq -n --arg r "$reason" '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'
fi
exit 0
