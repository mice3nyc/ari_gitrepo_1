# SPEC — AI 리터러시: 위임의 경계 v0.3

**최종 업데이트**: 2026-04-27 (v0.2 → v0.3 트리 구조 정정)

> [!warning] v0.3 방향 전환
> v0.1/v0.2는 평면 6시나리오 + 판단축 3개 + 자원 3개 구조. v0.3 = 트리 76노드 × 5시나리오 + 두 역량 + 점수 5등급 구조로 전면 재설계.
>
> 결정 기록: DECISIONS.md (4/27 회의 결정 6개)
> 회의록: [[26.0427 위임의경계 — 시나리오 패키지 회의 흐름]]

## 기술 스택 (v0.2 보존)

- 단일 `index.html` (HTML + CSS + JS 인라인)
- 바닐라 JavaScript
- 빌드 도구 없음
- localStorage — 진행 상태 + 이벤트 로그
- 서버 없음

## 파일 구조

```
ai-literacy-delegation-boundary/
├── PLAN.md
├── TASKS.md
├── SPEC.md        ← 이 파일
├── DECISIONS.md
├── IMAGE-PROMPTS.md
├── images/
└── index.html     ← 프로토타입 본체
```

## 시나리오 데이터 구조 (v0.3 정정)

```js
{
  id: 'string',                       // 'eorinwangja' 등
  category: 1|2|3|4|5,                // 5개 항목 분류
  title: 'string',                    // '어린왕자 독후감'
  
  situation: {
    text: 'string',                   // "어린왕자 독후감을 100자로 써야 하는데..."
    image: 'string'                   // 컷 1 이미지 경로
  },
  
  // 1차 선택지 (3개) — 위임 선택력 1
  tier1: [
    { id: 'A', label: 'string', desc: 'string' },  // "책을 읽고 쓴다"
    { id: 'B', label: 'string', desc: 'string' },  // "AI에게 맡긴다"
    { id: 'C', label: 'string', desc: 'string' }   // "안 읽고 직접 쓴다"
  ],
  
  // 2차 선택지 (각 1차마다 3개 = 총 9) — 위임 선택력 2
  tier2: {
    A: [
      { id: 'A1', label: 'string', desc: 'string' },  // "전체 정독 후 본인 감상"
      { id: 'A2', label: 'string', desc: 'string' },
      { id: 'A3', label: 'string', desc: 'string' }
    ],
    B: [...],
    C: [...]
  },
  
  // 결과 (9개) — 2차 선택지의 raw 결과물
  results: {
    A1: {
      text: 'string',                 // 100자 독후감 본문
      basePoint: number,              // 기본 점수 (검토 전)
      hiddenIssues: ['string', ...]   // R2/R3에서 발견 가능한 약점 목록
    },
    A2: {...}, ..., C3: {...}
  },
  
  // 검토 단계 — 모든 결과 공통 3개
  reviews: [
    { id: 'R1', label: '그대로 제출', deltaPoint: 0,  detectableIssues: 0 },
    { id: 'R2', label: '한 번 읽기',  deltaPoint: function(r){...}, detectableIssues: 'explicit' },
    { id: 'R3', label: '크로스체크',  deltaPoint: function(r){...}, detectableIssues: 'all' }
  ],
  
  // 최종 결과 (각 27 leaf 경로마다)
  finals: {
    'A1R1': { score: number, grade: 'S'|'A'|'B'|'C'|'D', item: 'string', awarenessNote: 'string' },
    'A1R2': {...}, ..., 'C3R3': {...}
  },
  
  // 학맞통 카드 결합 슬롯 (옵션)
  cardSlots: {
    'A1R2': { boostCard: 'AI 환각 식별', bonusPoint: 20 },
    ...
  }
}
```

## 두 역량 게이지 (v0.3)

```js
let gameState = {
  currentScenarioId: 'string',
  currentTier: 1|2|'review'|'final',
  selectedTier1: 'A'|'B'|'C'|null,
  selectedTier2: 'A1'..'C3'|null,
  selectedReview: 'R1'|'R2'|'R3'|null,
  
  competencies: {
    delegationChoice: { value: 0, history: [] },  // 위임 선택력 — 1·2차 선택 누적
    knowledge: { value: 0, history: [] }          // 지식 — 검토 단계 누적
  },
  
  score: 0,                          // 현 시나리오 점수
  totalScore: 0,                     // 전체 누적
  itemsCollected: [],                // 획득 아이템 목록
  cardsHeld: [],                     // 학맞통 카드 보유
  
  scenarioHistory: [
    { scenarioId, tier1, tier2, review, finalScore, grade, item }
  ],
  completed: false
};
```

