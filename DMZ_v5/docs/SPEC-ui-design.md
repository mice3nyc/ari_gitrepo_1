---
created: 2026-05-15
tags:
  - DMZ
  - SPEC
  - 디자인
author: 아리공
---

## SPEC-ui-design.md — DMZ v5 비주얼 디자인 명세 v1

### 0. 출처

- 디자인 샘플 9장 — `Assets/incoming/통일부/UI디자인샘플/` (219·224·225·226·240·261·262·266·267 .png)
- 아이콘 자산 9개 — `Assets/incoming/통일부/아이콘/` → 리포 `assets/icons/`
- SD 타이틀 이미지 — `assets/images/sd_card_title.png`
- 폰트 — `assets/fonts/Paperlogy-{4Regular,7Bold,9Black}.ttf`
- 피터공 5/15 결정 — Paperlogy 기본, 자료 타입별 변주 가능. 타이머 자리 잡되 기능은 나중.

### 0.5. 화면 명칭 정본 (5/16 결정)

작업·대화·문서에서 화면을 부를 때 정본은 **한글 명칭**. 좌하단 개발용 라벨도 한글만 표시.
Figma 번호는 디자인 검토 시 참조용이며 호칭 아님. HTML id는 코드 내부 좌표.

| 한글 명칭 (정본) | HTML id | Figma 참조 | 종류 |
|---|---|---|---|
| 타이틀 | `login-screen` | 224 | 진입 |
| 튜토리얼 | `tutorial-screen` | 220 | 안내 |
| 주제선택 | `category-screen` | 225 | 선택 |
| 스토리선택 | `story-screen` | 226 | 선택 |
| 자료선택 | `game-screen` | 240 | 선택·플레이 |
| 자료본문 | (modal `#source-detail`) | 261·262·266·267 | 모달 |
| 보관소 | `archive-screen` | — | 부수 (DMZ 픽셀 맵) |
| 스토리완료 | `completion-screen` | — | 자료선택 종료 상태 |
| 결과 | `result-screen` | 245? | 자료선택 종료 상태 |

- "스토리완료"·"결과"는 자료선택(게임 화면) 종료 시 등장하는 상태 화면 (피터공 5/16 분류 코멘트)
- 좌하단 라벨은 `index_pickone.html`의 `SCREEN_LABELS` 객체에서 관리. 화면 추가 시 동시 갱신

### 1. 컬러 토큰

```
--c-pink-primary    #FF1493   (DMZ Archive 메인, 강조)
--c-pink-soft       #FFB6D9   (자료 카드 배경 - 활성)
--c-pink-pale       #FFE4F0   (모달 배경 hint)
--c-cyan            #3FE0DC   (빈칸 highlight, 복구 필요 라벨, GAME START 강조)
--c-navy            #1a2b4a   (SD 카드 배경, 헤더 텍스트)
--c-gray-locked     #B8B8B8   (잠긴 카드 배경)
--c-gray-text       #6E6E6E   (잠긴 자료 텍스트)
--c-white           #FFFFFF
--c-bg              #F0F0F0   (전체 배경)

카테고리 컬러 (디자인 225.png 기준 6종)
--cat-01-info       #FF6FB8   (DMZ 기본정보 - 핑크)
--cat-02-eco        #C8E532   (생태/환경 - 라임)
--cat-03-heritage   #A8D5F0   (국가유산/문화재 - 라이트블루)
--cat-04-people     #FFA84D   (DMZ의 사람들 - 오렌지)
--cat-05-conflict   #C49EE8   (갈등과 협력 - 퍼플) ⚠️ 통삭 결정 자리
--cat-06-tourism    #FFD84D   (평화 관광 - 옐로우)
```

> ⚠️ **결정 자리 1**: 세션354에서 cat05 통삭 + 24 스토리 결정. 디자인 샘플은 cat05 포함 6 카테고리 = 34 스토리. 디자이너 갱신 요청 또는 cat05 복원 결정 대기. **잠정**: 5 카테고리(cat01·02·03·04·06)로 빌드하되 컬러 토큰은 6 모두 정의해둠.

### 2. 폰트 시스템

