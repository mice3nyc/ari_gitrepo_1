## TASKS — v1.0

**현재 Phase**: Phase 0 완료, Phase 1 대기
**v0.9 마지막 커밋**: 928c740
**베이스**: v0.9 index.html (826,534 bytes → v1.0 빌드 829,037 bytes)
**스타일 가이드**: [[AI 리터러시 게임 — 스타일 가이드]]

---

### Phase 0 — 빌드 준비 ✅

- [x] v10 폴더 생성 + v09 코드/데이터 복사
- [x] storageKey 교체 (v09→v10)
- [x] eventLogKey + sessionIdKey 교체 (v08→v10)
- [x] title / vtag 교체 (v0.9→v1.0)
- [x] template 재생성 (v09 desync 해결)
- [x] build.py 빌드 검증 (829,037 bytes)
- [x] SPEC / PLAN / TASKS 작성

---

### Phase 1 — CSS 토큰 + 전역 리셋

- [ ] `:root` CSS custom properties 선언 (surface, ink, accent 4색, accent 변형, geometry)
- [ ] body background: `#f5f5f5` → `var(--bg-page)`
- [ ] 나눔손글씨 펜 @import 추가
- [ ] font-family 변수 적용 (`--font-main`, `--font-hand`)
- [ ] border-radius 전역 0 리셋 (template 내 ~25건)
  - 제외: `.pending-dot`, `.coupon-radio`, `.progress-dot`, `.inv-tab-badge`, `.scenario-card .sc-num` (원형 요소)
- [ ] border 통일: 옅은 회색(`#aaa/#ccc/#e5e5e5`) → `var(--border-w) solid var(--ink)` (~10건)
- [ ] box-shadow 통일: 블러 있는 것 → `var(--shadow)` (~15건)
- [ ] 브라우저 검증
- [ ] 커밋

### Phase 2 — 버튼 체계 통일

- [ ] `.btn` 공통 클래스 CSS 정의 (yellow bg, black text, 3px border, 4px shadow)
- [ ] `.btn--ghost` / `.btn--correct` / `.btn--wrong` 변형
- [ ] `.start-btn` → `.btn` 전환 (bg:#111,color:#fff → yellow,black)
- [ ] `.advance-btn` → `.btn` 전환
- [ ] `.next-btn` → `.btn` 전환
- [ ] `.action-main` → `.btn` 전환 (Display 크기 유지)
- [ ] `.lvup-confirm` → `.btn` 전환
- [ ] `.rp-confirm` → `.btn` 전환
- [ ] `.recovery-card-btn` → `.btn` / `.btn--ghost` 전환
- [ ] JS 인라인 스타일 버튼들 전환 (replay-btn-grade, replay-btn-cut6 등)
- [ ] 누름 피드백 통일: translate(2px,2px) + shadow-press
- [ ] 브라우저 검증
- [ ] 커밋

### Phase 3 — 카드·패널·모달 컴포넌트

- [ ] `.choice-card` — 3px border + 4px shadow + hover 리프트 + active 누름
- [ ] `.panel.active/.done` — border/shadow 교체
- [ ] `.modal-card` — 블러 shadow → 8px 8px 0 #000, radius 0
- [ ] `.coupon-box` — 동일
- [ ] `.inv-tab` — radius 0, shadow 교체
- [ ] `.inv-card` — radius 0, shadow 교체
- [ ] `.card-reward-card` — radius 0, shadow 교체
- [ ] `.recovery-card` — dashed border 유지, radius 0, shadow 교체
- [ ] `.report-*` 섹션들 — border/shadow 교체, 내부 배경 → bg-soft
- [ ] `.report-narrative-cardtype` — 현재 bg:#111,color:#fff → 검토 (절대 규칙 충돌)
- [ ] `.scenario-progress-strip` — border/shadow 교체
- [ ] `.score-display` — border/shadow 교체
- [ ] 브라우저 검증
- [ ] 커밋

### Phase 4 — 색상 재매핑

- [ ] `.bipolar-fill.positive` — `#1a8c1a` → `var(--acc-mint-deep)`
- [ ] `.bipolar-fill.negative` — `#c44` → `var(--acc-pink-deep)`
- [ ] `.pending-dot.positive` — `#1a8c1a` → `var(--acc-mint)`
- [ ] `.pending-dot.negative` — `#c44` → `var(--acc-pink)`
- [ ] `.cost-box-effect` — green 계열 → mint 토큰
- [ ] `.cost-card-chips .card-chip` — green 계열 → mint 토큰
- [ ] `.insufficient-tag` — `#c44, color:#fff` → pink, color:black
- [ ] 인라인 스타일 색상 교체 (JS 내부 HTML — grep으로 찾기)
  - `#1a8c1a` → mint 계열
  - `#c44` / `#a33` → pink 계열
  - `#f8f8f8` / `#fafafa` → bg-soft
  - `#fff8e1` / `#f57c00` (경고 배경) → yellow-soft / yellow-deep
- [ ] 쿠폰 뱃지 색상 전환 (`#15803d` → mint 계열)
- [ ] 브라우저 검증
- [ ] 커밋

### Phase 5 — 인라인 하이라이트 + 손글씨

- [ ] `.hl` 클래스 4종 CSS 정의 (hl--y, hl--c, hl--m, hl--p)
- [ ] 튜토리얼 텍스트에 하이라이트 적용
- [ ] 시나리오 인트로/아웃로에 하이라이트 적용 검토
- [ ] 피드백 한마디 영역에 `--font-hand` 적용
- [ ] 브라우저 검증
- [ ] 커밋

### Phase 6 — 모션 통일 + 최종 검증

- [ ] `transition: all 0.2s` → `transform 0.05s, box-shadow 0.05s` (전역)
- [ ] 모든 인터랙션 누름 피드백 점검
- [ ] 스타일 가이드 §9 체크리스트 전항목 검증:
  - [ ] 모든 카드/버튼 — 3px 검정 테두리
  - [ ] 모서리 직각 (border-radius: 0)
  - [ ] 그림자 4px 오프셋 단색 (블러 0)
  - [ ] 화면당 액센트 2색 이하
  - [ ] 정답/오답 색 매핑 일관 (mint/pink)
  - [ ] 모든 텍스트 검정 — 흰글씨 없음
  - [ ] 손글씨 보조 영역만
  - [ ] Paperlogy 로드 + Pretendard 폴백
  - [ ] 모든 인터랙션 누름 피드백
- [ ] 5시나리오 여러 경로 완주 검증
- [ ] 빌드 + 커밋 + 푸시

---

### 볼트 노트 갱신

- [ ] 세션 체크리스트 갱신
- [ ] DN 오늘의 요청 등록