### 역량 변동 5단계

각 선택의 영향:
- ↑↑ = +2
- ↑  = +1
- △  = 0
- ↓  = -1
- ↓↓ = -2

시트 27행 데이터에서 읽음.

## 점수 산정 로직

```js
function calculateFinalScore(result, review) {
  const base = result.basePoint;
  const detected = countDetectedIssues(result.hiddenIssues, review);
  const cardBonus = getCardBonus(scenarioId, leafPath, gameState.cardsHeld);
  return base + detected * 10 + cardBonus;
}

function getGrade(score) {
  if (score >= 90) return 'S';
  if (score >= 70) return 'A';
  if (score >= 50) return 'B';
  if (score >= 30) return 'C';
  return 'D';
}
```

## 점수 5등급 + 아이템 풀

| 등급 | 점수대 | 아이템 (시나리오별 톤) |
|---|---|---|
| S | 90~100 | 「깊은 독서가」급 카드 |
| A | 70~89 | 「검증의 눈」급 카드 |
| B | 50~69 | 「반쪽 독후감」급 카드 |
| C | 30~49 | 「위태로운 위임」급 카드 |
| D | 0~29 | 아이템 없음, 자각 멘트만 |

아이템 = 학생 보유 카드 풀에 추가 (다음 시나리오 검토 단계에서 사용 가능).

## 학맞통 카드 결합 로직

### 카드 풀 (외부 자원, 70장)

7주제 × 10장:
- AI 환각 식별
- 검증 방법
- 개인정보
- 위임 판단
- 사용법
- AI 한계
- 비판적 사고

### 카드 획득

- 시나리오 시작 전 학맞통 미니게임에서 획득 (Pair 자음 빈칸 풀이)
- 시나리오 결과 아이템으로도 획득

### 카드 사용

- 시나리오 검토 단계에서 자동 적용
- 시트 `cardSlots`에 정의된 (경로 × 카드) 조합 해당 시 결과 점수 +20

## 6컷 화면 흐름

| 컷 | 화면 | 게임 상태 변화 |
|---|---|---|
| 1 | 상황 제시 | currentTier = 1 진입 |
| 2 | 1차 선택 (A·B·C 한 화면) | selectedTier1 결정 |
| 3 | 2차 선택 (선택된 1차의 3개) | selectedTier2 결정 |
| 4 | 결과 표시 (raw 결과물) | results[selectedTier2] 표시 |
| 5 | 검토 선택 (R1·R2·R3) | selectedReview 결정 — **인과 자각의 핵심 컷** |
| 6 | 최종 점수 + 아이템 | finals[leafPath] 표시 + itemsCollected 추가 |

각 컷 = 별도 이미지 자산. 시나리오당 6컷 × 5시나리오 = **30컷 이미지** 작업 필요.

## 시나리오 진행 흐름

```
시작
  → 시나리오 1 (어린왕자) 6컷 진행
    → 컷 1·2·3 (1차+2차 선택, 위임 선택력 누적)
    → 컷 4 결과 (raw)
    → 컷 5 검토 (지식 역량 누적)
    → 컷 6 최종 (점수+아이템)
  → 시나리오 2 (달 착륙) 6컷
  → ...
  → 시나리오 5 (윤리)
  → 최종 리포트 (두 역량 합산 + 모은 아이템 + 학습 메시지)

전체 시간: 50분
```

## 코드 구역 (index.html 내부) — v0.2 골격 보존

```
1. HTML Layout
2. CSS
3. Configuration
4. Scenario Data (v0.3 트리 구조)
5. Game State (v0.3 두 역량)
6. Game Engine (v0.3 트리 진행 로직)
7. Storage
8. Event Logger
9. Render Functions (v0.3 6컷 흐름)
10. Event Handlers
11. Report Generator (v0.3 두 역량 + 아이템)
12. Debug Panel
13. Initialization
```

v0.2의 1·2·7·8·12·13 구역은 거의 그대로 보존. 4·5·6·9·10·11은 v0.3 구조로 재작성.

## CONFIG (v0.3)

```js
const CONFIG = {
  storageKey: 'ai-literacy-delegation-boundary-v03',
  eventLogKey: 'ai-literacy-delegation-boundary-v03-events',
  
  scenarios: ['eorinwangja', 'moonLanding', 'studentNewspaper', 'friendDispute', 'privacyEthics'],
  
  pointThresholds: { S: 90, A: 70, B: 50, C: 30 },
  
  cardBoost: 20,                     // 학맞통 카드 적용 시 점수 +N
  detectedIssueBoost: 10,            // 검토에서 발견 1건당 점수 +N
  
  totalPlayTime: 50 * 60 * 1000,     // 50분 (참고용)
  scenarioTimeBudget: {
    eorinwangja: 12 * 60 * 1000,
    moonLanding: 8 * 60 * 1000,
    // ...
  }
};
```

