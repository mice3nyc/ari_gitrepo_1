#!/bin/bash
# DMZ v4 두 빌드 산출 — mobile (OFFLINE_MODE=false) / offline (OFFLINE_MODE=true)
# 사용: bash _dev/DMZ_v4/scripts/build.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SHARED="$ROOT/shared/index_base.html"
MOBILE_DIR="$ROOT/mobile"
OFFLINE_DIR="$ROOT/offline"

if [[ ! -f "$SHARED" ]]; then
  echo "ERROR: shared/index_base.html 없음 — $SHARED" >&2
  exit 1
fi

mkdir -p "$MOBILE_DIR" "$OFFLINE_DIR"

# mobile: 그대로 카피 (OFFLINE_MODE=false 그대로)
cp "$SHARED" "$MOBILE_DIR/index.html"

# offline: OFFLINE_MODE 한 줄을 true로 교체
sed 's/const OFFLINE_MODE = false;/const OFFLINE_MODE = true;/' "$SHARED" > "$OFFLINE_DIR/index.html"

# photos 자산: 카피 (GitHub Pages는 심볼릭 링크 미지원)
rm -rf "$MOBILE_DIR/photos" "$OFFLINE_DIR/photos"
cp -R "$ROOT/shared/photos" "$MOBILE_DIR/photos"
cp -R "$ROOT/shared/photos" "$OFFLINE_DIR/photos"

# 검증
M_FLAG=$(grep -c "const OFFLINE_MODE = false;" "$MOBILE_DIR/index.html" || true)
O_FLAG=$(grep -c "const OFFLINE_MODE = true;" "$OFFLINE_DIR/index.html" || true)

echo "=== build complete ==="
echo "mobile/index.html  : OFFLINE_MODE=false 발견 $M_FLAG 개 (1이어야 함)"
echo "offline/index.html : OFFLINE_MODE=true  발견 $O_FLAG 개 (1이어야 함)"
echo "mobile size  : $(wc -c < "$MOBILE_DIR/index.html") bytes"
echo "offline size : $(wc -c < "$OFFLINE_DIR/index.html") bytes"

if [[ "$M_FLAG" != "1" || "$O_FLAG" != "1" ]]; then
  echo "WARNING: OFFLINE_MODE 토글 검증 실패" >&2
  exit 2
fi

echo "OK"