> **5/16 세션361 결정**: 두꺼운 폰트 weight(700·800·900·bold) 60개 자리를 일괄 **600**으로 변경. Paperlogy-7Bold 자산을 `font-weight: 600`에 매핑 → 600 호출 시 7Bold 사용. 9Black 자산은 비활성(코드 사용 자리 없음). 시각 효과: 가장 두꺼운 자리(9Black 렌더)가 7Bold 렌더로 한 단계 얇아짐. 700→600은 자산 매핑상 동일 글리프지만 의미 정합.



```css
@font-face {
  font-family: 'Paperlogy';
  src: url('data:font/ttf;base64,...') format('truetype');
  font-weight: 400;
}
@font-face {
  font-family: 'Paperlogy';
  src: url('data:font/ttf;base64,...') format('truetype');
  font-weight: 700;
}
@font-face {
  font-family: 'Paperlogy';
  src: url('data:font/ttf;base64,...') format('truetype');
  font-weight: 900;
}

:root { --font-base: 'Paperlogy', -apple-system, sans-serif; }
```

#### 자료 타입별 폰트 변주 자리 (피터공 5/15 결정 — 일부 다른 폰트 가능)

| subtype | 폰트 | 비고 |
|---|---|---|
| `diary` | Paperlogy 4Regular | 일기 톤 |
| `letter` | Paperlogy 4Regular + serif 후보 | "편지" 손글씨 느낌 자리 |
| `newspaper` | Paperlogy 7Bold (헤드라인), 4Regular (본문) | |
| `scholar` / `report` | Paperlogy 4Regular | 학술 톤 |
| `blog` / `homework` / `twitter` | Paperlogy 4Regular | |
| `poster` | Paperlogy 9Black | 포스터 임팩트 |
| `photo` | Paperlogy 4Regular (캡션) | |
| `oral` | Paperlogy 4Regular | 구술 |
| `kakao` | Paperlogy 4Regular | 말풍선 |

> 1단계는 Paperlogy 단일 폰트로 통일 → 비주얼 자리 잡힌 후 변주 도입.

### 3. 자료 category ↔ 아이콘 매핑

| category | 아이콘 (작은) | 아이콘 (큰/탭) | subtypes |
|---|---|---|---|
| 개인서사자료 | `personal_small.png` (편지+봉투) | `personal_tab.png` | diary, letter, blog, homework, twitter |
| 공식기록자료 | `news_small.png` (확성기) | `news_tab.png` | newspaper, scholar, report, poster |
| 시각매체자료 | `photo_small.png` (사진 액자) | `photo_tab.png` | photo |
| 구술증언자료 | `oral_small.png` (마이크) | `oral_tab.png` | oral |

> kakao subtype은 어느 category? 현재 데이터에 미발견. 발견 시 결정 자리.

### 4. 화면별 컴포넌트

#### 4.1 GAME START 화면 (224.png)

```
┌─────────────────────┐
│  [30:00 placeholder]│ ← 타이머 자리만 잡음, 비활성
│                     │
│   ┌───────────┐     │
│   │   SD      │     │   sd_card_title.png 중앙 배치
│   │  CARD     │     │   max-width 280px
│   │  IMAGE    │     │
│   └───────────┘     │
│                     │
│   [GAME START btn]  │   SD 카드 내부에 이미 GAME START 포함됨
│                     │   → 클릭은 카드 전체 영역
│   [ Kr / En ]       │   토글 (잠정 비활성)
└─────────────────────┘
```

- 배경 `--c-bg`
- SD 카드 이미지 클릭 → 게임 코드 입력 모달 (현 v5 코드 1233 입력)
- Kr/En 토글: 1단계는 표시만, 동작 안 함

#### 4.2 카테고리 폴더 화면 (225.png)

```
┌─────────────────────┐
│ [30:00] DMZ Archive │ ← 헤더 (타이머 placeholder + 로고 + 프로필)
├─────────────────────┤
│ 주제                │ ← Paperlogy 9Black, 큰 글씨
│ 카테고리 선택 안내   │ ← Paperlogy 4Regular, gray
│                     │
│ ┌──┐  ┌──┐         │
│ │📁│  │📁│         │   카테고리 폴더 (CSS로 폴더 모양)
│ └──┘  └──┘         │   배경 색 = --cat-XX
│ DMZ기본정보 6  생태 5│   하단 라벨 + count badge
│                     │
│ ... (3 row × 2 col) │
└─────────────────────┘
```

