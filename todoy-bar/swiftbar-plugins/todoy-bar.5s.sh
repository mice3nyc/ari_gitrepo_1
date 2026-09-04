#!/bin/bash
# <xbar.title>todoy-bar</xbar.title>
# <xbar.version>v1</xbar.version>
# <xbar.author>아리공</xbar.author>
# <xbar.desc>오늘 할 일 체크리스트 — now-bar의 짝(계획축)</xbar.desc>
#
# 오늘 할 일을 메뉴바에. ACTIVE 항목 + 완료 진행을 흘끗 보고, 클릭으로 전환/완료.

# ⏱️ 출장 TZ 고정 (2026-09-03 ~ 09-08, 프랑크푸르트) — 귀국 시 이 세 줄을 삭제한다.
#   .claude/settings.json의 env.TZ는 «클로드코드가 부르는 셸»에만 걸린다. 시스템 TZ는 Asia/Seoul이고
#   SwiftBar는 GUI 앱이라 그 env를 안 받으므로, 날짜를 읽는 스크립트가 직접 박는다. (2026-09-04 창A)
export TZ=Europe/Berlin

TODOY="/Users/p.air15/Neo-Obsi-Sync/_dev/todoy-bar/todoy.sh"
JQ=/usr/bin/jq
OPEN=/usr/bin/open
DATA_DIR="/Users/p.air15/Neo-Obsi-Sync/_dev/todoy-bar/data"

DATA="$("$TODOY" render 2>/dev/null)"
[ -z "$DATA" ] && DATA='[]'

fmt() { # 초 -> 사람이 읽는 시간
  local s=${1:-0}; local m=$(( s / 60 )); local h=$(( m / 60 ))
  if   [ "$h" -gt 0 ]; then echo "${h}h$(( m % 60 ))m"
  elif [ "$m" -gt 0 ]; then echo "${m}m"
  else echo "${s}s"; fi
}

# dropped(오늘 안 하기로 뺀 것)는 진행률의 대상이 아니다 — 분모에서도 뺀다.
# 데이터에는 남아 있고 아래 접힌 줄로만 보인다. SPEC §빼기 참조.
LIVE="$(echo "$DATA" | "$JQ" '[.[] | select(.dropped != true)]')"
DROPPED="$(echo "$DATA" | "$JQ" '[.[] | select(.dropped == true)]')"
# carried_from(YYYY-MM-DD) -> 오늘까지 며칠. 값이 없거나 파싱 실패면 0.
# 오늘의 기준은 todoy.sh와 같은 4시 경계다(자정 직후에 나이가 하루 튀지 않게).
age_days() {
  local from="$1"
  [ -z "$from" ] && { echo 0; return; }
  local f t
  f="$(date -j -f "%Y-%m-%d" "$from" "+%s" 2>/dev/null)" || { echo 0; return; }
  t="$(date -j -f "%Y-%m-%d" "$(date -v-4H +%F)" "+%s" 2>/dev/null)" || { echo 0; return; }
  echo $(( (t - f) / 86400 ))
}

total="$(echo "$LIVE" | "$JQ" 'length')"
done_count="$(echo "$LIVE" | "$JQ" '[.[] | select(.done==true)] | length')"
dropped_count="$(echo "$DROPPED" | "$JQ" 'length')"
active_line="$(echo "$LIVE" | "$JQ" -r '.[] | select(.active==true) | [.text, (.live_seconds|tostring)] | @tsv' | head -1)"

# ── 메뉴바 ── (now-bar와 구분: 체크리스트 정체성 = 진행률 앞세움, ✓ 아이콘)
# 노치 화면 대비 최소 폭 (피터공 26.0705): 오늘{완료}/{전체}
echo "오늘${done_count}/${total} | size=14"

echo "---"
echo "오늘 할 일  ${done_count}/${total} 완료 | size=12 color=gray"
echo "---"

# ── 항목들 ──
# 완료 항목은 «지우지 않고 접는다»(2026-08-25). 목록이 길어지는 것은 보기의 문제라
# 표시에서만 접고, 데이터는 그대로 둔다 — 완료 항목이 진행률의 분자라 파일에서 빼면
# 카운터가 0/N이 되어 "오늘 뭘 했다"가 같이 사라진다. SPEC 참조.
undone_count="$(echo "$LIVE" | "$JQ" '[.[] | select(.done==false)] | length')"

