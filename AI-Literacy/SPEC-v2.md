# AI Literacy v2 — Development Spec

> **에피소드 1: "내 그림은 어디서부터인가" v2**
> 캐릭터 선택 + 메신저 기반 분기 시나리오 웹앱
> author: 아리공 · created: 2026-03-23

---

## Overview

- **대상**: 초중등 학생 (태블릿/PC 기본, 모바일 반응형)
- **플레이 시간**: 15~20분
- **기술**: 단일 HTML, 바닐라 JS, 프레임워크 없음
- **기획서**: `current_notes/26.0323 AI 리터러시 v2 — 기획서.md`
- **v1 코드**: 같은 폴더 `index.html`, `SPEC.md`

---

## Screen Architecture

```
┌─────────────────────────────────────────────────┐
│                 TITLE SCREEN                     │
│           게임 이름 + "시작하기"                    │
└────────────────────┬────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────┐
│            CHARACTER SELECT SCREEN               │
│     서연 / 하준 / 민지 / 도윤 (4장 카드)            │
└────────────────────┬────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────┐
│              MESSENGER SCREEN                    │
│  ┌─────────────────────────────────────┐        │
│  │ 상단: 상대 이름 + 프로필 아바타       │        │
│  │ 중앙: 채팅 버블 (스크롤 영역)         │        │
│  │ 하단: 선택지 답장 버튼               │        │
│  └─────────────────────────────────────┘        │
│          ↕ 장면 전환 시 TRANSITION               │
└────────────────────┬────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────┐
│            CARD COLLECTION SCREEN                │
│       지금까지 모은 선택 카드 그리드 보기            │
└────────────────────┬────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────┐
│             PROFILE RESULT SCREEN                │
│  SNS 카드 + 레이더 차트 + 스탯 + 카드 목록         │
│  "다시 해보기" / "다른 캐릭터로"                    │
└─────────────────────────────────────────────────┘
```

### 화면별 상세

#### Title Screen
- 흰 배경, 중앙 정렬
- 게임 타이틀: "내 그림은 어디서부터인가"
- 서브타이틀: "AI 시대, 나는 어떤 선택을 하는 사람일까?"
- "시작하기" 버튼 (fade-in 등장)

#### Character Select Screen
- 4장의 캐릭터 카드가 가로 배치 (태블릿), 2x2 그리드 (모바일)
- 각 카드: 아바타 아이콘 + 이름 + 한 줄 소개 + 특성 태그
  - 서연: "새 앱은 나오면 바로 깔아야지" / `#기술친화` `#효율`
  - 하준: "쉬는 시간 낙서가 제일 좋아" / `#그림` `#자존감`
  - 민지: "숙제는 빨리 끝내는 게 장땡" / `#솔직` `#편의`
  - 도윤: "뭘 해야 할지 잘 모르겠어..." / `#신중` `#불안`
- hover/tap: 카드 살짝 떠오름 (translateY -4px + shadow)
- 선택 시: 선택된 카드 확대 + 나머지 fade → 메신저로 전환

#### Messenger Screen
- **폰 프레임**: 태블릿/PC 화면 안에 스마트폰 모양 프레임
  - 고정 비율: 9:16 (또는 9:19.5)
  - 상단 노치/상태바 영역 (시각적 장식)
  - 하단 홈 인디케이터 바
- **상단 헤더**: 상대 프로필 아바타 + 이름 + 뒤로가기 아이콘 (장식)
- **채팅 영역** (중앙, 스크롤):
  - 받은 메시지: 왼쪽 정렬, 회색 배경, 둥근 모서리
  - 보낸 메시지 (내 선택): 오른쪽 정렬, 파란 배경, 흰 텍스트
  - 프로필 아바타: 받은 메시지 왼쪽에 작은 원형
  - 시간 표시: 버블 아래 작은 텍스트 (오후 4:32)
  - 읽음 표시: 보낸 메시지 아래 "읽음" 텍스트
- **선택지 영역** (하단):
  - 답장 선택지 2~4개, 하단에서 슬라이드업
  - 각 선택지: 카드형 버튼 (흰 배경, 보더, 터치 영역 48px+)
  - 탭하면: 선택지 영역 사라짐 → 내 답장 버블로 올라감 → 카드 획득 팝업