- 폴더 컴포넌트: `<div class="folder cat-01">` 안에 폴더 모양(CSS clip-path 또는 SVG)
- count badge: `<span class="count">6</span>` 원형, white bg, Paperlogy 7Bold

#### 4.3 스토리(에피소드) 자료 리스트 화면 (219·240.png)

```
┌─────────────────────┐
│ [30:00] DMZ Archive │
├─────────────────────┤
│ ╭─ DMZ 기본 정보 ─╮  │ ← 좌측 탭 (현 카테고리)
│ │ DMZ의 탄생       │ ← 우측 강조 (현 스토리 제목, 카테고리 컬러)
│ ┌─────────────────┐ │
│ │ ⊙ 복구 필요     │ │ ← 첫 자료 카드 (활성, 카테고리 컬러 BG)
│ │ 군인의 편지.txt  │ │   personal_tab.png (우측)
│ │ 총소리가 멈춘 밤 │ │
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │ 🔒 잠김         │ │ ← 잠긴 카드 (회색 BG)
│ │ 신문보도.txt    │ │   news_tab.png (우측, 회색조)
│ │ 판문점에서...    │ │
│ └─────────────────┘ │
│ ... (4 자료 슬롯)   │
└─────────────────────┘
```

- 활성 카드: 카테고리 컬러 BG + Paperlogy 7Bold 제목
- 잠긴 카드: `--c-gray-locked` BG + 텍스트 `--c-gray-text` + 우측 아이콘 opacity 0.4
- 복구 완료 카드: pale BG + 좌상단 ✓ 체크 라벨
- 상태 라벨 (좌상단 알약형):
  - 잠김: 회색 + 🔒
  - 복구 필요: cyan BG + 흰 텍스트
  - 복구 완료: white BG + ✓ + 카테고리 컬러 텍스트

#### 4.4 자료 본문 모달 (261·262·266·267.png)

```
┌─────────────────────┐
│ [30:00] DMZ Archive │
├─────────────────────┤
│ ╭─ 카테고리 ─╮ 스토리│
│ ┌─────────────────┐ │
│ │ 빈칸 복원하기  X│ │ ← 모달 헤더 (핑크 BG, 흰 텍스트)
│ │ 빈칸 정답은...   │ │
│ │ 자료 C(사진)... │ │
│ ├─────────────────┤ │
│ │                 │ │
│ │  본문 (자료별)  │ │ ← subtype별 렌더
│ │                 │ │
│ └─────────────────┘ │
└─────────────────────┘
```

- 모달 헤더 BG `--c-pink-primary`, 텍스트 white, Paperlogy 7Bold
- 안내문 Paperlogy 4Regular, opacity 0.85
- 본문 영역 (subtype별 패턴은 SPEC-data-v2 §6 그대로)
- 빈칸 button: cyan BG `--c-cyan`, 흰 텍스트, 라운드 8px, "[B]" "[C]" "[D]" 슬롯 라벨
- 카카오톡 (kakao): 본인=분홍 우측, 상대=회색 좌측, 분홍 말풍선 둥근, 캐릭터 아바타 상단 중앙

#### 4.5 타이머 placeholder (피터공 5/15 결정 — 기능 나중, 자리만)

- 헤더 좌상단 `<div class="timer-placeholder">30:00</div>`
- 알약 모양: `--c-pink-soft` BG, Paperlogy 7Bold, `--c-navy` 텍스트
- onclick 비활성, JS 미생성

### 5. 적용 베이스

- **canonical**: `pickone/index.html` — 5/15 피터공 결정으로 앞으로 디자인·콘텐츠 변경은 pickone만 작업
- mobile / offline / sequential 세 빌드는 5/15 상태로 동결 (propagate 폐기)

### 6. 미해결 / 결정 자리

1. cat05(갈등과 협력) 통삭 vs 복원 → 디자이너 갱신 또는 콘텐츠 복원
2. kakao subtype의 category 매핑 (개인서사? 별도?)
3. Kr/En 토글 동작 시점
4. 타이머 활성 시점·로직(전체 30분? 스토리당?)
5. 자료 타입별 폰트 변주(letter 손글씨, poster 임팩트) 도입 시점
6. SD 카드 클릭 후 코드 입력 모달 위치(현 v5 1233 입력 UI 재사용 vs 신규)

### 7. 변경 이력

