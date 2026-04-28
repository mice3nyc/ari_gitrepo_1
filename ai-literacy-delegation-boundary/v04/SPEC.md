## SPEC — AI 리터러시: 위임의 경계 v0.4

**최종 업데이트**: 2026-04-28 19:30 (Air, 세션246) — Phase 1 8/8 합의, SPEC 정정 일괄
**기반**: 루트 SPEC.md (v0.3) + 4/28 동현공 피드백 + 피터공 Q&A 9개 + Phase 1 검토 8건
**결정 로그**: [[v04/DECISIONS|DECISIONS.md]] / [[REVIEW-Phase1]]

> [!warning] v0.3 → v0.4 변경 핵심
> v0.3 = 트리 76노드 × 5시나리오 + 두 역량 + 5등급 점수 + 학맞통 카드. 자원 폐기.
> v0.4 = v0.3 위에 **자원 시스템(시간/에너지) + 경험치/레벨업 + 힌트 토글** 추가. MVP = 어린왕자 1 시나리오에 한정.
> 보존: 두 역량(`delegationChoice`, `knowledge`), 5등급 점수, 학맞통 카드, 6컷 흐름.

---

#### 1. v0.3 → v0.4 변경 영역

| 영역 | v0.3 | v0.4 |
|---|---|---|
| 시나리오 수 | 5 (어린왕자/달착륙/학생기자/친구분쟁/사생활윤리) | 1 (어린왕자) — MVP |
| 두 역량 | delegationChoice, knowledge | 보존. UI 라벨: 위임 판단 + **문해력**(어린왕자 도메인) |
| 점수 5등급 | S/A/B/C/D | 그대로 보존 |
| 학맞통 카드 | 70장, 결합 슬롯 | 그대로 보존 |
| 6컷 흐름 | 상황·1차·2차·결과·검토·최종 | 그대로 보존 |
| **자원** | 폐기 (유보) | **부활** — 시간 + 에너지 |
| **경험치** | 없음 | **신규** — 레벨업 미터 |
| **레벨업** | 없음 | **신규** — 5단계, 미터 max ↑ |
| **자원 회복** | 해당 없음 | **신규** — 종료 시 70% + 등급 보너스 10~60% |
| **힌트** | 선택지에 영향 미리 표시 | **숨김** (토글 버튼, 처음 OFF) |

---

#### 2. 자원 시스템

##### 2.1 자원 정의 (D-01, D-02)

```js
gameState.resources = {
  time: { current: number, max: number, history: [] },     // 시간 — 작업 소요. 마나/코인처럼 소모/획득
  energy: { current: number, max: number, history: [] }    // 에너지 — 노력/수고/수련. 경험치 변환기
};
```

**핵심 의미**:
- **시간**: 작업에 걸리는 시간. AI 위임 = 시간 ↓. 직접 = 시간 ↑.
- **에너지**: 본인이 들이는 노력. 직접 = 에너지 ↑ → 경험치 ↑. AI 위임 = 에너지 ↓ → 경험치 거의 X.
- 둘은 **독립 자원** — 다양한 조합 가능 (시간 高+에너지 低 / 시간 低+에너지 高 / 둘 다 高 / 둘 다 低).

##### 2.2 자원 소비 모델 (D-08, 27 leaf 매핑)

각 leaf 경로 (1차+2차+검토 = `tier1.tier2.review`, 예: `A1R2`)마다 시간 비용 + 에너지 비용 + 경험치 보상.

> 정확한 27 leaf 값은 §11 (시트 초안)에서 정의. 피터공 검토 후 확정.

##### 2.3 자원 회복 공식 (D-03, D-04, D-07)

**시나리오 종료 시에만** 회복. 시나리오 중에는 회복 X.

```js
function recoverResources(grade, level) {
  const baseRecover = 0.70;                      // 기본 70%
  const gradeBonus = { S: 0.60, A: 0.47, B: 0.34, C: 0.22, D: 0.10 };  // 5등급 선형 분배
  const recoverPercent = baseRecover + gradeBonus[grade];   // 0.80 ~ 1.30

  resources.time.current = Math.min(
    resources.time.max,
    resources.time.current + Math.floor(resources.time.max * recoverPercent)
  );
  resources.energy.current = Math.min(
    resources.energy.max,
    resources.energy.current + Math.floor(resources.energy.max * recoverPercent)
  );

  // 레벨업 발생 시: 모든 미터 꽉 찬 상태로 갱신 (D-06)
  if (didLevelUp) {
    resources.time.current = resources.time.max;
    resources.energy.current = resources.energy.max;
  }
}
```

