# SPEC — AI 리터러시: 위임의 경계 v0.1

**최종 업데이트**: 2026-04-25

## 기술 스택

- 단일 `index.html` (HTML + CSS + JS 인라인)
- 바닐라 JavaScript (프레임워크/라이브러리 없음)
- 빌드 도구 없음 — 브라우저에서 직접 열기
- localStorage — 진행 상태 + 이벤트 로그
- 서버 없음 — 클라이언트 전용

## 파일 구조

```
ai-literacy-delegation-boundary/
├── PLAN.md
├── TASKS.md
├── SPEC.md        ← 이 파일
├── DECISIONS.md
└── index.html     ← 프로토타입 본체
```

## 코드 구역 (index.html 내부)

```
1. HTML Layout
2. CSS
3. Configuration
4. Scenario Data
5. Game State
6. Game Engine
7. Storage
8. Event Logger
9. Render Functions
10. Event Handlers
11. Report Generator
12. Debug Panel
13. Initialization
```

각 구역은 주석 블록으로 구분:
```js
// =====================================================
// 3. Configuration
// =====================================================
```

## 상태값 정의

```js
// 설정값 (플테 후 조정 가능)
const CONFIG = {
  initialTime: 60,
  initialEnergy: 50,
  levelThresholds: { 2: 30, 3: 70 },
  storageKey: 'ai-literacy-delegation-boundary-v01',
  eventLogKey: 'ai-literacy-delegation-boundary-v01-events'
};

// 게임 상태
let gameState = {
  currentScenarioIndex: 0,
  time: CONFIG.initialTime,
  energy: CONFIG.initialEnergy,
  totalExperience: 0,
  skills: {
    ownThought: { level: 1, xp: 0 },
    delegateTask: { level: 1, xp: 0 },
    reviewResult: { level: 1, xp: 0 }
  },
  selectedChoiceHistory: [],
  completed: false
};
```

## 스킬 정의

| Key | 표시명 | 색상 |
|-----|--------|------|
| ownThought | 내 생각 | 청색 계열 |
| delegateTask | 맡길 일 | 주황 계열 |
| reviewResult | 다시 보기 | 청록 계열 |

### 레벨업 조건

- Lv.1 → Lv.2: 해당 스킬 XP ≥ 30
- Lv.2 → Lv.3: 해당 스킬 XP ≥ 70

### 레벨 효과

| 스킬 | Lv.2 | Lv.3 |
|------|------|------|
| 내 생각 | 선택 시 totalExperience +2 | 선택 시 energy 소모 2 감소 |
| 맡길 일 | 일부 잠금 선택지 해금 | 선택 시 time 소모 2 감소 |
| 다시 보기 | 선택 시 totalExperience +2 | 선택 시 energy 소모 2 감소 |

## 시나리오 데이터 구조

```js
{
  id: 'string',
  act: 1|2|3,
  title: 'string',
  place: 'string',
  situationText: 'string',
  coreQuestion: 'string',
  perspectiveHint: {
    ownThought: 'string',
    delegateTask: 'string',
    reviewResult: 'string'
  },
  choices: [
    {
      id: 'string',
      title: 'string',
      description: 'string',
      hint: 'string',
      primarySkill: 'ownThought'|'delegateTask'|'reviewResult',
      effects: {
        time: number,     // 음수=소모, 양수=회복
        energy: number,
        totalExperience: number,
        skillXp: { [skillKey]: number }
      },
      feedback: {
        selectedWay: 'string',
        gained: 'string',
        missed: 'string',
        skillNote: 'string'
      },
      requiresSkillLevel: { [skillKey]: number }  // optional
    }
  ]
}
```

## 선택 처리 규칙

1. 선택지 effects 가져오기
2. 현재 스킬 레벨에 따른 보너스 적용
3. time, energy 갱신 (0 미만은 0으로 clamp)
4. totalExperience 갱신
5. 해당 skillXp 누적
6. 레벨업 조건 확인
7. 선택 기록 history에 저장
8. 피드백 화면 표시
9. 레벨업 발생 시 레벨업 모달 표시
10. 다음 시나리오 또는 최종 리포트

## 선택지 해금 규칙

- `requiresSkillLevel`이 있는 선택지: 조건 만족 시에만 선택 가능
- 미충족 시: 화면에 보이되 잠금 상태 + 이유 표시
- 예: "이 선택은 '맡길 일' Lv.2부터 사용할 수 있습니다"

## localStorage 규칙

- 저장 key: `ai-literacy-delegation-boundary-v01`
- 저장 내용: gameState 전체 + 저장 시각
- 시작 시 저장 상태가 있으면 이어하기 버튼 표시
- 초기화 시 저장 상태 삭제 + sessionId 갱신

## 이벤트 로그

### 이벤트 타입

```
session_started, session_continued, scenario_viewed,
choice_selected, scenario_completed, level_up,
final_report_viewed, session_reset
```

### trackEvent() 구조

```js
function trackEvent(type, payload) {
  const event = { type, sessionId, createdAt, stateSnapshot, payload };
  console.log('[AI Literacy]', event);
  saveToLocalLog(event);
  // Future: fetch('/api/events', ...)
}
```

### 로그 저장

- key: `ai-literacy-delegation-boundary-v01-events`
- JSON 배열로 누적
- DebugPanel에서 확인/복사/다운로드/삭제

## DebugPanel 요구사항

### 표시 항목

- currentScenarioIndex, time, energy, totalExperience
- 각 스킬 level/xp
- sessionId, 누적 이벤트 수
- 마지막 이벤트 타입

### 버튼

- 상태 초기화
- 모든 스킬 Lv.2로
- 모든 스킬 Lv.3으로
- 마지막 시나리오로 이동
- localStorage 삭제
- 이벤트 로그 보기/복사/다운로드/삭제

## 최종 리포트 내용

- 사용한/남은 시간
- 사용한/남은 에너지
- 총 경험
- 3 스킬 레벨 + XP
- 가장 자주 선택한 스킬 계열
- 회고형 리포트 문장 (진단형 금지)

## 완료 기준

TASKS.md 참조.