| 버전 | 날짜 | 내용 |
|---|---|---|
| v1 | 2026-05-15 | 신설. 디자인 샘플 9장 + 아이콘 9개 + Paperlogy 적용 명세. pickone 파일럿 결정 |
| v2 | 2026-05-16 | 마닐라 폴더 패턴 + 색 토큰 정정(SVG에서 추출) + 226·240 BG=cat-color + Z 위계 + 돌아가기 알약 + drop shadow 제거 |
| v3 | 2026-05-16 | 화면 명칭 정본화 + SPEC-screens.md 신설. PNG 자산 통합(로고 6장·프로필·status 3종). 폰트 weight 600 일괄. 폴더 높이 20% 감소 + 레이블 외부 + 뒷장 마닐라 모양 + 색. 두 화면 헤더 결 통일(자료선택·스토리선택). 마닐라 mirror·좌상 탭 clip-path polygon. 자료 카드 박스 height 증가 + status 아이콘 mask |

---

## v2 — 마닐라 폴더 패턴 + 정밀화 (2026-05-16)

### v2-1. 색 토큰 정정 (SVG에서 추출한 정확한 hex)

```
v1 → v2
--cat-01: #FF6FB8 → #FF6EC7   (DMZ 기본정보 — 핫핑크)
--cat-02: #C8E532 → #D8E82D   (생태/환경 — 라임)
--cat-03: #A8D5F0 → #A9D4FF   (국가유산 — 라이트블루)
--cat-04: #FFA84D → #FF9D48   (DMZ의 사람들 — 오렌지)
--cat-05: #C49EE8 → #C77DFF   (갈등과 협력 — 퍼플)
--cat-06: #FFD84D → #FFD556   (평화 관광 — 옐로우)
--c-bg:   #F0F0F0 → #E7E7E7
```

> 출처: `Assets/incoming/통일부/UI디자인샘플/figma_svg/225.svg` line 7~10

### v2-2. 마닐라 폴더 카드 (.cat-card .folder-shape / .story-card .story-folder)

피터공 핵심 영감: "탭 형태의 윈도우, 일부는 높고 일부는 낮은 튀어나온 형태. 마닐라 폴더라고 하나? 겹치듯 위로 쌓이고 살짝 아래에 배치되면서 입체감과 꽉찬 화면."

```css
.folder-shape {
  /* 본체 사방 라운드 단, 좌상은 직각(탭과 연결) */
  background: var(--cat-color);
  border-radius: 0 14px 14px 14px;
  aspect-ratio: 1.3 / 1;
  margin-top: 14px;  /* 탭 공간 */
  padding: 0.8rem 0.85rem;
  display: flex; flex-direction: column; justify-content: flex-end;
}
.folder-shape::before {
  /* 좌상 사선 탭 — clip-path 사다리꼴 */
  position: absolute;
  top: -13px; left: 0;
  width: 52%; height: 14px;
  background: var(--cat-color);
  clip-path: polygon(0 0, 82% 0, 100% 100%, 0 100%);
  border-radius: 8px 0 0 0;
}
.folder-shape::after {
  /* 뒤 흰 layer — 다른 종이 한 장이 폴더 뒤에 살짝 위로 보임 */
  position: absolute;
  top: -8px; left: 0; right: 0; bottom: 8px;
  background: white;
  border-radius: 14px;
  z-index: -1;
}
.cat-card, .story-card { isolation: isolate; }  /* z-index -1 동작 보장 */
```

**폴더 뒤 layer 결정 (5/16)**: 225 SVG는 흰색, 226 SVG는 같은 cat-color opacity 0.3. 피터공 결정 — **둘 다 흰색으로 통일**.

**폴더 위 글씨 (피터공 결정)**: h3와 cat-label-row를 .folder-shape 안에 배치. flex column + justify-content: flex-end로 하단 정렬. 글씨에 `text-shadow: 0 1px 2px rgba(255,255,255,0.3)` 가독성.

### v2-3. 226 스토리 선택 화면 layout

```html
<div id="story-screen">                          <!-- BG = cat-color -->
  <header class="app-header">[transparent]       <!-- BG transparent -->
  <div class="story-page">
    <div class="story-folder-header">             <!-- flex row, 좌·우 -->
      <button class="btn-back-round">← 주제선택   <!-- 흰 알약 -->
      <div class="story-cat-banner">DMZ기본정보   <!-- 흰 탭, 우측 정렬 -->
    </div>
    <div class="story-page-body">                  <!-- 흰 시트 -->
      <div class="story-list">[폴더 카드 격자]
```