#### Transition Screen
- 장면 전환 시 표시
- 중앙: 장소 아이콘 + 한 줄 텍스트
  - "🏠 집, 책상 앞" → "📚 다음 날, 미술 시간" → "🪞 돌아보기"
- fade-in → 1.5초 유지 → fade-out → 다음 장면
- 상단: 단계 진행 인디케이터 (● ● ○ ○ ○)

#### Card Collection Screen
- "내가 모은 카드" 타이틀
- 카드 그리드: 2~3열
- 각 카드: 아이콘 + 한 줄 라벨 + 획득 장면 표시
  - 예: 🎨 "못생겨도 내 그림이다" — STEP 1
  - 예: 💬 "솔직하게 말했다" — STEP 3
- 빈 카드 슬롯: 아직 안 간 경로의 카드 (물음표 아이콘)
- "계속하기" 버튼 → 메신저로 복귀

#### Profile Result Screen
- **SNS 공유 카드** 느낌의 레이아웃:
  - 상단: 캐릭터 아바타 + 프로필 유형 이름 (큰 글자)
  - 중단: SVG 레이더 차트 (6축)
  - 하단 상: 6축 스탯 바 (가로 막대 그래프, 각 축 라벨 + 수치)
  - 하단 하: 모은 선택 카드 아이콘 나열 (작은 뱃지)
- 최하단 버튼:
  - "다시 해보기" (같은 캐릭터, 처음부터)
  - "다른 캐릭터로 해보기" (캐릭터 선택으로)

---

## Data Structure

### 시나리오 JSON 설계

```javascript
const CHARACTERS = {
  suyeon: {
    id: "suyeon",
    name: "서연",
    avatar: "👩‍💻",    // CSS로 렌더링, 이미지 파일 불필요
    tagline: "새 앱은 나오면 바로 깔아야지",
    tags: ["기술친화", "효율"],
    color: "#4A90D9"   // 캐릭터 테마 컬러
  },
  hajun: {
    id: "hajun",
    name: "하준",
    avatar: "🎨",
    tagline: "쉬는 시간 낙서가 제일 좋아",
    tags: ["그림", "자존감"],
    color: "#E8913A"
  },
  minji: {
    id: "minji",
    name: "민지",
    avatar: "😎",
    tagline: "숙제는 빨리 끝내는 게 장땡",
    tags: ["솔직", "편의"],
    color: "#50B87A"
  },
  doyun: {
    id: "doyun",
    name: "도윤",
    avatar: "🤔",
    tagline: "뭘 해야 할지 잘 모르겠어...",
    tags: ["신중", "불안"],
    color: "#9B7DC8"
  }
};

const SCENARIO = {
  // 캐릭터별 대화 트리
  suyeon: {
    step1: {
      scene: "home",
      sceneLabel: "집, 책상 앞",
      messages: [
        { from: "jimin", text: "야 나 벌써 했어 ㅋㅋ AI로 5분 컷", delay: 800 },
        { from: "jimin", type: "image", text: "[AI가 그린 포스터 이미지]", delay: 1200 },
        { from: "jimin", text: "이거 봐 대박이지?? 😆", delay: 600 },
        { from: "system", text: "지민이의 포스터는 꽤 멋지다. 근데... 나도 해봤는데.", delay: 1000 }
      ],
      choices: [
        {
          id: "suyeon-1A",
          text: "ㅋㅋ 나도 했어 근데 좀 아쉬운데",
          card: { icon: "🔍", label: "만족 못 해서 더 파본다" },
          stats: { thinking: 2, creativity: 1, tech: 1, adaptability: 0, confidence: 1, curiosity: 1 }
        },
        {
          id: "suyeon-1B",
          text: "오 어떤 거 썼어? 나도 해볼래",
          card: { icon: "⚡", label: "효율적으로 빨리 끝낸다" },
          stats: { thinking: 0, creativity: -1, tech: 2, adaptability: 2, confidence: 1, curiosity: 0 }
        },
        {
          id: "suyeon-1C",
          text: "근데 이거 내 그림은 아니잖아",
          card: { icon: "🤨", label: "뭔가 찝찝하다" },
          stats: { thinking: 2, creativity: 2, tech: 0, adaptability: 0, confidence: 0, curiosity: 1 }
        }
      ]
    },
    step2: {
      // 이전 선택 ID에 따라 다른 대화 트리
      "suyeon-1A": {
        scene: "desk",
        sceneLabel: "30분 뒤, 책상 앞",
        messages: [
          { from: "narration", text: "AI가 만들어준 건 예쁜데, 내 느낌이 아니다.", delay: 800 },
          { from: "narration", text: "프롬프트를 바꿔볼까, 아니면...", delay: 600 }
        ],
        choices: [
          {
            id: "suyeon-2A1",
            text: "프롬프트를 10번 더 바꿔본다",
            card: { icon: "🔧", label: "도구를 내 방식대로" },
            stats: { thinking: 1, creativity: 1, tech: 2, adaptability: 1, confidence: 1, curiosity: 0 }
          },
          // ... 추가 선택지
        ]
      },
      // ... 다른 분기
    },
    // step3, step4 동일 구조
  },
  // hajun, minji, doyun 동일 패턴
};

// 대화 참여자 정의
const SPEAKERS = {
  jimin: { name: "지민", avatar: "😄", side: "left" },
  teacher: { name: "선생님", avatar: "👨‍🏫", side: "left" },
  ai: { name: "AI 도우미", avatar: "🤖", side: "left" },
  narration: { name: null, avatar: null, side: "center" },  // 내레이션 (중앙 텍스트)
  system: { name: null, avatar: null, side: "center" },     // 상황 설명
  player: { name: "나", avatar: null, side: "right" }        // 플레이어 선택
};
```

