#!/bin/bash
# Mermaid Lab — 로컬 서버 시작
# python3 http.server로 index.html + diagrams 서빙
#
# 사용법: ./start_server.sh
# 접속:   http://localhost:8789

PORT=8789
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 이미 돌고 있으면 창만 열기
if lsof -i :$PORT > /dev/null 2>&1; then
    open -na "Google Chrome" --args --app="http://localhost:$PORT"
    exit 0
fi

echo "● Mermaid Lab 서버 시작"
echo "  http://localhost:$PORT"

cd "$PROJECT_DIR"
python3 -m http.server "$PORT" &
SERVER_PID=$!
sleep 1

open -na "Google Chrome" --args --app="http://localhost:$PORT"

echo "  서버 PID: $SERVER_PID"
wait $SERVER_PID
