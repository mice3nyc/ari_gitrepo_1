## SPEC — v0.6 점수 framework

**최종 업데이트**: 2026-05-03 세션275 (코드 framework 1차 진행)
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

raw 비용은 학기 시작 자원(`resourceMaxStart`) 대비 leaf 기여를 명시적으로 짜서 재조정. 가안 분포:

- tier1 raw cost: 0~5 (큰 방향, 가벼움)
- tier2 raw cost: 5~25 (행동, 중간)
- review raw cost: 0~40 (R1=0, R3=무거움)
- 학기 = 5 시나리오 × (tier1 + tier2 + review 한 사이클)
- `resourceMaxStart` = 100 유지 (가안)

> v0.5 career A1R1 raw 100 같은 경우는 실제 발란스 작업에서 재분배.

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

##### 6.3 시나리오 끝 화면 (부분 작동)

현재 `score-display` 요소가 항상 노출되어 v0.5 패턴. 진행 중 숨김 정책 미적용. 토글 위치 후보: `updateStats()` 함수에서 `currentTier` 보고 가시성 토글.

##### 6.4 학기 끝 화면 (이미 작동)

v0.5 Phase 8에서 신설된 자리. line 1998 `showFinalReport`, line 1991 4유형 분류 함수, line 2021 4유형 의미 박스. SPEC v0.6 요구가 이미 충족된 자리.

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

##### 7.2 도메인 풀 (1차 가설)

각 시나리오마다 가능한 역량 카드 후보 풀. leaf 선택에 따라 0~N장 획득.

| 시나리오 | 도메인 풀 (가설) |
|---|---|
| selfintro | 자기지식 / 표현력 / 정리력 |
| groupwork | 협업능력 / 소통능력 / 발표력 |
| eorinwangja | 문해력 / 비판적 읽기 / 공감력 |
| career | 진로탐색 / 자기이해 / 정보분석 |
| studyplan | 학습설계 / 시간관리 / 메타인지 |

> 가설 — 백도/피터공 검토 후 정정.

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
- **카드 표시**: 라벨 + 카운트 그룹화 (같은 라벨 N장 → "문해력 ×3"). 클릭 시 시나리오·leaf 출처 expand
- **빈 상태**: "아직 획득한 카드가 없어요. 시나리오 끝에 카드를 받을 수 있습니다."

##### 7.6 reward 팝업 (획득 시점)

- **트리거**: 시나리오 끝 시점, 도 축 양수 + `competencyCards` 배열 비지 않음
- **연출**: 화면 중앙에 카드 1~N장 등장 (1초 fadein) → 잠시 멈춤 → 우측 탭 버튼 위치로 이동(travel 0.6초) + scale 축소 → 사라짐. 이동 후 탭 버튼에 빨간 점(unread badge).
- **`note` 텍스트**: 카드 등장 시 카드 본문에 표시 ("자기 경험을 직접 고르고 끝까지 확인해서 이후 자기표현 카드와 잘 맞음")
- **복수 카드**: 1초 간격 cascade
- **"적당하게"**: 학생 부담 안 주는 짧은 연출. 스킵 버튼 제공

##### 7.7 위 축(위임 판단력) 표현 — 별도 결정 큐

위 축은 카드로 만들지 않음. 점수 + 게이지로만 표시 (현재 구조 유지). 측정 가능·객관 기준으로 학생에게 전달하는 방법은 후속 결정 자리:
- 옵션 A: 위 축도 카드로 (e.g. "위임 결정 ★", "AI 사용 검토 ★")
- 옵션 B: 시나리오 끝 위 축 결과 메시지 + 누적 그래프 (학기 끝 라벨에서 단계적 노출)
- 옵션 C: 학기 끝 4유형 라벨에만 (지금 그대로)

5/3 결정 시점은 1차 빌드 + 플테 후 → 별도 사이클.

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
