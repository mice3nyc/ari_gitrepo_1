## TASKS — AI 리터러시: 위임의 경계 v0.5

**최종 업데이트**: 2026-04-28
**PLAN**: [[v05/PLAN|PLAN.md]]
**SCENARIO_PROMPT**: [[SCENARIO_PROMPT]]

> 체크리스트. 완료 즉시 [x] 처리.

---

#### Phase 0 — 시나리오 검수 + PLAN 작성

- [x] ChatGPT 시나리오 1·2·4·5 작성 (4/28, 피터공)
- [x] 아리공 검수 완료 (구조/점수/자원/톤 모두 통과)
- [x] 피터공 결정 3건 (점수 상한 / C2R3 / timeBudgetSec)
- [x] PLAN.md 작성
- [x] TASKS.md 작성

---

#### Phase 1 — v05/index.html 생성 + 4개 시나리오 통합 ✅ 9/9 (4/28 세션251)

- [x] `v04/index.html` → `v05/index.html` 복사 (77KB → 작업 시작)
- [x] localStorage key 변경 (`v04` → `v05`) — storageKey/eventLogKey/sessionIdKey + HINT_PREF_KEY + 다운로드 로그 파일명
- [x] vtag → 'v0.5 — 5개 시나리오 학기 Arc' (시작 화면 + 우하단 둘 다)
- [x] CONFIG.scenarios 배열 5개로 확장 (시간 순: selfintro/groupwork/eorinwangja/career/studyplan)
- [x] SCENARIOS 객체에 4개 시나리오 추가 (인라인)
  - [x] selfintro (시나리오 1) — line 447
  - [x] groupwork (시나리오 2) — line 704
  - [x] career (시나리오 4) — line 963
  - [x] studyplan (시나리오 5) — line 1217
- [x] 어린왕자(eorinwangja) 기존 인라인 정의 line 279 그대로 유지
- [x] 데이터 무결성 검증 — 5개 시나리오 모두 27 finals / 9 results / 18 supplements / 27 resourceCosts / 27 expRewards (cardSlots: 어린왕자 4, 새 4개 6)
- [x] node JS 파싱 통과, SCENARIOS keys 5개 정상

---

#### Phase 2 — 시나리오 선택 UI + 진입 흐름 ✅ 6/6 (4/28 세션251)

- [x] 시작 화면 시나리오 카드 5개 (옵션 C 하이브리드 — 학기 순서, 자유 선택, 다음 추천 강조)
- [x] 카드 클릭 → startScenario(scid) → currentScenarioId 설정 + cut1 진입
- [x] 시나리오별 이미지 경로 동적 함수 getCutImage(scid,cutNum) — s01~s05 매핑
- [x] 클리어한 시나리오 ✓ 표식 + cursor:default + line-through (1회 제한)
- [x] 학기 진행 프로그레스 UI — X/5 카운트 + bar + 5 dots (cleared/next/empty)
- [x] scenario_selected 이벤트 로그

---

#### Phase 3 — 사이클 마무리 두 버튼 패치 ✅ 5/5 (4/28 세션251)

> **변경**: 피터공 결정 "시나리오 1회만 시도"로 인해 PLAN의 "다시 도전하기"를 "시나리오 선택으로"로 의미 변경. 같은 시나리오 재진입 X (clearedScenarios 가드).

- [x] 컷 6 활동 리포트 — "시나리오 선택으로" 버튼 (학기 진행 누적 유지)
  - [x] goNextScenario(): clearedScenarios.push(currentScenarioId) + totalScore += score + currentScenarioId=null
  - [x] gameState(자원/exp/레벨/competencies/카드) 유지 — 학기 캐릭터 누적
  - [x] 학기 마지막 시나리오면 "학기 마무리" 라벨로 표시
- [x] "학기 처음부터" 버튼 — resetGame 전체 리셋 (clearedScenarios 포함)
- [x] 시나리오 선택 화면 복귀 — showStartScreen() (다음 추천 자동 강조)
- [x] scenario_completed 이벤트 로그
- [x] 활동 리포트에 "학기 진행 X/5" 한 줄 표시

---

#### Phase 4 — 회복 없는 학기 + 단계 소비 + cost meter ✅ 9/9 (4/29 세션254)

> **방향 전환 (4/29)**: "자원 페널티 타이밍 수정" 단순 작업이었으나 피터공 4축 사유 후 "회복 모델 전환 + 단계별 소비 + cost meter + 게이지 색상 + LV/SCORE 중앙 표시"로 확장. 결정 근거: [[v05/DECISIONS|DECISIONS.md]] §7

- [x] 단계별 자원 소비 분할 — onTier1/onTier2/onReview 각각 consumeStage 호출
- [x] min 기반 incremental 분배 공식 — 합계 = leaf 총비용 (`getTier1/Tier2/ReviewCost`)
- [x] 모든 선택 버튼에 cost meter (시간/에너지 숫자+바, 정규화)
- [x] 게이지 4단계 색상 (≥70 초록 / 50~70 노랑 / 30~50 주황 / <30 빨강)
- [x] 회복 모델 전환 — 자원 자동 회복 OFF (`CONFIG.autoRecoverOnEnd=false`)
- [x] 비용 multiplier — 데이터 보존 + 튜닝 한 줄 (`CONFIG.resourceCostMultiplier=0.6`)
- [x] LV/SCORE 중앙 큰 표시(34px) + XP 좌측 진행 바
- [x] 힌트 토글/위임·점수 태그 제거
- [x] 결과 화면 "학기 잔여" 메시지 (회복 알림 → 잔여 표시)

