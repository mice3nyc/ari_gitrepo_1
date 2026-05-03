## SPEC — v0.6 점수 framework

**최종 업데이트**: 2026-05-03 세션282 (옵션 1 leaf.delta + 5 시나리오 정점 격상 + 공통 카드 풀 4종)
**PLAN**: [[PLAN|PLAN.md]] / **TASKS**: [[TASKS|TASKS.md]]

> 에이전트 전달용 기술 상세. 코드와 동기화. 변경 시 build.py / extract_balance.js / index.html 영향 점검.

---

#### 0. 핵심 변경 요약 (v0.5 → v0.6)

| 영역 | v0.5 | v0.6 |
|---|---|---|
| 점수 기여 | tier2 delegation에만 부분적 | tier1 / tier2 / review **모든 단계** |
| 점수 축 | 단일 (basePoint) | **두 축 분리 (위 / 도)** |
| 비용 보정 | `resourceCostMultiplier: 0.6` 글로벌 | **폐지** — raw 재조정 |
| 카드 키 | `cardSlots.boostCard` | **`axisDelta`** |
| 학생 노출 | 매 단계 점수 미터 | **시나리오 끝 종합만** |
| 학기 끝 | basePoint 누적 → result 라벨 | **누적 위/도 → 4유형 라벨 (pp/pn/np/nn)** |

---

#### 1. yaml 스키마 — delta 필드

##### 1.1 tier1 (큰 방향 선택)

```yaml
tier1:
  - id: A
    label: AI에게 먼저 물어본다
    delta: { 위: +1, 도: 0 }
  - id: B
    label: 친구한테 묻는다
    delta: { 위: 0, 도: +1 }
```

##### 1.2 tier2 (행동 선택, tier1 분기 아래)

```yaml
tier2:
  A:
    - id: A1
      label: 직접 검색해본다
      delta: { 위: +2, 도: +1 }
      cost: { time: 30, energy: 10 }   # raw, 0.6 곱하기 없음
    - id: A2
      label: AI 답을 그대로 믿는다
      delta: { 위: -2, 도: 0 }
      cost: { time: 5, energy: 2 }
```

##### 1.3 reviews (검토 강도)

```yaml
reviews:
  - id: R1
    label: 그냥 제출
    delta: { 위: -1, 도: 0 }
    cost: { time: 0, energy: 0 }
  - id: R3
    label: 출처 비교 + 다시 정리
    delta: { 위: 0, 도: +3 }
    cost: { time: 40, energy: 15 }
```

##### 1.4 axisDelta — 시나리오별 카드 슬롯

> **Phase 2 현재 상태 (parent key만 rename)**:

```yaml
axisDelta:                  # ← v0.5의 cardSlots에서 rename
  A1R1:                     # leaf id
    boostCard: 처음의 나 카드 # 카드 이름 (Phase 5 재구조 예정)
    bonusPoint: 20           # 점수 보너스 (Phase 5 → delta {위/도}로 재구조)
```

> **Phase 5 목표 형태** (카드 4안 결정 + final_item 연결 시):

```yaml
axisDelta:
  - id: card_self_inquiry
    label: 자기 탐색
    delta: { 위: +3, 도: 0 }
    triggerLeafIds: [A1R3, A2R3]
```

---

#### 2. 점수 누적 로직

##### 2.1 누적 식

```
score_위 = sum(leaf.delta.위) for leaf in 학기 전체 선택 경로
score_도 = sum(leaf.delta.도) for leaf in 학기 전체 선택 경로
+ axisDelta cards 보유분 합산
```

##### 2.2 4유형 판정 (학기 끝)

| score_위 | score_도 | 라벨 |
|---|---|---|
| ≥ +N | ≥ +N | **pp** — 판단도 도메인도 단단 |
| ≥ +N | < +N | **pn** — 판단 단단, 도메인 가벼움 |
| < +N | ≥ +N | **np** — 도메인 단단, 판단 가벼움 |
| < +N | < +N | **nn** — 둘 다 가벼움 |

> 임계값 N은 시나리오 5개 마이그레이션 후 발란스에서 확정. 가안: N = 0 (양/음 부호로만 판정).

##### 2.3 학생 노출 정책 [폐기 — 5/3]

