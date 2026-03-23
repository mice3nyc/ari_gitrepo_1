# AI Literacy Web App — SPEC

## Overview

에피소드 1: "내 그림은 어디서부터인가"
- 5단계 분기형 시나리오 웹앱
- 대상: 초중등 학생 (태블릿/노트북)
- 플레이 시간: 15~20분
- 기술: 단일 HTML, 바닐라 JS, 라이브러리 없음

---

## Game Flow Diagram

```
[INTRO] ─── "시작하기" ───▶ [STEP 1: 4지선다]
                                │
                    ┌───────┬───┴───┬───────┐
                    ▼       ▼       ▼       ▼
                   [A]     [B]     [C]     [D]
                    │       │       │       │
                    ▼       ▼       ▼       ▼
              [STEP 2]  [STEP 2]  [STEP 2]  [STEP 2]
              A-1/2/3   B-1/2/3   C-1/2/3   D-1/2/3
                │         │         │         │
                ▼         ▼         ▼         ▼
              [STEP 3]  [STEP 3]  [STEP 3]  [STEP 3]
              일부 분기  B-1 분기  C-1 분기  결과 장면
              결과 장면  a/b/c    a/b/c     (선택 없음)
                │         │         │         │
                └────┬────┴────┬────┘         │
                     ▼         ▼              │
               [STEP 4: 성찰]◄────────────────┘
                     │
                     ▼
               [STEP 5: 프로필]
               레이더 차트 + 유형
```

### STEP 3 분기 상세

| STEP1 | STEP2 | STEP3 |
|-------|-------|-------|
| A | A-1 | 결과 장면 (선택 없음) |
| A | A-2 | 결과 장면 (선택 없음) |
| A | A-3 | 결과 장면 (선택 없음) |
| B | B-1 | 3지선다 (B-1-a/b/c) |
| B | B-2 | 결과 장면 (선택 없음) |
| B | B-3 | 결과 장면 (선택 없음) |
| C | C-1 | 3지선다 (C-1-a/b/c) |
| C | C-2 | 결과 장면 (선택 없음) |
| C | C-3 | 결과 장면 (선택 없음) |
| D | D-1 | 결과 장면 (선택 없음) |
| D | D-2 | 결과 장면 (선택 없음) |
| D | D-3 | 결과 장면 (선택 없음) |

---

## Screen-by-Screen UI

### INTRO
- 흰 배경, 중앙 정렬
- 텍스트가 한 줄씩 페이드인 (typewriter 효과 아님, 라인별 fade)
- 하단에 "시작하기" 버튼 (텍스트 모두 표시된 후 등장)

### STEP 1~3: 선택 화면
- 상단: 스텝 인디케이터 (● ○ ○ ○ ○)
- 중앙: 상황 텍스트 (블록쿼트 스타일, 좌측 보더)
- 하단: 선택지 카드 (세로 배치)
  - 카드: 흰 배경, 얇은 보더, hover시 살짝 그림자
  - 선택 시 카드 highlight → 0.5초 후 다음 스텝 전환

### STEP 3: 결과 장면 (선택 없음인 경우)
- 상황 텍스트만 표시
- 하단에 "다음" 버튼

### STEP 4: 성찰
- 텍스트가 천천히 나타남 (fade-in)
- 볼드 텍스트 강조
- "다음" 버튼

### STEP 5: 프로필
- 상단: 프로필 유형 이름 (큰 글자)
- 중앙: SVG 레이더 차트 (6각형)
- 하단: 프로필 설명 텍스트
- 최하단: 마무리 메시지 + "다시 하기" 버튼

---

## Data Structure

