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

#### Phase 8 — RP 시스템 + 위/도 자동 할인 (4/30 세션256, DECISIONS §10)

> **방향 전환 (4/30 세션256)**: 첫 플테에서 자원 회복 데드락 발견 + 위/도 죽은 수치 진단. **자동 회복 모델 폐기**. 회복 포인트(RP) 분배 시스템 + 위/도 자동 할인 도입.
>
> 진입 배경 + 결정 근거: DECISIONS §10. 요청 노트: [[요청.26.0430.1000-v05Phase8게임도높이기]]

**8.1 진단** ✅ (4/30 세션256)
- [x] 5 시나리오 27 leaf cost 분포 — 모두 균질, 시간 > 에너지 10~20, 강한 양의 상관, 4축 trade-off 거의 없음
- [x] consumeStage 음수 처리 — clamp 없음 확인 (line 1763~64)
- [x] 자원 0 시 사이클 진행 — 마이너스로 진행됨 (버그)

**8.2 0 floor 정책 합의** ✅ (4/30 세션256, RP 시스템으로 풀림)
- [x] (a) 자원 0이면 사이클 처리 — 진행 가능 + UI 경고
- [x] (b) cost > 잔여자원 선택지 — disabled + 자원 부족 태그
- [x] (c) 데드락 방지 — RP 분배 시스템이 능동 회복 경로 제공

**8.3 부분 회복 hook ⛔ 폐기 (DECISIONS §10.1)** — rollback 작업은 8.7
- [x] ~~CONFIG.recoverOnLevelUp / recoverOnScore 추가~~ → 8.7에서 제거
- [x] ~~recoverPartial 함수 신설~~ → 8.7에서 제거
- [x] ~~goCut6 회복 호출~~ → 8.7에서 제거

**8.4 0 floor + UI** ✅ (4/30 세션256, 유지)
- [x] consumeStage에 `Math.max(0, ...)` clamp
- [x] 선택 버튼 비용 > 잔여자원 시 disabled + "자원 부족" 빨간 태그 (CSS .choice-card.disabled)
- [x] canAffordCost(cost) 헬퍼 함수 + 3개 카드 생성 위치(goCut2/3/5) 적용

**8.5 cost 다양성 데이터 재조정** — 보류 (RP 시스템 도입 후 재평가)
- [ ] 위/도 자동 할인이 trade-off를 만드는지 먼저 검증
- [ ] 필요 시 시나리오 특성별(자기소개=짧은 시간, 시험공부=긴 시간) 차별화

**8.6 발란스 + 플테** — 8.7~8.11 후로 미룸

---

#### Phase 8.7 — 자동 회복 코드 rollback (DECISIONS §10.1) ✅ 4/30 세션257

- [x] CONFIG에서 `recoverOnLevelUp` / `recoverOnScore` 제거
- [x] `recoverPartial` 함수 제거
- [x] goCut6에서 recoverPartial 호출 + 회복 알림 출력 제거
- [x] timeRecovered/energyRecovered 변수 정리
- [x] DECISIONS §9.1 헤딩에 ⛔ 폐기 마커 추가 + §10.1/§10.12 교차참조

---

#### Phase 8.8 — 자원토큰 시스템 (DECISIONS §10.2~10.4) ✅ 4/30 세션257

- [x] CONFIG에 `rpRewardByGrade` 객체 추가 ({S:15, A:10, B:6, C:3, D:1})
- [x] CONFIG에 `rpLevelUpBonus` 추가 (20)
- [x] CONFIG에 `rpCost` 객체 추가 ({time:1, energy:1}) — 2축 전용
- [x] gameState에 `rp` 추가 ({balance:0, history:[]})
- [x] `createInitialState` / `continueGame` / localStorage 가드 갱신
- [x] `awardRP(grade, didLevelUp)` 함수 신설 — goCut6에서 호출
- [x] `applyRPDistribution({time, energy})` 함수 신설 — 메터 max 클램프 + 잉여 손실 추적
- [x] 이벤트 로그: `rp_awarded`, `rp_distributed`
- [x] 코드 식별자는 RP 유지, UI 텍스트만 "자원토큰"
- [x] 로직 스모크 테스트 — 등급별 적립/레벨업 보너스/분배/max 클램프/잔액 초과 거부 모두 정상

---

#### Phase 8.9 — 위/도 자동 할인 (DECISIONS §10.6, §10.7) ✅ 4/30 세션257

- [x] `_applyDiscount` 신설 + getTier1/Tier2/Review Cost에 hook 적용 (multiplier 후)
- [x] 시간 비용 = max(0, cost.time - delegationChoice.value). 음수 dlg면 자연스럽게 cost+ (대칭 페널티)
- [x] 에너지 비용 = max(0, cost.energy - knowledge.value). 동일 대칭 처리
- [x] `buildCostHTML` + `buildDiscountTag` 신설 — 인라인 태그 ~~"(위 -3)"~~ 폐기 (4/30 피터공 디자인 변경)
- [x] **비용 표시 4박스 그리드 재디자인** (DECISIONS §10.6 갱신, 4/30 세션257):
  - 시간 비용 / 위임판단력 | 에너지 비용 / 도메인지식 (세로 구분선)
  - 큰 빨강 박스 = raw cost (multiplier 후, 위/도 차감 전)
  - 작은 효과 박스 — 양수: 초록 -N / 음수: 빨강 +|N| / 0: 회색 점선 0
  - progress bar 제거 (피터공 의도: 숫자만 강조)
  - 최종 비용은 시스템이 알아서 계산