---

#### Phase 5 — 시나리오 이미지 작업 ✅ 9/9 (4/29 세션253)

> **방향 전환**: 3 컷 그룹 매핑 → 25 컷 SPEC 1:1 매핑. 5×25 = 125장.

- [x] 피터공 5x5 그리드 시나리오 1~5 생성 → 25프레임/시나리오 단위 직접 크롭(scenario_images/ 125장)
- [x] 정사각 패딩(#f0f0f0) + webp 변환 + SPEC 명명 적용 (`s01_c1.webp` ~ `s05_c5_R3.webp`)
- [x] 이미지 디렉토리: `_dev/ai-literacy-delegation-boundary/images/` 공통
- [x] getCutImage 동적 매핑 (gameState.selectedTier1/Tier2/Review 분기) — line 1557
- [x] 선택 전 빈칸(null 반환) → 선택 후 setPanelImage 재호출 (goCut3/4/6 각 +1줄)
- [x] cut6 panel-image에 등급(140px) + 점수(28px), final-grade 컬러 매칭(S/A 초록, B 검정, C 주황, D 빨강) — line 2204
- [x] panel-body의 final-score 블록 제거 (중복 방지) — line 2232
- [x] 시각 검증 완료 (피터공 플테 — 시나리오 1~4 분기별 컷 확인)
- [x] 시나리오 5 자산 추가 수령 → 125장 풀세트 통합

---

#### Phase 6 — 통합 테스트 + 배포

- [ ] 5개 시나리오 27 leaf 자동 검증 (백도 Sonnet 위임, 총 135 leaf)
- [ ] 학기 Arc 누적 시뮬 (시나리오 1→2→3→4→5 순차 플레이)
- [ ] 사이클 마무리 두 버튼 손 테스트
- [ ] 자원 페널티 타이밍 손계산 검증
- [ ] localStorage 저장/이어하기 (5 시나리오 진행 상태 보존)
- [ ] 이벤트 로그 신규 타입 정상 (scenario_selected/cycle_continue/cycle_reset)
- [ ] DebugPanel 5 시나리오 점프 + 자원/exp 강제 설정 동작
- [ ] git commit (`v05 5개 시나리오 학기 Arc + 사이클 마무리 + 자원 페널티`)
- [ ] git push
- [ ] GitHub Pages 배포 확인 (`/ai-literacy-delegation-boundary/v05/`)
- [ ] 피터공 플레이 테스트
- [ ] 피드백 수집 → v0.6 PLAN으로 이전

---

#### Phase 7 — 카드 시스템 (역량 카드, 4/29 결정 §7.3)

> **SPEC**: [[CARD-SPEC]] — Lv2~5 카드 4종 + 효과 hook 위치 + DebugPanel + 학기 종합 리포트 통합

- [x] CARD-SPEC.md 신설 (4/29 세션254)
- [x] 검토 격상 메커닉 OFF — `CONFIG.useReviewLevelBoost=false` + `calculateFinalScore` 분기 (4/29 세션254)
- [ ] CONFIG.competencyCards 객체 추가 (LV2_PROMPT / LV3_CROSSCHECK / LV4_CONTEXT / LV5_FLUENCY)
- [ ] gameState.competencyCards 배열 신설 + localStorage 보존 + createInitialState/continueGame 가드
- [ ] goCut6 안 카드 획득 hook (didLevelUp 분기, competency_card_acquired 이벤트)
- [ ] `_applyCardModifiers(cost, context)` 함수 신설 → getTier1/Tier2/ReviewCost 호출 체인 통합
- [ ] `competencyCardScoreBonus(leaf)` 함수 신설 → calculateFinalScore 통합
- [ ] showStartScreen 보유 카드 표시 UI
- [ ] goCut6 카드 획득 알림 박스
- [ ] showFinalReport "획득한 역량 카드" 박스
- [ ] DebugPanel 카드 토글 버튼 (4종 + 모두/제거)
- [ ] 손계산 검증 (Lv2 카드 보유 → B 분기 cost meter -10% 표시)
- [ ] git commit + push

---

#### 차단 / 미해결

- 이미지 12장 (s02/s04/s05) — 별도 작업 필요. 코드 통합과 병렬 가능

---

#### 완료 통계

- Phase 0: 5/5 ✅
- Phase 1: 9/9 ✅
- Phase 2: 6/6 ✅
- Phase 3: 5/5 ✅
- Phase 3.5 (추가 결정): ✅ 활동 리포트 흐름 + 레벨업 단계별 + thresholds 조정 + DECISIONS.md 신설
- Phase 4: 9/9 ✅ (4/29 세션254 — 회복 없는 학기 + 단계 소비 + cost meter)
- Phase 5: 9/9 ✅
- Phase 6: 0/13
- Phase 7: 2/13 (CARD-SPEC + 검토 격상 OFF — 4/29 세션254)

**전체: 45/65** — 다음: Phase 7 카드 시스템 코드 구현 + Phase 6 통합 테스트 + 배포
