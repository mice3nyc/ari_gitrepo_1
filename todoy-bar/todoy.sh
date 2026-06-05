#!/bin/bash
# todoy-bar 상태 변경 헬퍼
# 사용: todoy.sh {setup | add <텍스트> | add-dialog | activate <id> | done <id> | carryover | render}
#   - 데이터: data/YYYY-MM-DD.json (오늘 날짜)
#   - 시간은 epoch초로 누적. active 구간이 끝날 때 정산.
#   - 절대경로로 호출해야 settings allowlist 매칭 (cd 붙이지 말 것)

DIR="$(cd "$(dirname "$0")" && pwd)"
DATA_DIR="$DIR/data"
mkdir -p "$DATA_DIR"
TODAY="$(date +%F)"
FILE="$DATA_DIR/$TODAY.json"
JQ=/usr/bin/jq

ensure_file() { [ -f "$FILE" ] || echo '[]' > "$FILE"; }

cmd="$1"
case "$cmd" in
  setup)
    if [ ! -f "$FILE" ]; then
      echo '[]' > "$FILE"
      # 직전 날짜 파일의 미완료 항목 이월 (상태 초기화)
      prev="$(ls "$DATA_DIR"/*.json 2>/dev/null | grep -v "/$TODAY.json" | sort | tail -1)"
      if [ -n "$prev" ] && [ -f "$prev" ]; then
        "$JQ" '[.[] | select(.done==false)
                | {id, text, done:false, active:false, switches:0, seconds:0, active_since:null, carried:true}]' \
          "$prev" > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"
      fi
    fi
    cat "$FILE"
    ;;

  add)
    ensure_file
    text="$2"
    [ -z "$text" ] && { echo "텍스트 필요" >&2; exit 1; }
    id="i${RANDOM}${RANDOM}"
    "$JQ" --arg id "$id" --arg t "$text" \
      '. + [{id:$id, text:$t, done:false, active:false, switches:0, seconds:0, active_since:null, carried:false}]' \
      "$FILE" > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"
    echo "추가: $text"
    ;;

  add-dialog)
    ensure_file
    text="$(osascript -e 'try' \
      -e 'text returned of (display dialog "오늘 할 일 추가" default answer "" buttons {"취소","추가"} default button "추가")' \
      -e 'end try' 2>/dev/null)"
    [ -z "$text" ] && exit 0
    "$0" add "$text"
    ;;

  activate)
    ensure_file
    id="$2"
    now="$(date +%s)"
    "$JQ" --arg id "$id" --argjson now "$now" '
      map(
        if .id == $id then
          if .active == true then
            (.seconds += ($now - (.active_since // $now)) | .active=false | .active_since=null)
          else
            (.active=true | .active_since=$now | .switches += 1)
          end
        elif .active == true then
          (.seconds += ($now - (.active_since // $now)) | .active=false | .active_since=null)
        else . end
      )' "$FILE" > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"
    ;;

  done)
    ensure_file
    id="$2"
    now="$(date +%s)"
    "$JQ" --arg id "$id" --argjson now "$now" '
      map(if .id == $id then
        (if .active == true then .seconds += ($now - (.active_since // $now)) else . end)
        | .done = (.done | not) | .active=false | .active_since=null
      else . end)' "$FILE" > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"
    ;;

  carryover)
    [ -f "$FILE" ] && "$JQ" -r '.[] | select(.done==false) | "- " + .text' "$FILE"
    ;;

  render)
    ensure_file
    now="$(date +%s)"
    "$JQ" --argjson now "$now" \
      'map(.live_seconds = (.seconds + (if .active then ($now - (.active_since // $now)) else 0 end)))' \
      "$FILE"
    ;;

  *)
    echo "todoy.sh {setup | add <텍스트> | add-dialog | activate <id> | done <id> | carryover | render}" >&2
    exit 1
    ;;
esac
