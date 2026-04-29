## PLAN — AI 리터러시: 위임의 경계 v0.5

**최종 업데이트**: 2026-04-29 세션254 — 회복 없는 학기 + 카드 시스템 진입 (디자인 사유 후 결정 5건)
**SCENARIO_PROMPT**: [[SCENARIO_PROMPT]]
**DECISIONS**: [[v05/DECISIONS|DECISIONS.md]] — 결정 근거 시간순 누적
**CARD-SPEC**: [[CARD-SPEC]] — Lv 마일스톤 카드 명세
**v0.4 PLAN**: [[v04/PLAN|PLAN.md]]

> Live document — 항상 "지금 상태". 방향 전환 시 즉시 갱신.

---

#### 0. v0.5 목표

v0.4(어린왕자 단일 시나리오) → v0.5(5개 시나리오 = 한 학생의 한 학기 Arc).

- **시나리오 5종 통합**: 1.자기소개 / 2.모둠 발표 / 3.어린왕자(기존) / 4.진로 고민 / 5.시험 공부 2주
- **학기 흐름 Arc**: 같은 주인공 캐릭터가 5개 결정을 거치며 누적
- **시나리오 선택 UI**: 시작 화면에서 5개 시나리오 모두 노출, 사이클 마무리 후 다음 시나리오 진입
- **사이클 마무리 두 버튼**: "다시 도전하기"(누적 유지) / "처음부터"(완전 리셋) — v0.4 메커닉 #7(반복 누적) 작동
- **회복 없는 학기 모델** (4/29 결정 §7.1): 시나리오 종료 시 자원 자동 회복 OFF. 학기 = 한정된 시간/에너지 풀.
- **단계별 자원 소비 + cost meter** (4/29 세션254): tier1/tier2/review 각 선택마다 분할 소비, 모든 버튼에 시간/에너지 비용 미터.
- **카드 시스템** (4/29 결정 §7.3): 레벨업 시 역량 카드 획득. 다음 시나리오부터 비용/점수 효과. 검토 격상 메커닉(C안) 폐기.

---

#### 1. 단계별 구현 순서

##### Phase 0 — 시나리오 검수 + PLAN 작성 ✅

- [x] ChatGPT(오리온) 시나리오 1·2·4·5 작성 완료 (4/28)
- [x] 아리공 검수 완료 — 27 leaf / 9 results / 18 supplements / 6 cardSlots / basePoint 분포 / 자원 패턴 / hiddenIssues / awareness 톤 모두 통과
- [x] 피터공 결정 3건: ① 점수 상한 없음 ② C2R3 A 등급 유지 ③ timeBudgetSec 데드 필드(추후 v0.6 정돈)
- [x] PLAN.md / TASKS.md 신설

##### Phase 1 — v05/index.html 생성 + 4개 시나리오 통합

**목표**: v04/index.html → v05/index.html 복사 + SCENARIOS 객체에 4개 추가.

| # | 항목 | 검증 |
|---|---|---|
| 1.1 | `v04/index.html` → `v05/index.html` 복사 | diff |
| 1.2 | localStorage key 변경 (`v04` → `v05`) | DebugPanel |
| 1.3 | vtag → 'v0.5 — 5개 시나리오 학기 Arc' | 시작 화면 |
| 1.4 | SCENARIOS 객체에 selfintro/groupwork/career/studyplan 추가 (인라인) | 데이터 무결성 |
| 1.5 | scenarios/eorinwangja.json은 외부 미참조 확인 (v04 동일) | grep |

**완료 조건**: 5개 시나리오 모두 인라인 정의, 데이터 정합성 확인.

##### Phase 2 — 시나리오 선택 UI + 진입 흐름

**목표**: 시작 화면에 5개 시나리오 노출 + 선택 후 진입.

| # | 항목 | 검증 |
|---|---|---|
| 2.1 | 시작 화면 시나리오 카드 5개 (id/title/category 노출) | 시각 확인 |
| 2.2 | 선택 시 해당 시나리오 진입 (gameState.currentScenarioId) | 콘솔 |
| 2.3 | 시나리오별 이미지 경로 동작 (`../images/s0{N}_ch{1,2,3}.webp`) | 시각 확인 |
| 2.4 | 누적 상태 표시 (이미 클리어한 시나리오 표식) | UI |

**완료 조건**: 시작 화면 → 시나리오 선택 → 6컷 진행 → 결과 → 시작 화면 복귀 흐름.

##### Phase 3 — 사이클 마무리 두 버튼 패치

**목표**: 컷 6 활동 리포트 → 두 버튼으로 v0.4 메커닉 #7(반복 누적) 작동.

| # | 항목 | 검증 |
|---|---|---|
| 3.1 | "다시 도전하기" 버튼 — 시나리오 데이터만 리셋, gameState(자원/exp/레벨/카드) 유지 | scenarioRepeatCount 증가 검증 |
| 3.2 | "처음부터" 버튼 — resetGame 전체 리셋 (현재 동작) | localStorage 클리어 |
| 3.3 | 시나리오 선택 화면 진입 옵션 (5개 중 선택) | UI |
| 3.4 | scenarioRepeatCount 활용 — 반복 시 검수 보너스 등 (D-07) | 디버그 |

