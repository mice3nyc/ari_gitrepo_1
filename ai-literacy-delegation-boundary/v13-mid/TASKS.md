## TASKS — v1.3-mid (중등)

**최종 업데이트**: 2026-06-11 세션468 (획득 팝업 v3 확보 버튼 + 자원토큰 보상 상향, SPEC-card-per-choice §2e·SPEC §18)

### §2e+§18 — 획득 팝업 확보 버튼 + 토큰 보상 두 자리 상향 (6/11 피터공, 세션468)

- [x] 획득 팝업 v3 — 자동 닫힘(4초)·×·아무데나 클릭 폐지 → **확보 버튼**(노랑) 단일 동선. railFlyToInventory 강제 닫힘은 `_forceClose` 핸들로 유지 — `16-card-rail.js`
- [x] 팝업 레이아웃 — 카드명 최상단 22px(over-image 24px) 굵게 + 아래 작은 설명 줄("「선택」 선택으로 획득!") — `08-inventory-and-rewards.css`
- [x] texts.yaml 키 2개(popup_desc_format·popup_btn_acquire) + ui_texts.csv 재추출(287항목)
- [x] rpRewardByGrade {S:30,A:20,B:15,C:10,D:5} / rpLevelUpBonusByLevel {2:10,3:15,4:20,5:25} — `00-config.js` (D:5는 2차 피터공 결정 "D도 한자리라도 주자")
- [x] 빌드(917,495B) + 린터 0 + 구문·인코딩 클린
- [x] (2차) 회복력 모달 §4k — 창 라운딩 20px·버튼 10px, 다시 도전=하늘색+↺, 다음 시나리오=노랑+→ — `13-inventory.js`·`08-inventory-and-rewards.css`
- [x] (2차) 획득 팝업 §4l — 타이틀 "{카드명} 확보!"(popup_title_format) + 인간중심 미리보기 한 줄("중심잡기 주체성") — `16-card-rail.js`
- [ ] 브라우저 확인 (피터공): 확보 버튼 닫힘→회전 비행 / "주체성 확보!" 타이틀·한 줄 카드 / 회복력 모달 라운딩·색 버튼 / 시나리오 완료 토큰 두 자리

### §17 — 시나리오 나가기 + 디버그 복구 (6/11 피터공, 세션467)

- [x] §17.1 디버그 버튼 클릭 복구 — 테마 z-index:1 강등 제거 + z-index:1300 (카드 독이 우측 하단 클릭 가로채던 것)
- [x] §17.2 나가기 버튼 — 확인 모달 → 롤백(자원 스냅샷·이번 판 카드·pending) → 시나리오 선택 화면. node 시뮬 6건 PASS
- [x] texts.yaml 키 추가(exit_scenario·exit_confirm) + ui_texts.csv 재추출(277항목)
- [x] 피터공 정정 2차 — 디버그=**좌측 하단**(패널도 좌측, version 라벨은 우측 하단으로 스왑) / 나가기=**전체 윈도우 좌측 상단 코너, 검정**(HUD 밖 fixed, `~` 셀렉터 연동, 자원 바 padding-left 76px)
- [x] 빌드 산출물(index.html) 커밋 — 세션468 창 라운드(b74b90c~5a5fc90)에 포함되어 커밋·라이브 반영 확인
- [ ] 브라우저 확인 (피터공): 좌측 하단 디버그 클릭·초기화 / 좌측 상단 나가기 → 선택 화면·자원 원복

> [!info] 이 빌드(v1.3-mid)는 1차 교사 검토(5명) 피드백 반영 작업 빌드. 중등 수리 완료 후 v13-elem로 초등 분기(기존 v12-elem 6/1 시나리오 정본 이전).
> 요청 노트: [[요청.26.0608.0851-AI리터러시교사반영]] / 신규 명세는 SPEC §14.
>
> **v12-mid 빌드 결과(이전)**: 867,921 bytes / Git `97387fe` / 라이브 .../ai-literacy-delegation-boundary/v12-mid/

---

### v1.3 — 진행 상태 복원 + 재도전 노출 (SPEC §14, 1차 교사 피드백)

