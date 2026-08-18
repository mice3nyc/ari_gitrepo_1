#!/bin/bash
# selftest.sh — spec_guard.sh 자가검사. SPEC-spec-guard.md §7.
#
# 픽스처로 가짜 프로젝트를 만들어 가드에 PostToolUse JSON을 먹이고, 기대한 반응이 나오는지 본다.
# 사용: ./selftest.sh [검사할_가드_경로]   (기본: 옆의 spec_guard.sh)

GUARD="${1:-$(cd "$(dirname "$0")" && pwd)/spec_guard.sh}"
FIX=$(mktemp -d)
pass=0; fail=0

cleanup() { rm -rf "$FIX"; }
trap cleanup EXIT

# 픽스처를 스캔 대상으로 주고, 상태 파일도 픽스처 전용으로 돌린다
# (실제 볼트와 진짜 상태 파일을 건드리지 않기 위해)
export SPEC_GUARD_ROOTS="$FIX/_devhaus"
export SPEC_GUARD_STATE="$FIX/seen"
reset_state() { rm -f "$SPEC_GUARD_STATE"; }

# 픽스처: {FIX}/_devhaus/fakeproj/{docs,scripts}
mk() {
  rm -rf "$FIX/_devhaus"
  mkdir -p "$FIX/_devhaus/fakeproj/docs" "$FIX/_devhaus/fakeproj/scripts"
}

run() { # run <설명> <json> <기대: WARN|SILENT> [기대 문자열]
  local desc="$1" json="$2" want="$3" needle="$4"
  local out; out=$(printf '%s' "$json" | "$GUARD" 2>/dev/null)
  local got="SILENT"
  case "$out" in *additionalContext*) got="WARN" ;; esac
  local ok=1
  [ "$got" = "$want" ] || ok=0
  if [ -n "$needle" ] && [ "$got" = "WARN" ]; then
    case "$out" in *"$needle"*) : ;; *) ok=0 ;; esac
  fi
  if [ $ok -eq 1 ]; then pass=$((pass+1)); printf 'PASS  %s\n' "$desc"
  else fail=$((fail+1)); printf 'FAIL  %s — 기대 %s%s, 실제 %s\n      %s\n' \
      "$desc" "$want" "${needle:+/\"$needle\"}" "$got" "$(printf '%s' "$out" | head -c 160)"; fi
}

bash_json() { /usr/bin/jq -n --arg c "$1" '{tool_name:"Bash",tool_input:{command:$c}}'; }
edit_json() { /usr/bin/jq -n --arg p "$1" '{tool_name:"Edit",tool_input:{file_path:$p}}'; }

echo "가드: $GUARD"
echo "픽스처: $FIX"
echo

# --- 1. Bash로 만든 코드 파일 → 경고해야 한다 (이번에 막는 구멍) ---------
mk; reset_state
echo "old spec" > "$FIX/_devhaus/fakeproj/docs/SPEC-x.md"
sleep 1
echo "const a=1" > "$FIX/_devhaus/fakeproj/scripts/gen.mjs"
run "Bash로 만든 코드가 SPEC보다 새것 → 경고" "$(bash_json "cat > scripts/gen.mjs <<'EOF'")" WARN "선문후코"

# --- 2. 같은 파일 두 번째 → 조용 (중복 억제) ------------------------------
run "같은 파일·같은 mtime 두 번째 → 조용" "$(bash_json "ls -la")" SILENT

# --- 3. 파일을 또 고치면 → 다시 경고 --------------------------------------
sleep 1
echo "const a=2" > "$FIX/_devhaus/fakeproj/scripts/gen.mjs"
run "다시 고치면 → 또 경고" "$(bash_json "python3 - <<PY")" WARN "선문후코"

# --- 4. SPEC이 코드보다 새로우면 → 조용 -----------------------------------
mk; reset_state
echo "const a=1" > "$FIX/_devhaus/fakeproj/scripts/gen.mjs"
sleep 1
echo "new spec" > "$FIX/_devhaus/fakeproj/docs/SPEC-x.md"
run "SPEC이 코드보다 새것 → 조용" "$(bash_json "cat > x")" SILENT

# --- 5. SPEC이 아예 없으면 → 「SPEC부터」 ----------------------------------
mk; reset_state
echo "const a=1" > "$FIX/_devhaus/fakeproj/scripts/gen.mjs"
run "SPEC 부재 → SPEC부터 세우라" "$(bash_json "cat > x")" WARN "SPEC 문서가 없습니다"

# --- 6. 문서만 바꾼 경우 → 조용 --------------------------------------------
mk; reset_state
echo "old" > "$FIX/_devhaus/fakeproj/docs/SPEC-x.md"
sleep 1
echo "# 노트" > "$FIX/_devhaus/fakeproj/docs/TASKS.md"
run "docs/ 문서만 변경 → 조용" "$(bash_json "cat > docs/TASKS.md")" SILENT

# --- 7. 최근 변경이 없으면 → 조용 (모든 Bash 호출에 안 짖는다) -------------
mk; reset_state
echo "old" > "$FIX/_devhaus/fakeproj/docs/SPEC-x.md"
echo "const a=1" > "$FIX/_devhaus/fakeproj/scripts/gen.mjs"
/usr/bin/touch -t 202601010000 "$FIX/_devhaus/fakeproj/scripts/gen.mjs"
run "오래된 파일뿐 → 조용" "$(bash_json "grep -r foo .")" SILENT

# --- 8. Edit 경로 회귀 -----------------------------------------------------
mk; reset_state
echo "old spec" > "$FIX/_devhaus/fakeproj/docs/SPEC-x.md"
sleep 1
echo "const a=1" > "$FIX/_devhaus/fakeproj/scripts/gen.mjs"
run "Edit 경로: 코드가 SPEC보다 새것 → 경고" "$(edit_json "$FIX/_devhaus/fakeproj/scripts/gen.mjs")" WARN "선문후코"
reset_state
run "Edit 경로: docs/ 파일 → 조용" "$(edit_json "$FIX/_devhaus/fakeproj/docs/SPEC-x.md")" SILENT

# --- 9. 관할 밖 ------------------------------------------------------------
reset_state
mkdir -p "$FIX/elsewhere"; echo "x" > "$FIX/elsewhere/a.mjs"
run "_dev/_devhaus 바깥 Edit → 조용" "$(edit_json "$FIX/elsewhere/a.mjs")" SILENT

echo
echo "검사 $((pass+fail))건 · 통과 $pass · 실패 $fail"
[ $fail -eq 0 ] || exit 1
