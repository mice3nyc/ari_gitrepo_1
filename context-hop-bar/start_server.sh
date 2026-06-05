#!/bin/bash
# Context Hop Bar — 서버 시작 스크립트
# python3 http.server로 index.html + 로그 파일 서빙
#
# 사용법: ./start_server.sh
# 접속:   http://localhost:8787

PORT=8787
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOGS_DIR="$PROJECT_DIR/logs"
TODAY=$(/bin/date +"%Y-%m-%d")
LOG_FILE="$LOGS_DIR/$TODAY.jsonl"
SYMLINK="$PROJECT_DIR/context_hop_log.jsonl"

echo "● Context Hop Bar 서버 시작"
echo "  프로젝트: $PROJECT_DIR"
echo "  포트:     $PORT"
echo "  오늘 로그: $LOG_FILE"
echo ""

# logs 폴더 생성
mkdir -p "$LOGS_DIR"

# 오늘 로그 없으면 생성
if [ ! -f "$LOG_FILE" ]; then
    touch "$LOG_FILE"
    echo "  로그 파일 생성: $LOG_FILE"
fi

# 심볼릭 링크 → 오늘 파일
if [ -L "$SYMLINK" ]; then
    rm "$SYMLINK"
fi
ln -s "$LOG_FILE" "$SYMLINK"
echo "  심링크: context_hop_log.jsonl → logs/$TODAY.jsonl"

echo ""
echo "  http://localhost:$PORT 에서 확인"
echo "  종료: Ctrl+C"
echo ""

# 서버 시작 (백그라운드) + Chrome App Mode 창 열기
cd "$PROJECT_DIR"
python3 -m http.server "$PORT" &
SERVER_PID=$!
sleep 1

# Chrome App Mode — 주소창/탭바 없는 슬림 창
open -na "Google Chrome" --args --app="http://localhost:$PORT"

echo "  서버 PID: $SERVER_PID"
echo "  창을 닫아도 서버는 계속 돌아갑니다. 서버 종료: kill $SERVER_PID 또는 Ctrl+C"

# 서버를 포그라운드로 돌려서 Ctrl+C로 종료 가능하게
wait $SERVER_PID