- [x] v12-mid → v13-mid 폴더 분기 + storageKey/version/eventLogKey/sessionIdKey v13 교체
- [x] §14.1 (최서연샘) 새로고침 시 현재 위치 자동 복원 — `14-init.js` initEntry에 `continueGame()` 분기
- [x] §14.2 (사성진샘) 완료 카드 재도전 버튼 + 기존 등급/점수 — `09-render-scenario.js` showStartScreen + `06-scenario-select.css`
- [x] §14.3 (피터공) 인벤토리 패널 하단 "처음부터 다시"(전체 초기화) — `13-inventory.js` + `confirmReset`
- [x] §14.4 (피터공) 시나리오 카드 라벨 정리 — next 카드만 하늘색 PLAY 배지, '자유 선택' 제거 — `09` + `06-scenario-select.css`
- [x] 빌드 + 마커 검증
- [ ] 브라우저 3건 동작 확인 (피터공): 새로고침 복원 / 완료 카드 재도전 / 인벤토리 처음부터
- [ ] 재도전 확인 모달 필요 여부 판단 (우발 클릭 관찰 후)
- [ ] 나머지 교사 피드백 항목 작업 순서 정리 (항목별 대응표 기반: S5 다른 버그·S4·S3·S2·S6)
- [ ] (배포 전) 라이브 배포 경로 + 커밋

---

## TASKS — v1.0 (역사 본문, v1.1 시점에서 계승)

**현재 Phase**: Phase 8 완료, 다음 — 5시나리오 플테 + QA
**v0.9 마지막 커밋**: 928c740
**v1.0 커밋**: a0915f8 (Phase 0 + Phase 1~4 통합)
**빌드**: 832,048 bytes (v1.0 시점, 현 v12-mid = 867,921)
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

---

### S3 기획 수정 1차 — delegation 부호 (6/10, SPEC §15)

- [x] SPEC §15 작성 (선문후코)
- [x] scenarios.yaml 백업(`scenarios.yaml.before-s3-delegation-fix`) + 11건 수정 (tier1 B→0·C→− ×5, 어린왕자 C3 →−)
- [x] diff 검증 (의도 변경 외 ruamel 정규화뿐) + 백스페이스 0
- [x] build.py 재빌드 (870,941 bytes) + 산출물 부호 3건 확인
- [x] scenarios_to_csv.py 재생성 — CSV 레이어 동기화 검증
- [ ] 피터공 브라우저 확인 → 커밋
- [ ] (제안 대기) 진로·시험2주전 afterX 분화 보강
- [ ] (보류, S1 재밸런싱과 묶음) `++`/`--` ±2 활성화 — 갈래 2

---

### 논리정합 Phase 1~2 — SPEC §16 + 정합성 린터 (6/10, 세션457)

