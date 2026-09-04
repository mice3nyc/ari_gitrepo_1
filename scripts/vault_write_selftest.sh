#!/bin/bash
# vault_write.py 픽스처 테스트 — SPEC-vault_write.md §13
# 볼트 실물은 건드리지 않는다. VAULT_WRITE_ROOT로 임시 볼트를 만들어 돈다.
set -u
VW="/Users/p.air15/Neo-Obsi-Sync/_dev/scripts/vault_write.py"
ROOT=$(mktemp -d /tmp/vwtest.XXXXXX)
export VAULT_WRITE_ROOT="$ROOT"
export VAULT_WRITE_DAY="2026-08-23"
PASS=0; FAIL=0

ok(){ PASS=$((PASS+1)); printf '  \033[32mPASS\033[0m %s\n' "$1"; }
ng(){ FAIL=$((FAIL+1)); printf '  \033[31mFAIL\033[0m %s\n' "$1"; [ $# -gt 1 ] && printf '       %s\n' "$2"; }

fixture(){
  rm -rf "$ROOT"; mkdir -p "$ROOT/_클로드코드노트" "$ROOT/_init/_myJournal" "$ROOT/_dev/scripts"
  cat > "$ROOT/_클로드코드노트/클로드코드 세션 로그.md" <<'F'
## 세션 로그

## 세션 957 — 2026-08-23 (창B) | 복원

- 씨앗

## 세션 956 — 2026-08-23 (창A) | 굿모닝

- 이전 세션 내용
F
  cat > "$ROOT/_init/세션 체크리스트.md" <<'F'
## 열린 프로젝트

### 활성

- **알파 프로젝트** `8/23` — 상태 알파 <!-- P1 -->
- **베타 프로젝트** `8/22` — 상태 베타 <!-- P2 -->
- **한글NFD 프로젝트 값** `8/21` — 상태 감마 <!-- P3 -->

### 대기
F
  cat > "$ROOT/_init/작업 큐.md" <<'F'
## 작업 큐

### 활성 — 지금 진행 중

##### Q1 — 첫째 섹션
본문 첫째 1
본문 첫째 2

##### Q2 — 둘째 섹션
본문 둘째 1

##### Q3 — 셋째 섹션
본문 셋째 1

### 완료
F
  cat > "$ROOT/_init/_myJournal/2026-08-23.md" <<'F'
###### 해야 할 일
- [ ] 무엇

###### 오늘의 요청
> 안내 문구

###### PM 한 줄
F
}

echo "── vault_write.py selftest ──"

# 1. 동시에 «다른» UID를 쓰면 둘 다 살아남는가
fixture
( "$VW" line-replace checklist P1 '- **알파** `8/23` — 창B가 씀' --expect '알파' >/dev/null 2>&1 ) &
( "$VW" line-replace checklist P2 '- **베타** `8/23` — 창C가 씀' --expect '베타' >/dev/null 2>&1 ) &
wait
if grep -q '창B가 씀' "$ROOT/_init/세션 체크리스트.md" && grep -q '창C가 씀' "$ROOT/_init/세션 체크리스트.md"; then
  ok "동시 쓰기 — 다른 UID 둘 다 생존"
else ng "동시 쓰기 — 다른 UID 둘 다 생존" "$(grep -c '창' "$ROOT/_init/세션 체크리스트.md") 건만 남음"; fi

# 2. 같은 UID를 동시에 → 하나가 이기고, 덮인 옛 줄이 감사 로그에 남는가
fixture
( "$VW" line-replace checklist P1 '- **알파** `8/23` — X <!-- P1 -->' --expect '알파' >/dev/null 2>&1 ) &
( "$VW" line-replace checklist P1 '- **알파** `8/23` — Y <!-- P1 -->' --expect '알파' >/dev/null 2>&1 ) &
wait
n=$(grep -c '<!-- P1 -->' "$ROOT/_init/세션 체크리스트.md")
if [ "$n" = "1" ] && [ -s "$ROOT/_dev/scripts/logs/vault_write.log" ]; then
  ok "동시 쓰기 — 같은 UID는 하나만 남고 옛 줄이 로그에"
else ng "동시 쓰기 — 같은 UID" "P1 $n건 / 로그 $( [ -f "$ROOT/_dev/scripts/logs/vault_write.log" ] && echo 있음 || echo 없음)"; fi

# 3. 없는 UID → exit 1 이고 파일이 한 바이트도 안 변하는가
fixture
before=$(md5 -q "$ROOT/_init/세션 체크리스트.md")
"$VW" line-replace checklist P99 '- 없는 것' --expect '아무거나' >/dev/null 2>&1
rc=$?
after=$(md5 -q "$ROOT/_init/세션 체크리스트.md")
if [ "$rc" = "1" ] && [ "$before" = "$after" ]; then ok "없는 UID → exit 1 · 파일 무변경"
else ng "없는 UID" "rc=$rc  md5 동일=$([ "$before" = "$after" ] && echo y || echo n)"; fi

# 4. 중복 UID → exit 1
fixture
echo '- **중복** `8/23` — 또 하나 <!-- P1 -->' >> "$ROOT/_init/세션 체크리스트.md"
before=$(md5 -q "$ROOT/_init/세션 체크리스트.md")
"$VW" line-replace checklist P1 '- 덮기' --expect '알파' >/dev/null 2>&1
rc=$?
after=$(md5 -q "$ROOT/_init/세션 체크리스트.md")
if [ "$rc" = "1" ] && [ "$before" = "$after" ]; then ok "중복 UID → exit 1 · 파일 무변경"
else ng "중복 UID" "rc=$rc"; fi

# 5. --expect 불일치 → exit 1 (존재하는 «다른» UID를 잘못 고른 경우)
fixture
before=$(md5 -q "$ROOT/_init/세션 체크리스트.md")
"$VW" line-replace checklist P2 '- 남의 자리에 쓰기' --expect '알파' >/dev/null 2>&1
rc=$?
after=$(md5 -q "$ROOT/_init/세션 체크리스트.md")
if [ "$rc" = "1" ] && [ "$before" = "$after" ]; then ok "--expect 불일치 → exit 1 · 파일 무변경"
else ng "--expect 불일치" "rc=$rc"; fi

# 6. 블록 교체가 «이웃 섹션을 같이 먹지» 않는가
fixture
cat > "$ROOT/body.md" <<'F'
##### Q2 — 둘째 섹션 (교체됨)
새 본문 A
새 본문 B
F
"$VW" block-replace queue Q2 "$ROOT/body.md" --expect '둘째' >/dev/null 2>&1
q="$ROOT/_init/작업 큐.md"
if grep -q '첫째 섹션' "$q" && grep -q '본문 첫째 2' "$q" \
   && grep -q '셋째 섹션' "$q" && grep -q '본문 셋째 1' "$q" \
   && grep -q '교체됨' "$q" && ! grep -q '본문 둘째' "$q"; then
  ok "블록 교체 — 이웃 섹션 보존"
else ng "블록 교체 — 이웃 섹션 보존" "$(grep -c '^##### ' "$q")개 섹션 남음"; fi

# 7. 한글 NFD 본문에서 도는가
fixture
python3 - "$ROOT/_init/세션 체크리스트.md" <<'PY'
import sys,io,unicodedata
p=sys.argv[1]; s=io.open(p,encoding='utf-8').read()
io.open(p,'w',encoding='utf-8').write(unicodedata.normalize('NFD',s))
PY
"$VW" line-replace checklist P3 '- **감마** `8/21` — NFD에서 씀' --expect '한글NFD' >/dev/null 2>&1
rc=$?
if [ "$rc" = "0" ] && grep -q 'NFD에서 씀' "$ROOT/_init/세션 체크리스트.md"; then ok "NFD 본문에서 --expect 매칭"
else ng "NFD 본문" "rc=$rc"; fi

# 8. 죽은 락은 회수하고, 산 락은 안 뺏는가
fixture
LK="$ROOT/_init/.세션 체크리스트.lock"
mkdir -p "$LK"; echo 999999 > "$LK/pid"      # 존재하지 않을 PID = 죽은 락
"$VW" line-replace checklist P1 '- **알파** `8/23` — 죽은락 뒤 <!-- P1 -->' --expect '알파' >/dev/null 2>&1
rc=$?
if [ "$rc" = "0" ] && grep -q '죽은락 뒤' "$ROOT/_init/세션 체크리스트.md"; then ok "죽은 락 회수"
else ng "죽은 락 회수" "rc=$rc"; fi

fixture
mkdir -p "$LK"; echo $$ > "$LK/pid"           # 이 셸 = 살아 있는 PID
before=$(md5 -q "$ROOT/_init/세션 체크리스트.md")
"$VW" line-replace checklist P1 '- 뺏기 시도' --expect '알파' >/dev/null 2>&1
rc=$?
after=$(md5 -q "$ROOT/_init/세션 체크리스트.md")
rm -rf "$LK"
if [ "$rc" = "2" ] && [ "$before" = "$after" ]; then ok "산 락은 안 뺏는다 → exit 2 · 파일 무변경"
else ng "산 락은 안 뺏는다" "rc=$rc (2 기대)"; fi

# 9. entry-fill — 이웃 엔트리 보존
fixture
cat > "$ROOT/body.md" <<'F'
- 한 일 하나
- 한 일 둘
F
"$VW" entry-fill 957 "$ROOT/body.md" --expect '창B' >/dev/null 2>&1
L="$ROOT/_클로드코드노트/클로드코드 세션 로그.md"
if grep -q '한 일 하나' "$L" && grep -q '세션 956' "$L" && grep -q '이전 세션 내용' "$L" && ! grep -q '씨앗' "$L"; then
  ok "entry-fill — 이웃 엔트리 보존"
else ng "entry-fill — 이웃 엔트리 보존"; fi

# 9b. entry-append — 실시간 한 줄 추가, 이웃 엔트리 보존
fixture
"$VW" entry-append 957 '- 완료: 실시간 기록' --expect '창B' >/dev/null 2>&1
L="$ROOT/_클로드코드노트/클로드코드 세션 로그.md"
if python3 -c "
import io,sys
l=io.open('$L',encoding='utf-8').read().split('\n')
i=[k for k,x in enumerate(l) if x.startswith('## 세션 957')][0]
j=[k for k,x in enumerate(l) if x.startswith('## 세션 956')][0]
sec=l[i:j]
sys.exit(0 if any('실시간 기록' in x for x in sec) and any('씨앗' in x for x in sec) else 1)"; then
  ok "entry-append — 957 안에 추가 · 씨앗 줄 보존"
else ng "entry-append"; fi

# 10. append-under — DN 섹션 끝에 붙고 다음 헤딩을 안 넘는가
fixture
"$VW" append-under dn '###### 오늘의 요청' '- [[요청.26.0823.테스트]]' >/dev/null 2>&1
D="$ROOT/_init/_myJournal/2026-08-23.md"
if python3 -c "
import io,sys
l=io.open('$D',encoding='utf-8').read().split('\n')
i=l.index('###### 오늘의 요청'); j=l.index('###### PM 한 줄')
sys.exit(0 if any('테스트' in x for x in l[i:j]) else 1)"; then ok "append-under — 올바른 섹션 안에"
else ng "append-under"; fi

# 11. line-add — UID 자동 발급 (max+1)
fixture
uid=$("$VW" line-add checklist '- **새 프로젝트** `8/23` — 신규' 2>/dev/null)
if [ "$uid" = "P4" ] && grep -q '<!-- P4 -->' "$ROOT/_init/세션 체크리스트.md"; then ok "line-add — UID 자동 발급 P4"
else ng "line-add" "발급=$uid (P4 기대)"; fi

# 12. --dry-run 은 쓰지 않는가
fixture
before=$(md5 -q "$ROOT/_init/세션 체크리스트.md")
"$VW" --dry-run line-replace checklist P1 '- 안 써야 함' --expect '알파' >/dev/null 2>&1
after=$(md5 -q "$ROOT/_init/세션 체크리스트.md")
if [ "$before" = "$after" ]; then ok "--dry-run 은 쓰지 않는다"; else ng "--dry-run"; fi

rm -rf "$ROOT"
echo "──"
echo "  $PASS/$((PASS+FAIL)) 통과"
[ "$FAIL" = "0" ] || exit 1