**완료 조건**: 한 시나리오 클리어 → "다시 도전" 누르면 자원/exp 그대로 → 반복 누적 작동.

##### Phase 4 — 회복 없는 학기 모델 + 단계 소비 + cost meter ✅ 4/29 세션254

> **방향 전환 (4/29)**: 본 Phase 의미 재정의. 원래 "자원 페널티 타이밍" 단순 수정이었으나, 피터공 4축 사유 후 "회복 모델 전환 + 단계별 소비 + cost meter 가시화 + 게이지 4단계 색상 + LV/SCORE 중앙 표시"로 확장.

| # | 항목 | 결과 |
|---|---|---|
| 4.1 | 단계별 자원 소비 분할 (tier1/tier2/review) | onTier1/onTier2/onReview 각각 consumeStage 호출 |
| 4.2 | min 기반 incremental 분배 공식 — 합계 = leaf 총비용 | `getTier1/Tier2/ReviewCost` 헬퍼 |
| 4.3 | 모든 선택 버튼에 cost meter (시간/에너지 숫자+바) | `buildCostHTML` 정규화 (그 컷 안 max 기준) |
| 4.4 | 게이지 4단계 색상 (≥70 초록 / 50~70 노랑 / 30~50 주황 / <30 빨강) | `gaugeColorByPct` |
| 4.5 | 회복 모델 전환 — 자동 회복 OFF | `CONFIG.autoRecoverOnEnd=false` |
| 4.6 | 비용 multiplier — 데이터 보존 + 튜닝 한 줄 | `CONFIG.resourceCostMultiplier=0.6` |
| 4.7 | LV/SCORE 중앙 큰 표시 (34px display-num) + XP 좌측 진행 바 | panel-row HTML 재구성 |
| 4.8 | 힌트 토글/위임·점수 태그 제거 | 시작화면 + 컷3·5 |
| 4.9 | 결과 화면 "학기 잔여" 메시지 (회복 알림 → 잔여 표시로) | goCut6 |

**완료 조건**: ✅ 자원이 매 선택마다 가시적으로 줄어듦. 학기 누적. 적정 선택 시 1.7~3 시나리오 버팀.

##### Phase 7 — 카드 시스템 (역량 카드, 4/29 결정 §7.3)

**목표**: 레벨업 시 역량 카드 획득 → 다음 시나리오부터 비용/점수 효과 발동. "내가 어떤 학습자가 됐는가"가 가시화.

| # | 항목 | 검증 |
|---|---|---|
| 7.1 | CARD-SPEC.md 신설 — Lv2~5 카드 4종 명세 + 효과 hook 위치 | 문서 |
| 7.2 | gameState.competencyCards 배열 신설 + localStorage 보존 | DebugPanel |
| 7.3 | checkLevelUp 후 카드 획득 — 레벨별 단일 카드 자동 부여 | trackEvent('competency_card_acquired') |
| 7.4 | consumeStage에 카드 modifier hook (Lv2 카드 = B 분기 시간 -10% 등) | 손계산 |
| 7.5 | calculateFinalScore에 카드 modifier hook (Lv3·4·5 카드 점수 보너스) | 손계산 |
| 7.6 | 시나리오 시작 화면 + 컷6에 보유 카드 표시 (효과 명시) | UI |
| 7.7 | 카드 획득 시 알림 UI (레벨업과 함께) | 시각 확인 |
| 7.8 | 검토 격상 메커닉(C안) 폐기 — `CONFIG.useReviewLevelBoost=false` 플래그로 분기 | detectIssues 정리 |

**완료 조건**: 레벨업할 때마다 카드 획득 알림 → 다음 시나리오에서 효과 발동 (선택 버튼의 cost meter에 -% 표시) → 학기 종합 리포트에 누적 카드 노출.

**위임 전략**: SPEC 작성(메인 직도) → 구현은 백도 위임 가능.

##### Phase 5 — 시나리오 이미지 작업 ✅ 4/29 세션253

**방향 전환**: ~~5 시나리오 × 3 컷 = 15 이미지~~ → **5 시나리오 × 25 컷 = 125 이미지** (SPEC IMAGE_PROMPTS 명명 `s{N}_c{컷}_{ID}` 직접 매핑). 모든 분기 1:1 시각화.