### 선택 카드 데이터

```javascript
// 카드는 choice 객체 안에 포함
// choice.card = { icon: "🎨", label: "못생겨도 내 그림이다" }

// 수집된 카드 저장
const state = {
  character: null,          // 선택된 캐릭터 ID
  currentStep: "step1",     // 현재 단계
  currentBranch: null,      // 현재 분기 ID
  cards: [],                // 수집된 카드 배열 [{ icon, label, step }]
  stats: {                  // 누적 역량
    thinking: 0,
    creativity: 0,
    tech: 0,
    adaptability: 0,
    confidence: 0,
    curiosity: 0
  },
  choiceHistory: []         // 선택 ID 이력
};
```

### 프로필 유형 판정

```javascript
const PROFILES = {
  handmaker: {
    name: "직접 해보는 사람",
    desc: "결과가 완벽하지 않아도, 과정에 내가 들어가는 게 중요한 사람.",
    condition: (s) => s.thinking + s.creativity >= 10 && s.tech <= 5
  },
  toolmaker: {
    name: "도구와 함께 만드는 사람",
    desc: "AI를 쓰되, 내 것으로 만드는 방법을 찾는 사람.",
    condition: (s) => s.creativity >= 5 && s.tech >= 4 && s.confidence >= 4
  },
  speedrunner: {
    name: "빠르게 끝내는 사람",
    desc: "효율을 중요하게 생각하고, 도구를 적극적으로 활용하는 사람.",
    condition: (s) => s.tech + s.adaptability >= 10 && s.creativity <= 5
  },
  explorer: {
    name: "아직 찾는 사람",
    desc: "정해진 답 없이 여러 가능성을 탐색하고 있는 사람.",
    condition: (s) => s.curiosity >= Math.max(s.thinking, s.creativity, s.tech, s.adaptability, s.confidence)
  }
};

function determineProfile(stats) {
  for (const key of ['handmaker', 'toolmaker', 'speedrunner', 'explorer']) {
    if (PROFILES[key].condition(stats)) return PROFILES[key];
  }
  // fallback: 최고축 기반
  const entries = Object.entries(stats);
  entries.sort((a, b) => b[1] - a[1]);
  const topKey = entries[0][0];
  if (topKey === 'thinking' || topKey === 'creativity') return PROFILES.handmaker;
  if (topKey === 'tech' || topKey === 'adaptability') return PROFILES.speedrunner;
  if (topKey === 'curiosity') return PROFILES.explorer;
  return PROFILES.toolmaker;
}
```