- `#story-screen { background: var(--cat-color); transition: background 0.25s; }`
- `#story-screen .app-header { background: transparent; }` — 헤더까지 카테고리 컬러
- `.story-cat-banner`: `background: white`, `color: navy`, `margin-left: auto`, `border-radius: 18px 18px 0 0`
- `.story-page-body`: `background: white`, `border-radius: 18px 0 18px 18px` (우상 직각 — 탭과 연결)
- `.btn-back-round`: 흰 알약(`border-radius: 999px`), 네이비 글씨, "← 주제선택"
- `.story-folder-header padding: 0` — 탭과 시트 우측 edge 정확히 일치 (padding 있으면 어긋남)

### v2-4. 240 자료 선택 화면 Z 위계 (피터공 결정 5/16)

**Z 위계 — 가장 아래(z=1) → 가운데(z=2) → 가장 위(z=3)**:

```html
<div class="phase-banner">                       <!-- relative -->
  <div class="phase-cat-tab">DMZ기본정보         <!-- z=1, 전체 폭 띠, 클릭→주제선택 -->
  <div class="phase-story-tab">DMZ의 탄생         <!-- z=3, 우측 50% 폭, 시트 위로 솟음 -->
  <div class="phase-sheet">                       <!-- z=2, 흰 시트 (자료 카드 포함) -->
    [source-card × N]
```

```css
.phase-banner { position: relative; }
.phase-cat-tab {
  display: block; width: 100%;
  background: var(--c-gray-card);
  padding: 0.8rem 1rem 2rem;  /* 5/16 세션361: 높이 2배(0.4·1·1 → 0.8·1·2) */
  border-radius: 14px 14px 0 0;
  z-index: 1;
  cursor: pointer;  /* 클릭 → exitToStoryList() — 스토리선택으로 */
}
.phase-story-tab {
  position: absolute; top: 0; right: 0;  /* 5/16 세션361: 주제 띠 상단과 같은 높이(4px → 0) */
  /* padding-bottom 0.55 → 2rem (5/16 세션361): 박스를 더 길게 → 시트 안으로 자연스럽게 들어감 */
  width: 50%;
  background: white;
  color: var(--c-navy);
  padding: 0.7rem 1.1rem 0.55rem;
  border-radius: 16px 16px 0 0;
  z-index: 3;
  text-align: center;
}
.phase-sheet {
  background: white;
  border-radius: 14px 14px 14px 14px;
  padding: 2rem 0.8rem 1.4rem;  /* padding-top 큼 — 스토리 탭과 안 겹침 */
  margin-top: -14px;  /* 카테고리 탭 하단 일부 덮음 */
  z-index: 2;
}
```

- **화면 BG = cat-color** (피터공 결정 — 226에서 이어짐. 240 SVG의 회색 BG 디자인 의도와 다름)
- `#game-screen { background: var(--cat-color); }`
- `#game-screen .app-header { background: transparent; }`
- **클릭 동선 (5/16 정정)**: 주제 띠(`.phase-cat-tab`, "DMZ 기본정보") → **스토리선택**(`exitToStoryList()`) / 스토리 제목 탭(`.phase-story-tab`, "DMZ의 탄생") → (현재 미활용)
- **`.game-header` 폐기 (5/16 결정)**: 상단바와 phase-banner 사이의 ← + 위치 + "빈칸 복원 0/4" 한 줄은 제거. 뒤로 가는 길은 주제 띠가 담당. 진행 카운트(0/4)는 다른 자리(자료 카드 그룹 또는 시트 헤더 등) 후속 결정 자리.

### v2-5. 자료 카드 겹겹이 쌓임

```css
.source-card {
  background: var(--cat-color);
  border-radius: 18px;
  margin-top: -32px;  /* 다음 카드가 위 카드 위로 올라옴 */
  padding: 1.1rem 1.2rem 3rem;  /* 텍스트 아래 여백 — 한두 줄 분량 */
  min-height: 130px;
}
.source-card:first-of-type { margin-top: 0; }
/* JS 렌더에 z-index inline — 다음 카드가 위에 */
return `<div class="${cardCls}" style="z-index:${i+1}; ...">`;
```