> 5/3 plate에서 발견: "진행 중 점수 노출 X"를 visibility 토글로 구현 → 정보 UI 통째로 사라진 인상. **점수 UI는 항상 보이는 상태가 기본**, 숨김이 필요하다면 UI 토글이 아니라 점수 업데이트 시점을 지연(delay)하는 방식으로 다뤄야 한다는 피터공 명시. 이 정책 자체 폐기. 점수 노출 시점 결정은 별도 자리에서.

- **점수 UI**: 항상 노출 (LV / SCORE / 위 / 도 / 진행 카운터)
- **시나리오 끝**: 위·도 두 축 점수 + 그 시나리오 누적 한 줄
- **학기 끝**: 4유형 라벨 + 그동안 누적된 axisDelta 카드 모음

---

#### 3. 비용 계산식 (multiplier 폐지)

##### 3.1 v0.5 (폐지)

```
actual_cost = raw_cost × resourceCostMultiplier (0.6)
```

##### 3.2 v0.6

```
actual_cost = raw_cost
```

raw 비용은 학기 시작 자원(`resourceMaxStart`) 대비 leaf 기여를 명시적으로 짜서 재조정.

##### 3.3 시나리오 단위 누적 + 비대칭 효과 (5/3 세션278 root cause 정정)

**5/3 폭주 진단**: DELTA_POS={'++':4,'+':2} + competencyDiscountMult=2 → 실효 ×4. **그러나 root cause는 mult 값이 아니라 회로 — 한 시나리오 안에서 점수가 즉시 누적되어 다음 선택의 비용 효과가 즉시 변화**. 발란스 mult 조정으로는 폭주 강도만 줄어들 뿐 회로는 유지.

**root cause 정정 — 누적 단위를 시나리오로 끌어올림**:

- 한 시나리오 안에서는 비용 효과가 **고정** (학기 시작 ~ 이전 시나리오 끝까지 누적된 점수 기준)
- 학생의 선택은 **pending 점수**로 시각적으로만 표시 (§12 원 마커)
- 시나리오 끝에서 pending → 누적 게이지로 흡수
- 다음 시나리오부터 새 누적값으로 비용 효과 변화

**효과 식**:

```
displayed_cost = raw_cost - effect
effect = 누적_점수 × mult (시나리오 안 변화 X, pending 배제)
mult: 양수 ×2, 음수 ×2 (대칭 — 시나리오 단위라 폭주 위험 없음)
```

| 단계 | 정정 전 (5/3 박힘) | 시나리오 단위 + ±1 단순화 (5/3 최종) |
|---|---|---|
| 점수 매핑 | `{'++':4,'+':2}`/`{'-':-1,'--':-1}` | **선택당 ±1만** (`++/+ → 1`, `--/- → -1`) — 학생이 원 1·2·3개로 직관 |
| 효과 mult (양수) | 2 | 2 |
| 효과 mult (음수) | 2 | **2** (대칭 — 시나리오 단위라 안전) |
| 누적 변화 시점 | 매 선택 | **시나리오 끝** |
| 한 시나리오 안 비용 효과 | 변화 (폭주 회로) | **고정** |
| 한 회기 max pending (양수) | — | **+3** (모두 +) |
| 한 회기 max pending (음수) | — | **-3** (모두 -) |
| DELTA_POS / DELTA_NEG 변수 | 사용 | **폐기** (`getAxisDelta(sign)` 함수로 단순화) |

CONFIG: `competencyDiscountMultPos: 2`, `competencyDiscountMultNeg: 2` (대칭).

코드:
- `_applyDiscount`는 `gameState.competencies.*.value` (이전 시나리오까지 누적) 기준 — pending 배제
- pending은 `gameState.pending.{delegation, knowledge}`에 박힘
- 시나리오 끝에 `absorbPending()` 호출 → value에 더하고 pending 0으로 reset

---

#### 4. build.py 영향

| 영역 | 수정 내용 |
|---|---|
| 출력 변수명 | `SCENARIO_*` → `SCENARIOS` (v0.5 단일 객체와 동일) |
| 키 변경 | `cardSlots.boostCard` → `axisDelta` |
| 새 필드 | tier1/tier2/reviews에 `delta`, `cost` 처리 |
| 산출 | `index.html.template`에 `__SCENARIOS__`, `__CUT_IMAGES__` 자리 (v0.5와 동일) |

---

#### 5. extract_balance.js 영향

