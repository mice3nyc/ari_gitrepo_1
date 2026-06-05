## TASKS — v1.0

**현재 Phase**: Phase 8 완료, 다음 — 5시나리오 플테 + QA
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

**모션 통일 ✅** (e363c50)
- [x] `transition: all` 전부 제거 → 구체 속성으로 (panel, resource-num, stat-num)
- [x] start-btn-large: bg:#111/color:#fff → yellow + press 0.05s
- [x] card-reward-confirm: bg:#111/color:#fff → yellow + press 0.05s
- [x] recovery-card-btn: all 0.15s → transform 0.05s, box-shadow 0.05s

**스타일 가이드 체크리스트** (미완)
- [ ] 5시나리오 여러 경로 완주 검증
- [ ] 전항목 최종 QA

---

### Phase 7 — UI 텍스트 분리 (texts.yaml 확장) ✅

**texts.yaml 확장** (258개 항목, 새 섹션 12개)
- [x] title_screen — 타이틀 화면 텍스트
- [x] start_screen — 시나리오 선택 화면
- [x] game_flow — 게임 진행 UI (질문, 버튼, 패널 라벨)
- [x] cost_labels — 비용 라벨 (시간/에너지/할인/최종)
- [x] hud — HUD (자원/역량 패널)
- [x] modals — 레벨업, RP 분배 모달
- [x] coupon — 할인 카드 선택
- [x] recovery — 회복력 특별 UI
- [x] config_texts — resultTextsByType, resultMoods
- [x] inventory_labels — 인벤토리 섹션 라벨
- [x] scenario_report — 시나리오 활동 리포트
- [x] final_report — 최종 리포트 확장

**JS 코드 수정** (하드코딩 → TEXTS 참조, fallback 유지)
- [x] _t() 텍스트 헬퍼 함수 추가 (00-config.js)
- [x] 09-render-scenario.js — 타이틀/시작/게임흐름/비용/쿠폰 배지
- [x] 11-report.js — 활동 리포트/최종 리포트/성장 리포트
- [x] 13-inventory.js — 인벤토리 섹션/카드 리워드/회복력 모달
- [x] 04-resources.js — 쿠폰 선택 UI
- [x] 05-modals.js — RP 분배 모달 미리보기/손실 텍스트
- [x] 03-engine.js — 회복력 카드 노트 텍스트
- [x] 10-event-handlers.js — 아는것의 힘 라벨
- [x] 14-init.js — applyUITexts 확장 (HUD, 레벨업, RP, 리셋 모달)

**CSV 변환 워크플로우**
- [x] texts_to_csv.py — YAML → CSV (258개 항목)
- [x] csv_to_texts.py — CSV → YAML (round-trip 검증 통과)

**빌드**: 861,582 bytes (이전 847,291 → +14,291)

---

### Phase 8 — 시나리오 데이터 CSV 편집 워크플로우 ✅

**scenarios.yaml 구조 분석** (세션340)
- [x] scenarios.yaml 전체 구조 분석 (9,604행, 5 시나리오, 20개 섹션)
- [x] tier2 포맷 차이 발견: delta 중첩(selfintro/groupwork/eorinwangja) vs 직접 del/know(career/studyplan)
- [x] reportData = finals 중복 확인 → rebuild 시 자동 재생성
- [x] 선택적 필드 목록화: earnedCards(100/135), item null(9건), basePoint(3시나리오), hiddenIssues(산발), domainLabel(career 누락), cuts/semesterClosing(시나리오별)

**CSV 스키마 설계 + 스크립트**
- [x] 3 CSV 분리: scenario_meta(5행×15컬럼) + scenario_choices(75행×32컬럼) + scenario_leaves(135행×45컬럼)
- [x] scenarios_to_csv.py 작성 — YAML → 3 CSV
- [x] csv_to_scenarios.py 작성 — 3 CSV → YAML (tier2 두 포맷 자동 판별)
- [x] round-trip 검증 통과 (deep_compare, 원본과 데이터 동일)
- [x] 빌드 검증: 861,610 bytes (YAML 포매팅 차이 +28, 데이터 동일)

**통합 빌드 스크립트**
- [x] update.py 작성 — csv_to_texts + csv_to_scenarios + build.py 한 줄 실행
- [x] --verify, --skip-texts, --skip-scenarios, -i 옵션
- [x] 동작 검증 (시나리오 verify 통과, 빌드 성공)

**문서 갱신**
- [x] SPEC §12 시나리오 CSV 워크플로우 + update.py 워크플로우 추가
- [x] PLAN Phase 8 + 데이터 소스 목록 추가
- [x] TASKS Phase 8 체크리스트 추가

---

### 볼트 노트 갱신

- [x] 세션 체크리스트 갱신
- [x] DN 오늘의 요청 등록