- [x] SPEC §16 작성 (선문후코) — 규칙 R1·R2·R3a/b/c·R4·R5·R8 기계 검사 형태 명세, R6/R7 보류
- [x] `scripts/check_consistency.py` 제작 — yaml 전수 검사, md+CSV 리포트, allowlist(`data/consistency_exceptions.yaml`) 지원, exit code
- [x] 명세 보정 2건 (코드 현실 반영): ① cardEarned는 성장카드 포함 지급 게이트(`03-engine.js:89`)라 D도 true가 정상 ② R1 카드 수는 실지급 기준(cardEarned=false→0)
- [x] update.py 끝에 린터 연결 (경고 전용, 빌드 차단 안 함)
- [x] 1차 실행 — **위반 33건** (R1 2·R2 1·R3a 2·R3b 5·R3c 22·R4 1, R5·R8 클린). 세션456 수기 발견(D카드 2곳·C없음 5곳·빈자리발견)과 정확히 일치 + 신규 발견(R3c 경로 밖 카드 22)
- [x] 아리공 1차 가설표 — 위반 33건을 수정 단위 18행으로 (`data/exports/검토_260610/정합위반_가설표_18행.csv` + Downloads 사본). 핵심 발견: 분석력 10건의 뿌리는 검토 선택지 태그의 시나리오 간 비일관 / 시험2주전 A계열 8결말 '문제해결적 사고' 복붙
- [x] 피터공 1차 결정 (6/10 저녁): ① 카드 지급선 — B 이상 검토 무관 카드 / C는 검토가 가른다(R1 무·R2/R3 유) / D 회복력만 ② 어린왕자 C1R3 = D 유지·카드 제거가 아니라 **C(60) 상향 + 카드 유지** ③ 텍스트-경로 정합(R9) 검사 필수 → SPEC §16 R3b 정교화 + R9 등록, 린터 갱신(위반 33→34건: C+R1 무카드 3곳 위반 해제, 카드 있는 4곳 위반 전환)
- [x] 가설표 v2 (16행, 34건 덮음) — `검토_260610/정합위반_가설표_v2_16행.csv` + Downloads 사본 (v1 폐기)
- [x] R9 텍스트-경로 정합 백도 5개 가동 (시나리오별 27결말 전수, `텍스트정합_{sid}.md` 산출 예정)
- [x] 백도 텍스트정합 5종 취합 — 확실 29 / 애매 22. 공통 패턴: 검토 단계 공유 문구(컷5·검토보충·리포트회고)가 B계열(AI) 기준으로 쓰여 경로 무관 일괄 배정 + 어린왕자 B3 경로 정의 혼동
- [x] **v22 일괄 정비 실행** (`data/migrate_v22.py`, 피터공 "가설대로 + 텍스트 모순까지 합쳐서 진행" 6/10 저녁) — 구조 16행 + 텍스트 확실 건, 변경 86경로. 백업 `scenarios.yaml.before-v22-migration`
- [x] 검증: **린터 8규칙 클린(위반 0)** / diff 86경로 전수 의도 일치 / 백스페이스 0·NFC / 빌드 870,918 bytes 새 문구 반영 / scenario CSV 3종 + 검토 매트릭스 재생성
- [x] 대조표 2종: `검토_260610/정비결과_v22_대조표.csv`(기계 추출 86행, Downloads 사본) + `.md`(읽기용)
- [ ] 피터공 대조표 재검토 (특히 텍스트 "수정 후" 문구 — 아리공 작성) → 이의 행만 재정비
- [ ] 피터공 브라우저 확인 → 커밋 (부호 11건 + v22 정비 묶어서)
- 보류: 텍스트 애매 22건 / 죽은 미러 필드 불일치(죽은 데이터 일괄 정리 때)
- [ ] Phase 3 일괄 정비 (백업+마이그레이션+diff+재빌드+CSV 동기화)

**발견 (별건)**: `update.py --verify`가 텍스트 라운드트립에서 실패 — ui_texts.csv `<br>` vs texts.yaml ` - ` 드리프트 (기존 문제, 이번 작업과 무관). 다음 텍스트 CSV 작업 때 정리 필요.

---

### UI 업데이트 트랙 + 카드 선택별 획득 트랙 (6/11, 세션460 신설)

> 별도 트랙 문서로 관리 (피터공 지시: 콘텐츠 작업과 다른 트랙). 상세 진행은 각 PLAN이 단일 소스.

- **HUD 개편**: [PLAN-ui-update.md](PLAN-ui-update.md) + [SPEC-ui-hud.md](SPEC-ui-hud.md) — 자원 바(아이콘·두툼·수치 좌정렬)·역량 원 7개 미터(주황3+초록·오버플로 링)·레이블 선택/능력·pending 세모 제거·중간 박스 제거·카드 토스트 라운딩+능력형 표시명(display 매핑, scenarios.yaml 무수정). 피터공 v3 확인 중.
- **카드 선택별 획득**: [PLAN-card-per-choice.md](PLAN-card-per-choice.md) + [SPEC-card-per-choice.md](SPEC-card-per-choice.md) — selfintro 파일럿 가동(지급 규칙 v0 데이터 도출, 결말 일괄 지급 대체, perChoice 카드는 다음 시나리오부터 쿠폰 가능). 파일럿 통과 시 Phase 2 전체 개편, KT(6/19) 전 완료 목표.
- 두 트랙 모두 커밋은 v22 검토 게이트와 묶어서 한 번에.

### 카드 UI/UX 수정 4건 (6/11, 세션462 — 피터공 요청)

> SPEC-ui-hud §4d + SPEC-card-per-choice §2b. 빌드 886,606 bytes (린터 클린, 헤드리스 로드 OK).