---

## CSS Design System

### 전체 변수

```css
:root {
  /* 색상 */
  --color-bg: #ffffff;
  --color-text: #1a1a1a;
  --color-text-light: #888;
  --color-bubble-mine: #3B82F6;       /* 내 말풍선: 파란 */
  --color-bubble-mine-text: #ffffff;
  --color-bubble-other: #F1F1F1;      /* 상대 말풍선: 밝은 회색 */
  --color-bubble-other-text: #1a1a1a;
  --color-narration: #666;            /* 내레이션 텍스트 */
  --color-card-bg: #FAFAFA;
  --color-card-border: #E5E5E5;
  --color-card-earned: #F59E0B;       /* 카드 획득 골드 */
  --color-accent: #3B82F6;

  /* 레이더 차트 */
  --chart-grid: #E5E7EB;
  --chart-fill: rgba(59, 130, 246, 0.15);
  --chart-stroke: #3B82F6;
  --chart-point: #3B82F6;

  /* 간격 */
  --radius-sm: 8px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --radius-full: 9999px;

  /* 폰트 */
  --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans KR", sans-serif;
  --font-size-sm: 13px;
  --font-size-base: 15px;
  --font-size-lg: 18px;
  --font-size-xl: 24px;
  --font-size-xxl: 32px;
}
```

### 폰 프레임

```css
.phone-frame {
  /* 태블릿/PC에서: 화면 중앙에 폰 모양 프레임 */
  width: 375px;
  max-height: 720px;
  margin: 0 auto;
  border: 2px solid #E5E5E5;
  border-radius: 36px;
  overflow: hidden;
  background: var(--color-bg);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  position: relative;
}

/* 상단 노치/상태바 영역 */
.phone-statusbar {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--color-text);
  background: var(--color-bg);
  border-bottom: 1px solid #F0F0F0;
}

/* 하단 홈 인디케이터 */
.phone-home-indicator {
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.phone-home-indicator::after {
  content: '';
  width: 134px;
  height: 5px;
  background: #D1D5DB;
  border-radius: 3px;
}

/* 모바일에서: 폰 프레임 제거, 전체 화면 사용 */
@media (max-width: 767px) {
  .phone-frame {
    width: 100%;
    max-height: none;
    height: 100dvh;
    border: none;
    border-radius: 0;
    box-shadow: none;
  }
  .phone-statusbar,
  .phone-home-indicator {
    display: none;
  }
}
```

### 메신저 버블

```css
/* 채팅 영역 */
.chat-area {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* 메시지 행 */
.message-row {
  display: flex;
  gap: 8px;
  max-width: 80%;
  align-items: flex-end;
}
.message-row.left { align-self: flex-start; }
.message-row.right { align-self: flex-end; flex-direction: row-reverse; }
.message-row.center { align-self: center; max-width: 90%; }

/* 프로필 아바타 (받은 메시지) */
.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background: #F3F4F6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

/* 메시지 버블 */
.bubble {
  padding: 10px 14px;
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  line-height: 1.5;
  word-break: keep-all;
}
.bubble.left {
  background: var(--color-bubble-other);
  color: var(--color-bubble-other-text);
  border-bottom-left-radius: 4px;
}
.bubble.right {
  background: var(--color-bubble-mine);
  color: var(--color-bubble-mine-text);
  border-bottom-right-radius: 4px;
}
.bubble.center {
  background: none;
  color: var(--color-narration);
  font-size: var(--font-size-sm);
  text-align: center;
  font-style: italic;
}

/* 발신자 이름 (받은 메시지 위) */
.sender-name {
  font-size: 12px;
  color: var(--color-text-light);
  margin-bottom: 4px;
  margin-left: 40px;  /* 아바타 너비 + gap */
}

/* 시간 표시 */
.message-time {
  font-size: 11px;
  color: var(--color-text-light);
  margin-top: 2px;
}
.message-row.left .message-time { margin-left: 40px; }
.message-row.right .message-time { text-align: right; }

/* 읽음 표시 */
.read-receipt {
  font-size: 11px;
  color: var(--color-text-light);
  text-align: right;
}
```

