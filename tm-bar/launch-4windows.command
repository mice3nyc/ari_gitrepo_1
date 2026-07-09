#!/bin/bash
# 4창 자동 런처 — Terminal 2개(좌/우) + iTerm2 2개(좌/우)를 자동 배치.
# 더블클릭 또는 Dock 등록해서 사용. 각 앱의 2창은 같은 좌/우 반반을 차지(Cmd-Tab으로 앱 전환).
#
# RUN_CLAUDE=1 로 실행하면 각 창에서 `cd 볼트 && claude` 자동 실행.
#   예: RUN_CLAUDE=1 /Users/.../launch-4windows.command
# 기본(0)은 창만 배치 + 볼트로 cd.

VAULT="/Users/p.air15/Neo-Obsi-Sync"
RUN_CLAUDE="${RUN_CLAUDE:-0}"

# 각 창에서 실행할 명령. RUN_CLAUDE=1이면 claude까지.
if [ "$RUN_CLAUDE" = "1" ]; then
  INIT_CMD="cd '$VAULT' && claude"
else
  INIT_CMD="cd '$VAULT'"
fi

/usr/bin/osascript <<APPLESCRIPT
-- 화면(데스크톱) 논리 크기 얻기
tell application "Finder"
    set deskBounds to bounds of window of desktop
end tell
set scrW to item 3 of deskBounds
set scrH to item 4 of deskBounds

set topY to 25          -- 메뉴바 아래
set halfW to (scrW / 2) as integer
set leftBounds to {0, topY, halfW, scrH}
set rightBounds to {halfW, topY, scrW, scrH}

set initCmd to "$INIT_CMD"

-- ── Terminal.app: 좌/우 2창 ──
tell application "Terminal"
    activate
    do script initCmd
    delay 0.3
    set bounds of front window to leftBounds
    do script initCmd
    delay 0.3
    set bounds of front window to rightBounds
end tell

delay 0.4

-- ── iTerm2: 좌/우 2창 ──
tell application "iTerm2"
    activate
    set w1 to (create window with default profile)
    delay 0.3
    tell current session of w1 to write text initCmd
    set bounds of w1 to leftBounds
    set w2 to (create window with default profile)
    delay 0.3
    tell current session of w2 to write text initCmd
    set bounds of w2 to rightBounds
end tell
APPLESCRIPT

echo "4창 배치 완료 (RUN_CLAUDE=$RUN_CLAUDE)"