- [x] (1) 카드 획득 연출 교체 (파일럿) — 우측 획득 팝업(「선택」→○○ 획득!, X·클릭·4초 자동 닫힘) → 우측 레일에 팝 등장(위→아래 스택) → 컷6 체인 끝에 역량카드 버튼으로 순차 비행. 신설 `src/js/16-card-rail.js`. 검토 카드 지급을 컷6 일괄 → onReview 직후로 이동. 레일 정리 훅(시작·리플레이·리셋·시작화면). 모달 없는 경로(S/A) 팝업-비행 레이스 방어.
- [x] (2) 폰트 — `00-base.css`에 `button,input,select,textarea{font-family:inherit}` 전역 추가 (폼 요소 시스템 폰트 누수 차단). 손글씨 4곳·debug monospace 유지.
- [x] (3) 결말 재시도 모달 — primary/secondary 차등 제거, [다시 도전] [다음 시나리오] 동일 스타일 가로 배치. texts.yaml·ui_texts.csv 동기(btn_use_sub 제거).
- [x] (4) 검토 선택지 표기 R1~R3 → 1·2·3 (컷4 choice-num·컷5 chosen-title, 표시만).
- [ ] 피터공 브라우저 확인 (확인 포인트: 팝업 리듬·레일 위치와 역량카드 버튼 겹침·비행 연출·재시도 모달 톤)

### 논리정합 텍스트 보류 22건 정비 (6/11, 세션463)

> 피터공 결정: "어긋나게 읽힐 수 있으면 전부 경로 맞춤 수정". `data/migrate_hold22.py`, 백업 `scenarios.yaml.before-hold22`. 빌드 887,570 bytes (린터 클린, 드리프트 0, 인코딩 클린).

- [x] 공통 문구 돌려쓰기 회색지대 24곳 경로 맞춤 문구로 교체 (자기소개 6·모둠 3·진로 6·공부계획 9)
- [x] 등급-톤 모순 2곳 — 어린왕자 A3R1·B1R3 cut6Feedback을 B등급 톤으로
- [x] 카드 표기 불일치 — 어린왕자 A2R2 reportCardSummary를 domainCards와 일치 + 같은 결 A2R1·A2R3 덤 2건
- [x] 내부 메모 — studyplan matchGroups C1R3 note의 C2 설명 정정
- [x] 유지 판단 1건 — 어린왕자 C1R1 reportReflection (경로와 정합, 수정 안 함)
- [x] yaml→CSV 재추출(scenarios_to_csv.py)→빌드→린터 3층 동기화
- [x] 대조표 29행 `exports/검토_260611/정비결과_보류22_대조표.csv` + 구글 시트 + ~/Downloads 사본
- [x] 피터공 1차 확인 — 자기소개 1~5행 돌아보기 문장을 조건문 충고투 → 과거 서술로 재작성 지시·반영. v22 텍스트 40건도 같은 눈으로 전수 스캔(돌아보기 자리 클린, 컷6 격려체는 필드 양식이라 유지)
- [x] 커밋·푸시 8b865f4 (6/11)
- [ ] 피터공 CSV 전체 검토 (다운로드 `AI리터러시_정비_검토용_전체_대조표_260611.csv` 115행) — 이의 행 나오면 후속 수정

#### 6/11 세션465 — 컷6 폰트 + HUD 중앙 실시간 점수 그래프 (SPEC-ui-hud §4d-2 v5 보강 + §4e)

- [x] 컷6 awareness(결과 설명) 손글씨(나눔펜 22px) → Paperlogy 상속 16px (09-render-scenario.js)
- [x] HUD 3:5:3 분할 — 자원(3) : 점수 그래프(5) : 역량(3)
- [x] 중앙 0~100 시나리오 점수 그래프 + getLiveScore() (확정 전 tier1+tier2 points 합산, 검토 확정 시 CSV score 스냅)
- [x] icon-schoolhead.svg 머리/기어 패스 분리 인라인 — 기어 SMIL 회전(중심 11,10, 4s), 머리가 채움 끝 따라 이동, 점수 숫자 머리 좌측
- [x] 누적 SCORE(totalScore+score) 그래프 우측 + LV·XP 컴팩트 행 이동
- [x] 헤드리스 크롬 검증(0→25→47→92 스냅, 에러 0) + 스크린샷 확인, 빌드 893,384B 린터 0
- [ ] 피터공 라이브 확인 (그래프 리듬·머리 아이콘 위치·기어 속도)

#### 6/11 세션465 v6.1 — 피터공 라이브 확인 후 4건 (SPEC §4e-6)