| 등급 | 기본 회복 | 등급 보너스 | 합 |
|---|---|---|---|
| S | 70% | +60% | 130%* |
| A | 70% | +47% | 117%* |
| B | 70% | +34% | 104%* |
| C | 70% | +22% | 92% |
| D | 70% | +10% | 80% |

\* 100% 초과분은 미터 max에 닿음 (overflow 폐기). 완벽 플레이 시에도 다음 시나리오 시작 시 max 상태.

##### 2.4 자원 소진 시 처리 (A안 확정 — 4/28 19:30)

**A안 단순화** — 자원 부족해도 선택은 가능. 부족분만큼 점수 페널티.

```js
function calcResourcePenalty(resources) {
  const timeShortage = Math.max(0, -resources.time.current);
  const energyShortage = Math.max(0, -resources.energy.current);
  return Math.floor((timeShortage + energyShortage) * 0.5);  // 부족 1단위 = 0.5점 감점
}
```

- 자원이 음수가 될 수 있음. 다음 시나리오 시작 시 회복으로 복구
- B안(강제 분기)는 v0.5 반복 메커닉과 함께 "강제 결말 분기" 옵션으로 재검토

---

#### 3. 경험치 + 레벨업 시스템

##### 3.1 경험치 (D-02, D-05)

```js
gameState.exp = {
  current: number,              // 현재 누적 경험치
  level: 1|2|3|4|5,             // 현재 레벨
  thresholds: [0, 20, 50, 100, 200]   // 레벨 임계값 (L1=0~19, L2=20~49, ...)
};
```

- 시나리오 종료 시에만 갱신 (D-05)
- 같은 시나리오 반복 시 누적 (D-07) — 반복 플레이 보상
- 시나리오 중 표시는 가능 (UI), 단 레벨업은 종료 시점에만 발생

##### 3.2 경험치 획득 공식 (확정 4/28 19:30)

```js
function calculateExpGain(leafPath, grade) {
  const leafExp = leafExpTable[leafPath];      // 27 leaf별 기본 경험치 (시트)
  const gradeMultiplier = { S: 1.5, A: 1.3, B: 1.0, C: 0.7, D: 0.5 };
  return Math.floor(leafExp * gradeMultiplier[grade]);
}
```

→ leaf별 기본값은 §11에서. **에너지 비용이 큰 leaf = 경험치 보상 큰 구조** (직접 작업 = 경험치 ↑ 메커닉).

##### 3.3 레벨업 효과 (D-06)

레벨업 발생 시:
1. **시간/에너지 max 증가**: 각각 `+10%` (linear) 또는 누적식 (예: L2=110, L3=125, L4=145, L5=170 — 시트 결정)
2. **모든 미터 꽉 찬 상태**로 다음 시나리오 시작
3. 두 역량(`delegationChoice`, `knowledge`)에는 영향 X (별도 누적 — v0.3 보존)

> 레벨이 두 역량을 강화하는 것이 아니라, **자원 효율을 강화**한다. 두 역량은 선택의 누적 효과로 자연 증가.

##### 3.5 도메인 역량 명칭 (확정 4/28 19:30)

- **v0.4 MVP**: 단일 도메인 역량. 코드 변수는 v0.3 호환 위해 `knowledge` 유지. **UI 라벨만 "문해력"** (어린왕자 시나리오 직관성)
- **v0.5**: 시나리오 3종 추가 시 "주역량 + 부역량" 도입 검토 — 어린왕자=문해력+읽기역량, 논술=논증력+문해력 등
- 게이지 = 4개 (시간/에너지/위임 판단/문해력). v0.5에서 5개로 확장

##### 3.4 레벨 → 검수 효율 (메시지 메커닉) — 확정 4/28 19:30

피터공 Q3 답: 레벨 ↑ → AI 위임 결과 검수 역량 ↑ → 결과 완성도 판단 ↑

→ **구현**: `knowledge` 역량 값과 레벨이 검토 단계 점수 산정에 영향. v0.3에서는 검토에서 발견 가능한 hidden issue가 R1/R2/R3로 고정. v0.4에서는 **레벨이 R1·R2·R3 별 발견 보너스**에 더해짐.

