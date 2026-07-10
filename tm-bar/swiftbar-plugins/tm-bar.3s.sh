#!/bin/bash
# <xbar.title>TM (TerminalMonitor)</xbar.title>
# <xbar.version>v0.3</xbar.version>
# <xbar.author>아리공</xbar.author>
# <xbar.desc>여러 클로드코드 창(A/B/C/D)의 현재 작업 — 노치 화면 대비 아이콘+풀다운만</xbar.desc>
#
# 메뉴바에는 최소 폭(TM + 활성 창 수)만. 상세(현재 작업·당일 로그)는 클릭 드롭다운.
# 노치 있는 화면은 상태영역이 좁아 상시 텍스트가 todoy를 밀어내므로, 텍스트 로테이션은 뺐다.
# 방금 갱신된 창은 드롭다운에서 파랑(+맨 위)으로 표시해 "어디가 움직였나"는 살린다.

TM="/Users/p.air15/Neo-Obsi-Sync/_dev/tm-bar/tm.sh"
EDIT="/Users/p.air15/Neo-Obsi-Sync/_dev/tm-bar/tm-edit.sh"
JQ=/usr/bin/jq
OPEN=/usr/bin/open
WIN_DIR="/Users/p.air15/Neo-Obsi-Sync/_dev/tm-bar/data/windows"
EXT_DIR="/Users/p.air15/Neo-Obsi-Sync/_dev/tm-bar/data/ext"
LABEL="TM"        # 메뉴바 표시 이름(노치 화면 최소 폭). 드롭다운 헤더는 TermMo 유지
PIN_SECS=12       # 최근 이 초 내 갱신된 창을 파랑(+상단)으로
LOG_SHOW=8        # 서브메뉴에 보여줄 최근 로그 개수
DROPDOWN_MAX=48   # 드롭다운 창 헤더 최대 길이(풀다운이라 여유. 그래도 리밋)

# 텍스트 말줄임
ellip() { local s="$1" n="${2:-40}"; if [ "${#s}" -gt "$n" ]; then echo "${s:0:$((n-1))}…"; else echo "$s"; fi; }

DATA="$("$TM" render 2>/dev/null)"
[ -z "$DATA" ] && DATA='[]'
now="$(date +%s)"
count="$(echo "$DATA" | "$JQ" 'length')"

# ── 메뉴바 (최소 폭) ── 집계색: attention(빨강) > done(초록) > 최근갱신(파랑) > 기본
recent="$(echo "$DATA" | "$JQ" -r --argjson now "$now" --argjson w "$PIN_SECS" \
  '[.[] | select($now - .updated_at < $w)] | length')"
att="$(echo "$DATA" | "$JQ" -r '[.[] | select(.state=="attention")] | length')"
dn="$(echo "$DATA" | "$JQ" -r '[.[] | select(.state=="done")] | length')"
wk="$(echo "$DATA" | "$JQ" -r '[.[] | select(.state=="working")] | length')"
# 집계색 우선순위: 개입(빨강) > 완료(초록) > 진행중(파랑) > 기본(검정)
if [ "$count" -eq 0 ]; then
  echo "${LABEL} | size=13 color=gray"
elif [ "${att:-0}" -gt 0 ]; then
  echo "${LABEL} ${count} ! | size=13 color=#e5484d"
elif [ "${dn:-0}" -gt 0 ]; then
  echo "${LABEL} ${count} ✓ | size=13 color=#2e9e44"
elif [ "${wk:-0}" -gt 0 ] || [ "${recent:-0}" -gt 0 ]; then
  echo "${LABEL} ${count} ● | size=13 color=#1100ff"
else
  echo "${LABEL} ${count} | size=13"
fi

echo "---"
echo "TM · 활성 ${count}창 | size=12 color=gray"
echo "---"

# ── 창별 목록 (최근 갱신 상단) ──
if [ "$count" -eq 0 ]; then
  echo "(활성 창 없음 — recall/goodmorning에서 등록) | size=12 color=gray"
else
  # 구분자 = US(\x1f). 탭은 bash가 연속 공백류로 합쳐 빈 필드(대기=project"")를 삼킴
  echo "$DATA" | "$JQ" -r 'sort_by(.id) | .[] | [.id, .project, .status, (.updated_at|tostring), (.state // "")] | join("")' \
  | while IFS=$'\x1f' read -r id proj stat upd stt; do
      # 색 우선순위: attention(빨강) > done(초록) > 최근 갱신(파랑) > 대기(회색) > 일반(검정)
      color=""; mark=""
      # 파랑=진행중(working) / 초록=완료(done) / 검정=그냥 대기(idle) / 빨강=개입(attention)
      if [ "$stt" = "attention" ]; then color=" color=#e5484d"; mark="🔴 "
      elif [ "$stt" = "done" ]; then color=" color=#2e9e44"; mark="🟢 "
      elif [ "$stt" = "working" ]; then color=" color=#1100ff"       # 진행 중 = 파랑(텍스트만)
      elif [ "$stt" = "idle" ]; then color=""                        # 그냥 대기 = 검정
      elif [ $(( now - upd )) -lt "$PIN_SECS" ]; then color=" color=#1100ff"   # legacy(무상태) 폴백
      elif [ -z "$proj" ] || [ "$stat" = "대기" ]; then color=" color=gray"; fi
      if [ -n "$proj" ]; then head="${mark}${id} · ${proj} — ${stat}"; else head="${mark}${id} · ${stat}"; fi
      # 헤드 라인 자체가 이동 버튼(TM=뷰어라 창 텍스트 클릭=그 창으로 focus). 로그·편집은 hover 서브메뉴.
      echo "$(ellip "$head" "$DROPDOWN_MAX") | size=13${color} bash=$TM param1=focus param2=${id} terminal=false"
      logs="$(echo "$DATA" | "$JQ" -r --arg id "$id" \
        '.[] | select(.id==$id) | .log | reverse | .['"0:$LOG_SHOW"'][] | .t + "  " + .msg')"
      if [ -n "$logs" ]; then
        echo "$logs" | while IFS= read -r ln; do echo "--${ln} | size=12"; done
      else
        echo "--(로그 없음) | size=12 color=gray"
      fi
      echo "-----"
      echo "--✏️ 상태 입력… | bash=$EDIT param1=win param2=${id} terminal=false size=12"
    done
fi

# ── 외부 AI 레인 (손입력) ──
echo "---"
echo "외부 AI · 손입력 | size=12 color=gray"
for pair in "dex:Codex" "gpt:ChatGPT" "claude:Claude" "google:Gemini"; do
  k="${pair%%:*}"; lbl="${pair##*:}"
  txt=""; [ -f "$EXT_DIR/$k.txt" ] && txt="$(cat "$EXT_DIR/$k.txt")"
  if [ -n "$txt" ]; then line="${lbl} · $(ellip "$txt" 40)"; col=""; else line="${lbl} · (비어있음)"; col=" color=gray"; fi
  echo "${line} | bash=$EDIT param1=ext param2=${k} terminal=false size=13${col}"
done

echo "---"
TODAY_TAG="$(date +%y%m%d)"
echo "TM_log_${TODAY_TAG} 열기 | href=obsidian://open?vault=Neo-Obsi-Sync&file=TM_log_${TODAY_TAG}"
echo "데이터 폴더 열기 | bash=$OPEN param1=$WIN_DIR terminal=false"
echo "새로고침 | refresh=true"