- [x] XP 바 HUD 표시 제거 (exp/레벨업 시스템 무변, updateExpUI null-safe 재배열)
- [x] 중앙 배경 하늘색 → 흰색 (10-paperlogy 테마)
- [x] LV을 SCORE 숫자 아래 작은 한 줄로
- [x] 머리 아이콘 26px → 40px (XP 행 제거 공간 사용)
- [ ] 피터공 라이브 재확인

#### 6/11 세션465 — 카드 선택별 획득 Phase 2 전체 적용 (SPEC-card-per-choice §5)

- [x] 축→태그 맵 5종 추가 (15-card-per-choice.js) — selfintro 파일럿 맵 유지, 나머지 finals 최빈 태그
- [x] 대조표 135행 생성 (exports/검토_260611 + 다운로드) — 동일 26/차이 109/중복 8
- [x] SPEC-card-per-choice §5 명문화 + SPEC.md §16 주석 + PLAN Phase 2 체크
- [x] 빌드 893,934B + 린터 0 + 헤드리스 검증 (좋은 경로/D경로/일괄 지급 차단)
- [ ] 피터공: 대조표 검토 + 축→태그 맵 4종 확인 + "D도 검토하면 검토 카드" 판단 + 초등 반영 여부

#### 6/11 세션465 v6.2 — 미터 안 머리(스케치 IMG_4762) + 중복 획득 차단

- [x] 중앙 박스 drop shadow 제거 + 라운딩 16px + 밝은 하늘색 #e5f6fc
- [x] 트랙 알약형 44px — 머리(34px)가 안에, 0/100점 모두 안쪽 클램프, 낮은 점수 숫자 우측 플립
- [x] 중복 획득 차단 (피터공 "이미 받은 것을 또 받지는 않음") — 같은 시나리오 내, _ownedThisScenario
- [x] 초등 결정 기록: 중등 수정 완료 후 진행
- [x] 빌드 895,447B + 린터 0 + 헤드리스 검증(중복 차단·클램프·num-right)

#### 6/11 세션465 v6.3 — 머리 노랑 원 + 그림자 진짜 제거

- [x] rider = 노랑 원 36px + ink 테두리, 머리 24px 중앙 (채움 경계 비침 차단, 양끝 2px 클램프)
- [x] 테마 CSS의 score-display 그림자 그룹(5px 5px 0) 분리 — v6.2 box-shadow:none이 덮였던 원인

#### 6/11 세션465 v6.4 — 노랑 원 정합

- [x] 노랑 원 = 바 내부 높이(40px) / 초록 채움 우측 끝 = 원 우측 끝 (max(0px) 클램프) / 점수 숫자 흰색(플립 시 ink)

#### 6/11 세션465 — 중심잡기 태그 시나리오별 분산 (커밋 a15c99a, 기록 보충)

- [x] 피터공 "5번 모두 주체성은 좀" → groupwork 적응성·eorinwangja 호기심·career 호기심 (SPEC-card-per-choice §5 표)
- [x] 대조표 재생성 (중복 차단 반영, 동일 24/차이 111, 다운로드 사본 갱신)

#### 6/11 세션466 — 시나리오 화면 수정 5건 (SPEC-ui-hud §4f v7)

- [x] (1) 컷1 상황 텍스트 .situation-text 15px (03-overlays CSS)
- [x] (2) 비용 표기 — 시간 비용 − 선택 할인 = 비용 / 에너지 비용 − 능력 할인 = 비용 (texts.yaml cost_labels 키 개편 + ui_texts.csv 재생성)
- [x] (3) 할인 가능 선택지 텍스트 끝 초록 표식 .card-discount-mark (버튼 아님, coupon.choice_mark)
- [x] (4) 쿠폰 모달 확정 = 즉시 선택 진행 — onTier2/onReview 콜백 자기 재호출 (재클릭 단계 제거)
- [x] (5) 하단 cost-coupon-badge 제거 + _updateCouponBadge·blink CSS·badge 텍스트 키 삭제
- [x] 빌드 893,260B + 린터 0 + 인코딩 클린 + 헤드리스 검증(라벨 공식·표식 2개·모달 즉시 진행·에너지 소비)
- [ ] 피터공 브라우저 확인 — 컷1 폰트 크기, 표식 톤, 모달 확정 직행 리듬