| 영역 | 수정 내용 |
|---|---|
| 새 컬럼 | `delta_위`, `delta_도` (tier1/tier2/review 각 행에) |
| 제거 컬럼 | basePoint (사용 시) |
| 보존 | peter_note 보존 로직 그대로 |
| 출력 | `~/Downloads/v06_balance_{date}/choices.csv` |

---

#### 6. index.html (코드) 영향

##### 6.0 진행 상태 (5/3 세션275)

| 영역 | 상태 | 비고 |
|---|---|---|
| 6.1 점수 누적 (두 축) | **이미 작동** | `competencies.delegationChoice` (위) + `competencies.knowledge` (도). 이름만 v0.5 변수명, 동작은 두 축 분리 누적 동일 |
| 6.1 tier1 점수 기여 | **5/3 framework 추가** ✅ | `applyTier1`에 `getAxisDelta` 호출 자리 추가. yaml tier1에 `delegation`·`knowledge` 필드 없으면 fallback 0 |
| 6.2 multiplier 폐지 | **미진행** ❌ | `CONFIG.resourceCostMultiplier:0.6` 잔존. raw 재조정과 묶인 발란스 작업이라 외부 LLM 분석 결과 반영 사이클에서 같이 진행 |
| 6.3 시나리오 끝 화면 | **이미 작동** ✅ | `score-display` 항상 노출 (5/3 §2.3 진행 중 숨김 정책 폐기 — 점수 UI는 항상 보이는 상태가 기본) |
| 6.4 학기 끝 화면 | **이미 작동** ✅ | v0.5 Phase 8에서 `showFinalReport`(line 1998)·4유형 분류(line 1991)·4유형 의미 박스(line 2021) 구현됨. 4유형 라벨(pp/pn/np/nn) + 등급(S/A/B/C/D) + 무드 메시지 |
| 6.5 음수 delta 매핑 | **5/3 결정** ✅ | `DELTA_NEG={'-':-1,'--':-1}`로 음수 폭 압축. `getAxisDelta` 함수 분기로 양수·음수 다른 룰 적용 가능 구조 |

##### 6.1 점수 누적 (런타임)

현재 코드는 v0.5 변수명을 유지하되 두 축 분리 누적 작동:

```js
// 위: tier1 + tier2의 delegation 누적 (5/3부터 tier1 기여)
gameState.competencies.delegationChoice.value += getAxisDelta(sign);
// 도: tier1 + finals[leaf]의 knowledge 누적 (5/3부터 tier1 기여)
gameState.competencies.knowledge.value += getAxisDelta(sign);
```

이름 마이그(`competencies.delegationChoice` → `state.score.위`)는 사실상 변경이지 동작 변화 없음. 우선순위 낮음.

##### 6.2 cost meter (미진행)

SPEC: `actual_cost = leaf.cost` (multiplier 곱셈 제거). 현재 `_applyMult` 함수에서 0.6 곱셈 잔존. raw 재조정과 묶여 후속.

##### 6.3 시나리오 끝 chain (5/3 세션278 재배치)

cut6 결과 패널 표시 후 1.4초 → 모달 chain. 카드 단계가 첫 자리. 학기 끝일 땐 자원 충전 단계 건너뛰고 종합 리포트로.

```
[0] 결과 패널 (cut6 본체)            등급·획득 아이템·awareness·위/도 delta+누적·비용·exp·잔여 자원
        ↓ 1.4초 자동
[1] 카드 reward (조건부)             도 축 양수 + leaf의 competencyCards 비지 않음
        - 카드 1장씩 단건 컨펌
        - 라벨 + note + "획득" 버튼
        - 클릭 → 인벤토리로 travel → 다음 카드 자동 fadein
        - 마지막 카드 travel 끝나면 자동 닫힘
        ↓
[2] 레벨업 모달 (조건부)             didLevelUp일 때만. 자원 max 증가 + 자원토큰 보너스. "확인" 버튼
        ↓
[3] 자원 충전 모달 (조건부)          학기 끝 아닐 때만. RP 분배 (showRPDistributionModal)
        ↓
[4] 다음 버튼                        "다음 시나리오로 →" / "학기 종합 리포트 보기"
```

**카드 못 받은 회기 (도 축 음수 또는 카드 0장)**: 결과 패널에 "이번엔 역량 카드를 받지 못했어요" 한 줄 박스 노출 (학습 피드백 자리 명확화).

