#!/bin/bash
# DMZ v5 두 빌드 산출 — mobile (OFFLINE_MODE=false) / offline (OFFLINE_MODE=true)
# data/topics/*.yaml + archivist_types.yaml → STORIES/ARCHIVIST_TYPES 주입
# 사용: cd _dev/DMZ_v5 && bash scripts/build.sh
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

# 1. yaml → JS 변환 + placeholder 주입 → /tmp/dmz_base_filled.html
python3 - <<PYEOF
import subprocess, sys
from pathlib import Path
ROOT = Path("$ROOT")
content = (ROOT / "shared/index_base.html").read_text()
inject = subprocess.run(
    ["python3", str(ROOT / "scripts/build_stories_json.py")],
    capture_output=True, text=True, check=True
).stdout
placeholder = "// __STORIES_AND_TYPES__ (data/topics/*.yaml에서 빌드 시 주입)"
if placeholder not in content:
    sys.exit(f"ERROR: placeholder 없음: {placeholder}")
content = content.replace(placeholder, inject)
Path("/tmp/dmz_base_filled.html").write_text(content)
print(f"base filled: {len(content)} bytes")
PYEOF

# 2. mobile: 그대로 (OFFLINE_MODE=false)
cp /tmp/dmz_base_filled.html "$MOBILE_DIR/index.html"

# 3. offline: OFFLINE_MODE=true 토글
sed 's/const OFFLINE_MODE = false;/const OFFLINE_MODE = true;/' /tmp/dmz_base_filled.html > "$OFFLINE_DIR/index.html"

# 4. photos 자산
rm -rf "$MOBILE_DIR/photos" "$OFFLINE_DIR/photos"
cp -R "$ROOT/shared/photos" "$MOBILE_DIR/photos"
cp -R "$ROOT/shared/photos" "$OFFLINE_DIR/photos"

# 5. 검증
M_FLAG=$(grep -c "const OFFLINE_MODE = false;" "$MOBILE_DIR/index.html" || true)
O_FLAG=$(grep -c "const OFFLINE_MODE = true;" "$OFFLINE_DIR/index.html" || true)

# JS syntax
for f in "$MOBILE_DIR/index.html" "$OFFLINE_DIR/index.html"; do
  node -e "new Function(require('fs').readFileSync('$f','utf8').match(/<script>([\s\S]*?)<\/script>/)[1])" \
    || { echo "JS syntax FAILED: $f"; exit 3; }
done

echo "=== build complete ==="
echo "mobile/index.html  : OFFLINE_MODE=false 발견 $M_FLAG 개 (1이어야 함)"
echo "offline/index.html : OFFLINE_MODE=true  발견 $O_FLAG 개 (1이어야 함)"
echo "mobile size  : $(wc -c < "$MOBILE_DIR/index.html") bytes"
echo "offline size : $(wc -c < "$OFFLINE_DIR/index.html") bytes"
echo "JS syntax OK (mobile, offline)"

if [[ "$M_FLAG" != "1" || "$O_FLAG" != "1" ]]; then
  echo "WARNING: OFFLINE_MODE 토글 검증 실패" >&2
  exit 2
fi

echo "OK"
