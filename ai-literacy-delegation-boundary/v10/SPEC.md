## SPEC — v1.0

**최종 업데이트**: 2026-05-09 세션323 (v0.9에서 분기, Neo-Brutalism 디자인 최종)
**PLAN**: [[PLAN|PLAN.md]] / **TASKS**: [[TASKS|TASKS.md]] / **DESIGN**: [[DESIGN-REGISTRY|DESIGN-REGISTRY.md]]
**스타일 가이드 원본**: [[AI 리터러시 게임 — 스타일 가이드]]

> v0.9 SPEC을 계승. 기능/밸런스/데이터 구조는 v0.9 SPEC 참조.
> 이 문서는 v1.0 디자인 최종 변경사항만 기록한다.

---

#### 0. v1.0 변경 요약 (v0.9 → v1.0)

Neo-Brutalism 디자인 시스템 전면 적용. marjoballabani.me 영감.
기능 변경 없음 — 시각·인터랙션·레이아웃 품질을 최종 수준으로.

##### 0.1 v0.9에서 계승 (변경 없음)

- 자원: 시간·에너지 100/100 시작, 자동 회복 없음, RP 직접 배분
- 할인: 고정 (역량 점수 = 할인액) + 카드 쿠폰 수동 적용
- 피드백: 2레이어 (shortFeedback + reportFeedback)
- 용어: 판단하는 힘 / 아는것의 힘
- 선택지: 인라인 전개 (Cut 1~5 순차)
- XP: score × 0.3
- 이미지: 5시나리오 130개 webp

---

#### 1. 디자인 원칙 (스타일 가이드 §1)

1. **숨기지 않는다.** 그림자·테두리는 블러/그라디언트 없이 단색으로.
2. **블록 단위로 사고한다.** 모든 UI 요소는 사각형 카드. 영역 경계 분명.
3. **색은 의미로 쓴다.** 노랑=활성, 시안=정보, 민트=완료, 핑크=위험. 화면당 1~2색.
4. **타이포는 Paperlogy + 손글씨 2종.** 위계는 굵기+크기로. 색으로 위계 만들지 않는다.
5. **사람 냄새를 남긴다.** 카드는 차갑게, 한 곳쯤 손글씨/이모지로 온도.

---

#### 2. 컬러 토큰

##### 2.1 CSS Custom Properties

```css
:root {
  /* Surface */
  --bg-page:        #d0d0d0;
  --bg-card:        #ffffff;
  --bg-soft:        #f4f1ea;
  --bg-dark:        #000000;

  /* Ink */
  --ink:            #000000;
  --ink-mute:       #3c3c3c;
  --ink-soft:       rgba(0,0,0,.55);

  /* Accent 4색 */
  --acc-yellow:     #ffd93d;
  --acc-cyan:       #66d9ef;
  --acc-mint:       #a8e6cf;
  --acc-pink:       #ff6b9d;

  /* Accent 변형 */
  --acc-yellow-soft: rgba(255,217,61,0.70);
  --acc-yellow-deep: #d9b620;
  --acc-cyan-soft:   rgba(102,217,239,0.70);
  --acc-cyan-deep:   #2ba8c6;
  --acc-mint-soft:   rgba(168,230,207,0.70);
  --acc-mint-deep:   #5fbf95;
  --acc-pink-soft:   rgba(255,107,157,0.70);
  --acc-pink-deep:   #d63f7a;

  /* Geometry */
  --border-w:       3px;
  --shadow-offset:  4px;
  --shadow:         var(--shadow-offset) var(--shadow-offset) 0 var(--ink);
  --shadow-press:   2px 2px 0 var(--ink);
  --radius:         0;
}
```

##### 2.2 색상 매핑 (v0.9 → v1.0)

