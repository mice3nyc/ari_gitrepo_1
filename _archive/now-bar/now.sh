#!/bin/bash
# now-bar status 한 줄 append 헬퍼
# 사용: now.sh "짧은라벨" "헤드라인" "디테일(선택)" "태그(선택)"
#   - ts는 현재 시각으로 자동 기록
#   - 아리공이 굵직한 작업/주제 전환마다 호출 (매 tool마다 X)

DIR="$(cd "$(dirname "$0")" && pwd)"
FILE="$DIR/now_status.jsonl"

SHORT="$1"
HEADLINE="$2"
DETAIL="$3"
TAG="$4"

if [ -z "$SHORT" ]; then
  echo "사용: now.sh \"짧은라벨\" \"헤드라인\" \"디테일(선택)\" \"태그(선택)\"" >&2
  exit 1
fi

# 헤드라인 비면 짧은라벨로 채움
[ -z "$HEADLINE" ] && HEADLINE="$SHORT"

TS="$(date "+%Y-%m-%dT%H:%M:%S")"

# JSON 문자열용 최소 이스케이프 (백슬래시, 큰따옴표)
esc() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

printf '{"ts":"%s","short":"%s","headline":"%s","detail":"%s","tag":"%s"}\n' \
  "$TS" "$(esc "$SHORT")" "$(esc "$HEADLINE")" "$(esc "$DETAIL")" "$(esc "$TAG")" \
  >> "$FILE"

echo "기록: $TS · $SHORT"
tail -1 "$FILE"