```js
function detectIssues(result, review, level) {
  const baseDetected = countDetectedIssues(result.hiddenIssues, review);
  const levelBonus = CONFIG.levelDetectBonus[level];   // L1=0, L2=0, L3=+2, L4=+3, L5=+4
  return Math.min(result.hiddenIssues.length, baseDetected + levelBonus);
}
```

**곡선 의도** (피터공 4/28): L3부터 효과 명확 → 몰입+레슨 강화. L5는 거의 마스터 — hidden issue 평균 5개 가정 시 L3=40% 추가 발견 / L5=80% 추가 발견.

> **구현 정정 (Phase 5, 세션248)**: 위 의사코드는 `result.hiddenIssues` + `countDetectedIssues`를 가정하나, 실제 어린왕자 시나리오 데이터는 B1에만 hiddenIssues가 있어 범용 적용 불가. **C안(검토 격상 메커닉)으로 전환**: 레벨이 오르면 같은 검토 강도로도 한 단계 더 깊이 본다. `CONFIG.levelStep + levelExtraBonus` 사용. `levelDetectBonus`는 deprecated (키 보존). 실제 구현:
> ```js
> // 검토 인덱스: R1=0, R2=1, R3=2
> // effectiveReviewIndex = min(2, baseIdx + levelStep[level])
> // effIdx=0 → basePoint만 / effIdx=1 → +deltaR2 / effIdx=2 → +deltaR3
> // L4·L5: effIdx 계산 후 levelExtraBonus 추가 (격상 천장 후 차별화)
> function detectIssues(result, review, level) {
>   const reviewMap = {R1:0, R2:1, R3:2};
>   const effIdx = Math.min(2, reviewMap[review.id] + CONFIG.levelStep[level]);
>   const deltaPoint = effIdx===0 ? 0 : (effIdx===1 ? result.deltaR2 : result.deltaR3);
>   return deltaPoint + CONFIG.levelExtraBonus[level];
> }
> ```

---

#### 4. 힌트 토글 시스템 (D-09)

##### 4.1 동작 (A안 확정 — 4/28 19:30)

```js
gameState.hintEnabled = false;   // 처음 OFF
```

- 토글 버튼: 게임 시작 화면 + 디버그 패널 (둘 중 하나로 단순화 가능)
- ON: v0.3 동작 (선택지에 두 역량 영향 ↑↑/↑/△/↓/↓↓ 표시 + 자원 비용 표시)
- OFF: **영향만 숨김. 자원 비용은 항상 보임** (객관적 정보는 결정 근거)

##### 4.2 결과 화면에서의 사후 노출 (확정)

검토 결과 화면(컷 5~6)에서는 자원 소비 + 영향 + 경험치 획득 **사후 공개** = 학습 피드백. 선택 시점에서만 영향 숨김, 결과 화면에서는 항상 공개.

##### 4.3 디버그 패널 확장

힌트 토글 + 자원/경험치 임의 설정 + 레벨 점프 + 시나리오 점프 (v0.3 보존).

---

#### 5. UI 변화

##### 5.1 게이지 패널 (재설계 — 4/28 세션247)

**좌/우 패널 (본문 상단 가로 분할, sticky)**:
- **좌측 패널 (`panel-left`)**: 시간 / 에너지 자원 게이지 (세로 적층). 일반 채움 바(좌→우). 향후 Phase 4에서 레벨/경험치 추가 자리
- **우측 패널 (`panel-right`)**: 위임 판단 / 문해력 역량 게이지 (세로 적층) + 점수 + 진행 표시

**역량 게이지 = 양방향 바 (Diverging Bar)**:
- 범위 -4 ~ +4. 가운데 0 마커(세로선)
- 양수: 가운데에서 우측으로 짙은 회색(`#333`) 채움
- 음수: 가운데에서 좌측으로 옅은 회색(`#888`) 채움
- 양 끝 미세 라벨 `-4` / `+4` (스케일 인지)
- 변화 애니메이션: v0.3 ±pop 패턴 재사용 (한쪽으로 흘러나오는 표시)

**자원 게이지 = 단방향 채움 (보존)**:
- 좌→우 채움. 50% 이하 짙은 회색(`#333`), 그 이상 중간 회색(`#555`) — "닳는" 감각

**시각 톤**:
- B&W 미니멀. 패널 배경 흰색, 검은 테두리(`2px solid #111`)
- 모바일에서는 좌/우 → 위/아래 column 적층