#### 6/11 세션466 v8 — HUD 색·미터 0기준 + 컷3 위임 깊이 제거 (SPEC-ui-hud §4g)

- [x] (1) 자원 게이지 색 핑크 고정 (gaugeColorByPct 상수화 — 잔량별 변화 폐지)
- [x] (2) 원 미터 0개 시작·마이너스 폐지 — filled=clamp(raw,0,7), absorbPending 0 바닥, 채움 전부 초록 단일(주황 시작분 폐지)
- [x] (3) 점수 그래프 채움 #15803d (쨍한 초록, 구 할인 배지 색)
- [x] (4) 컷3 "위임 깊이: ±N" 제거 + texts delegation_depth 키 삭제·csv 재생성
- [x] 빌드 + 린터 0 + 인코딩 클린 + 헤드리스 8체크 (미터0·핑크·채움색·바닥0·dot1·깊이제거)
- [ ] 피터공 브라우저 확인

#### 6/11 세션466 v9 — 자원 미터 라운딩·흰 숫자·테두리 +1px (SPEC-ui-hud §4h)

- [x] 시간·에너지 게이지 알약형(radius 999px) + 채움도 라운딩
- [x] 게이지 숫자 흰색 (left 6→8px)
- [x] 알약 미터 테두리 2→3px (resource-gauge·score-graph-track, 테마 exp-bar 그룹 분리)
- [x] 빌드 + 헤드리스 5체크 (radius·border3·흰숫자·트랙3px·채움radius)
- [ ] 피터공 확인 — 원 미터 dot(토큰)도 3px로 갈지 (이번엔 알약형 둘만 해석)

#### 6/11 세션466 v9 보강 — 토큰 원 3px + 게이지 높이 26px (SPEC-ui-hud §4h v9 보강)

- [x] cm-dot·cm-overflow 테두리 2→3px (01-hud + 테마)
- [x] 자원 게이지 높이 22→26px (숫자 14px가 테두리에 닿던 문제)
- [x] 빌드 + 헤드리스 3체크

#### 6/11 세션466 v9 보강2 — 점수 머리 노랑 원 테두리 4px

- [x] score-graph-rider 테두리 2→4px + 빌드

#### 6/11 세션466 — 획득 팝업 컷 이미지 위 + 레일 비행 (SPEC-card-per-choice §2c) / 노랑 원 출렁임 동기 (SPEC-ui-hud §4e-10)

- [x] 팝업 앵커 = 선택 요약 컷 이미지(tier1→컷2·tier2→컷3·review→컷5), absolute 문서 좌표, scale 등장, 앵커 실패 시 우측 고정 폴백
- [x] 팝업 닫힘 시 미리보기 카드 고스트가 레일 슬롯으로 비행(0.5s) → 도착 시 레일 팝
- [x] rider left를 max/calc 문자열 → px 계산 (트랜지션 보간 복구, 채움 바와 같은 바운스)
- [x] 빌드 + 헤드리스 (over-image·컷2 겹침·비행 후 레일 1장·rider px)
- [ ] 피터공 확인 — 팝업이 이미지를 가리는 정도, 비행 톤

#### 6/11 세션466 — 획득 팝업 v2.1: 띠용 팝 + 이미지 하단 중앙 + 크게 (SPEC-card-per-choice §2c v2.1)

- [x] 등장 scale 0.3→1 오버슈트 바운스 0.45s / 이미지 가로 중앙·바닥 14px 위 / width 300px(≤1320 260)·padding 20/24·획득 글자 18px
- [x] 빌드 + 헤드리스 (하단 정렬·폭 300·패딩 24 — 중앙은 헤드리스 좁은 패널에서 화면 경계 클램프, 실폭 OK)

#### 6/11 세션466 v10 — 타이틀 화면 레트로 재작업 + 3화면 분리 (SPEC-ui-hud §4i)

