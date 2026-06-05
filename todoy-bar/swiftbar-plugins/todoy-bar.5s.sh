#!/bin/bash
# <xbar.title>todoy-bar</xbar.title>
# <xbar.version>v1</xbar.version>
# <xbar.author>아리공</xbar.author>
# <xbar.desc>오늘 할 일 체크리스트 — now-bar의 짝(계획축)</xbar.desc>
#
# 오늘 할 일을 메뉴바에. ACTIVE 항목 + 완료 진행을 흘끗 보고, 클릭으로 전환/완료.

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

total="$(echo "$DATA" | "$JQ" 'length')"
done_count="$(echo "$DATA" | "$JQ" '[.[] | select(.done==true)] | length')"
active_line="$(echo "$DATA" | "$JQ" -r '.[] | select(.active==true) | [.text, (.live_seconds|tostring)] | @tsv' | head -1)"

# ── 메뉴바 ── (now-bar와 구분: 체크리스트 정체성 = 진행률 앞세움, ✓ 아이콘)
if [ -n "$active_line" ]; then
  a_text="$(echo "$active_line" | cut -f1)"
  echo "✓ ${done_count}/${total} · ${a_text} | size=14"
else
  echo "✓ ${done_count}/${total} 오늘 할 일 | size=14"
fi

echo "---"
echo "오늘 할 일  ${done_count}/${total} 완료 | size=12 color=gray"
echo "---"

# ── 항목들 ──
if [ "$total" -eq 0 ]; then
  echo "(할 일 없음 — 아래에서 추가) | size=12 color=gray"
else
  echo "$DATA" | "$JQ" -r '.[] | [.id, .text, (.done|tostring), (.active|tostring), (.switches|tostring), (.live_seconds|tostring)] | @tsv' \
  | while IFS=$'\t' read -r id text done active switches lsec; do
      meta=""
      if [ "${switches:-0}" -gt 0 ]; then meta="  ×${switches} $(fmt "$lsec")"; fi
      # 메인 라인 클릭 = ACTIVE(지금 작업으로). 완료는 서브메뉴. ☐/☑는 상태 표시.
      # ACTIVE = 파랑+볼드(md), 완료 = 초록(끝난 것이니 굿).
      prefix="☐ "; line_color=""; line_extra=""; text_disp="$text"
      if [ "$done" = "true" ]; then
        prefix="☑ "; line_color=" color=#009443"
      elif [ "$active" = "true" ]; then
        line_color=" color=#1100ff"; line_extra=" md=true"; text_disp="**${text}**"
      fi
      echo "${prefix}${text_disp}${meta} | size=13${line_color}${line_extra} bash=$TODOY param1=activate param2=$id terminal=false refresh=true"
      # 서브메뉴 = 완료 토글 (+ ACTIVE 해제)
      if [ "$done" = "true" ]; then
        echo "-- ↩ 완료 취소 | bash=$TODOY param1=done param2=$id terminal=false refresh=true"
      else
        echo "-- ☑ 완료로 표시 | bash=$TODOY param1=done param2=$id terminal=false refresh=true"
      fi
      if [ "$active" = "true" ]; then
        echo "-- ⏸ 지금 작업 해제 | bash=$TODOY param1=activate param2=$id terminal=false refresh=true"
      fi
    done
fi

echo "---"
echo "＋ 할 일 추가 | bash=$TODOY param1=add-dialog terminal=false refresh=true"
echo "데이터 폴더 열기 | bash=$OPEN param1=$DATA_DIR terminal=false"
echo "새로고침 | refresh=true"
