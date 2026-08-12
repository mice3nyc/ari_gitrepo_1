#!/bin/bash
# drift_scan.sh — 선문후코 세션 종료용 drift 스캔
#
# _dev·_devhaus 전 프로젝트에서 "최신 코드 mtime > 최신 SPEC mtime"인 것만 출력.
# 방치된 stale(문서가 코드보다 뒤처짐)을 세션 끝에 자동 표면화한다.
# /goodbye·/memento가 이걸 호출해 보고에 한 줄 넣는다.
#
# 출력: drift 있는 프로젝트만 한 줄씩. 없으면 "clean".
# 정본: _dev/개발 방법론 — 선문후코.md  ④ 강제

VAULT="/Users/p.air15/Neo-Obsi-Sync"
found=0

scan_root() {
  local marker="$1"
  for proj in "$VAULT/$marker"/*/; do
    [ -d "$proj" ] || continue
    # 최신 SPEC mtime (docs/ + 루트). SPEC 없으면 스킵(구 프로젝트 노이즈 방지).
    local spec_m=0 have=0
    for f in "$proj"docs/SPEC*.md "$proj"SPEC*.md; do
      [ -e "$f" ] || continue
      have=1
      local m; m=$(/usr/bin/stat -f %m "$f" 2>/dev/null) || continue
      [ "$m" -gt "$spec_m" ] && spec_m=$m
    done
    [ "$have" -eq 0 ] && continue

    # 최신 코드 mtime (src/ 하위 + 루트 코드 확장자). node_modules·target·dist 제외.
    local code_m=0 code_f=""
    while IFS= read -r f; do
      local m; m=$(/usr/bin/stat -f %m "$f" 2>/dev/null) || continue
      if [ "$m" -gt "$code_m" ]; then code_m=$m; code_f=$(basename "$f"); fi
    done < <(/usr/bin/find "$proj" \
        -type d \( -name node_modules -o -name target -o -name dist -o -name .git -o -name build \
                   -o -name .nuxt -o -name .output -o -name .svelte-kit -o -name coverage \) -prune -o \
        -type f ! -name '*.d.ts' \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' \
                   -o -name '*.rs' -o -name '*.css' -o -name '*.scss' -o -name '*.vue' \
                   -o -name '*.svelte' -o -name '*.py' -o -name '*.swift' \) -print 2>/dev/null)

    if [ "$code_m" -gt "$spec_m" ]; then
      local diff=$(( code_m - spec_m )) span
      local days=$(( diff / 86400 ))
      if [ "$days" -ge 1 ]; then span="${days}일"; else span="$(( diff / 3600 ))시간"; fi
      printf '  ⚠️ %s — 코드(%s)가 SPEC보다 %s 앞섬\n' "$(basename "$proj")" "$code_f" "$span"
      found=1
    fi
  done
}

scan_root "_devhaus"
scan_root "_dev"

[ "$found" -eq 0 ] && echo "  ✓ SPEC drift 없음 (clean)"
exit 0
