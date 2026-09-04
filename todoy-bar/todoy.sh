#!/bin/bash
# todoy-bar 상태 변경 헬퍼
# 사용: todoy.sh {setup | add <텍스트> | add-dialog | activate <id> | done <id> | drop <id> | undrop <id> | carryover | render}
#   - 데이터: data/YYYY-MM-DD.json (오늘 날짜)
#   - 시간은 epoch초로 누적. active 구간이 끝날 때 정산.
#   - 절대경로로 호출해야 settings allowlist 매칭 (cd 붙이지 말 것)

# ⏱️ 출장 TZ 고정 (2026-09-03 ~ 09-08, 프랑크푸르트) — 귀국 시 이 세 줄을 삭제한다.
#   .claude/settings.json의 env.TZ는 «클로드코드가 부르는 셸»에만 걸린다. 시스템 TZ는 Asia/Seoul이고
#   SwiftBar는 GUI 앱이라 그 env를 안 받으므로, 날짜를 읽는 스크립트가 직접 박는다. (2026-09-04 창A)
export TZ=Europe/Berlin

DIR="$(cd "$(dirname "$0")" && pwd)"
# TODOY_DATA_DIR가 있으면 그쪽을 쓴다 — 검증 하니스가 실데이터에 «닿을 수 없게» 하기 위한 것.
# 조심하는 것이 아니라 길을 끊는다(검사는 자기가 밖으로 밀어낸 것을 안 본다).
DATA_DIR="${TODOY_DATA_DIR:-$DIR/data}"
mkdir -p "$DATA_DIR"
# 2026-07-27 원복 — 7/17 뉴욕 출장 임시 패치(TZ=America/New_York) 해제. 7/25 귀국.
# 해외 체류 시에는 TZ만 앞에 붙인다: TODAY="$(TZ=<현지TZ> date -v-4H +%F)". 귀국 즉시 이 줄로 원복.
# 2026-08-12 — 날짜 경계를 자정에서 오전 4시로. 00:00~03:59는 아직 '어제'(피터공이 자정 넘겨 일하는 날이 잦다).
# 경계는 '그 시각에 도는 무엇'이 아니라 '지금이 몇 시냐를 계산하는 식'이라, 4시에 컴이 꺼져 있었어도 정상 동작한다. SPEC 참조.
TODAY="$(date -v-4H +%F)"
FILE="$DATA_DIR/$TODAY.json"
JQ=/usr/bin/jq

ensure_file() { [ -f "$FILE" ] || echo '[]' > "$FILE"; }

cmd="$1"
case "$cmd" in
  setup)
    # 멱등 이월 — 오늘 파일이 이미 있어도 돈다.
    # 조건이 "파일 없으면"이던 시절엔, 자정 렌더나 굿모닝 전 add로 파일이 먼저 생기면 이월이 통째로 죽었다.
    # 실제로 물어야 할 것은 "이월을 아직 안 했는가"라서, 오늘에 없는 text만 덧붙이는 방식으로 바꿨다. (2026-08-12)
    ensure_file
    prev="$(ls "$DATA_DIR"/*.json 2>/dev/null | grep -v "/$TODAY.json" | sort | tail -1)"
    if [ -n "$prev" ] && [ -f "$prev" ]; then
      prev_date="$(basename "$prev" .json)"
      "$JQ" -s --arg pd "$prev_date" '
        .[0] as $today | .[1] as $prev
        | ($today | map(.text)) as $have
        | $today + [ $prev[]
            | select(.done==false)
            | select(.dropped != true)
            | select(.text as $t | $have | index($t) | not)
            | {id, text, done:false, active:false, switches:0, seconds:0, active_since:null,
               carried:true, carried_from:(.carried_from // $pd), dropped:false, dropped_at:null} ]' \
        "$FILE" "$prev" > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"
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

  drop)
    # 「오늘 안 함」으로 뺀다. 지우지 않고 표시만 — 데이터에는 남아 그날의 기록이 된다.
    # 완료 항목은 거부한다: 완료는 진행률의 «분자»이고 drop은 「안 한다」라서 둘은 배타적이다.
    ensure_file
    id="$2"
    [ -z "$id" ] && { echo "id 필요" >&2; exit 1; }
    if ! "$JQ" -e --arg id "$id" 'any(.[]; .id == $id)' "$FILE" >/dev/null; then
      echo "그런 id가 오늘 목록에 없다: $id" >&2; exit 1
    fi
    if "$JQ" -e --arg id "$id" 'any(.[]; .id == $id and .done == true)' "$FILE" >/dev/null; then
      echo "완료 항목은 뺄 수 없다. 먼저 완료를 취소한다(done $id)." >&2; exit 1
    fi
    now="$(date +%s)"
    "$JQ" --arg id "$id" --argjson now "$now" '
      map(if .id == $id then
        (if .active == true then .seconds += ($now - (.active_since // $now)) else . end)
        | .dropped = true | .dropped_at = $now | .active = false | .active_since = null
      else . end)' "$FILE" > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"
    ;;

  undrop)
    ensure_file
    id="$2"
    [ -z "$id" ] && { echo "id 필요" >&2; exit 1; }
    if ! "$JQ" -e --arg id "$id" 'any(.[]; .id == $id)' "$FILE" >/dev/null; then
      echo "그런 id가 오늘 목록에 없다: $id" >&2; exit 1
    fi
    "$JQ" --arg id "$id" '
      map(if .id == $id then (.dropped = false | .dropped_at = null) else . end)' \
      "$FILE" > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"
    ;;

  carryover)
    [ -f "$FILE" ] && "$JQ" -r '.[] | select(.done==false) | select(.dropped != true) | "- " + .text' "$FILE"
    ;;

  render)
    # ⚠️ ensure_file 부르지 않는다 — 읽기는 쓰기를 하지 않는다.
    # 플러그인이 5초마다 부르므로, 여기서 파일을 만들면 자정 렌더가 빈 오늘 파일을 낳고
    # 그게 setup의 이월 조건을 뒤집는다(2026-08-12 이월 12건 유실). SPEC 참조.
    [ -f "$FILE" ] || { echo '[]'; exit 0; }
    now="$(date +%s)"
    "$JQ" --argjson now "$now" \
      'map(.live_seconds = (.seconds + (if .active then ($now - (.active_since // $now)) else 0 end)))' \
      "$FILE"
    ;;

  sync)
    # 옵시디언 미러 노트 <-> json 양방향 병합
    shift
    /usr/bin/python3 "$DIR/sync.py" "$@"
    ;;

  edit)
    # 배치 편집창 (로컬 웹). detached로 띄워 SwiftBar 갱신을 막지 않음.
    ensure_file
    /usr/bin/python3 "$DIR/edit_server.py" >/dev/null 2>&1 &
    ;;

  *)
    echo "todoy.sh {setup | add <텍스트> | add-dialog | activate <id> | done <id> | drop <id> | undrop <id> | carryover | render | sync | edit}" >&2
    exit 1
    ;;
esac