| v0.9 값 | 용도 | v1.0 토큰 |
|---------|------|----------|
| `#1a8c1a` | 긍정/할인/자원+ | `--acc-mint` / `--acc-mint-deep` |
| `#c44` | 부정/부족/자원- | `--acc-pink` / `--acc-pink-deep` |
| `#f5f5f5` | 페이지 배경 | `--bg-page` (#d0d0d0) |
| `#fff` | 카드 배경 | `--bg-card` |
| `#f8f8f8`, `#fafafa` | 보조 배경 | `--bg-soft` (#f4f1ea) |
| `#111 bg + #fff text` (버튼) | 어두운 버튼 | `--acc-yellow` bg + `--ink` text |

##### 2.3 절대 규칙

1. **글씨는 어떤 배경 위에서도 항상 `--ink` (검정).** 흰 글씨 금지.
2. 한 화면 액센트 **1~2색**. 나머지는 흑/백/회색.
3. 액센트 색끼리 **나란히 두지 않는다.** 사이에 흑/백/회색 텍스트.
4. 그라디언트·블렌드 금지. **단색 채움만.**

---

#### 3. 타이포그래피

##### 3.1 폰트 스택

```css
--font-main: "Paperlogy", "Pretendard", system-ui, sans-serif;
--font-hand: "Nanum Pen Script", "Caveat", cursive;
```

##### 3.2 스케일

| 역할 | 크기/굵기 | 용도 |
|------|----------|------|
| Display | 56/800 | 게임 시작, 챕터 표지 |
| H1 | 36/700 | 스테이지 제목 |
| H2 | 24/700 | 섹션 제목, 카드 헤드 |
| Body | 16/400 | 본문, 설명 |
| Caption | 13/500 | 보조 안내, 메타 |
| Tag/Label | 12/700 (letter-spacing:1.5px) | STAGE 03/12, +120 XP |
| Button | 14/700 | 모든 버튼 |
| Hand | 24/400 | 힌트, 대사 (나눔손글씨 펜) |

##### 3.3 운용 원칙

- 위계: Regular(400) / Bold(700) / ExtraBold(800) 세 단계만.
- 색 변화로 위계 만들지 않음 (색은 의미용).
- 손글씨는 **힌트·캐릭터 대사 전용**. 본문·버튼·태그에 쓰지 않는다.

---

#### 4. 테두리·그림자·간격

- 테두리: **3px solid black**. 옅은 회색 테두리 금지.
- 그림자: **4px 4px 0 #000** (블러 0). 누른 상태 2px 2px.
- 간격: 8의 배수 (8/16/24/32/48).
- 코너: **border-radius: 0**. 직각 모서리. (예외: 원형 아바타/도트 1곳)

##### 4.1 v0.9 → v1.0 변환 대상

| v0.9 패턴 | 변환 |
|-----------|------|
| `border-radius: 3~24px` (카드, 버튼, 모달) | → `0` |
| `border-radius: 50%` (도트, 라디오, 뱃지) | 유지 (원형 요소) |
| `border: 1~2px solid #aaa/#ccc/#e5e5e5` | → `3px solid var(--ink)` |
| `box-shadow: 0 Npx Mpx rgba(...)` (블러 있음) | → `var(--shadow)` |
| `box-shadow: 0 2px 0 #111` (오프셋만) | → `var(--shadow)` (4px 4px) |

---

#### 5. 버튼 체계

##### 5.1 공통 버튼 (.btn)

```css
.btn {
  font-family: var(--font-main);
  font-weight: 700;
  font-size: 14px;
  background: var(--acc-yellow);
  color: var(--ink);
  border: var(--border-w) solid var(--ink);
  border-radius: 0;
  padding: 12px 20px;
  box-shadow: var(--shadow);
  cursor: pointer;
  transition: transform .05s, box-shadow .05s;
}
.btn:active {
  transform: translate(2px, 2px);
  box-shadow: var(--shadow-press);
}
```

##### 5.2 변형

| 변형 | 배경 | 용도 |
|------|------|------|
| `.btn` (기본) | `--acc-yellow` | 주 행동 (다음, 시작) |
| `.btn--ghost` | `--bg-card` | 보조 행동 (다시, 취소) |
| `.btn--correct` | `--acc-mint` | 정답 피드백 |
| `.btn--wrong` | `--acc-pink` | 오답 피드백 |

> 모든 변형에서 글씨 색 = `--ink`. v0.9의 `color:#fff` 버튼들은 전부 전환.

##### 5.3 v0.9 버튼 매핑

| v0.9 클래스 | 현재 스타일 | v1.0 전환 |
|------------|-----------|----------|
| `.start-btn` | bg:#111, color:#fff | → `.btn` (yellow bg, black text) |
| `.advance-btn` | bg:#111, color:#fff | → `.btn` |
| `.next-btn` | bg:#111, color:#fff | → `.btn` |
| `.action-main` | bg:#111, color:#fff | → `.btn` (Display 크기) |
| `.lvup-confirm` | bg:#111, color:#fff | → `.btn` |
| `.rp-confirm` | bg:#111, color:#fff | → `.btn` |
| replay-btn (인라인) | bg:#fff, border:#ccc | → `.btn--ghost` |
| `.recovery-card-btn` | 각종 | → `.btn` / `.btn--ghost` |

---

#### 6. 컴포넌트 변환

##### 6.1 선택지 카드 (.choice-card)

현재: `border:2px solid #111, box-shadow:0 2px 0 #111`
전환: `border:3px solid var(--ink), box-shadow:var(--shadow), border-radius:0`
hover: `transform:translate(-2px,-2px), box-shadow:6px 6px 0 var(--ink)` (리프트)
active: `transform:translate(2px,2px), box-shadow:var(--shadow-press)` (누름)

##### 6.2 패널 (.panel)

현재: `border:2px solid #111, box-shadow:0 2px 4px rgba(...)`
전환: `border:var(--border-w) solid var(--ink), box-shadow:var(--shadow)`

##### 6.3 모달 (.modal-card, .coupon-box)

현재: `box-shadow:0 8px 32px rgba(...)`
전환: `border:var(--border-w) solid var(--ink), box-shadow:8px 8px 0 var(--ink), border-radius:0`

##### 6.4 리포트 섹션

현재: `border:2px solid #111, box-shadow:0 2px 0 rgba(0,0,0,0.1)`
전환: `border:var(--border-w) solid var(--ink), box-shadow:var(--shadow)`
리포트 내부 배경: `#f8f8f8` → `var(--bg-soft)`

##### 6.5 인벤토리 (.inv-tab, .inv-card)

inv-tab: `border-radius:14px` → `0`, `box-shadow:-3px 3px 0 #111` → `-4px 4px 0 var(--ink)`
inv-card: `border-radius:8px` → `0`, `box-shadow:0 2px 0 #111` → `var(--shadow)`

##### 6.6 카드 보상 (.card-reward-card)

현재: `border-radius:12px, box-shadow:0 4px 0 #111`
전환: `border-radius:0, box-shadow:var(--shadow)`

##### 6.7 비용 박스

cost-box-effect: `border:#1a8c1a, background:#f3faf3, color:#1a8c1a` → mint 계열
card-chip: `color:#1a8c1a, background:#e8f5e9, border-radius:8px` → `--acc-mint, --acc-mint-soft, border-radius:0`

---

#### 7. 상단 패널 색상

##### 7.1 자원 바 (resource-bar)

변경 없음 (이미 2px→3px, 그림자 교체만).

##### 7.2 역량 바 (stats-bar)

bipolar-fill:
- positive: `#1a8c1a` → `var(--acc-mint-deep)` (#5fbf95)
- negative: `#c44` → `var(--acc-pink-deep)` (#d63f7a)

pending-dot:
- positive: `#1a8c1a` → `var(--acc-mint)`
- negative: `#c44` → `var(--acc-pink)`

---

#### 8. 모션

- 인터랙션: **50~80ms** transform. 짧고 단단하게.
- 누름: `translate(2px,2px)` + shadow 축소.
- ease: `cubic-bezier(0.2, 0.8, 0.2, 1)`. "있는 척하는 ease-out" 피함.
- v0.9의 `transition: all 0.2s` → `transition: transform 0.05s, box-shadow 0.05s`.

---

#### 9. 인라인 하이라이트 (새 패턴)

```css
.hl       { padding: 1px 8px; color: var(--ink); white-space: nowrap; }
.hl--y    { background: var(--acc-yellow); }
.hl--c    { background: var(--acc-cyan); }
.hl--m    { background: var(--acc-mint); }
.hl--p    { background: var(--acc-pink); }
```

한 문단에 **2~3색까지**. 같은 의미 카테고리 = 같은 색. 하이라이트 위 글씨 항상 검정.
적용 위치: texts.yaml 내 본문, 튜토리얼 안내문, 시나리오 인트로.

---

#### 10. 손글씨 폰트

```css
@import url('https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap');
```

적용 위치: 힌트, 캐릭터 대사, 정답/오답 피드백의 한마디.
본문·헤더·버튼·태그에 절대 쓰지 않는다.