```javascript
const SCENARIO = {
  intro: {
    lines: ["2026년 어느 목요일.", "미술 시간 종이 울렸다.", ...],
    bold: ["다음 주까지 '나의 하루'를 주제로 포스터 한 장을 만들어 오세요.", ...]
  },

  step1: {
    situation: { lines: [...], bold: [...] },
    choices: [
      {
        id: "A",
        label: "종이를 집는다.",
        desc: "일단 내 손으로 시작해보자.",
        stats: { thinking: 2, creativity: 2, tech: 0, adaptability: 0, confidence: 1, curiosity: 0 }
      },
      // B, C, D...
    ]
  },

  step2: {
    A: {
      situation: { lines: [...], bold: [...] },
      choices: [
        {
          id: "A-1",
          label: "계속 그린다.",
          desc: "못생겨도 내 그림이다.",
          stats: { ... }
        },
        // A-2, A-3...
      ]
    },
    // B, C, D...
  },

  step3: {
    // 선택이 있는 경로
    "B-1": {
      situation: { lines: [...], bold: [...] },
      choices: [
        { id: "B-1-a", label: "...", stats: { ... } },
        // b, c
      ]
    },
    "C-1": { ... },

    // 선택 없는 경로 (결과 장면만)
    "A-1": {
      situation: { lines: [...], bold: [...] },
      choices: null  // null = 결과 장면만, "다음" 버튼
    },
    // ...
  },

  step4: {
    lines: [...],
    bold: [...]
  },

  profiles: {
    // 경로 패턴 → 프로필 유형 매핑은 역량 점수로 판정
  }
};
```

---

## Stat Calculation

### 6 Axes

| Key | 한글 | 설명 |
|-----|------|------|
| thinking | 사고력 | 스스로 판단하는 능력 |
| creativity | 창의력 | 독창적 표현 능력 |
| tech | 기술친숙도 | AI/디지털 도구 활용도 |
| adaptability | 적응력 | 상황 변화 대응 |
| confidence | 자신감 | 결과물에 대한 확신 |
| curiosity | 호기심 | 탐구하려는 성향 |

### Accumulation

각 선택마다 stats 객체의 값을 누적 합산.
기본값: 각 축 0점에서 시작.
최소 0, 최대 10으로 클램프.

```javascript
function addStats(current, delta) {
  for (const key in delta) {
    current[key] = Math.max(0, Math.min(10, (current[key] || 0) + delta[key]));
  }
}
```

### STEP별 역량 변화표

#### STEP 1
| 선택 | 사고력 | 창의력 | 기술친숙도 | 적응력 | 자신감 | 호기심 |
|------|--------|--------|------------|--------|--------|--------|
| A | +2 | +2 | 0 | 0 | +1 | 0 |
| B | 0 | -1 | +2 | +2 | +1 | 0 |
| C | +1 | +1 | +1 | +1 | 0 | +1 |
| D | 0 | 0 | +1 | +1 | -1 | +1 |

#### STEP 2
| 선택 | 사고력 | 창의력 | 기술친숙도 | 적응력 | 자신감 | 호기심 |
|------|--------|--------|------------|--------|--------|--------|
| A-1 | +2 | +2 | 0 | 0 | +2 | 0 |
| A-2 | +1 | +1 | +1 | +1 | 0 | +1 |
| A-3 | 0 | 0 | 0 | -1 | -1 | +1 |
| B-1 | -1 | -1 | +1 | +1 | +1 | -1 |
| B-2 | 0 | +1 | +2 | +1 | 0 | +1 |
| B-3 | +2 | +2 | 0 | +1 | +1 | +1 |
| C-1 | +1 | 0 | +1 | +1 | +1 | 0 |
| C-2 | +2 | +2 | 0 | +1 | +2 | 0 |
| C-3 | 0 | 0 | +2 | +1 | -1 | +2 |
| D-1 | -1 | -1 | +2 | +1 | +1 | -1 |
| D-2 | +1 | +2 | +1 | +1 | +1 | 0 |
| D-3 | +1 | +1 | -1 | 0 | 0 | +2 |

#### STEP 3 (선택이 있는 경로만)
| 선택 | 사고력 | 창의력 | 기술친숙도 | 적응력 | 자신감 | 호기심 |
|------|--------|--------|------------|--------|--------|--------|
| B-1-a | +1 | 0 | 0 | 0 | +2 | 0 |
| B-1-b | 0 | 0 | 0 | +1 | 0 | 0 |
| B-1-c | -1 | 0 | 0 | 0 | -1 | 0 |
| C-1-a | +1 | 0 | 0 | 0 | +2 | 0 |
| C-1-b | -1 | 0 | 0 | 0 | +1 | -1 |
| C-1-c | +2 | +1 | +1 | +1 | +1 | +1 |