**기능 정합**: 자원=시각·연속(좌측, "흐른다"), 역량=균형·양방향(우측, "기울어진다"). 좌측 = 시간/노력 자원. 우측 = 선택의 누적 효과.

##### 5.2 경험치 + 레벨 표시 (좌측 패널 상단 — Phase 4)

**위치**: 좌측 패널 상단, 자원 게이지 위. 시각 위계 — 레벨이 자원 max를 결정하므로 위에 둔다.

**구조**:
- 레벨 표시: `Lv.{N}` — 굵은 숫자(15px)
- 경험치 바: 가로 채움(height:6px), 흑색 채움(`#111`), 옅은 회색 배경(`#e0e0e0`)
- 숫자: `{current}/{threshold}` — 작게(10px, `#888`)
- L5 도달 시 표시: `Lv.5 MAX` (스레숄드 무한대 또는 "MAX")

**레벨업 애니메이션**:
- 좌측 패널 노란빛(`#fff8d0`) 깜빡 0.8s
- 레벨 숫자 numPulse 0.5s
- 컷 6 결과 화면에 "LV UP! Lv.{N-1} → Lv.{N}" 강조 (자원 회복 알림과 같이)

**구분선**: 경험치 바 아래 1px 옅은 회색 divider (자원과 시각 분리)

##### 5.3 컷 5 (검토) — 힌트 영향

- v0.3: "이 검토를 선택하면 지식 +1, 점수 +N"
- v0.4: 힌트 OFF 시 "이 검토를 선택하면..." → 영향 숨김. 결과만 보고 사후 학습

##### 5.4 컷 6 (최종) — 회복 알림

- 결과 점수 + 등급 + 아이템 (v0.3 보존)
- **신규**: 회복된 자원량 + 새 레벨 (있으면) + 다음 시나리오 시작 자원 상태

---

#### 6. 시나리오 데이터 구조 (v0.3 + 자원 추가)

```js
// 시나리오 (어린왕자 1개)
{
  id: 'eorinwangja',
  // ... v0.3 필드 보존 (situation, tier1, tier2, results, reviews, finals, cardSlots)

  // v0.4 신규
  resourceCosts: {
    'A1': { time: number, energy: number },     // 1+2차 선택 누적 비용
    'A2': {...}, ..., 'C3': {...}
  },
  expRewards: {
    'A1R1': number,                              // 27 leaf별 경험치 기본값
    'A1R2': number, ..., 'C3R3': number
  }
}
```

---

#### 7. Game State (v0.4 확장)

```js
let gameState = {
  // v0.3 보존
  currentScenarioId: 'eorinwangja',
  currentTier: 1|2|'review'|'final',
  selectedTier1, selectedTier2, selectedReview,
  competencies: {
    delegationChoice: { value: 0, history: [] },
    knowledge: { value: 0, history: [] }
  },
  score: 0,
  totalScore: 0,
  itemsCollected: [],
  cardsHeld: [],
  scenarioHistory: [],

  // v0.4 신규
  resources: {
    time: { current: 100, max: 100, history: [] },
    energy: { current: 100, max: 100, history: [] }
  },
  exp: {
    current: 0,
    level: 1,
    thresholds: [0, 20, 50, 100, 200]
  },
  hintEnabled: false,
  scenarioRepeatCount: { 'eorinwangja': 0 },     // D-07 반복 카운트

  completed: false
};
```

---

#### 8. 점수 산정 로직 (v0.4 Phase 5 — C안 구현)

```js
// 최종 점수 = base + detected + cardBonus - resourcePenalty
// detected = detectIssues() 반환값 (deltaR2 or deltaR3) + levelExtraBonus
// base = result.basePoint (결과 텍스트 기본 점수)
// cardBonus = 보유 카드가 해당 leaf의 boostCard면 bonusPoint, 아니면 0
// resourcePenalty = calcResourcePenalty(gameState.resources) = floor((timeShortage + energyShortage) * 0.5)
function calculateFinalScore(result, review, level, leaf) {
  const base = result.basePoint;
  const detected = detectIssues(result, review, level);   // §3.4 C안 격상 메커닉
  const cardBonus = getCardBonus(leaf);                   // 학맞통 카드 (§17)
  const resourcePenalty = calcResourcePenalty(gameState.resources);   // §2.4 A안

  return Math.max(0, base + detected + cardBonus - resourcePenalty);
}
```