## localStorage 규칙 (v0.2 보존, key만 v03으로)

- 저장 key: `ai-literacy-delegation-boundary-v03`
- 저장 내용: gameState 전체 + 저장 시각
- 시작 시 저장 상태가 있으면 이어하기 버튼 표시
- 초기화 시 저장 상태 삭제 + sessionId 갱신

## 이벤트 로그 (v0.3 추가 타입)

### 이벤트 타입 (v0.3 추가)

```
session_started, session_continued,
scenario_viewed,
tier1_selected, tier2_selected, review_selected,    ← v0.3 새로움
result_viewed, final_viewed,                         ← v0.3 새로움
card_acquired, card_used,                            ← v0.3 새로움
scenario_completed,
final_report_viewed, session_reset
```

### trackEvent() 구조 (v0.2 보존)

```js
function trackEvent(type, payload) {
  const event = { type, sessionId, createdAt, stateSnapshot, payload };
  console.log('[AI Literacy v0.3]', event);
  saveToLocalLog(event);
}
```

## DebugPanel (v0.3 확장)

### 표시 항목

- currentScenarioId, currentTier
- selectedTier1, selectedTier2, selectedReview
- 두 역량 (delegationChoice / knowledge) value + history
- score, totalScore, grade
- itemsCollected, cardsHeld
- sessionId, 누적 이벤트 수

### 버튼

- 상태 초기화
- 시나리오 점프 (1~5)
- 두 역량 임의 설정
- 카드 임의 추가
- localStorage 삭제
- 이벤트 로그 보기/복사/다운로드/삭제

## 최종 리포트 (v0.3)

- 5시나리오 진행 요약 (각 점수, 등급, 선택 경로)
- 두 역량 누적 합산 (위임 선택력 / 지식 차트)
- 획득 아이템 목록
- 사용한 학맞통 카드 목록
- 자각 멘트 모음 (가장 인상 깊은 D등급 자각 강조)
- 회고형 리포트 문장 (진단형 금지, v0.2 원칙 보존)

## 시나리오 본문 데이터 출처 (v0.3 신규)

각 시나리오는 ChatGPT 위임으로 작성:
- 시트 27행 (분기 데이터)
- 결과 텍스트 9개 (100자 raw 본문)
- 검토 보완 18개 (R2·R3 발견 사항)
- 자각 멘트 27개
- 아이템 풀 5등급

위치: `Assets/incoming/AI리터러시/gpt_시나리오_*_v*.md`
완료 후 → JSON 변환 (`scenarios/*.json`) → index.html에 import

## mermaid 자산 (v0.3 신규)

각 시나리오마다 2장:
- 추상 트리 (단계만 표시)
- 1경로 예시 (한 경로 풀 본문)

위치 (이중 저장):
- 옵시디언 노트 §"mermaid" 코드 블록
- `_dev/apps/mermaid-lab/diagrams/scenario-{id}-abstract.mmd` + `scenario-{id}-path-{XXR}.mmd`
- `_dev/apps/mermaid-lab/diagrams/index.json` 엔트리 추가

## 완료 기준

TASKS.md 참조.

## 보존된 v0.2 자산

- HTML/CSS 골격 (B&W 미니멀, 패널 누적, Paperlogy)
- 게임 엔진 코드 섹션 1·2·7·8·12·13
- 스탯바 시각 (게이지 변화, +/- pop 애니메이션)
- 선택지 시각 연결 (말풍선 커넥터)
- localStorage + 이벤트 로그 + DebugPanel
- GitHub Pages 배포 인프라

## 폐기되는 v0.2 자산

- 6시나리오 데이터 (5시나리오로 재작성)
- 판단축 3개 (두 역량으로 통합)
- 평면 choices 배열 (트리 구조로 재작성)
- 잠금 선택지 메카닉 (학맞통 카드 결합으로 대체)
- 3컷 이미지 (6컷으로 확장)

## 유보 — 결정 안 됨 (재도입 검토 중)

- **자원 3개 (시간/에너지/경험)** — 4/27 회의 결정 6개에 자원 폐기 명시 없음. 피터공: "그것이 선택 기준이 될 수 있다." 자원이 학생의 위임 판단 동기로 작용 가능 (시간 부족 → AI 위임 등). v0.3 첫 빌드(2026-04-28)는 자원 시스템 없이 진행하되 재도입/변형 형태 별도 결정 시점 보유.