if [ "$total" -eq 0 ] && [ "$dropped_count" -eq 0 ]; then
  echo "(할 일 없음 — 아래에서 추가) | size=12 color=gray"
else
  if [ "$undone_count" -eq 0 ]; then
    echo "오늘 할 일 전부 완료 | size=12 color=gray"
  fi
  # 미완료만 본 목록에 그린다
  echo "$LIVE" | "$JQ" -r '.[] | select(.done==false) | [.id, .text, (.active|tostring), (.switches|tostring), (.live_seconds|tostring), (.carried_from // "")] | @tsv' \
  | while IFS=$'\t' read -r id text active switches lsec cfrom; do
      meta=""
      if [ "${switches:-0}" -gt 0 ]; then meta="  ×${switches} $(fmt "$lsec")"; fi
      # 3일 이상 밀린 항목만 나이를 붙인다. 전부 붙이면 시끄럽고, 3일은 DN 이월 스캔과 같은 선.
      age="$(age_days "$cfrom")"
      if [ "$age" -ge 3 ]; then meta="${meta}  +${age}일"; fi
      # 메인 라인 클릭 = ACTIVE(지금 작업으로). 완료는 서브메뉴. ☐는 상태 표시.
      # ACTIVE = 파랑+볼드(md).
      line_color=""; line_extra=""; text_disp="$text"
      if [ "$active" = "true" ]; then
        line_color=" color=#1100ff"; line_extra=" md=true"; text_disp="**${text}**"
      fi
      echo "☐ ${text_disp}${meta} | size=13${line_color}${line_extra} bash=$TODOY param1=activate param2=$id terminal=false refresh=true"
      echo "-- ☑ 완료로 표시 | bash=$TODOY param1=done param2=$id terminal=false refresh=true"
      echo "-- ✕ 오늘 안 함 | bash=$TODOY param1=drop param2=$id terminal=false refresh=true"
      if [ "$active" = "true" ]; then
        echo "-- ⏸ 지금 작업 해제 | bash=$TODOY param1=activate param2=$id terminal=false refresh=true"
      fi
    done

  # 완료분 = 접힌 한 줄 + 서브메뉴 (클릭 = 완료 취소)
  if [ "$done_count" -gt 0 ]; then
    echo "---"
    echo "☑ 완료 ${done_count}건 | size=13 color=#009443"
    echo "-- 클릭하면 완료 취소 | size=11 color=gray"
    echo "$LIVE" | "$JQ" -r '.[] | select(.done==true) | [.id, .text, (.switches|tostring), (.live_seconds|tostring)] | @tsv' \
    | while IFS=$'\t' read -r id text switches lsec; do
        meta=""
        if [ "${switches:-0}" -gt 0 ]; then meta="  ×${switches} $(fmt "$lsec")"; fi
        echo "-- ☑ ${text}${meta} | size=13 color=#009443 bash=$TODOY param1=done param2=$id terminal=false refresh=true"
      done
  fi

  # 뺀 항목 = 접힌 한 줄 + 서브메뉴 (클릭 = 되돌리기). 완료 초록·ACTIVE 파랑과 갈리게 회색.
  if [ "$dropped_count" -gt 0 ]; then
    echo "---"
    echo "✕ 뺀 항목 ${dropped_count}건 | size=13 color=#888888"
    echo "-- 클릭하면 오늘 목록으로 되돌립니다 | size=11 color=gray"
    echo "$DROPPED" | "$JQ" -r '.[] | [.id, .text] | @tsv' \
    | while IFS=$'\t' read -r id text; do
        echo "-- ✕ ${text} | size=13 color=#888888 bash=$TODOY param1=undrop param2=$id terminal=false refresh=true"
      done
  fi
fi

echo "---"
echo "＋ 할 일 추가 | bash=$TODOY param1=add-dialog terminal=false refresh=true"
echo "✎ 편집창 열기 (여러 개 몰아서) | bash=$TODOY param1=edit terminal=false"
echo "데이터 폴더 열기 | bash=$OPEN param1=$DATA_DIR terminal=false"
echo "새로고침 | refresh=true"
