#!/bin/bash
# Now Bar — 서버 시작 스크립트
# Context Hop Bar의 로그를 공유해서 "현재형" 상태창을 띄운다.
#
# 사용법: ./start_server.sh
# 접속:   http://localhost:8788

PORT=8788
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
HOP_LOGS="$PROJECT_DIR/../context-hop-bar/logs"
LINK="$PROJECT_DIR/logs"

echo "● Now Bar 서버 시작"
echo "  프로젝트: $PROJECT_DIR"
echo "  포트:     $PORT"
echo "  로그 공유: $HOP_LOGS"
echo ""

# logs 심링크 → context-hop-bar/logs (같은 로그를 빌려 읽음)
if [ -L "$LINK" ]; then
    rm "$LINK"
fi
if [ -e "$LINK" ] && [ ! -L "$LINK" ]; then
    echo "  경고: $LINK 가 심링크가 아닙니다. 수동 확인 필요 — 심링크 생성 건너뜀"
else
    ln -s "$HOP_LOGS" "$LINK"
    echo "  심링크: logs → ../context-hop-bar/logs"
fi

echo ""
echo "  http://localhost:$PORT 에서 확인"
echo "  종료: Ctrl+C"
echo ""

cd "$PROJECT_DIR"
python3 -m http.server "$PORT" &
SERVER_PID=$!
sleep 1

# Chrome App Mode — 주소창/탭바 없는 슬림 창
open -na "Google Chrome" --args --app="http://localhost:$PORT"

echo "  서버 PID: $SERVER_PID"
echo "  창을 닫아도 서버는 계속 돌아갑니다. 서버 종료: kill $SERVER_PID 또는 Ctrl+C"

wait $SERVER_PID