### 선택지 카드

```css
/* 선택지 컨테이너 — 하단에서 슬라이드업 */
.choices-container {
  padding: 12px 16px;
  background: var(--color-bg);
  border-top: 1px solid #F0F0F0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* 개별 선택지 버튼 */
.choice-btn {
  background: var(--color-bg);
  border: 1.5px solid var(--color-card-border);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  font-size: var(--font-size-base);
  color: var(--color-text);
  cursor: pointer;
  text-align: left;
  min-height: 48px;
  transition: all 0.15s ease;
  font-family: var(--font-family);
}
.choice-btn:hover {
  border-color: var(--color-accent);
  background: rgba(59, 130, 246, 0.04);
}
.choice-btn:active {
  transform: scale(0.98);
}

/* 선택된 상태 — 버블로 전환되기 전 잠깐 하이라이트 */
.choice-btn.selected {
  background: var(--color-bubble-mine);
  color: var(--color-bubble-mine-text);
  border-color: var(--color-bubble-mine);
}
```

### 수집 카드

```css
/* 카드 그리드 */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  padding: 16px;
}

/* 개별 수집 카드 */
.earned-card {
  background: var(--color-card-bg);
  border: 1.5px solid var(--color-card-border);
  border-radius: var(--radius-md);
  padding: 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.earned-card .card-icon {
  font-size: 28px;
}
.earned-card .card-label {
  font-size: var(--font-size-sm);
  color: var(--color-text);
  line-height: 1.4;
}
.earned-card .card-step {
  font-size: 11px;
  color: var(--color-text-light);
}

/* 빈 카드 슬롯 */
.empty-card {
  background: #FAFAFA;
  border: 1.5px dashed #D1D5DB;
  border-radius: var(--radius-md);
  padding: 16px;
  text-align: center;
  color: #D1D5DB;
  font-size: 28px;
}

/* 카드 획득 팝업 */
.card-popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.8);
  background: var(--color-bg);
  border: 2px solid var(--color-card-earned);
  border-radius: var(--radius-lg);
  padding: 24px 32px;
  text-align: center;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.12);
  z-index: 100;
  animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
@keyframes popIn {
  from { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
  to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}
.card-popup .popup-icon { font-size: 40px; margin-bottom: 8px; }
.card-popup .popup-label { font-size: var(--font-size-lg); font-weight: 600; }
.card-popup .popup-badge { font-size: 12px; color: var(--color-card-earned); margin-top: 4px; }
```

### 레이더 차트 (SVG)

```javascript
function renderRadarChart(stats, container) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 40; // 라벨 공간 확보
  const axes = ['thinking', 'creativity', 'tech', 'adaptability', 'confidence', 'curiosity'];
  const labels = ['사고력', '창의력', '기술친숙도', '적응력', '자신감', '호기심'];
  const maxVal = 10;
  const angleStep = 360 / 6;

  function polar(angle, r) {
    const rad = (angle - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  let svg = `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">`;

  // 배경 격자 (5단계)
  for (let level = 1; level <= 5; level++) {
    const r = maxR * (level / 5);
    const points = [];
    for (let i = 0; i < 6; i++) {
      const p = polar(i * angleStep, r);
      points.push(`${p.x},${p.y}`);
    }
    svg += `<polygon points="${points.join(' ')}" fill="none" stroke="var(--chart-grid)" stroke-width="1"/>`;
  }

  // 축 라인
  for (let i = 0; i < 6; i++) {
    const p = polar(i * angleStep, maxR);
    svg += `<line x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" stroke="var(--chart-grid)" stroke-width="1"/>`;
  }

  // 데이터 다각형
  const dataPoints = [];
  for (let i = 0; i < 6; i++) {
    const val = Math.max(0, Math.min(maxVal, stats[axes[i]] || 0));
    const r = maxR * (val / maxVal);
    const p = polar(i * angleStep, r);
    dataPoints.push(p);
  }
  const pointsStr = dataPoints.map(p => `${p.x},${p.y}`).join(' ');
  svg += `<polygon points="${pointsStr}" fill="var(--chart-fill)" stroke="var(--chart-stroke)" stroke-width="2"/>`;

  // 데이터 포인트
  for (const p of dataPoints) {
    svg += `<circle cx="${p.x}" cy="${p.y}" r="4" fill="var(--chart-point)"/>`;
  }

  // 축 라벨
  for (let i = 0; i < 6; i++) {
    const p = polar(i * angleStep, maxR + 20);
    svg += `<text x="${p.x}" y="${p.y}" text-anchor="middle" dominant-baseline="central"
            font-size="12" fill="var(--color-text)" font-family="var(--font-family)">${labels[i]}</text>`;
  }

  svg += '</svg>';
  container.innerHTML = svg;
}
```

### 프로필 카드 (결과 화면)

```css
.profile-card {
  background: var(--color-bg);
  border: 1.5px solid var(--color-card-border);
  border-radius: var(--radius-lg);
  padding: 32px 24px;
  max-width: 360px;
  margin: 0 auto;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.profile-avatar {
  font-size: 48px;
  margin-bottom: 8px;
}
.profile-type {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 4px;
}
.profile-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-light);
  margin-bottom: 24px;
  line-height: 1.6;
}
.profile-chart {
  margin: 0 auto 24px;
  max-width: 280px;
}