---

## Profile Type Determination

최종 누적 점수 기준으로 프로필 유형 판정.

### 판정 로직

1. 6축 점수의 패턴을 분석
2. 지배적인 축(가장 높은 점수) 기반 1차 분류
3. 경로 이력과 결합하여 최종 유형 결정

### 프로필 유형 (4종)

| 유형 | 조건 | 설명 |
|------|------|------|
| 손으로 시작하는 사람 | thinking + creativity >= 12, tech <= 4 | 직접 해보는 사람 |
| 도구를 쓰되 자기 것으로 만드는 사람 | creativity >= 6, tech >= 4, confidence >= 5 | 도구와 자기 사이 균형 |
| 빠르게 끝내고 싶은 사람 | tech + adaptability >= 12, creativity <= 4 | 효율 중심 |
| 아직 찾는 중인 사람 | curiosity가 최고축, confidence <= 4 | 기준을 찾는 중 |

### 판정 함수

```javascript
function determineProfile(stats) {
  const { thinking, creativity, tech, adaptability, confidence, curiosity } = stats;

  if (thinking + creativity >= 12 && tech <= 4) {
    return "손으로 시작하는 사람";
  }
  if (creativity >= 6 && tech >= 4 && confidence >= 5) {
    return "도구를 쓰되 자기 것으로 만드는 사람";
  }
  if (tech + adaptability >= 12 && creativity <= 4) {
    return "빠르게 끝내고 싶은 사람";
  }
  if (curiosity >= Math.max(thinking, creativity, tech, adaptability, confidence) && confidence <= 4) {
    return "아직 찾는 중인 사람";
  }

  // fallback: 가장 높은 축 기반
  const max = Math.max(thinking, creativity, tech, adaptability, confidence, curiosity);
  if (max === thinking || max === creativity) return "손으로 시작하는 사람";
  if (max === tech || max === adaptability) return "빠르게 끝내고 싶은 사람";
  if (max === curiosity) return "아직 찾는 중인 사람";
  return "도구를 쓰되 자기 것으로 만드는 사람";
}
```

---

## Radar Chart Implementation

### 방식: SVG

6각형 레이더 차트를 SVG로 직접 렌더링.

### 구조

```
<svg viewBox="0 0 300 300">
  <!-- 배경 격자: 10%, 20%, ... 100% 동심 육각형 -->
  <!-- 축 라인: 중심에서 꼭짓점까지 -->
  <!-- 축 라벨: 각 꼭짓점 바깥 -->
  <!-- 데이터 다각형: 6개 데이터 포인트 연결, 반투명 채움 -->
  <!-- 데이터 포인트: 각 꼭짓점에 작은 원 -->
</svg>
```

### 좌표 계산

```javascript
function polarToCartesian(cx, cy, radius, angleDeg) {
  const rad = (angleDeg - 90) * Math.PI / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad)
  };
}

// 6축 → 60도 간격, 시작 각도 -90 (12시 방향)
const axes = ['thinking', 'creativity', 'tech', 'adaptability', 'confidence', 'curiosity'];
const labels = ['사고력', '창의력', '기술친숙도', '적응력', '자신감', '호기심'];
const angleStep = 360 / 6; // 60도
```

### 스타일

- 격자: #e0e0e0, 1px
- 데이터 영역: rgba(0, 120, 255, 0.15) 채움, #0078ff 테두리
- 데이터 포인트: #0078ff 원, 반지름 4px
- 라벨: #333, 14px

---

## Transitions & Animation

- 화면 전환: CSS opacity + transform (fade + 살짝 위로 슬라이드)
- 텍스트 라인별 fade-in: staggered delay (0.3초 간격)
- 선택 카드 클릭: 선택된 카드 highlight (배경색 변경) → 0.8초 후 전환
- 레이더 차트: 데이터 다각형이 중심에서 확장되는 애니메이션

---

## Responsive Design

- max-width: 640px (태블릿/모바일 최적)
- 카드 버튼: min-height 72px, padding 20px (터치 친화)
- 폰트: system-ui, 본문 17px, 제목 24px
- 여백: 충분한 spacing (gap 16px)
