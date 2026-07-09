#!/bin/bash
# 임시 probe — 훅이 실제로 주는 페이로드를 확인하기 위한 진단용. Q2 매핑 설계 후 제거.
# 훅 stdin(JSON) + 프로세스/터미널 정보를 로그에 append.
OUT="/Users/p.air15/Neo-Obsi-Sync/_dev/tm-bar/data/hook-probe.log"
STDIN_JSON="$(cat)"
{
  echo "==== $(date '+%F %T') ===="
  echo "-- stdin json --"
  echo "$STDIN_JSON"
  echo "-- ppid tty --"
  ps -o tty=,command= -p "$PPID" 2>/dev/null
  echo "-- env(session/term) --"
  env | grep -iE 'session|term|iterm|tty|claude' 2>/dev/null
  echo ""
} >> "$OUT" 2>&1
exit 0