다음 카드의 z-index가 위 카드보다 높음 → 위 카드의 하단 라운드가 다음 카드에 가려짐. layered 입체.

### v2-6. unlock 깜빡 (반투명 BG → opacity 토글)

```css
@keyframes card-unlock-flash {
  0%, 49%, 100% { opacity: 1; }
  50%, 99%      { opacity: 0; }
}
.source-card.just-unlocked {
  animation: card-unlock-flash 0.16s steps(1) 4;
}
```

- 반투명 초록 BG/border 전부 폐기 (이상함)
- on/off 토글, steps(1)로 즉시 전환, 0.16s × 4 사이클 = 0.64s 빠른 깜빡 4회

### v2-7. SD 카드 진입 애니메이션 (224 GAME START)

```css
@keyframes sd-card-pop-in {
  0%   { transform: translateY(110vh) scale(0.78); opacity: 0; }
  55%  { transform: translateY(-14px) scale(1.05); opacity: 1; }
  72%  { transform: translateY(7px)   scale(0.97); }
  84%  { transform: translateY(-3px)  scale(1.015); }
  93%  { transform: translateY(1px)   scale(0.995); }
  100% { transform: translateY(0)     scale(1); }
}
.sd-card-image {
  animation: sd-card-pop-in 1.05s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
```

아래에서 튕겨 올라와 자리잡는 "딸깍" 효과.

### v2-8. drop shadow 전부 off (피터공 결정 5/16)

"뭔가 지저분해" — 226·240 화면의 box-shadow 모두 제거. layered 효과는 색 대비 + 음수 margin + z-index로만.

제거 위치:
- `.folder-shape`, `.story-folder` 본체
- `.folder-shape::after`, `.story-folder::after` 뒤 흰 layer
- `.cat-count` 알약
- `.story-cat-banner`, `.story-page-body`
- `.phase-cat-tab`, `.phase-story-tab`, `.phase-sheet`
- `.btn-back-round`
- `.timer-placeholder`
- `.card-status`, `.source-card`, `.source-card:hover`

### v2-9. 화면 BG 동적 cat-color

JS:
```js
const gameScreen = document.getElementById('game-screen');
if (gameScreen) gameScreen.style.setProperty('--cat-color', catColor);
const storyScreen = document.getElementById('story-screen');
if (storyScreen) storyScreen.style.setProperty('--cat-color', catColor);
```

`selectCategory()` 함수에서 story-screen·game-screen·game-content 모두 cat-color 설정.

### v2-10. 폐기·이동 자리

- **era / soundNote** 자료 화면(`.phase-sheet` 안)에서 제거. 디자이너 의도 아님. 자료 본문 모달 또는 다른 자리로 이동 — 결정 자리.

### v2-11. 비교 빌드 — pickone-v1/

`_dev/DMZ_v5/pickone-v1/index.html` — 5/15 디자인 v1 빌드 사본. assets 경로 `../pickone/assets/`로 sed 정정 → 자산 공유. photos는 직접 참조 X. 로컬·GitHub Pages 모두 작동.

URL:
- 로컬: `http://localhost:8765/pickone-v1/`
- GitHub Pages: `https://mice3nyc.github.io/ari_gitrepo_1/DMZ_v5/pickone-v1/`

### v2-12. 미해결 / 결정 자리 (추가)

7. 일러스트 자산(편지+봉투·메가폰·액자·마이크) 디자이너 정식 수령 자리 — 현재 작은 아이콘 png만 있음
8. 폴더 정확한 SVG path 적용 (현재는 CSS clip-path polygon 사선 탭 + border-radius 라운드 절충 — SVG path는 사방 라운드 + 좌상 사선 통합 가능)
9. Figma MCP 또는 PAT 세팅 (반복 협업 시) — 현재 SVG export로 충분
10. 디자이너에게 피드백할 항목: ① 226 화면 돌아가기 버튼 누락 ② 탭 우측 정렬 디자인 의도 ③ era/soundNote 위치
11. 226 스토리 선택 화면도 240과 같은 결(전체 폭 카테고리 띠 + 우측 솟은 스토리 탭)로 통일할지 — 현재 226은 좌측 알약 + 우측 탭으로 다른 결