- [x] 로직 스모크 — 할인+페널티 동시/clamp/0 모두 통과

---

#### Phase 8.10a — 자원토큰 분배 팝업 UI (DECISIONS §10.5) ✅ 4/30 세션257

- [x] HTML 모달 컴포넌트 신설 — `#rp-modal` (배경 dim + 카드)
- [x] CSS 스타일 (B&W 미니멀, 흰 배경)
- [x] 시간/에너지 2축 [-]/[+] 컨트롤 (1토큰 = +1)
- [x] "남은 자원토큰" 카운터 (실시간, 0 도달 시 초록 강조)
- [x] 미리보기 줄 — "→ 시간 +20 / 에너지 +10 충전" + 손실 빨간 경고
- [x] 두 양동이 비주얼 — 현재 메터 + 추가분 줄무늬 오버레이로 시각화
- [x] 메터 max 초과 시 "(+5, 손실 X)" 빨간 표시. clamp는 applyRPDistribution이 처리
- [x] [분배 완료 →] 버튼 — 남은 토큰 0일 때만 활성화
- [x] 레벨업 팝업 닫힌 후(있으면) 또는 컷6 결과 1.4초 후 자동 표시
- [x] 분배 완료 → applyRPDistribution → 모달 닫힘 + updateStats + 다음 버튼 노출
- [x] 학기 마지막 시나리오는 분배 팝업 스킵(다음 시나리오 없음 → 토큰 lose)
- [x] **+/- 버튼 hold-to-repeat** (1차 플테 후 추가, 4/30 세션257)
- [ ] 디버그 패널 강제 호출 버튼 — 8.11 검증 단계에서 추가

---

#### Phase 8.10b — 레벨업 이벤트 팝업 UI (DECISIONS §10.11) ✅ 4/30 세션257

- [x] HTML 모달 컴포넌트 신설 — `#levelup-modal`
- [x] CSS 스타일 (B&W + yellow accent for level transition)
- [x] 표시 — "Lv X → Lv Y" 큰 강조 + 효과 박스
  - 자원 메터 max — 시간 +N / 에너지 +N
  - 자원토큰 보너스 +20
- [x] [확인 →] 버튼 → 8.10a 자원토큰 분배 팝업으로 chain
- [x] 컷6 결과 직후 + didLevelUp일 때만 등장. 분배 팝업 직전 순서
- [x] 디버그 패널 강제 호출 버튼 — 8.11 디버그 패널에 LV Up 모달 강제 호출 박힘 (4/30 세션259)
- [x] 기존 결과 화면 노란 한 줄 — **제거 결정** (4/30 세션260, 8.10b 모달과 중복)

---

#### Phase 8.11 — 결과 화면 통합 + 검증

- [ ] goCut6 결과 화면에 "RP 적립 — X (등급 G + 레벨업 B)" 박스 추가
- [ ] 학기 종합 리포트(`showFinalReport`)에 RP 분배 히스토리 요약 (역량 빌드 가시화)
- [ ] saveGame/continueGame에 rp 보존 검증
- [x] **DebugPanel: 위/도 직접 조정 (음수 포함) + RP 강제 적립** (4/30 세션259)
  - State 표시: rp balance + compType + scenarioHistory 길이 추가
  - 위/도 4유형 강제 5버튼 (pp/pn/np/nn/mid) + 미세조정 ±1 (위·도)
  - RP 강제 0/20/50 + ±5 토글
  - **Final Report 강제 호출 5버튼 (S/A/B/C/D)** — scenarioHistory 5건 mock + 위/도 유지 + showFinalReport 호출 → 4유형×5등급 빠른 점검
  - 모달 강제 호출 — LV Up / RP 분배
- [ ] 8.10a/b 디버그 강제 호출 검증 (실제 4유형 × 5등급 모두 정상 렌더 확인)
- [ ] 손계산 검증: 위 +3 + 시간 cost 30 → 표시 시간 27 / 위 -3 + 시간 30 → 표시 33
- [ ] git commit + push

---

#### Phase 8.12 — 발란스 + 플테 (이전 8.6)

- [x] **위/도 효과 배율 도입** (4/30 세션257) — `competencyDiscountMult` 도입
  - 1차 (배율 3): "무적" 피드백
  - 2차 (배율 2, 4/30): 적용 — 추가 플테 후 미세 조정