/* 스탯 바 */
.stat-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
  text-align: left;
}
.stat-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.stat-label {
  font-size: 12px;
  color: var(--color-text-light);
  width: 70px;
  flex-shrink: 0;
}
.stat-bar-bg {
  flex: 1;
  height: 6px;
  background: #F3F4F6;
  border-radius: 3px;
  overflow: hidden;
}
.stat-bar-fill {
  height: 100%;
  background: var(--color-accent);
  border-radius: 3px;
  transition: width 0.8s ease-out;
}
.stat-value {
  font-size: 12px;
  color: var(--color-text);
  width: 24px;
  text-align: right;
  flex-shrink: 0;
}

/* 카드 뱃지 라인 */
.profile-cards {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}
.profile-card-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: var(--radius-full);
  padding: 4px 12px;
  font-size: 13px;
}
```

---

## Animation Spec

### 채팅 버블 등장

```css
.bubble-enter {
  animation: bubbleIn 0.3s ease-out forwards;
}
@keyframes bubbleIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### 타이핑 인디케이터

```css
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background: var(--color-bubble-other);
  border-radius: var(--radius-lg);
  border-bottom-left-radius: 4px;
  width: fit-content;
}
.typing-dot {
  width: 8px;
  height: 8px;
  background: #9CA3AF;
  border-radius: 50%;
  animation: typingBounce 1.2s infinite;
}
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typingBounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-4px); }
}
```

### 카드 획득 팝업

```javascript
function showCardPopup(card, duration = 1500) {
  const popup = document.createElement('div');
  popup.className = 'card-popup';
  popup.innerHTML = `
    <div class="popup-badge">카드 획득!</div>
    <div class="popup-icon">${card.icon}</div>
    <div class="popup-label">${card.label}</div>
  `;
  document.body.appendChild(popup);
  setTimeout(() => {
    popup.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => popup.remove(), 300);
  }, duration);
}
```

### 장면 전환 Fade

```css
.transition-screen {
  position: absolute;
  inset: 0;
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  z-index: 50;
  animation: fadeInOut 2.5s ease forwards;
}
@keyframes fadeInOut {
  0% { opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { opacity: 0; }
}
.transition-icon { font-size: 40px; }
.transition-label {
  font-size: var(--font-size-lg);
  color: var(--color-text-light);
}
```

### 화면 전환

```css
.screen-enter { animation: screenFadeIn 0.4s ease forwards; }
.screen-exit { animation: screenFadeOut 0.3s ease forwards; }

@keyframes screenFadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes screenFadeOut {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-8px); }
}
```

---

## Core Logic

### 메신저 엔진

