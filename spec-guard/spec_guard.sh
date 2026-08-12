#!/bin/bash
# spec_guard.sh — 선문후코 실시간 강제 hook (PostToolUse, Edit|Write)
#
# 계약: 동기 hook + exit 0 + JSON stdout hookSpecificOutput.additionalContext
#       → 모델(아리공)이 tool result 직후 즉시 읽는다. 차단이 아닌 경고.
#
# 동작: _dev/_devhaus 하위 코드 파일을 편집했는데, 그 프로젝트의 최신 SPEC보다
#       코드 mtime이 앞서면 → "SPEC 반영했나?" 리마인더를 아리공 눈앞에 주입.
#       조건 불충족이면 조용히 {} 반환(대부분의 편집엔 아무 소음 없음).
#
# stdin: PostToolUse JSON. 편집 파일 경로 = .tool_input.file_path
# 정본: _dev/개발 방법론 — 선문후코.md  ④ 강제

emit() { printf '%s\n' "$1"; exit 0; }
silent() { emit '{}'; }

input=$(cat 2>/dev/null)
fp=$(printf '%s' "$input" | /usr/bin/jq -r '.tool_input.file_path // empty' 2>/dev/null)
[ -z "$fp" ] && silent
[ -f "$fp" ] || silent

# _dev 또는 _devhaus 하위인가
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

# 최신 SPEC mtime (docs/SPEC*.md + 루트 SPEC*.md 둘 다 스캔; 구 flat 프로젝트 대응)
latest=0
have_spec=0
for f in "$root"/docs/SPEC*.md "$root"/SPEC*.md; do
  [ -e "$f" ] || continue
  have_spec=1
  m=$(/usr/bin/stat -f %m "$f" 2>/dev/null) || continue
  [ "$m" -gt "$latest" ] && latest=$m
done

code_m=$(/usr/bin/stat -f %m "$fp" 2>/dev/null) || silent
codebase=$(basename "$fp")

if [ "$have_spec" -eq 0 ]; then
  msg="[선문후코] ${proj}에 SPEC 문서가 없습니다. ${codebase} 코드를 짜기 전에 docs/SPEC-{주제}.md를 먼저 세우세요(선문). 정본: _dev/개발 방법론 — 선문후코.md ②."
  emit "$(/usr/bin/jq -n --arg m "$msg" '{hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:$m}}')"
fi

if [ "$code_m" -gt "$latest" ]; then
  msg="[선문후코] ${proj}: 방금 ${codebase}(코드)가 최신 SPEC보다 앞섰습니다. 이 변경을 docs/SPEC에 반영했는지 확인하세요. 반영했다면 SPEC을 함께 저장해 동기화하세요(같은 턴). 정본: _dev/개발 방법론 — 선문후코.md ④."
  emit "$(/usr/bin/jq -n --arg m "$msg" '{hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:$m}}')"
fi

silent