**chain 구현**: `Promise.resolve()` → 각 단계 함수가 Promise 반환. 카드 단계는 `playCardRewardSequential(cards, note)`로 모든 카드 컨펌 끝나면 resolve.

**호출 자리 이동 (5/3 세션278)**: `awardCompetencyCards`의 데이터 적립은 review 선택 시점 그대로 (cut5→cut6 전환 직전, line ~3893), 시각 reward(`playCardRewardSequential`)만 chain의 첫 단계로 분리.

##### 6.4 학기 끝 화면 (5/3 세션282 갱신 — 카드 누적 리뷰 + 카툰 정정)

v0.5 Phase 8에서 신설된 `showFinalReport` 자리에 카드 누적 리뷰 + 카툰 세부 정정 박힘. 학기 종합 리포트 화면 흐름:

1. **타이틀 + 부제**
2. **4박스 통계** (총점/레벨/위/도)
3. **4유형 의미 박스** (compType + compText)
4. **카드 누적 리뷰 섹션 (신설)** — 한 학기 동안 모은 역량 카드
   - 그룹별 카운트 (인벤토리 패널과 동일 룰: 23px·800·#f0f0f0 배경, 좌측 강조)
   - 라벨 (15px·700·카드 색상)
   - 출처 한 줄 (시나리오 unique join, #888)
   - 정렬: 카운트 내림차순 → 가나다순
   - 빈 상태: "이번 학기는 역량 카드를 받지 못했어요. 다시 도전!" 박스
5. **카툰** (시나리오마다 strip) — 세 정정:
   - 컷 간격 `.comic-strip` gap 10→5px
   - 시상 panel `.comic-panel-prize` 신설 — 폭 160→107px (2/3 축소)
   - mood 캡션(α) — `CONFIG.resultMoods` 정형 메시지 폐기, 학생 받은 카드 관점 텍스트로 갈음. 카드 받은 회기 "이번 회기에 **{카드명}** 카드를 얻었다…" / 못 받은 회기 "이번 회기는 카드를 받지 못했다…"
   - scene-summary(β) — scene-title 아래 한 줄 (12px·#555·중앙정렬): "선택: {tier2 라벨} · 위 ±N · 도 ±N · 카드 N장 — 라벨1, 라벨2"
6. **"학기 처음부터" 버튼**

**데이터 보강**: `gameState.scenarioHistory.push`에 4필드 추가 (`dlgDelta`/`knlDelta`/`dlgTotal`/`knlTotal`) — scene-summary β의 위/도 Δ 표시용. 시나리오 종료 시점 pending 값 스냅샷. 기존 세이브(필드 없음) 가드 — `typeof r.dlgDelta==='number'` 체크.

##### 6.5 음수 delta 매핑 (5/3)

```js
var DELTA_POS={'++':2,'+':1};
var DELTA_NEG={'-':-1,'--':-1};
function getAxisDelta(sign){...}  // 부호 분기 자리
```

---

#### 7. 역량 카드 시스템 (5/3 신설, boostCard 라벨 22종 폐기)

##### 7.1 컨셉

기존 review 결과 `boostCard`(시나리오 특화 메시지 22종 — "처음의 나 카드", "타인의 말 경고 카드")는 **폐기.** 같은 자리(시나리오 끝 도메인 지식 양수)에 **역량 카드**를 획득하는 시스템으로 대체. 역량 카드는 학생이 이해 가능한 일반 역량 라벨(문해력·협업능력·발표력 등)을 사용하고, 같은 라벨이 여러 시나리오에서 반복 획득 가능 → 학습 메시지 강조 효과.

> "도메인 지식"은 학생에게 어려운 용어. 역량 카드는 시나리오 안에서 구체 역량 라벨로 표현된다. "도메인 지식(문해력)" 식의 표기는 게이지 라벨에서만 사용, 카드는 후자만.

##### 7.2 도메인 풀 — 공통 + 시나리오 특화 (5/3 세션282 확정)

각 시나리오마다 가능한 역량 카드 후보 풀. **공통 풀(4종, 모든 시나리오 공유) + 시나리오 특화(3종)** = 시나리오당 7종.

###### 공통 풀 (5 시나리오 누적 가능)

| 카드 | 의미 | 주로 등장하는 자리 |
|---|---|---|
| **자기검증** | 자기 결과물 다시 보는 능력 | R3 (전면 검수) |
| **자기성찰** | 자기 행동·결정 돌아보는 능력 | C 묶음·얕음 자리 R3 |
| **검수능력** | 결함 발견하는 능력 | R2 (한 번 읽기)·B 묶음 R2~R3 |
| **비판적 사고** | 정보·결과 의심하고 따져보는 능력 | 정점 R2·부정 회복 R2 |

###### 시나리오 특화 풀

| 시나리오 | 특화 3종 |
|---|---|
| selfintro | 자기지식 / 표현력 / 정리력 |
| groupwork | 협업능력 / 소통능력 / 발표력 |
| eorinwangja | 문해력 / 공감력 / 해석능력 |
| career | 진로탐색 / 정보분석 / 직업이해 |
| studyplan | 학습설계 / 시간관리 / 학습전략 |

###### 변경 이력 (1차 가설 → 5/3 확정)

- eorinwangja "비판적 읽기" → 공통 "비판적 사고"로 흡수
- career "자기이해" → 공통 "자기성찰"로 흡수
- studyplan "메타인지" → 공통 "자기검증"으로 흡수

###### 카드 자리 룰

| 자리 | R1 | R2 | R3 |
|---|---|---|---|
| **회피** (B1·C3 + AI 통째 위임) | 0장 | 0장 | 0장 |
| **부정** (예: C2) | 0장 | 1장 (비판적 사고) | 3~4장 (회복) |
| **얕음** (예: A3) | 1장 | 2장 | 3~4장 (자기성찰) |
| **중립** (예: B2) | 1장 | 2~3장 (검수) | 3~4장 (자기검증) |
| **적절** (+/+) | 2장 | 3장 (+검수) | 4장 (+자기검증) |
| **정점** (++/++) | 3장 | 4장 (+비판적 사고) | 5장 (+자기검증·자기성찰) |

**핵심 룰** (5/3 피터공 진단):
- 회피 자리만 0장 — 학습 거의 없음
- **노력 자리는 R1부터 1장 이상 보장** — 자기 손으로 했으면 카드 받아야
- R3는 풍부 — 전면 검수 = 자기검증·자기성찰 자리
- 정점 R1부터 풍부 — 자기 주도 + 검수 = 카드 폭발

학기 통틀어 카드 풀: **공통 4종 + 특화 15종 = 19종**. 같은 카드(특히 공통) 여러 장 누적 가능 → 도메인 단단함 표시(A 관점 — 학기 끝 4유형 라벨 영향).

##### 7.3 yaml 스키마 확장

```yaml
selfintro:
  ...
  domainPool: [자기지식, 표현력, 정리력]   # 신설 — 시나리오 풀
  reviews:
    A1R3:
      competencyCards: [자기지식, 정리력]   # 신설 — 획득 카드 배열 (도메인 풀 안)
      note: "..."                          # 보존 — 카드 획득 시 학습 메시지
      # boostCard / bonusPoint — 폐기
```

##### 7.4 획득 조건 + 카드 데이터 구조

- **조건**: 시나리오 끝 시점 도 축 점수가 양수(>0)이면 그 leaf의 `competencyCards` 배열 카드 모두 획득
- **음수면 미획득** — 카드는 자리에 안 들어옴
- **데이터**: 인벤토리는 `gameState.inventory.competencyCards = [{label, scenario, scenarioTitle, leaf, note, ts}, ...]`. 같은 라벨 여러 장 누적 가능 (중복 카운트는 inventory 패널에서 표시).

##### 7.5 인벤토리 UI (슬라이드 패널)

- **탭 버튼**: 화면 우측 끝 고정 (세로 라벨 "📇 카드" 또는 "역량 카드"). 클릭 시 패널 슬라이드 인/아웃
- **패널 폭**: 320px 가량, 우측에서 슬라이드. 닫기 버튼 + 배경 dim
- **카드 표시 (5/3 갱신)**: 카운트 + 라벨 가로 배치
  - 카운트: 큰 볼드 + 배경색 강조 + 좌측 배치 (font-size 23px·font-weight 800·color #111·배경 #f0f0f0·padding 2px 10px·min-width 36px·radius 4px)
  - 라벨: 카운트 우측 (15px·700·카드 색상 — `_cardColor(label)` 활용)
  - 정렬: 카운트 내림차순 → 라벨 가나다순 (`.sort((a,b) => groups[b].length - groups[a].length || a.localeCompare(b, 'ko'))`)
  - "×N" 표기 폐기 — 카운트는 단독 숫자로
  - 클릭 시 시나리오·leaf 출처 expand
- **빈 상태**: "아직 획득한 카드가 없어요. 시나리오 끝에 카드를 받을 수 있습니다."

##### 7.6 reward 팝업 — 단건 컨펌 (5/3 세션278 재작성, cascade·skip 폐기)

- **트리거**: 시나리오 끝 chain의 [1] 단계. 도 축 양수 + `competencyCards` 배열 비지 않음
- **연출 (단건)**:
  1. 카드 1장 화면 중앙 fadein (0.5s) — 라벨 + note + **"획득" 버튼**
  2. 학생이 "획득" 클릭 → 우측 탭 버튼 위치로 travel (0.6s) + scale 축소 → 사라짐
  3. 다음 카드 자동 fadein (간격 0.2s buffer)
  4. 마지막 카드 travel 끝나면 chain 다음 단계로 자동 진행
- **인벤토리 badge**: travel 끝나는 시점부터 탭 버튼 unread badge 노출
- **`note` 텍스트**: 카드 본문에 표시 ("자기 경험을 직접 고르고 끝까지 확인해서 이후 자기표현 카드와 잘 맞음")
- **폐기**: cascade 자동 진입(2s 간격), 스킵 버튼, ESC 단축키, 배경 클릭 닫기 — 모두 제거
- **이유**: 학생이 카드가 무엇인지 + 획득했다는 사실을 강조. 모방·회피로 흐를 수 있는 자동 연출 폐기. 컨펌 = "이 카드를 내 것으로 받았다"는 능동적 자리

**카드 못 받은 회기**: cut6 결과 패널에 음수 안내 박스(`"이번엔 역량 카드를 받지 못했어요"`) — 도 축 음수 || competencyCards 0장일 때 출력. 카드 reward 단계는 건너뜀.

##### 7.7 위 축(위임 판단력) 표현 — 별도 결정 큐 (5/3 세션282 갱신)

위 축은 카드로 만들지 않음. 점수 + 게이지로만 표시 (현재 구조 유지). 측정 가능·객관 기준으로 학생에게 전달하는 방법은 후속 결정 자리:
- 옵션 A: 위 축도 카드로 (e.g. "위임 결정 ★", "AI 사용 검토 ★") — **미해결**
- 옵션 B: 시나리오 끝 위 축 결과 메시지 + 누적 그래프 (학기 끝 라벨에서 단계적 노출) — **미해결**
- 옵션 C: 학기 끝 4유형 라벨에만 (지금 그대로) — **5/3 종합 리포트에 카드 누적 박혀서 옵션 C 일부 선택된 상태** (학기 끝 4유형 + 위/도 카드 누적 그리드)

5/3 결정 시점은 1차 빌드 + 플테 후 → 별도 사이클. 옵션 A·B는 여전히 미해결.

---

#### 11. 타이틀+튜토리얼 화면 (5/3 세션278 신설)

##### 11.1 컨셉

게임 진입 시 곧바로 시나리오 선택 화면(`showStartScreen`)으로 가는 흐름을 폐기. 그 위에 **타이틀+튜토리얼 한 화면**(`showTitleScreen`)을 신설한다. 학생이 메카닉 무게(두 축·자원·카드·레벨업·4유형)에 들어가기 전에 한 번 펼쳐 보고 진입하는 자리.

> 한 화면 안에 타이틀 + 한 줄 명제 + 핵심 메카닉 2~3불릿 + "시작" 버튼 — 스크롤 없이.

##### 11.2 진입 흐름

```
페이지 로드
  ↓
gameState.tutorialSeen ?
  ├─ true  → showStartScreen()         (시나리오 선택)
  └─ false → showTitleScreen()         (타이틀+튜토리얼)
                ↓ "시작" 버튼 클릭
                gameState.tutorialSeen = true; saveGame()
                ↓
                showStartScreen()
```

- **첫 진입에만**: tutorialSeen 플래그가 false일 때만 자동 노출
- **다시 보기**: showStartScreen 화면에 "튜토리얼 다시 보기" 링크 → 클릭 시 showTitleScreen 호출 (플래그 변경 X)

##### 11.3 gameState 확장

```js
// createInitialState() 안
tutorialSeen:false   // 첫 시작 버튼 클릭 시 true
```

continueGame guard: 구버전 save 호환 — `if(gameState.tutorialSeen===undefined)gameState.tutorialSeen=true;` (이미 진행 중인 학기는 다시 안 보여줌).

##### 11.4 화면 구성 (한 장 레이아웃)

- **타이틀 박스** (상단): 게임명 + 부제
- **명제** (중앙 상): 한 문장. "이 게임이 무엇을 하는가"가 잡힐 것
- **메카닉 불릿** (중앙 하): 2~3개. 진행 흐름·두 축·자원의 한정성 정도까지. 카드/레벨업/4유형은 첫 회기에서 자연스럽게 익힘 (just-in-time)
- **시작 버튼** (하단): 한 안 — "1학기를 시작한다" 또는 "시작"

디자인: 게임 본체와 일관 (B&W 미니멀, 흰배경, 박스 외곽 2px black). 시나리오 선택 화면(`semester-frame`)의 톤을 따른다.

##### 11.5 카피 (5/3 세션278 박힘)

피터공이 두 톤을 결합하는 방향으로 박음 — 캐논 도입 + 게임 쇼 진행자 + 1·2·3 게임 진행자 톤.

```
타이틀: AI 리터러시 — 위임의 경계

(도입 — 캐논 톤)
딸깍하면 누구나 할 수 있는 AI 시대라고 한다.
누구나 할 수 있다면, 누구인가가 중요하다.

(진행자 톤 — 게임 진입)
무엇을 AI가 해야 하고 무엇은 내가 직접 해야 하는지.
당신은 구별할 수 있을까?

AI 리터러시, 위임의 경계!
상황에 따른 당신의 선택이 결과물의 점수를 바꾼다.
높은 점수, 역량 레벨업!

(게임 진행 — 1·2·3)
1. 한 학기 동안 다섯 가지 상황을 만난다 — 자기소개, 모둠활동,
   어린왕자 독서, 진로 탐색, 학습계획.
2. 각 상황에서 세 번의 선택의 순간이 있다 (큰 방향 → 행동 → 검토).
   어떤 행동을 선택하는지에 따라 결과 점수가 달라진다.
3. 점수가 쌓이며 경험치가 오른다. 경험치를 높이고 역량을 레벨업 하라.

버튼: [게임 시작]
```

##### 11.6 코드 자리

- 신규 함수: `showTitleScreen()` — DOM 생성 + 시작 버튼 핸들러 (tutorialSeen=true → saveGame → showStartScreen)
- 진입점 변경: line 2561 `showStartScreen();` → 분기 호출
- showStartScreen 갱신: `vtag` 자리 또는 별도 위치에 "튜토리얼 다시 보기" 링크 추가

---

#### 12. pending 시스템 + 원 마커 (5/3 세션278 신설, §3.3 짝)

##### 12.1 컨셉

한 시나리오 안의 점수 변화를 "확정 누적"이 아닌 "임시 pending"으로 표시. 학생은 매 선택마다 원 마커로 즉각 피드백 받지만, 비용 효과 계산은 이전 시나리오 끝의 누적값으로 고정. 시나리오 끝에서 pending → 누적 흡수.

**해결하는 문제**:
- 한 시나리오 안 비용 효과가 매 선택마다 변하는 회로(×4 폭주의 root cause) 폐기
- 그러면서도 학생의 선택 피드백은 원 마커로 살림 — 두 시간 축 분리

##### 12.2 gameState 확장

```js
// createInitialState() 안
pending:{delegation:0, knowledge:0}   // 시나리오 시작 0, 끝에서 value에 흡수
```

continueGame guard: `if(!gameState.pending)gameState.pending={delegation:0,knowledge:0};`

##### 12.3 적용 시점 변경

| 함수 | 정정 전 | 정정 후 |
|---|---|---|
| `applyTier1` | `competencies.delegationChoice.value+=delta` | `pending.delegation+=delta` |
| `applyTier2` | 동일 | `pending.delegation+=delta` |
| `applyReview` | `competencies.knowledge.value+=delta` | `pending.knowledge+=delta` |
| `_applyDiscount` | `competencies.*.value` 기준 | 그대로 (`competencies.*.value`만 사용, pending 배제) |

##### 12.4 원 마커 UI (5/3 후속 — 좌우 분할)

- **위치**: 두 트랙(위·도) 게이지 위. pending-dots 컨테이너를 좌우 50/50 분할 (`.pending-dots-neg` + `.pending-dots-pos`). 중앙선이 게이지의 `bipolar-zero`(`left:50%`)와 시각적으로 정렬
- **양수 pending**: 중앙에서 **우측**으로 초록 원 N개 (좌측에서 우측으로 뻗음)
- **음수 pending**: 중앙에서 **좌측**으로 빨강 원 N개 (우측에서 좌측으로 뻗음, `flex-direction:row-reverse`)
- **0**: 양쪽 모두 빈 상태
- **양수 → 음수 전환**: 초록이 깨지는 연출 (0.3s) + 빨강 등장
- **음수 → 양수 전환**: 빨강이 사라지고 초록 등장
- **CSS**: `.pending-dots` 컨테이너 + 좌우 분할 자식(`.pending-dots-neg`, `.pending-dots-pos`), `.pending-dot.positive`/`.negative`, `.pending-dot.breaking` keyframe
- **이유**: 게이지 자체가 좌(음)/우(양) 방향성. 원 마커도 같은 방향성 채택 → 색 + 방향 두 채널로 직관 강화. 한 시나리오 안 pending max ±3이라 좌/우 50% 공간 충분
- **유의**: SPEC 라벨 -4/+8은 점수 max 값(단위당 폭 비대칭)이지 시각 자리 아님. 게이지 zero선 = 시각 50%

##### 12.5 시나리오 끝 흡수

cut6 chain의 첫 단계로 박음 — 카드 reward 직전:

```
[0] 결과 패널 (cut6) — 1.4초
        ↓
[1] pending 흡수 — pending dot이 게이지로 흘러들어가는 애니메이션 (0.8s)
        - value+=pending → 게이지 갱신
        - pending=0 → dot 클리어
        ↓
[2] 카드 reward (도 양수+카드 있을 때)
[3] 레벨업
[4] 자원 충전
```

`absorbPending()` 함수: `competencies.*.value += pending.*` → `pending.* = 0` → setBipolar 갱신 + 마커 클리어 + 흡수 애니메이션 재생. Promise 반환.

##### 12.6 시나리오 시작 reset

`startScenario(scid)`에서 `gameState.pending = {delegation:0, knowledge:0}` reset. 마커 클리어.

---

#### 8. 미정 / 다음 결정

- 4유형 임계값 N (Phase 4 발란스 후, 가안 N=0)
- ~~카드 메시지 메카닉 4안~~ → §7 역량 카드 시스템으로 결정 ✅
- `axisDelta` 트리거 조건 — leafIds 조합 / 누적 점수 임계 / 둘 다 (Phase 5)
- multiplier 0.6 폐지 + raw 재조정 ✅ (5/3 80ff4b5)
- ~~score-display 진행 중 숨김 정책~~ → 폐기 (5/3 e75d4b8)
- ~~yaml tier1에 `delegation`·`knowledge` 필드 추가~~ → selfintro ✅ (5/3 80ff4b5), 나머지 4 시나리오 외부 LLM 분석 후
- 변수명 마이그 (`competencies.delegationChoice` / `knowledge` → `state.score.위` / `도`) — 동작 변화 없음, 우선순위 낮음
- 5 시나리오 → 3 레벨×3 시나리오 = 9 시나리오 확장 ([[요청.26.0503.0955-AI리터러시3x3구조]])
- 위 축(위임 판단력) 측정 가능·객관 기준 전달 방법 (§7.7, 1차 빌드 후 결정)
- 도메인 풀 5 시나리오 라벨 후보 정정 (§7.2 1차 가설 → 백도/피터공 검토)

---

#### 9. 참조

- [[PLAN|PLAN.md]] — 단계별 구현 순서
- [[TASKS|TASKS.md]] — 진행 체크리스트
- [[26.0501 v0.6 기획 결정 요약]] — 이 빌드의 출발점
- `_dev/ai-literacy-delegation-boundary/v05/SPEC.md` — v0.5 기준선
