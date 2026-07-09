#!/bin/bash
# TM 플러그인을 SwiftBar PluginDirectory에 배포(복사).
# SwiftBar가 심볼릭 링크를 따라가지 않으므로 실파일 복사가 정본 배포 방식.
# 코드(swiftbar-plugins/tm-bar.3s.sh)를 고치면 이 스크립트를 다시 실행한다.

SRC="/Users/p.air15/Neo-Obsi-Sync/_dev/tm-bar/swiftbar-plugins/tm-bar.3s.sh"
PLUGIN_DIR="$(defaults read com.ameba.SwiftBar PluginDirectory 2>/dev/null)"
[ -z "$PLUGIN_DIR" ] && { echo "SwiftBar PluginDirectory를 못 찾음" >&2; exit 1; }
DST="$PLUGIN_DIR/tm-bar.3s.sh"

# 기존 심링크/파일 제거 후 복사
rm -f "$DST"
cp "$SRC" "$DST"
chmod +x "$DST"
echo "배포: $DST"

# SwiftBar 플러그인 새로고침
open "swiftbar://refreshallplugins" 2>/dev/null
echo "SwiftBar 리로드 신호 전송"