`getGrade()` 그대로 (v0.3 5등급). goCut6에서 `grade = getGrade(gameState.score)` 동적 산출 (Phase 5 수정 — 사전계산값 fin.grade 미사용). item/awareness는 fin에서 그대로.

---

#### 9. 6컷 흐름 (v0.4 자원 + 경험치 통합)

| 컷 | v0.3 동작 | v0.4 추가 |
|---|---|---|
| 1 (상황) | 시나리오 진입 | 자원 게이지 표시 시작. 시간/에너지 max 표시 |
| 2 (1차 선택) | A·B·C 한 화면 | 힌트 OFF 시 영향 숨김. 자원 게이지에서 비용 미리 보기 토글 |
| 3 (2차 선택) | 선택된 1차의 3개 | 동일 |
| 4 (결과 raw) | results[selectedTier2] | 자원 소비 알림 (시간 -X, 에너지 -Y) |
| 5 (검토) | R1·R2·R3 | 레벨이 검토 효율에 영향 (§3.4). 힌트 OFF 시 영향 숨김 |
| 6 (최종) | 점수+등급+아이템 | **신규**: 경험치 획득 + (레벨업 시) 레벨업 알림 + 자원 회복 알림 + 다음 시나리오 시작 자원 미리보기 |

---

#### 10. 코드 분기 전략

- **루트 `index.html`**: v0.2 옛 빌드 (5 시나리오, 4/3). 참고용 보존.
- **`v03/index.html`**: v0.3 어린왕자 prototype (4/28 09:58 commit, d8ff24f). **v04 base**.
- **`v04/index.html`**: v0.4 fresh start. `v03/index.html`을 복사한 뒤 자원 시스템 추가.
- 추후 실험 분기 필요 시: `v04a/index.html`, `v04b/index.html` 등 sibling 폴더.

배포: `https://mice3nyc.github.io/ari_gitrepo_1/ai-literacy-delegation-boundary/v04/`

---

#### 11. 27 leaf 비용/보상 시트 (아리공 초안 — 피터공 검토 필요)

> 한 시나리오 = 한 사이클. 시작 시 시간 100, 에너지 100. 한 번 끝까지 가면 거의 다 소진되도록 설계.

##### 11.1 단위 가정

- 시간 max 100, 에너지 max 100 (시작값)
- 한 시나리오 1회 플레이 = 시간 70~95, 에너지 30~80 소비 (선택에 따라)
- 경험치는 한 회 플레이당 5~25 획득 (등급 곱셈 후 기준)

##### 11.2 leaf별 자원 비용 + 경험치 보상 (확정 — MVP 기준값. v0.5에서 레벨별 곱셈 도입 검토)

> 1차 선택: A=직접 정독 / B=AI 위임 / C=무시·날림
> 2차 선택: 1=깊게 / 2=중간 / 3=얕게
> 검토: R1=그대로 / R2=한 번 읽기 / R3=크로스체크

| Leaf | Tier1 | Tier2 | Review | 시간 비용 | 에너지 비용 | 경험치 |
|---|---|---|---|---|---|---|
| A1R1 | 직접 | 깊게 | 그대로 | 90 | 80 | 25 |
| A1R2 | 직접 | 깊게 | 한 번 읽기 | 95 | 85 | 25 |
| A1R3 | 직접 | 깊게 | 크로스체크 | 100 | 90 | 25 |
| A2R1 | 직접 | 중간 | 그대로 | 70 | 60 | 18 |
| A2R2 | 직접 | 중간 | 한 번 읽기 | 75 | 65 | 18 |
| A2R3 | 직접 | 중간 | 크로스체크 | 80 | 70 | 18 |
| A3R1 | 직접 | 얕게 | 그대로 | 50 | 40 | 12 |
| A3R2 | 직접 | 얕게 | 한 번 읽기 | 55 | 45 | 12 |
| A3R3 | 직접 | 얕게 | 크로스체크 | 60 | 50 | 12 |
| B1R1 | AI | 깊게 | 그대로 | 30 | 15 | 8 |
| B1R2 | AI | 깊게 | 한 번 읽기 | 40 | 25 | 10 |
| B1R3 | AI | 깊게 | 크로스체크 | 55 | 45 | 14 |
| B2R1 | AI | 중간 | 그대로 | 25 | 10 | 6 |
| B2R2 | AI | 중간 | 한 번 읽기 | 35 | 20 | 8 |
| B2R3 | AI | 중간 | 크로스체크 | 50 | 40 | 12 |
| B3R1 | AI | 얕게 | 그대로 | 15 | 5 | 3 |
| B3R2 | AI | 얕게 | 한 번 읽기 | 25 | 15 | 5 |
| B3R3 | AI | 얕게 | 크로스체크 | 40 | 35 | 10 |
| C1R1 | 무시 | 깊게(?) | 그대로 | 40 | 30 | 5 |
| C1R2 | 무시 | 깊게(?) | 한 번 읽기 | 50 | 40 | 7 |
| C1R3 | 무시 | 깊게(?) | 크로스체크 | 65 | 55 | 9 |
| C2R1 | 무시 | 중간 | 그대로 | 25 | 15 | 3 |
| C2R2 | 무시 | 중간 | 한 번 읽기 | 35 | 25 | 5 |
| C2R3 | 무시 | 중간 | 크로스체크 | 50 | 40 | 7 |
| C3R1 | 무시 | 얕게 | 그대로 | 10 | 5 | 1 |
| C3R2 | 무시 | 얕게 | 한 번 읽기 | 20 | 10 | 2 |
| C3R3 | 무시 | 얕게 | 크로스체크 | 35 | 25 | 4 |