```javascript
class MessengerEngine {
  constructor(chatArea, choicesContainer) {
    this.chatArea = chatArea;
    this.choicesContainer = choicesContainer;
    this.messageQueue = [];
    this.isPlaying = false;
  }

  // 메시지 시퀀스 재생
  async playMessages(messages) {
    this.isPlaying = true;
    for (const msg of messages) {
      if (msg.from !== 'player') {
        // 타이핑 인디케이터 표시
        if (msg.from !== 'system' && msg.from !== 'narration') {
          this.showTyping(msg.from);
          await this.wait(msg.delay || 800);
          this.hideTyping();
        } else {
          await this.wait(msg.delay || 600);
        }
      }
      this.addBubble(msg);
      this.scrollToBottom();
    }
    this.isPlaying = false;
  }

  // 버블 추가
  addBubble(msg) {
    const speaker = SPEAKERS[msg.from];
    const row = document.createElement('div');
    row.className = `message-row ${speaker.side}`;

    if (speaker.side === 'left' && speaker.avatar) {
      row.innerHTML = `
        <div class="message-avatar">${speaker.avatar}</div>
        <div>
          <div class="sender-name">${speaker.name}</div>
          <div class="bubble left bubble-enter">${msg.text}</div>
          <div class="message-time">${this.getTime()}</div>
        </div>
      `;
    } else if (speaker.side === 'right') {
      row.innerHTML = `
        <div>
          <div class="bubble right bubble-enter">${msg.text}</div>
          <div class="read-receipt">읽음</div>
        </div>
      `;
    } else {
      // center (narration/system)
      row.innerHTML = `<div class="bubble center bubble-enter">${msg.text}</div>`;
    }

    this.chatArea.appendChild(row);
  }

  // 선택지 표시
  showChoices(choices, onSelect) {
    this.choicesContainer.innerHTML = '';
    this.choicesContainer.style.display = 'flex';
    this.choicesContainer.style.flexDirection = 'column';
    this.choicesContainer.style.gap = '8px';

    for (const choice of choices) {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = choice.text;
      btn.addEventListener('click', () => {
        btn.classList.add('selected');
        setTimeout(() => {
          this.choicesContainer.style.display = 'none';
          this.addBubble({ from: 'player', text: choice.text });
          this.scrollToBottom();
          onSelect(choice);
        }, 400);
      });
      this.choicesContainer.appendChild(btn);
    }
  }

  showTyping(from) { /* 타이핑 인디케이터 DOM 추가 */ }
  hideTyping() { /* 타이핑 인디케이터 DOM 제거 */ }
  scrollToBottom() { this.chatArea.scrollTop = this.chatArea.scrollHeight; }
  getTime() { /* 현재 게임 내 시간 반환 */ return "오후 4:32"; }
  wait(ms) { return new Promise(r => setTimeout(r, ms)); }
}
```

### 게임 컨트롤러

