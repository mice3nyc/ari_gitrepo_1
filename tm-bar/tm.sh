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

# controlling tty 찾기 (focus용, §10). Bash 툴은 파이프라 $$ 자체는 "not a tty" →
# 부모 프로세스 체인을 올라가 첫 ttysNNN 을 잡는다(클로드 프로세스가 붙은 터미널).
find_tty() {
  local pid=$$ t pp i
  for i in 1 2 3 4 5 6 7 8 9 10; do
    read -r t pp <<<"$(ps -o tty=,ppid= -p "$pid" 2>/dev/null)"
    case "$t" in ttys*) echo "/dev/$t"; return 0;; esac
    [ -z "$pp" ] || [ "$pp" = "1" ] && return 1
    pid="$pp"
  done
  return 1
}

cmd="$1"; ID="$2"

case "$cmd" in
  register)
    valid_id "$ID" || { echo "ID는 A/B/C/D" >&2; exit 1; }
    f="$(wfile "$ID")"; now="$(date +%s)"; session="${3:-}"
    ts="${ITERM_SESSION_ID:-${TERM_SESSION_ID:-}}"   # 터미널 창 앵커 자동 캡처(§9)
    prog="${TERM_PROGRAM:-}"                          # 앱 구분 iTerm.app/Apple_Terminal(§10)
    tty="$(find_tty || true)"                         # controlling tty(focus 매칭 공통키, §10)
    d_in_file="$([ -f "$f" ] && "$JQ" -r '.date // ""' "$f" 2>/dev/null)"
    if [ ! -f "$f" ] || [ "$d_in_file" != "$TODAY" ]; then
      "$JQ" -n --arg id "$ID" --arg date "$TODAY" --arg s "$session" --arg ts "$ts" \
        --arg prog "$prog" --arg tty "$tty" --argjson now "$now" \
        '{id:$id, date:$date, session:$s, term_session:$ts, term_program:$prog, tty:$tty, project:"", status:"대기", state:"idle", updated_at:$now, state_at:$now, active:true, log:[]}' \
        > "$f"
    else
      "$JQ" --arg s "$session" --arg ts "$ts" --arg prog "$prog" --arg tty "$tty" --argjson now "$now" \
        '.active=true | .updated_at=$now
         | (if $s!="" then .session=$s else . end)
         | (if $ts!="" then .term_session=$ts else . end)
         | (if $prog!="" then .term_program=$prog else . end)
         | (if $tty!="" then .tty=$tty else . end)' \
        "$f" > "$f.tmp" && mv "$f.tmp" "$f"
    fi
    echo "창 $ID 등록"
    ;;

  term)
    # 자기 env의 터미널 앵커를 창 파일에 백필(register가 자동 하므로 보통 불필요)
    valid_id "$ID" || { echo "ID는 A/B/C/D" >&2; exit 1; }
    ts="${ITERM_SESSION_ID:-${TERM_SESSION_ID:-}}"
    [ -z "$ts" ] && { echo "터미널 앵커 없음(TERM_SESSION_ID/ITERM_SESSION_ID)" >&2; exit 1; }
    prog="${TERM_PROGRAM:-}"; tty="$(find_tty || true)"   # focus용 앱·tty도 함께 백필(§10)
    f="$(wfile "$ID")"; [ -f "$f" ] || "$0" register "$ID" >/dev/null
    "$JQ" --arg ts "$ts" --arg prog "$prog" --arg tty "$tty" \
      '.term_session=$ts
       | (if $prog!="" then .term_program=$prog else . end)
       | (if $tty!="" then .tty=$tty else . end)' \
      "$f" > "$f.tmp" && mv "$f.tmp" "$f"
    echo "창 $ID term_session=$ts${tty:+ tty=$tty}${prog:+ prog=$prog}"
    ;;

  focus)
    # 메뉴바 클릭 → 해당 창을 앞으로(cmd-tab처럼, §10). 저장된 term_program으로 앱을 갈라
    # tty(공통키) 또는 term_session UUID로 세션/탭을 찾아 select+activate.
    valid_id "$ID" || { echo "ID는 A/B/C/D" >&2; exit 1; }
    f="$(wfile "$ID")"; [ -f "$f" ] || { echo "창 $ID 미등록" >&2; exit 1; }
    prog="$("$JQ" -r '.term_program // ""' "$f")"
    tty="$("$JQ" -r '.tty // ""' "$f")"
    ts="$("$JQ" -r '.term_session // ""' "$f")"
    uuid="${ts##*:}"   # wXtXpX:UUID → UUID (프리픽스 없으면 그대로)
    [ -z "$tty" ] && [ -z "$uuid" ] && { echo "창 $ID: tty/UUID 없음 — 그 창에서 tm.sh term $ID 먼저" >&2; exit 1; }
    case "$prog" in
      Apple_Terminal)
        [ -z "$tty" ] && { echo "창 $ID(Terminal): tty 없음 — 그 창에서 tm.sh term $ID 먼저" >&2; exit 1; }
        /usr/bin/osascript <<OSA
tell application "Terminal"
  repeat with w in windows
    repeat with t in tabs of w
      if (tty of t) is "$tty" then
        set selected of t to true
        set frontmost of w to true
        activate
        return
      end if
    end repeat
  end repeat
end tell
OSA
        ;;
      *)  # iTerm.app(기본). tty 우선, 없으면 세션 UUID로 매칭.
        /usr/bin/osascript <<OSA
tell application "iTerm2"
  repeat with w in windows
    repeat with t in tabs of w
      repeat with s in sessions of t
        if (("$tty" is not "") and ((tty of s) is "$tty")) or (("$uuid" is not "") and ((id of s) is "$uuid")) then
          tell s to select
          tell t to select
          tell w to select
          activate
          return
        end if
      end repeat
    end repeat
  end repeat
end tell
OSA
        ;;
    esac
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
    echo "tm.sh {register <ID> [session] | log <ID> <project> <status> | set <ID> <project> <status> | note <ID> <msg> | state <ID> <working|attention|done> | term <ID> | focus <ID> | whoami <UUID> | whoami-term <anchor> | unregister <ID> | render | slot | flush [date]}" >&2
    exit 1
    ;;
esac