##### 11.3 시트 설계 원칙 (검토용)

- **A (직접) > B (AI) > C (무시)** 시간 비용. 단 검토 단계 R3은 항상 비용 추가.
- **A (직접)**: 에너지 비용 큼 → 경험치 大. 학습 곡선의 "삽질" 단계.
- **B (AI)**: 시간 비용 작음, 에너지 작음 → 경험치 小. 그러나 검토(R3)에서 발견 못 하면 등급 ↓ → 회복량 ↓ → 자원 부족 → 악순환.
- **C (무시)**: 시간/에너지 모두 작지만 경험치 거의 X. 등급도 낮음.
- **R3 (크로스체크)**: 모든 분기에서 시간 +10~15. 단 레벨 ↑ 시 발견 +1 보너스.

##### 11.4 레벨업 임계 + 미터 증가량 (확정 4/28 19:30)

| 레벨 | 누적 경험치 임계 | 시간 max | 에너지 max |
|---|---|---|---|
| L1 | 0 | 100 | 100 |
| L2 | 20 | 110 | 110 |
| L3 | 50 | 125 | 125 |
| L4 | 100 | 145 | 145 |
| L5 | 200 | 170 | 170 |

→ L5 도달 = 최대 미터 70% 증가. 같은 작업도 자원 잉여로 처리 가능 = "더 빨리 더 많이" (피터공 Q3).

---

#### 12. CONFIG (v0.4)

```js
const CONFIG = {
  storageKey: 'ai-literacy-delegation-boundary-v04',
  eventLogKey: 'ai-literacy-delegation-boundary-v04-events',

  scenarios: ['eorinwangja'],   // MVP

  pointThresholds: { S: 90, A: 70, B: 50, C: 30 },     // v0.3 보존

  cardBoost: 20,                // v0.3 보존
  detectedIssueBoost: 10,       // v0.3 보존

  // v0.4 신규
  resourceMaxStart: { time: 100, energy: 100 },
  recoverBase: 0.70,
  gradeBonus: { S: 0.60, A: 0.47, B: 0.34, C: 0.22, D: 0.10 },
  expThresholds: [0, 20, 50, 100, 200],
  meterMaxByLevel: {
    1: { time: 100, energy: 100 },
    2: { time: 110, energy: 110 },
    3: { time: 125, energy: 125 },
    4: { time: 145, energy: 145 },
    5: { time: 170, energy: 170 }
  },
  // deprecated (Phase 5에서 levelStep+levelExtraBonus로 대체)
  levelDetectBonus: { 1: 0, 2: 0, 3: 2, 4: 3, 5: 4 },
  // Phase 5 신규: C안 검토 격상 메커닉
  levelStep: { 1: 0, 2: 0, 3: 1, 4: 1, 5: 2 },           // 레벨별 검토 인덱스 격상 폭
  levelExtraBonus: { 1: 0, 2: 0, 3: 0, 4: 5, 5: 10 },    // 격상 천장 후 미세 보너스
  hintEnabledDefault: false
};
```

---

#### 13. localStorage 규칙

