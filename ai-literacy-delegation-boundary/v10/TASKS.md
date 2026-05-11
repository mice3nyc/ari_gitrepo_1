## TASKS — v1.0

**현재 Phase**: Phase 1~4 통합 완료, Phase 5 대기
**v0.9 마지막 커밋**: 928c740
**v1.0 커밋**: a0915f8 (Phase 0 + Phase 1~4 통합)
**빌드**: 832,048 bytes
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

### Phase 1~4 통합 — Neo-Brutalism 전면 적용 ✅

피터공 피드백("색 없이 테두리만 두꺼워졌다")으로 Phase 1~4를 합쳐서 한 번에 적용.

**Phase 1 — CSS 토큰 + 전역 리셋 ✅**
- [x] `:root` CSS custom properties 선언 (surface, ink, accent 4색+변형, geometry, font)
- [x] body background: `#f5f5f5` → `var(--bg-page)` (#d0d0d0)
- [x] 나눔손글씨 펜 @import 추가
- [x] font-family 변수 적용 (`--font-main`, `--font-hand`)
- [x] border-radius 전역 0 리셋 (30건, 원형 50% 7건 유지)
- [x] border 통일: 옅은 회색 → `var(--border-w) solid var(--ink)` (12건)
- [x] box-shadow 통일: 블러 → `var(--shadow)` 4px offset 단색 (10건+)
- [x] JS 인라인 스타일 border-radius/shadow/border (12건)

**Phase 2 — 버튼 체계 통일 ✅**
- [x] `.start-btn` — bg:#111,color:#fff → yellow bg, black text, 4px shadow
- [x] `.advance-btn` — 동일
- [x] `.next-btn` — 동일
- [x] `.action-main` — 동일 (Display 크기 유지)
- [x] `.action-secondary` — ghost 스타일 (white bg, black text)
- [x] `.lvup-confirm` — yellow
- [x] `.rp-confirm` — yellow, disabled=bg-page
- [x] `.rp-btn` — white bg + 4px shadow, charging=yellow
- [x] `.recovery-card-btn.primary` — yellow
- [x] `.recovery-card-btn.secondary` — ghost
- [x] `.confirm-cancel` — ghost
- [x] `.confirm-destructive` — pink bg, black text
- [x] `.gameover-report` — yellow
- [x] `.gameover-restart` — ghost
- [x] JS 인라인 버튼 (replay-btn-grade, replay-btn-cut6) — yellow/ghost
- [x] 누름 피드백 통일: translate(2px,2px) + shadow-press

**Phase 3 — 카드·패널·모달 컴포넌트 ✅**
- [x] `.choice-card` — 3px border + 4px shadow + hover 리프트(-2px) + active 누름
- [x] `.choice-num` — yellow bg + black text + 2px border
- [x] `.panel` inactive — dashed ink-soft, bg-soft
- [x] `.panel.active/.done` — solid ink, bg-card, 4px shadow
- [x] `.modal-card` — 8px 8px 0 #000, radius 0
- [x] `.coupon-box` — border + 8px shadow
- [x] `.coupon-option` — 3px border
- [x] `.inv-tab` — radius 0, -4px 4px shadow
- [x] `.inv-card` — radius 0, 4px shadow
- [x] `.card-reward-card` — radius 0, 4px shadow
- [x] `.card-reward-card.growth-card` — dashed ink, bg-soft
- [x] `.recovery-card` — dashed ink, bg-soft, radius 0, 4px shadow
- [x] `.report-*` 섹션들 — border/shadow 교체
- [x] `.report-narrative` — bg-soft, 3px border, 4px shadow
- [x] `.report-narrative-cardtype` — bg:#111,color:#fff → yellow bg, black text
- [x] `.scenario-progress-strip` — 3px border, bg-soft, 4px shadow
- [x] `.scenario-card` — 3px border, 4px shadow
- [x] `.score-display` — 3px border, 4px shadow
- [x] `.gameover-card` — 8px shadow
- [x] `.card-inner` (시작화면) — white bg, 3px border, 8px shadow, h1 28px/800
- [x] `.binder-divider` — yellow 배경, 3px border

**Phase 4 — 색상 재매핑 ✅**
- [x] `.bipolar-fill.positive` — `#1a8c1a` → `var(--acc-mint-deep)`
- [x] `.bipolar-fill.negative` — `#c44` → `var(--acc-pink-deep)`
- [x] `.stat-num.positive/.negative` — mint-deep / pink-deep
- [x] `.pending-dot.positive/.negative` — mint / pink
- [x] `.cost-box-main` — pink-deep border, pink-soft bg
- [x] `.cost-box-effect` — mint-deep border, mint-soft bg
- [x] `.cost-formula-discount` — mint-deep
- [x] `.cost-formula-final` — pink-deep
- [x] `.card-chip` — mint-soft bg, ink text
- [x] `.insufficient-tag` — pink bg, black text
- [x] `.final-grade` — S/A mint-deep, C yellow-deep, D pink-deep
- [x] `.score-step-pts` — mint-deep
- [x] `.score-stat` — cyan bg, black text
- [x] `.inv-tab-badge` — pink
- [x] `.rp-bal-num.zero` — mint-deep
- [x] `.rp-bucket-num .waste` — pink-deep
- [x] `.gameover-resource-num` — pink-deep
- [x] JS `gaugeColorByPct` — mint/yellow/yellow-deep/pink
- [x] JS `gradeColor` — mint/black/yellow-deep/pink-deep
- [x] 브라우저 검증
- [x] 커밋 + 푸시 (a0915f8)

### 세션332 수정 (Phase 1~4 이후) ✅

- [x] 역량카드 배지: 텍스트 "역량카드 할인가능 – 할인 적용하기" + 블록 배치 + 1개도 선택 모달 필수
- [x] 적용 후 "{카드명} 역량카드 효과: -{N} 할인" + 비용 UI 실시간 갱신 + 할인+최종 동시 깜빡임
- [x] pending-dots 0점 정렬 (gauge-with-pending 래퍼)
- [x] choice-cost margin-top 1px
- [x] 할인 바닥값(DISCOUNT_FLOOR) 전면 폐지 — 전부 0
- [x] review 비용 계산 버그 픽스 (bid에서 전체 leaf 추출)
- [x] 어린왕자 시나리오 situation 텍스트 보강 (1문장→3문장)
- [x] 커밋 3건 push (f5b4c81, 166fa50, 6c685c0)

### Phase 4.5 — 이미지 프레임 효과 (SPEC §7.3) ✅

- [x] `.panel-image::after, .img-frame::after` — inset 5px 흰색 + 7px 검정 inner border
- [x] 리포트 카툰 이미지 — `class="img-frame"` 추가 (CSS ::after 공유)
- [x] 이미지 `width:100%; height:100%; object-fit:cover` 확인
- [x] 브라우저 검증

### Phase 5 — 인라인 하이라이트 + 손글씨 ✅

- [x] `.hl` 클래스 4종 CSS 정의 (hl--y, hl--c, hl--m, hl--p)
- [x] 튜토리얼 텍스트에 하이라이트 적용 (kw-time→hl--c, kw-energy→hl--p, kw-* CSS 삭제)
- [x] 피드백 한마디(awareness) — Cut6 + 리포트에 `--font-hand` 적용
- [x] 브라우저 검증

### 세션333 UX 수정 ✅

- [x] 다음 시나리오 버튼: 화면 하단 → Cut 6 패널 body 안으로 이동 (full-width yellow)
- [x] CUT 라벨: "CUT 3" → "3"만 표시 (숫자만)
- [x] 리플레이 버튼: A 등급에서도 제거 (S/A 없음, B ghost, C/D yellow)

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

- [x] 세션 체크리스트 갱신
- [x] DN 오늘의 요청 등록