```javascript
class GameController {
  constructor() {
    this.state = {
      character: null,
      currentStep: null,
      currentBranch: null,
      cards: [],
      stats: { thinking: 0, creativity: 0, tech: 0, adaptability: 0, confidence: 0, curiosity: 0 },
      choiceHistory: []
    };
    this.messenger = null;  // MessengerEngine 인스턴스
  }

  // 캐릭터 선택
  selectCharacter(charId) {
    this.state.character = charId;
    this.showScreen('messenger');
    this.startStep('step1');
  }

  // 단계 시작
  async startStep(stepKey) {
    this.state.currentStep = stepKey;
    const charScenario = SCENARIO[this.state.character];
    const branchKey = this.state.currentBranch || stepKey;
    const stepData = stepKey === 'step1'
      ? charScenario.step1
      : charScenario[stepKey]?.[branchKey];

    if (!stepData) { this.showProfile(); return; }

    // 장면 전환
    if (stepData.scene) {
      await this.showTransition(stepData.sceneLabel);
    }

    // 메시지 재생
    await this.messenger.playMessages(stepData.messages);

    // 선택지 표시
    if (stepData.choices) {
      this.messenger.showChoices(stepData.choices, (choice) => this.onChoice(choice));
    } else {
      // 선택 없는 결과 장면 → "다음" 버튼
      this.showNextButton();
    }
  }

  // 선택 처리
  onChoice(choice) {
    // 역량 누적
    this.addStats(choice.stats);

    // 카드 획득
    if (choice.card) {
      const card = { ...choice.card, step: this.state.currentStep };
      this.state.cards.push(card);
      showCardPopup(card);
    }

    // 선택 기록
    this.state.choiceHistory.push(choice.id);
    this.state.currentBranch = choice.id;

    // 다음 단계로
    const nextStep = this.getNextStep();
    setTimeout(() => this.startStep(nextStep), 1800);
  }

  addStats(delta) {
    for (const key in delta) {
      this.state.stats[key] = Math.max(0, Math.min(10,
        (this.state.stats[key] || 0) + delta[key]
      ));
    }
  }

  getNextStep() {
    const order = ['step1', 'step2', 'step3', 'step4'];
    const idx = order.indexOf(this.state.currentStep);
    return idx < order.length - 1 ? order[idx + 1] : 'profile';
  }

  showProfile() {
    const profile = determineProfile(this.state.stats);
    // Profile Result Screen 렌더링
  }

  showTransition(label) { /* 트랜지션 화면 표시, 2.5초 후 해제 */ }
  showScreen(screenId) { /* 화면 전환 */ }
  showNextButton() { /* "다음" 버튼 표시 */ }

  // 리플레이
  restart(sameCharacter = true) {
    const charId = sameCharacter ? this.state.character : null;
    this.state = {
      character: charId,
      currentStep: null,
      currentBranch: null,
      cards: [],
      stats: { thinking: 0, creativity: 0, tech: 0, adaptability: 0, confidence: 0, curiosity: 0 },
      choiceHistory: []
    };
    if (charId) {
      this.showScreen('messenger');
      this.startStep('step1');
    } else {
      this.showScreen('character-select');
    }
  }
}
```

---

## Responsive Design

### Breakpoints

| 범위 | 대상 | 폰 프레임 | 특이사항 |
|------|------|-----------|----------|
| 768px+ | 태블릿/PC (기본) | 375x720 중앙 프레임 | 폰 프레임 안에서 플레이 |
| ~767px | 모바일 | 프레임 해제, 전체 화면 | dvh 사용, 네이티브 앱 느낌 |

### 태블릿/PC (768px+)

```css
body {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  background: #F9FAFB;  /* 폰 프레임 밖 배경: 아주 밝은 회색 */
}
```

### 모바일 (~767px)

```css
@media (max-width: 767px) {
  body { background: var(--color-bg); }

  .phone-frame {
    width: 100%;
    max-height: none;
    height: 100dvh;
    border: none;
    border-radius: 0;
    box-shadow: none;
  }

  /* 캐릭터 선택: 2x2 그리드 */
  .character-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  /* 선택지 버튼 크기 확대 */
  .choice-btn {
    min-height: 52px;
    font-size: 16px;
  }
}
```

### 터치 친화

```css
/* 모든 인터랙티브 요소: 최소 44x44px 터치 영역 */
button, .choice-btn, .character-card {
  min-height: 44px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
```

---

## File Structure

```
_dev/AI-Literacy/
├── index.html      ← v1 (유지)
├── v2.html         ← v2 (새로 생성, 단일 파일)
├── SPEC.md         ← v1 스펙 (유지)
└── SPEC-v2.md      ← 이 문서
```

**v2.html 하나에 HTML + CSS + JS 전부 포함.** 외부 의존성 없음.
이미지 파일 없음 — 아바타는 이모지, 차트는 SVG, 아이콘은 유니코드.

---

## Implementation Order

1. **Phase 1**: HTML 뼈대 + 화면 전환 + 폰 프레임
2. **Phase 2**: 메신저 엔진 (버블 렌더링 + 타이핑 + 스크롤)
3. **Phase 3**: 선택지 UI + 카드 획득 + 상태 관리
4. **Phase 4**: 캐릭터 선택 + 시나리오 데이터 1명분 (서연)
5. **Phase 5**: 프로필 결과 화면 + 레이더 차트 + 스탯 바
6. **Phase 6**: 나머지 캐릭터 3명 시나리오 데이터
7. **Phase 7**: 애니메이션 폴리싱 + 반응형 테스트