- 저장 key: `ai-literacy-delegation-boundary-v04`
- 저장 내용: gameState 전체 (resources, exp, hintEnabled 포함) + 저장 시각
- v0.3 데이터와 분리 (각자 key 다름)

---

#### 14. 이벤트 로그 (v0.4 추가 타입)

```
session_started, session_continued,
scenario_viewed,
tier1_selected, tier2_selected, review_selected,
result_viewed, final_viewed,
card_acquired, card_used,
scenario_completed,
final_report_viewed, session_reset,

resource_consumed,    ← v0.4 신규 (선택 시)
resource_recovered,   ← v0.4 신규 (시나리오 종료 시)
exp_gained,           ← v0.4 신규
level_up,             ← v0.4 신규
hint_toggled          ← v0.4 신규
```

---

#### 15. DebugPanel (v0.4 확장)

##### 표시 항목

- v0.3 보존: currentScenarioId, currentTier, selected*, 두 역량 value+history, score, totalScore, grade, itemsCollected, cardsHeld, sessionId, 누적 이벤트 수
- v0.4 신규: 시간/에너지 current+max, 경험치 current+level, hintEnabled, scenarioRepeatCount

##### 버튼 (v0.4 추가)

- v0.3 보존: 상태 초기화, 시나리오 점프, 두 역량 임의 설정, 카드 임의 추가, localStorage 삭제, 이벤트 로그 보기/복사/다운로드/삭제
- v0.4 신규: 자원 임의 설정, 경험치/레벨 임의 설정, 힌트 토글

---

#### 16. 완료 기준

PLAN.md / TASKS.md 참조.

---

#### 17. 보존된 v0.3 자산

- 두 역량 게이지 (delegationChoice / knowledge)
- 5등급 점수 시스템 (S/A/B/C/D)
- 학맞통 카드 결합 슬롯
- 6컷 흐름 + 트리 76노드 데이터 구조
- HTML/CSS 골격 (B&W 미니멀)
- localStorage + 이벤트 로그 + DebugPanel
- GitHub Pages 배포 인프라

---

#### 18. 폐기/유보 (v0.4 범위 외)

- 시나리오 5개 → 1개 축소 (MVP). v0.5에서 학습 곡선 시나리오 3개로 확장.
- 반복 메커닉(동현공 ③, 1년 분량 6~12 시나리오) — v0.5 이후
- 타임 스플릿(피터공 즉흥) — 반복과 통합, v0.5 이후
- AI 리터러시 아이템 = 기능형 vs 콜렉션 별도 결정 — v0.4 학맞통 카드 + 5등급 아이템에 자원/레벨업 통합 후 v0.5에서 확장

---

#### 19. Phase 변경 이력

**Phase 5 (4/28 세션248)**: C안 채택 — hiddenIssues 범용 데이터 부재로 detectIssues 의사코드 대신 검토 격상 메커닉 구현. CONFIG.levelStep + levelExtraBonus 신설. calculateFinalScore에 자원 페널티 통합. grade 동적 산출(fin.grade 미사용). 디버그 패널 Level/Resources 버튼 추가.

---

#### Phase 1 검토 결과 (4/28 19:30 확정)

8/8 항목 합의 완료. 상세 응답: [[REVIEW-Phase1]]

| # | 항목 | 결정 | SPEC 반영 |
|---|---|---|---|
| 1 | §11.2 27 leaf | MVP 기준값 확정 (v0.5에서 레벨별 곱셈) | §11.2 헤더 |
| 2 | §11.4 레벨 곡선 | 확정 | §11.4 헤더 |
| 3 | §3.2 등급 곱셈 | 확정 | §3.2 헤더 |
| 4 | §3.4 검수 보너스 | **수정 — L3=+2, L4=+3, L5=+4** | §3.4 코드 + §12 CONFIG |
| 5 | §2.4 자원 페널티 | A안(단순화) | §2.4 본문 |
| 6 | §4 힌트 토글 | A안(영향만 숨김, 자원 보임) | §4.1·§4.2 |
| 7 | 도메인 역량 명칭 | **단일 "문해력"** (v0.5에서 복수 도입 검토) | §1 표 + §3.5 신설 |
| 8 | §5.1 게이지 배치 | 시간/에너지=상단 가로, 위임판단/문해력=우측 세로 | §5.1 본문 |

다음: **Phase 2 — v04/index.html 골격** ([[v04/PLAN|PLAN.md]] §Phase 2)