| # | 항목 | 결과 |
|---|---|---|
| 5.1 | 5 시나리오 25프레임 자산 수령 (피터공 직접 크롭, scenario_images/) | 125장 PNG |
| 5.2 | 정사각 패딩(#f0f0f0 panel 배경 일치) + webp 변환 | 125장 webp, 9.5MB |
| 5.3 | SPEC 명명 적용 (s01_c1, s01_c2_A/B/C, s01_c3_A1~C3, s01_c4_A1~C3, s01_c5_R1/R2/R3) | 파일 트리 일치 |
| 5.4 | getCutImage 동적 매핑 (gameState.selectedTier1/Tier2/Review 참조) | line 1557 |
| 5.5 | 선택 전 빈칸 — 선택 후 setPanelImage 재호출로 갱신 (cut2~5) | goCut3/4/6 +1줄 |
| 5.6 | cut6은 이미지 대신 등급 + 점수 큰 글자 표시 (final-grade 컬러 매칭) | line 2204 |
| 5.7 | panel-body의 final-score 블록 제거 (등급/점수 중복 방지) | line 2233 |

**완료 조건**: 5 시나리오 × 25 컷 = 125 이미지 모두 webp + 코드 통합.

##### Phase 6 — 통합 테스트 + 배포

| # | 항목 | 검증 |
|---|---|---|
| 6.1 | 5개 시나리오 모두 27 leaf 동작 확인 (총 135 leaf) | 백도 위임 |
| 6.2 | 학기 Arc 누적 시뮬 (시나리오 1→2→3→4→5) | gameState 추적 |
| 6.3 | 사이클 마무리 두 버튼 동작 검증 | 손 테스트 |
| 6.4 | 자원 페널티 타이밍 검증 | 손계산 |
| 6.5 | localStorage 저장/이어하기 (5 시나리오 진행 상태) | 새로고침 |
| 6.6 | 이벤트 로그 신규 타입 (scenario_selected, cycle_continue, cycle_reset) | 로그 다운로드 |
| 6.7 | git commit + push | GitHub Pages 배포 |
| 6.8 | 피터공 플레이 테스트 | 피드백 수집 |

**완료 조건**: `https://mice3nyc.github.io/ari_gitrepo_1/ai-literacy-delegation-boundary/v05/` 정상 동작.

---

#### 2. 위임 전략

| Phase | 위임 가능성 | 비고 |
|---|---|---|
| 1 (시나리오 통합) | 백도 가능 (Sonnet) | 인라인 객체 추가 + grep 검증 |
| 2 (선택 UI) | 메인 직접 | UX 판단 필요 |
| 3 (사이클 마무리) | 메인 직접 | UX + 누적 로직 |
| 4 (자원 페널티) | 백도 가능 | 명확한 타이밍 수정 |
| 5 (이미지) | 별도 (피터공 또는 외부) | 디자인 작업 |
| 6 (테스트+배포) | 백도 + 메인 + 피터공 | 자동 검증 + 손 테스트 |

---

#### 3. 진행 추적

| Phase | 상태 |
|---|---|
| 0. 검수 + PLAN 작성 | ✅ 4/28 |
| 1. v05/index.html + 시나리오 통합 | ✅ 4/28 세션251 (9/9) |
| 2. 선택 UI + 진입 흐름 | ✅ 4/28 세션251 (6/6) — 옵션 C 하이브리드 + 학기 프로그레스 UI |
| 3. 사이클 마무리 두 버튼 | ✅ 4/28 세션251 (5/5) — 1회 제한 반영 |
| 3.5 추가 결정 (DECISIONS §4·5) | ✅ 4/28 세션251 — 활동 리포트 흐름 + 레벨업 단계별 + thresholds 조정 |
| 4. 회복 없는 학기 + 단계 소비 + cost meter | ✅ 4/29 세션254 (의미 확장: 자원 페널티 타이밍 → 회복 모델 전환) |
| 5. 이미지 작업 | ✅ 4/29 세션253 (125장 + 동적 매핑 + cut6 등급 표시) |
| 6. 통합 테스트 + 배포 | ⏳ |
| 7. 카드 시스템 (역량 카드) | ⏳ 4/29 세션254 결정 — 다음 회기 SPEC 작성 부터 |

---

#### 4. 참고

- **v0.4 미해결 → v0.5에서 정리**: ① 점수 상한(없음 결정) ② consumeResources 순서(Phase 4 대기) ③ scenarioRepeatCount 누적은 1회 제한으로 v0.6 이후로 미룸
- **v0.5 추가 결정 (DECISIONS.md 참조)**:
  - §1 검수 결정 3건 (점수 상한 / C2R3 / timeBudgetSec)
  - §2 옵션 C 하이브리드 + 1회 제한 + 학기 프로그레스
  - §3 학기 캐릭터 누적 디자인
  - §4 활동 리포트 — 컷6 자체 + 5개 다 끝나면 종합 리포트
  - §5 레벨업 단계별 + exp 리셋 + thresholds [0,20,40,65,100]
- **v0.6 예고**: timeBudgetSec 정리 / scenarioRepeatCount / 학기 후반 페르소나 전환 / awareness 누적 노출 / showReport 함수 제거
- **시나리오 데이터**: `Assets/incoming/AI리터러시/시나리오{1,2,4,5}.js` (통합 완료)
