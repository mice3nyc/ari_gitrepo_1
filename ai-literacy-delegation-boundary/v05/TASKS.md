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

#### Phase 4 — 자원 페널티 타이밍 수정

- [ ] consumeResources(leaf, R) 호출 위치 확인 (현재 L1261)
- [ ] calculateFinalScore 호출 전으로 이동
- [ ] calcResourcePenalty가 소비 후 자원 상태 기준으로 계산되는지 검증
- [ ] 반복 진입 시 자원 페널티 정상 작동 (scenarioRepeatCount=2 시 손계산)
- [ ] applyReview 함수 흐름 재검증

---

#### Phase 5 — 시나리오 이미지 작업

- [ ] s01_ch{1,2,3}.png → webp 변환 (incoming에 png 3장 있음)
- [ ] s02_ch{1,2,3}.webp 신규
- [ ] s04_ch{1,2,3}.webp 신규
- [ ] s05_ch{1,2,3}.webp 신규
- [ ] s03(어린왕자) v04 기존 경로 확인 (`../images/s03_ch*` 또는 어린왕자 별도 경로)
- [ ] 이미지 디렉토리 구조 정리 (`v05/images/` 또는 공통 `images/`)

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

#### 차단 / 미해결

- 이미지 12장 (s02/s04/s05) — 별도 작업 필요. 코드 통합과 병렬 가능

---

#### 완료 통계

- Phase 0: 5/5 ✅
- Phase 1: 9/9 ✅
- Phase 2: 6/6 ✅
- Phase 3: 5/5 ✅
- Phase 3.5 (추가 결정): ✅ 활동 리포트 흐름 + 레벨업 단계별 + thresholds 조정 + DECISIONS.md 신설
- Phase 4: 0/5
- Phase 5: 0/6
- Phase 6: 0/13

**전체: 25/49** — Phase 4 대기 (자원 페널티 타이밍 수정 / 캐싱 클리어 후 시각 검증 우선)
