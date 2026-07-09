#!/bin/bash
# TM 손입력 헬퍼 — SwiftBar 드롭다운의 "입력…" 항목이 이걸 bash=로 부른다.
# osascript 다이얼로그로 값을 받아 tm.sh에 쓰고 플러그인을 새로고침한다.
# 취소(Cancel)하면 아무것도 쓰지 않는다.
#
# 사용:
#   tm-edit.sh win <ID>     창 A/B/C/D의 project·status를 손으로 편집
#   tm-edit.sh ext <key>    외부 AI 레인(dex/gpt/claude/google) 텍스트 편집

TM="/Users/p.air15/Neo-Obsi-Sync/_dev/tm-bar/tm.sh"
JQ=/usr/bin/jq
OPEN=/usr/bin/open
WIN_DIR="/Users/p.air15/Neo-Obsi-Sync/_dev/tm-bar/data/windows"
EXT_DIR="/Users/p.air15/Neo-Obsi-Sync/_dev/tm-bar/data/ext"

mode="$1"; key="$2"

# osascript 입력창. $1=프롬프트 제목, $2=기본값. 취소면 exit 1(빈 출력).
ask() {
  local prompt="$1" def="$2"
  osascript <<OSA 2>/dev/null
try
  set r to text returned of (display dialog "$prompt" default answer "$def" with title "TermMo" buttons {"취소","저장"} default button "저장")
  return r
on error number -128
  error number 1
end try
OSA
}

case "$mode" in
  win)
    case "$key" in A|B|C|D) ;; *) exit 1;; esac
    f="$WIN_DIR/$key.json"
    cur_p=""; cur_s=""
    if [ -f "$f" ]; then
      cur_p="$("$JQ" -r '.project // ""' "$f" 2>/dev/null)"
      cur_s="$("$JQ" -r '.status // ""' "$f" 2>/dev/null)"
    fi
    p="$(ask "창 $key — 프로젝트" "$cur_p")" || exit 0
    s="$(ask "창 $key — 상태" "$cur_s")" || exit 0
    "$TM" set "$key" "$p" "$s"
    ;;
  ext)
    case "$key" in dex|gpt|claude|google) ;; *) exit 1;; esac
    mkdir -p "$EXT_DIR"
    ef="$EXT_DIR/$key.txt"
    cur=""; [ -f "$ef" ] && cur="$(cat "$ef")"
    label="$key"
    case "$key" in dex) label="Codex";; gpt) label="ChatGPT";; claude) label="Claude";; google) label="Gemini";; esac
    v="$(ask "$label — 지금 뭐 시켜놨나" "$cur")" || exit 0
    printf '%s' "$v" > "$ef"
    ;;
  *)
    exit 1
    ;;
esac

"$OPEN" "swiftbar://refreshallplugins" 2>/dev/null