- [x] 물마루 도입 — ../fonts/Mulmaru.woff2(99KB, OFL+LICENSE), @font-face, --font-pixel
- [x] 타이틀 → 튜토리얼(신설 showTutorialScreen) → 시나리오 선택 분리
- [x] 레트로 타이틀: 다크+스캔라인, 2줄 메인(흰/노랑+핑크 하드섀도, 띠용 등장), 서브 2줄, host_text, ▶ 시작하기 깜빡임
- [x] texts.yaml title_screen 개편 + tutorial_screen 신설 + csv 재생성(270항목)
- [x] 빌드 + 스크린샷 확인 + 3화면 흐름 헤드리스 + 린터 0
- [ ] 피터공 확인 — 타이틀 임팩트·배지(경기도 하이러닝) 유지 여부·재방문 스킵 필요성

#### 6/11 세션466 — 카드 독 + 팝업 중앙 보정 + UI 전체 물마루 (SPEC-card-per-choice §2d, SPEC-ui-hud §4i-6)

- [x] (1) 팝업 우측 밀림 수정 — 앵커를 rect → offsetLeft 체인(패널 slide-in transform 중 측정 문제)
- [x] (2) 카드 독 #card-dock — 우측 끝 상시, 인간중심 역량/능력 카드 2섹션, 획득 순서 스택, 클릭=상세 패널
- [x] 획득 = 팝업에서 회전(540°) 비행 → pending(점선) 칩 / 시나리오 완료 = 철컥(dockClunk) locked 고정
- [x] inv-tab 버튼 숨김(독 대체), 레일·종료 비행 폐기 (railClear/railFlyToInventory 이름 유지 호환)
- [x] UI 전체 물마루 — --font-main 1순위 교체 (Paperlogy 폴백)
- [x] 빌드 + 린터 0 + 헤드리스(독 표시·pending 1·철컥 후 locked) + 스크린샷 확인
- [ ] 피터공 확인 — 본문 픽셀체 가독성, 성장카드(회복력·도전력) 능력 섹션 배치, 빈 섹션 표시

#### 6/11 세션466 — 카드 독 v2 다듬기 5건 (SPEC-card-per-choice §2d v2 보강)

- [x] inv-tab·inv-panel 폐지 (독 클릭 동작 제거, 리셋=디버그 초기화만)
- [x] 섹션 레이블 13px / 칩 글씨 14px / 한 줄 표기(nowrap) + 독 폭 200px(≤1320 170)
- [x] pending = 진한 회색·컬러 없음·점선·깜빡임(dockBlink) → 철컥 때 컬러 입힘(_dockChipApplyLocked)
- [x] 빌드 + 린터 0 + 스크린샷 (locked 컬러 칩·pending 회색 점선 공존 확인)

#### 6/11 세션466 — 공통 타이틀 헤더 (SPEC-ui-hud §4i-7)

- [x] buildGameTitleHead() — 튜토리얼·시나리오 선택 상단에 "내가 할까? 시킬까? 그것이 문제로다!" + "AI 리터러시, 위임의 경계!"
- [x] 시나리오 선택 기존 h1 대체, "튜토리얼 다시 보기"를 분리된 안내 화면으로 연결
- [x] 빌드 + 두 화면 스크린샷 확인

#### 6/11 세션466 v10.1 — 타이틀 배지 문구·여백 + 타이틀 확대

- [x] 배지 "경기도 하이러닝 - AI 리터러시" + padding 7px 20px
- [x] 메인 타이틀 확대 — 줄1 최대 72px·줄2 최대 94px, 섀도 +1px씩
- [x] 빌드 + 스크린샷 확인

#### 6/11 세션466 — 튜토리얼 화면 레트로 전환 (SPEC-ui-hud §4i-8)

- [x] .retro-title 프레임 재사용 — 다크+스캔라인, 타이틀 헤더 다크 변형(흰+핑크 섀도·시안 서브)
- [x] "게임 안내" 노랑 픽셀 헤딩 + 안내 4문장 흰 테두리 박스+노랑 번호 칩(.rt-tutorial) + rt-start 계속 버튼
- [x] 빌드 + 스크린샷 확인

#### 6/11 세션466 — 시나리오 순차 진행 잠금 (SPEC.md §14.5)

- [x] 미완료 중 다음 카드만 진입, 그 뒤는 잠김(점선·흐림·잠김 칩) / 완료 재도전은 순서 무관 유지
- [x] startScenario 가드(미완료 && !next → return) — UI 우회 방어
- [x] texts mark_locked + csv 재생성, 빌드 + 헤드리스(잠김3·PLAY1·재도전1·가드) + 스크린샷