- [x] **분배 팝업 hold-to-repeat** (4/30 세션257) — bindHoldRepeat 헬퍼, +/- 버튼 누르고 있으면 연속
- [ ] 학기 시뮬 — 5 시나리오 통과 가능성 (자원토큰 적립 vs 누적 소비, 위/도 효과 배율 3 반영)
- [ ] 자원토큰 적립값(S=15/A=10/B=6/C=3/D=1, 레벨업 +20) 재평가 — 2축으로 단순화 후 체감
- [ ] multiplier (resourceCostMultiplier 0.6) 재평가 — 효과 배율과 함께 발란스
- [ ] 위/도 자동 할인이 trade-off를 만드는지 (배율 3에서 체감?)
- [ ] 동현공/오공 플테 요청
- [ ] 피드백 수집 → v0.6 PLAN으로 이전

---

#### Phase 8.13 — 학기 종합 리포트 재설계 (DECISIONS §10.13, 4/30 세션257 1차 플테 후)

피터공 진단: 평균 점수 무의미, 카드/아이템 미구현, 시나리오별 결과 약함, 위/도 의미 분석 없음.

##### 8.13.1 상단 통계 축소 + 의미 분석 박스 ✅ (4/30 세션258)
- [x] 통계 4박스로 축소 — 학기 총점 / 최종 레벨 / 위임 선택력 / 도메인 지식
- [x] 평균 점수 박스 제거
- [x] 카드/아이템 박스 제거 (Phase 7 카드 시스템 미구현, v0.6에서 부활)
- [x] **위/도 4유형 의미 박스** — pp/pn/np/nn/mid 5종, AI 안 쓰는 게 좋은 게 아니라 위+도 둘 다 키우자 톤 (피터공 4/30 시정)

##### 8.13.2 카툰 시리얼 (하단) ✅ (4/30 세션258 코드 + 세션260 컷별 캡션)
- [x] 5 시나리오 좌우 흐름 카툰 strip (위→아래)
- [x] 각 시나리오 6컷 (c1~c5 + 시상)
- [x] **마지막 프레임 = 시상 이미지** `scenario_result__{a/b/c/d/s}.png`
- [x] CSS 신규 (.report-comic / .comic-scene / .comic-strip / .comic-cut / .comic-mood)
- [x] 4/30 세션260 — strip 좌→우 변경 (max-width 1040px / 컷 160px × 6)
- [x] 4/30 세션260 — **컷별 캡션 추가** (.comic-panel + .comic-caption) — situation/tier1/tier2/results/reviews에 lesson 필드 박힘. 시상 panel에 mood 통합

##### 8.13 사전 작업 ✅ (4/30 세션257 메멘토 직전)
- [x] 시상 이미지 폴더 위치 확인 — `Assets/incoming/AI리터러시/scenario_images/` (피터공 작업 폴더)
- [x] 시상 이미지 5개 → `_dev/ai-literacy-delegation-boundary/scenario_results/`로 복사 완료
- [x] 매핑 확정 — a/b/c/d/s = 등급별 (시나리오 무관 공유)

##### 8.13 진입 전 미정 (피터공 확인 필요) ⚠️
- [ ] **사용 카툰 컷 선택** — (A) 6컷 c1~c5+시상 / (B) 3컷 c1+c4+시상 / (C) 2컷 c5+시상
- [ ] **무드 대사 출처** — `sc.finals[leaf].awareness` vs `sc.learningMessage` vs 신규 작성
- [ ] 위/도 4유형 잠정 텍스트 적정성 검토 (DECISIONS §10.13 잠정안)

---

#### 차단 / 미해결

- 이미지 12장 (s02/s04/s05) — 별도 작업 필요. 코드 통합과 병렬 가능
- Phase 8 자원 0 처리 정책 — 4/30 피터공 합의 대기 (8.2 a/b/c)

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
- Phase 8.1~8.4: 9/9 ✅ (4/30 세션256 — 진단 + 0 floor + UI disabled)
- Phase 8.3 부분 회복: ⛔ 폐기 (DECISIONS §10.1, 8.7에서 rollback)
- Phase 8.5 데이터 재조정: 보류 (RP 도입 후 재평가)
- Phase 8.7 자동 회복 rollback: 5/5 ✅ (세션257)
- Phase 8.8 자원토큰 시스템: 10/10 ✅ (4/30 세션257)
- Phase 8.9 위/도 자동 할인: 5/5 ✅ (4/30 세션257)
- Phase 8.10a 자원토큰 분배 팝업: 11/12 ✅ (4/30 세션257, 디버그 호출 빼고)
- Phase 8.10b 레벨업 이벤트 팝업: 6/8 ✅ (4/30 세션257, 디버그 + 노란 한 줄 결정 보류)
- Phase 8.11 결과 화면 통합 + 검증: 1/7 (디버그 패널 ✅, 4/30 세션259)
- Phase 8.12 발란스 + 플테: 0/7

**전체: 94/146** — 세션257 진행 중: 8.7~8.10 ✅ → 8.12 부분 ✅ (배율 도입+hold-to-repeat) → **8.13 결과 리포트 재설계 (다음, 폴더 위치 확인 후 진입)** → 8.11 검증 → 8.12 발란스 잔여 (학기 시뮬·multiplier 재평가). Phase 7 카드 + Phase 6 배포는 Phase 8 완료 후
