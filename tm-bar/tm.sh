#!/bin/bash
# TM (TerminalMonitor) 상태 변경 헬퍼
# 사용: tm.sh {register <ID> [session] | log <ID> <project> <status> | set <ID> <project> <status>
#            | note <ID> <msg> | state <ID> <working|attention|done> | term <ID>
#            | whoami <UUID> | whoami-term <anchor> | unregister <ID> | render | slot | flush [YYYY-MM-DD]}
#   - 데이터: data/windows/{A,B,C,D}.json  (창별 현재 작업 + 당일 로그)
#   - 절대경로로 호출해야 settings allowlist 매칭 (cd 붙이지 말 것)
#   - ID = A/B/C/D

DIR="$(cd "$(dirname "$0")" && pwd)"
WIN_DIR="$DIR/data/windows"
mkdir -p "$WIN_DIR"
JQ=/usr/bin/jq
TODAY="$(date +%F)"

valid_id() { case "$1" in A|B|C|D) return 0;; *) return 1;; esac; }
wfile() { echo "$WIN_DIR/$1.json"; }

cmd="$1"; ID="$2"

case "$cmd" in
  register)
    valid_id "$ID" || { echo "ID는 A/B/C/D" >&2; exit 1; }
    f="$(wfile "$ID")"; now="$(date +%s)"; session="${3:-}"
    ts="${ITERM_SESSION_ID:-${TERM_SESSION_ID:-}}"   # 터미널 창 앵커 자동 캡처(§9)
    d_in_file="$([ -f "$f" ] && "$JQ" -r '.date // ""' "$f" 2>/dev/null)"
    if [ ! -f "$f" ] || [ "$d_in_file" != "$TODAY" ]; then
      "$JQ" -n --arg id "$ID" --arg date "$TODAY" --arg s "$session" --arg ts "$ts" --argjson now "$now" \
        '{id:$id, date:$date, session:$s, term_session:$ts, project:"", status:"대기", state:"idle", updated_at:$now, state_at:$now, active:true, log:[]}' \
        > "$f"
    else
      "$JQ" --arg s "$session" --arg ts "$ts" --argjson now "$now" \
        '.active=true | .updated_at=$now
         | (if $s!="" then .session=$s else . end)
         | (if $ts!="" then .term_session=$ts else . end)' \
        "$f" > "$f.tmp" && mv "$f.tmp" "$f"
    fi
    echo "창 $ID 등록"
    ;;

  term)
    # 자기 env의 터미널 앵커를 창 파일에 백필(register가 자동 하므로 보통 불필요)
    valid_id "$ID" || { echo "ID는 A/B/C/D" >&2; exit 1; }
    ts="${ITERM_SESSION_ID:-${TERM_SESSION_ID:-}}"
    [ -z "$ts" ] && { echo "터미널 앵커 없음(TERM_SESSION_ID/ITERM_SESSION_ID)" >&2; exit 1; }
    f="$(wfile "$ID")"; [ -f "$f" ] || "$0" register "$ID" >/dev/null
    "$JQ" --arg ts "$ts" '.term_session=$ts' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
    echo "창 $ID term_session=$ts"
    ;;

  whoami-term)
    # 터미널 앵커로 등록 창 ID 조회(훅→창 매핑, §9). 없으면 아무것도 출력 안 함.
    anchor="$2"; [ -z "$anchor" ] && exit 0
    shopt -s nullglob
    for f in "$WIN_DIR"/*.json; do
      t="$("$JQ" -r '.term_session // ""' "$f" 2>/dev/null)"
      a="$("$JQ" -r '.active' "$f" 2>/dev/null)"
      if [ -n "$t" ] && [ "$t" = "$anchor" ] && [ "$a" = "true" ]; then "$JQ" -r '.id' "$f"; exit 0; fi
    done
    ;;

  state)
    # 색 상태만 교체(working|attention|done). updated_at 안 건드림. 미등록 창이면 조용히 무시.
    valid_id "$ID" || { echo "ID는 A/B/C/D" >&2; exit 1; }
    st="$3"
    case "$st" in working|attention|done|idle) ;; *) echo "state는 working|attention|done|idle" >&2; exit 1;; esac
    f="$(wfile "$ID")"; now="$(date +%s)"
    [ -f "$f" ] || exit 0
    "$JQ" --arg st "$st" --argjson now "$now" '.state=$st | .state_at=$now' \
      "$f" > "$f.tmp" && mv "$f.tmp" "$f"
    ;;

  log|set)
    valid_id "$ID" || { echo "ID는 A/B/C/D" >&2; exit 1; }
    project="$3"; status="$4"
    [ -z "$status" ] && { echo "사용: tm.sh $cmd <ID> <project> <status>" >&2; exit 1; }
    f="$(wfile "$ID")"; now="$(date +%s)"; hm="$(date +%H:%M)"
    [ -f "$f" ] || "$0" register "$ID" >/dev/null
    if [ "$cmd" = "log" ]; then
      "$JQ" --arg p "$project" --arg st "$status" --arg t "$hm" --argjson now "$now" \
        '.project=$p | .status=$st | .updated_at=$now | .active=true
         | .log += [{t:$t, msg:$st}]' \
        "$f" > "$f.tmp" && mv "$f.tmp" "$f"
    else
      "$JQ" --arg p "$project" --arg st "$status" --argjson now "$now" \
        '.project=$p | .status=$st | .updated_at=$now | .active=true' \
        "$f" > "$f.tmp" && mv "$f.tmp" "$f"
    fi
    ;;

  note)
    valid_id "$ID" || { echo "ID는 A/B/C/D" >&2; exit 1; }
    msg="$3"; [ -z "$msg" ] && { echo "사용: tm.sh note <ID> <msg>" >&2; exit 1; }
    f="$(wfile "$ID")"; hm="$(date +%H:%M)"
    [ -f "$f" ] || "$0" register "$ID" >/dev/null
    "$JQ" --arg t "$hm" --arg m "$msg" '.log += [{t:$t, msg:$m}]' \
      "$f" > "$f.tmp" && mv "$f.tmp" "$f"
    ;;

  unregister)
    valid_id "$ID" || { echo "ID는 A/B/C/D" >&2; exit 1; }
    f="$(wfile "$ID")"
    [ -f "$f" ] && "$JQ" '.active=false' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
    echo "창 $ID 해제"
    ;;

  render)
    shopt -s nullglob
    files=("$WIN_DIR"/*.json)
    if [ ${#files[@]} -eq 0 ]; then echo '[]'; exit 0; fi
    "$JQ" -s --arg today "$TODAY" \
      '[ .[] | select(.date==$today and .active==true) ] | sort_by(.id)' \
      "${files[@]}"
    ;;

  slot)
    shopt -s nullglob
    used=""
    for f in "$WIN_DIR"/*.json; do
      a="$("$JQ" -r 'select(.date=="'"$TODAY"'" and .active==true) | .id' "$f" 2>/dev/null)"
      [ -n "$a" ] && used="$used $a"
    done
    for c in A B C D; do
      case " $used " in *" $c "*) ;; *) echo "$c"; exit 0;; esac
    done
    echo "A"  # 다 찼으면 A 제안
    ;;

  whoami)
    # 세션 UUID로 이미 등록된 창 ID를 찾는다(clear→recall 사이클 자동 복원용).
    # UUID가 같으면 같은 창(프로세스). 있으면 ID 출력, 없으면 아무것도 출력 안 함.
    uuid="$2"; [ -z "$uuid" ] && exit 0
    shopt -s nullglob
    for f in "$WIN_DIR"/*.json; do
      s="$("$JQ" -r '.session // ""' "$f" 2>/dev/null)"
      a="$("$JQ" -r '.active' "$f" 2>/dev/null)"
      if [ "$s" = "$uuid" ] && [ "$a" = "true" ]; then "$JQ" -r '.id' "$f"; exit 0; fi
    done
    ;;

  flush)
    DATE="${2:-$TODAY}"
    shopt -s nullglob
    files=("$WIN_DIR"/*.json)
    [ ${#files[@]} -eq 0 ] && { echo "(로그 없음)"; exit 0; }
    for f in "${files[@]}"; do
      match="$("$JQ" -r --arg d "$DATE" 'select(.date==$d and (.log|length>0)) | .id' "$f" 2>/dev/null)"
      [ -z "$match" ] && continue
      id="$("$JQ" -r '.id' "$f")"
      proj="$("$JQ" -r '.project // ""' "$f")"
      echo "#### 창 $id${proj:+ — $proj}"
      "$JQ" -r '.log[] | "- " + .t + "  " + .msg' "$f"
      echo ""
    done
    ;;

  *)
    echo "tm.sh {register <ID> [session] | log <ID> <project> <status> | set <ID> <project> <status> | note <ID> <msg> | state <ID> <working|attention|done> | term <ID> | whoami <UUID> | whoami-term <anchor> | unregister <ID> | render | slot | flush [date]}" >&2
    exit 1
    ;;
esac
