#!/bin/bash
# spec_guard.sh — 선문후코 실시간 강제 hook (PostToolUse, Edit|Write|Bash)
#
# 계약: 동기 hook + exit 0 + JSON stdout hookSpecificOutput.additionalContext
#       → 모델(아리공)이 tool result 직후 즉시 읽는다. 차단이 아닌 경고.
#
# 동작: _dev/_devhaus 하위 코드 파일이 그 프로젝트의 최신 SPEC보다 새로우면
#       → "SPEC 반영했나?" 리마인더를 아리공 눈앞에 주입.
#       조건 불충족이면 조용히 {} 반환(대부분의 호출엔 아무 소음 없음).
#
# 대상 파일을 찾는 길이 둘이다:
#   Edit/Write → .tool_input.file_path (그대로)
#   Bash       → 최근 변경된 코드 파일을 파일시스템에서 찾는다 (2026-08-18 신설)
#
# ⚠️ Bash 쪽에서 명령줄을 파싱하지 않는 이유: 이 구멍을 실제로 만든 것이
#    `python3 - <<PY` 안의 open(p,'w')였고 거기엔 경로도 리다이렉트도 안 보인다.
#    파서였다면 원인이 된 바로 그 케이스를 놓친다. 상세: SPEC-spec-guard.md §3
#
# 정본: _dev/개발 방법론 — 선문후코.md ④ 강제 · 사양: SPEC-spec-guard.md
# 자가검사: ./selftest.sh

SCAN_WINDOW="${SPEC_GUARD_WINDOW:-120}"          # 초. 긴 빌드·생성기 뒤에 훅이 도는 경우를 덮는다
STATE="${SPEC_GUARD_STATE:-/tmp/spec_guard_seen}" # {경로}:{mtime} 한 쌍당 한 번만 경고

emit() { printf '%s\n' "$1"; exit 0; }
silent() { emit '{}'; }
warn() {
  emit "$(/usr/bin/jq -n --arg m "$1" \
    '{hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:$m}}')"
}

input=$(cat 2>/dev/null)
tool=$(printf '%s' "$input" | /usr/bin/jq -r '.tool_name // empty' 2>/dev/null)

# 스캔 뿌리: 이 스크립트는 {볼트}/_dev/spec-guard/ 에 있다 → 두 단계 위가 볼트
here=$(cd "$(dirname "$0")" && pwd)
vault=$(cd "$here/../.." && pwd)
roots="${SPEC_GUARD_ROOTS:-$vault/_dev $vault/_devhaus}"

# --- 대상 파일 정하기 ---------------------------------------------------
case "$tool" in
  Edit|Write|NotebookEdit)
    fp=$(printf '%s' "$input" | /usr/bin/jq -r '.tool_input.file_path // empty' 2>/dev/null)
    ;;
  Bash)
    # 최근 SCAN_WINDOW 초 안에 바뀐 코드 파일 중 가장 새것.
    # ⚠️ 프루닝은 선택이 아니라 전제다 — 빼면 대상이 16,000개를 넘어 훅이 느려진다.
    fp=$(find $roots \
          \( -name node_modules -o -name .git -o -name .nuxt -o -name .output \
             -o -name dist -o -name build -o -name .build -o -name .venv -o -name venv \
             -o -name target -o -name Pods -o -name .next -o -name coverage \) -prune -o \
          -type f -newermt "-${SCAN_WINDOW} seconds" \
          ! -path '*/docs/*' \
          \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' \
             -o -name '*.mjs' -o -name '*.cjs' -o -name '*.css' -o -name '*.scss' \
             -o -name '*.rs' -o -name '*.vue' -o -name '*.svelte' -o -name '*.py' \
             -o -name '*.html' -o -name '*.swift' \) \
          -exec /usr/bin/stat -f '%m %N' {} + 2>/dev/null \
        | sort -rn | head -1 | cut -d' ' -f2-)
    ;;
  *) silent ;;
esac

[ -z "$fp" ] && silent
[ -f "$fp" ] || silent

# --- 관할 판정 (Edit/Write/Bash 공통 — 두 벌로 두면 갈라진다) ------------
case "$fp" in
  */_devhaus/*) marker="_devhaus" ;;
  */_dev/*)     marker="_dev" ;;
  *) silent ;;
esac

# 코드 파일인가 (문서/설정은 제외). src/ 경로거나 코드 확장자.
case "$fp" in
  */docs/*) silent ;;                       # 설계 문서는 대상 아님
  *.md|*.json|*.txt|*.lock|*.toml|*.yml|*.yaml) silent ;;
  */src/*) : ;;                             # src 하위는 코드로 간주
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs|*.css|*.scss|*.rs|*.vue|*.svelte|*.py|*.html|*.swift) : ;;
  *) silent ;;
esac

# 프로젝트 루트 = .../{marker}/{proj}
base="${fp%%/$marker/*}/$marker"
rest="${fp#*/$marker/}"
proj="${rest%%/*}"
root="$base/$proj"
[ -d "$root" ] || silent

code_m=$(/usr/bin/stat -f %m "$fp" 2>/dev/null) || silent

# --- 같은 경고를 반복하지 않는다 ----------------------------------------
# Bash 경로는 부수적으로 걸리므로, 안 막으면 이후의 모든 ls·grep이 같은 경고를 다시 낸다.
# 키에 mtime을 넣어 «파일을 또 고쳤으면 다시 경고»는 살려 둔다.
key="${fp}:${code_m}"
if [ -f "$STATE" ] && /usr/bin/grep -Fqx "$key" "$STATE" 2>/dev/null; then
  silent
fi
mark_seen() {
  printf '%s\n' "$key" >> "$STATE" 2>/dev/null
  # 무한정 자라지 않게 꼬리만 남긴다
  if [ "$(/usr/bin/wc -l < "$STATE" 2>/dev/null || echo 0)" -gt 400 ]; then
    /usr/bin/tail -n 200 "$STATE" > "$STATE.tmp" 2>/dev/null && /bin/mv "$STATE.tmp" "$STATE"
  fi
}

# --- 최신 SPEC mtime (docs/SPEC*.md + 루트 SPEC*.md; 구 flat 프로젝트 대응) ---
latest=0
have_spec=0
for f in "$root"/docs/SPEC*.md "$root"/SPEC*.md; do
  [ -e "$f" ] || continue
  have_spec=1
  m=$(/usr/bin/stat -f %m "$f" 2>/dev/null) || continue
  [ "$m" -gt "$latest" ] && latest=$m
done

codebase=$(basename "$fp")
via=""
[ "$tool" = "Bash" ] && via=" (Bash로 만들어진 것을 훅이 잡았습니다)"

if [ "$have_spec" -eq 0 ]; then
  mark_seen
  warn "[선문후코] ${proj}에 SPEC 문서가 없습니다. ${codebase} 코드를 짜기 전에 docs/SPEC-{주제}.md를 먼저 세우세요(선문).${via} 정본: _dev/개발 방법론 — 선문후코.md ②."
fi

if [ "$code_m" -gt "$latest" ]; then
  mark_seen
  warn "[선문후코] ${proj}: ${codebase}(코드)가 최신 SPEC보다 앞섰습니다. 이 변경을 docs/SPEC에 반영했는지 확인하세요. 반영했다면 SPEC을 함께 저장해 동기화하세요(같은 턴).${via} 정본: _dev/개발 방법론 — 선문후코.md ④."
fi

silent
