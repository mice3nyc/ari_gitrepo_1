---
created: 2026-05-16
tags:
  - DMZ
  - SPEC
  - 디자인
author: 아리공
---

## SPEC-screens.md — DMZ v5 pickone 화면별 세부 명세

화면별 세부 구조 문서. [[SPEC-ui-design]]의 글로벌 토큰(컬러·폰트·아이콘 매핑)·화면 명칭 표·v1/v2 변경 이력은 그쪽에. 여기는 각 화면 한 곳에 모아 본다.

호칭 정본은 한글 명칭. 좌하단 라벨도 한글만. Figma 번호는 디자인 검토 참조용. HTML id는 코드 내부 좌표.

공통 레이어 4종 (모든 화면 동일):
- **배경** — 화면 전체 BG
- **상단바** — 앱 헤더(타이머·로고·프로필)
- **본문** — 화면 고유 컨텐츠 영역
- **오버레이** — 모달·토스트 등 위로 뜨는 자리

작성 순서: 자료선택 → 스토리선택 → 주제선택 → 자료본문 → 타이틀 → 튜토리얼 → 보관소 → 스토리완료 → 결과.

---

## 자료선택 (HTML: `game-screen` · Figma 240)

### 한 줄 정의

한 스토리 안의 자료 4개를 마닐라 폴더처럼 겹겹이 쌓아 보여주고, 활성(unlock된) 자료를 선택해 본문 모달로 진입한다. 빈칸을 풀수록 다음 자료가 순차 unlock된다 (pickone 룰).

### 레이어 구조

| 레이어 | 요소 | 비고 |
|---|---|---|
| 배경 | 화면 전체 BG = 카테고리 컬러 | 226 결 이어감 |
| 상단바 | 앱 헤더 (타이머·로고·프로필) | 투명 배경 |
| 본문 | 주제 띠 / 스토리 제목 탭 / 시트 / 자료 카드 묶음(4) | phase-banner + phase-sheet 구조 |
| 오버레이 | 자료 본문 모달 / 정답 모달 / 토스트(잠긴 카드) / 진입 깜빡 | 자료 선택·잠금·풀이 시 |

### ASCII 도식

```
┌────────────────────────────────┐
│ ⟦상단바: 타이머·로고·프로필⟧     │  ← 배경 = 카테고리 컬러
│                                │
│ ┌──────────────────────────┐   │
│ │ ⟦주제 띠⟧ DMZ 기본정보     │   │  ← z=1, 전체 폭
│ │   DMZ 기본정보  ⟦스토리 제목 탭⟧│  ← 회색 띠와 같은 줄 좌우 분할
│ │                  DMZ의 탄생  │   │   (z=3, 우측 60%, height 64)
│ │ ┌─────────────────────┐ │   │
│ │ │ ⟦시트 — 흰 폴더 박스⟧│ │   │  ← z=2
│ │ │ ┌──────────────────┐│ │   │
│ │ │ │자료 1번 (z=1, 위) ││ │   │  ← 자료 카드 묶음
│ │ │ │┌─────────────────┤│ │   │
│ │ │ ││자료 2번 (z=2)    ││ │   │
│ │ │ ││┌────────────────┤│ │   │
│ │ │ │││자료 3번 (z=3)   ││ │   │
│ │ │ │││┌───────────────┤│ │   │
│ │ │ ││││자료 4번 (z=4, 아래)│ │  │
│ │ │ └──────────────────┘│ │   │
│ │ └─────────────────────┘ │   │
│ └──────────────────────────┘   │
└────────────────────────────────┘
```

### 본문 elements (5)

| 요소 | 역할 | 클릭 동작 |
|---|---|---|
| 주제 띠 | 현재 작업 중인 카테고리(주제) 이름 표시 (예: "DMZ 기본정보") | **스토리선택**으로 (`exitToStoryList()`) — 5/16 결정 |
| 스토리 제목 탭 | 현재 스토리 제목 표시 (예: "DMZ의 탄생"). 텍스트 컬러 = 카테고리 컬러 — 5/16 세션361 | 미활용 (정보 표시) |
| 시트 | 흰 폴더 박스. 자료 카드 묶음의 배경 | — |
| 자료 카드 묶음 (4) | 자료 1~4번이 z 위계로 쌓임 | 활성 카드 → 자료본문 진입 / 잠긴 카드 → 흔들기 + 토스트 |
| (폐기) game-header | `←` + 위치 + "빈칸 복원 0/4" 한 줄 | **5/16 폐기**. 뒤로 가는 길은 주제 띠가 담당 |

### 자료 카드 묶음 — Z 위계

- **자료 1번** (위치상 최상단, `z=1`) — 다른 카드들이 그 위로 덮음. 살짝만 보이는 영역
- **자료 2번** (`z=2`)
- **자료 3번** (`z=3`)
- **자료 4번** (위치상 최하단, `z=4`) — 가장 위에 덮이며 가장 넓게 보임

코드: `<div class="source-card" style="z-index:${i+1}; margin-top:-32px;">`. `i=0`이 첫 카드(z=1), `i=3`이 마지막(z=4).

**위치 호칭 = 슬롯 호칭 (정본 — 고정 매핑)**: 자료 1번/2번/3번/4번 = A(편지)/B(신문)/C(사진)/D(구술). Z 위계·아이콘 결 모두 위치에 1:1 고정. 5/17 세션362 확정 — 이전 "위치 ≠ 슬롯" 문구는 폐기.
**pickone에서 "가변"의 자리**: 첫 자료(=unlock 순서의 시작)가 A/B/C/D 중 가변. **표시 위치 자체는 가변 아님** — 화면에 항상 A(자료1)→B(자료2)→C(자료3)→D(자료4) 순으로 쌓임. unlock 순서만 사이클로 변함.

### 자료 카드 세부 (4장 공통, 7 요소)

각 카드 안의 공통 구조. "자료 2번 카드 세부" 발화 시 이 레벨로 진입.

| 요소 | 역할 | 비고 |
|---|---|---|
| 카드 배경 | cat-color 폴더 모양 | `border-radius: 18px`, 시트보다 살짝 진한 음영 |
| 좌상 사선 탭 | 마닐라 폴더 결 | clip-path 사다리꼴 |
| 자료 아이콘 | **위치별 고정** — 자료 1번=personal_tab(편지) / 2번=news_tab(신문) / 3번=photo_tab(사진) / 4번=oral_tab(구술). type 무관 | `assets/icons/{key}.png` (`POSITION_ICONS[i]`). 크기 150px, 위치 우하단(right 1.6rem, bottom -2px) — 5/17 세션362 (위치 기반으로 정정) |
| 자료 제목 | 자료의 짧은 식별자 | `.source-card-title` |
| 메타 정보 | 출처·날짜·문서 제목 | `.source-card-meta` |
| 잠금 표시 | 🔒 (locked 상태만). 위치 홀수(1·3)는 `--c-gray-card` #E8E8E8, 짝수(2·4)는 `--c-gray-card-alt` #D8D8D8 — 5/16 세션361 짝수/홀수 변주 | `.source-card.locked` / `.card-shade-alt` |
| 활성 표시 | 빈칸 풀린 자료의 체크·테두리 | `.source-card.solved` |

### 상호작용

| 상태 / 이벤트 | 동작 |
|---|---|
| 활성(unlock) 자료 클릭 | 자료본문 모달 진입 (`openSource(id)`) |
| 잠긴 자료 클릭 | 흔들기(`locked-shake`) + 토스트 "🔒 자료 X의 빈칸을 먼저 풀어야 열립니다" |
| 자료본문 닫기 | 시트로 복귀. 다음 unlock 자료가 있으면 1.65s 초록 깜빡 3회 |
| 빈칸 정답 풀이 | 다음 자료 unlock + 진입 시 깜빡 큐 등록 |
| 주제 띠 클릭 | 스토리선택 화면으로 복귀 (`exitToStoryList()`) |

### CSS 매핑

```
배경            → #game-screen { background: var(--cat-color); }
상단바          → #game-screen .app-header { background: transparent; }
주제 띠         → .phase-cat-tab
스토리 제목 탭  → .phase-story-tab
시트            → .phase-sheet
자료 카드 묶음  → .game-content > (sequence of .source-card)
자료 카드 1장   → .source-card (style="z-index:N")
자료 카드 잠금  → .source-card.locked
자료 카드 활성  → .source-card.solved
자료 본문 모달  → #source-detail / .detail-inner
```

### 결정 자리 / 미해결

1. ~~**두 화면 헤더 높이 미세 차이** ⚠️ — CSS px(64/82)는 자료선택·스토리선택 동일. 시각상 차이 잔존~~ → **5/17 세션362 해소**. 시각 차이 원인은 헤더 박스가 아니라 부모/시트 결합 결이었음 — game-content padding-top 0.8→0, phase-banner margin-bottom 0.4→0, phase-sheet border-radius 사방 라운드→`18px 0 18px 18px`(스토리선택과 동일) + margin-top -14→0, 흰 탭 padding-right 1.1→1.4. 두 화면 헤더+시트 한 덩어리 결로 통일
2. **진행 카운트(0/4) 자리** — 폐기된 game-header에서 표시하던 "빈칸 복원 0/4"를 어디에 둘지. 후보: ① 자료 카드 묶음 상단 라벨 ② 시트 헤더 ③ 스토리 제목 탭 부속 ④ 표시 안 함
3. **era / soundNote 위치** — phase-sheet에서 제거. 자료 본문 모달 또는 다른 자리 후속 결정
4. **자료 카드 활성 표시 비주얼** — 추가 정밀화 (현재 status 아이콘만)
5. **자료 카드 잠금 표시** — status_locked.png + navy mask 적용됨. 위치·크기 후속 조정 자리
6. **스토리 제목 탭 클릭 동작** — 미활용. 정보 표시만 / 어떤 동작 부여?
7. **자료 카드 진입 애니메이션** — 현재 `animation-delay: ${i*0.1}s` 순차 fade-in. 정밀화 자리

### 5/17 세션362 추가 적용

- **헤더+시트 결 통일**: 자료선택을 스토리선택 결에 맞춤. `.game-content` padding-top 0.8rem→0 / `.phase-banner` margin-bottom 0.4rem→0 / `.phase-sheet` border-radius 사방 14→`18px 0 18px 18px` (좌상 라운드, 우상 직각 — 흰 탭과 이어짐) + margin-top -14→0 / 흰 탭 padding-right 1.1→1.4rem. 두 화면 모두 헤더와 시트가 한 덩어리로 읽힘
- **흰 탭 height 통일 (솟음 폐기)**: 회색 띠와 흰 탭 모두 64px. 이전 흰 탭 82px(회색 띠 위로 18px 솟음) → 64px로 회색 띠와 같은 줄에서 좌우 분할되는 결. 두 화면 동일 적용 (`.phase-story-tab` / `.story-cat-banner`)
- **시트 padding-top 통일**: 두 화면 모두 30px. 이전 자료선택 2rem(32px) / 스토리선택 1.2rem(19.2px) → 30px 통일. 첫 본체(자료 카드 / 폴더)까지 시각 시작점이 두 화면에서 같은 결
- **시트 라인이 헤더를 가로지르는 결**: 시트가 헤더 박스(0~64) 위 15px 올라옴(`margin-top: -15`, z=2). 회색 띠·흰 탭(둘 다 z=1)의 아래 15px이 시트에 가려짐. 흰 탭은 회색띠와 동일한 박스(`top: 0`, `height: 64px`)에 좌우 분할로 자리. 좌표:
  - 0~49: 회색 띠·흰 탭 보이는 영역 (좌우 분할, clip-path 사선으로 비킴. width 100% 회색 띠 + width 60% 우측 흰 탭)
  - 49: 시트 라인 (시트 시작)
  - 49~64: 회색 띠·흰 탭이 시트에 가려지는 영역 (15px)
  - 64: 헤더 박스 bottom
  - 49+30=79: 시트 padding-top 30 뒤 첫 본체 시작
- **자료 카드 겹침 -20→-40**: 카드 하단이 다음 카드 아래로 40px 들어감(가시 여백 16~20px대로 축소). padding-bottom 3.8rem 유지, card-header padding-top 1.3rem 유지
- **자료 아이콘 크기**: `.card-icon-img` width 120→180→150. 위치(right 1.6rem, bottom -2px) 유지
- **자료 아이콘 매핑 = 위치 기반 (type 기반 폐기)**: type 기반 `SOURCE_ICON_MAP`(kakao·text·scholar 등이 잘못 personal_tab으로 떨어지던 자리) 폐기 → `POSITION_ICONS[i]` (0:편지, 1:신문, 2:사진, 3:구술). DMZ 관리체계(s0104) D 위치 카카오톡 대화가 편지 아이콘으로 떠 있던 버그 정정. 영향 7건: s0102·s0103·s0104·s0105·s0203·s0302·s0403

### 5/16 세션361 디자인 v3 적용 사항

- **헤더 결**: 자료선택·스토리선택 통일 — 전체 폭 회색 띠(`.phase-cat-tab`/`.btn-back-round`) + 우측 60% 흰 탭(`.phase-story-tab`/`.story-cat-banner`). ~~헤더 64px, 흰 탭 82px 고정~~ → 5/17 세션362: 둘 다 64px (솟음 폐기)
- **마닐라 결**: 좌상 탭(라운드 + 우상 안쪽 경사) / mirror(좌측 안쪽 경사 + 우상 라운드). 모두 clip-path polygon
- **자료 카드**: min-height 160px, padding-bottom 3.8rem, margin-top -20px (카드 사이 가시 여백 28px)
- **자료 status 아이콘**: mask 방식, 색 코드로 자유 — 잠긴=navy / 활성=흰색 / 완료=cat-color, 크기 1.4em
- **스토리 제목 탭 텍스트**: cat-color 적용 (배경 흰색)
- **주제 띠 클릭**: 스토리선택으로 (`exitToStoryList()`)
- **"다른 주제 선택"** (btn-back-round 텍스트)

### Figma 참조

- `240.svg` — 자료 카드 4 쌓임 + 시트 + 주제 띠 + 스토리 제목 탭 layout
- `241.svg` / `242.svg` — 진행 상태별 변주 (잠긴 카드 / 풀린 카드)
- 디자이너 의도 BG: 회색. 피터공 5/16 결정: BG = cat-color (226에서 이어짐)

---

## 스토리선택 (HTML: `story-screen` · Figma 226)

### 한 줄 정의

한 주제(카테고리) 안의 스토리들을 마닐라 폴더 격자로 나열한다. 활성 스토리를 클릭하면 자료선택 화면으로 진입한다. 완료된 스토리는 폴더가 흐려지고 제목 끝에 ✓가 붙는다.

### 레이어 구조

| 레이어 | 요소 | 비고 |
|---|---|---|
| 배경 | 화면 전체 BG = 카테고리 컬러 | 226 결 — 자료선택까지 이어짐 |
| 상단바 | 앱 헤더 (타이머·로고·프로필) | 투명 배경 |
| 본문 | 헤더(다른 주제 선택 + 카테고리명) / 시트 / 스토리 폴더 격자 2열 | story-folder-header + story-page-body |
| 오버레이 | (없음) | — |

### ASCII 도식

```
┌────────────────────────────────┐
│ ⟦상단바: 타이머·로고·프로필⟧     │  ← 배경 = 카테고리 컬러
│                                │
│ ┌──────────────────────────┐   │
│ │ ⟦다른 주제 선택⟧   ⟦카테고리명⟧ │  ← 회색 띠(z=1, 전체 폭) + 흰 탭(z=3, 우측 60%)
│ │                              │   │   둘 다 height 64 (같은 줄 좌우 분할)
│ │ ┌─────────────────────┐ │   │
│ │ │ ⟦시트 — 흰 폴더 박스⟧│ │   │  ← z=2, 좌상 라운드 18, 우상 직각
│ │ │ ┌────┐ ┌────┐       │ │   │
│ │ │ │📁 1│ │📁 2│        │ │   │  ← 폴더 격자 2열
│ │ │ │제목│ │제목│        │ │   │
│ │ │ └────┘ └────┘       │ │   │
│ │ │ ┌────┐ ┌────┐       │ │   │
│ │ │ │📁 3│ │📁 4│        │ │   │
│ │ │ └────┘ └────┘       │ │   │
│ │ │ ┌────┐ ┌────┐       │ │   │
│ │ │ │📁 5│ │📁 6│        │ │   │
│ │ │ └────┘ └────┘       │ │   │
│ │ └─────────────────────┘ │   │
│ └──────────────────────────┘   │
└────────────────────────────────┘
```

### 본문 elements (5)

| 요소 | 역할 | 클릭 동작 |
|---|---|---|
| 다른 주제 선택 (회색 띠) | 주제 선택 화면으로 복귀 | `showScreen('category-screen') + renderCategories()` |
| 카테고리명 (흰 탭) | 현재 카테고리 이름 표시. 텍스트 컬러 = cat-color | 미활용 (정보 표시) |
| 시트 | 흰 폴더 박스. 스토리 카드 격자의 배경 | — |
| 스토리 카드 (n개, 2열 격자) | 폴더(cat-color 55% 라이트) + 제목 + era. 카드 = 폴더 본체 + 뒷장 + 좌상 사선 탭 | 활성 → `startStory(id)` 자료선택 진입 / 완료 → 비활성 |
| 폴더 외부 제목·era | 카드 아래(폴더 외부)에 제목 + era 좌측 정렬 | — |

### 스토리 카드 세부 (5 요소)

각 폴더 카드의 공통 구조.

| 요소 | 역할 | 비고 |
|---|---|---|
| 폴더 본체 | cat-color 폴더 모양 | `aspect-ratio: 1.625 / 1`, `border-radius: 0 14px 14px 14px` (좌상 사선 탭과 어우러짐) |
| 좌상 사선 탭 | `::before` 마닐라 폴더 결 | clip-path polygon, width 52%, height 12px, 위 -11px |
| 폴더 뒷장 | `.folder-back` div, cat-color 55% 라이트 | color-mix |
| 제목 (`h3`) | 스토리 제목. 폴더 외부 아래 | `color: navy`, `font-size 0.88rem`, `font-weight 600`, 좌측 정렬, 한국어 줄바꿈 (`word-break: keep-all`) |
| era | 시대·연도 등 부제 (있을 때만) | `font-size 0.7rem`, `opacity 0.7`, 좌측 정렬 |
| 완료 표시 | `.completed`: 폴더 `opacity: 0.55` + h3에 `✓` 추가 | `.story-card.completed .story-folder` / `h3::after { content: ' ✓' }` |

### 상호작용

| 상태 / 이벤트 | 동작 |
|---|---|
| 다른 주제 선택 클릭 | category-screen으로 복귀 |
| 스토리 카드 (활성) 클릭 | `startStory(id)` — 자료선택 화면 진입 |
| 스토리 카드 (완료) 클릭 | 비활성 (onclick 빈 문자열) |
| 카테고리명 탭 클릭 | 미활용 |
| 카드 hover | `transform: translateY(-2px)` |

### CSS 매핑

```
배경            → #story-screen { background: var(--cat-color); }
상단바          → #story-screen .app-header { background: transparent; }
컨테이너        → .story-page (max-width 500px, padding 0 1rem 2rem)
헤더 컨테이너   → .story-folder-header (height 64, padding 0)
회색 띠         → .btn-back-round (height 100%, clip-path 우측 사선)
흰 탭           → .story-cat-banner (absolute, top 0, height 64, width 60%, z=1, clip-path 좌측 사선)
시트            → .story-page-body (border-radius 18px 0 18px 18px, padding 1.2rem 1rem 1.4rem)
스토리 격자     → .story-list (display grid, grid-template-columns 1fr 1fr, gap 1rem)
스토리 카드     → .story-card (isolation isolate)
폴더 본체       → .story-card .story-folder (aspect 1.625, border-radius 0 14 14 14)
좌상 사선 탭    → .story-card .story-folder::before (clip-path polygon)
폴더 뒷장       → .story-card .story-folder .folder-back
완료 표시       → .story-card.completed .story-folder { opacity 0.55 } / h3::after { ' ✓' }
제목            → .story-card h3 (폴더 외부, font 0.88rem/600, 좌측 정렬)
era             → .story-card .story-era (font 0.7rem, opacity 0.7)
```

### 결정 자리 / 미해결

1. **카테고리명 탭 클릭 동작** — 자료선택의 "스토리 제목 탭"과 같은 상태(미활용). 두 탭 모두 정보 표시만. 통일된 의미 부여 자리 (예: 탭 클릭 → 상단 안내 토스트?)
2. **스토리 era 노출 룰** — 일부 스토리만 era 있음. 모든 스토리에 era를 채울지 / 비워둘지 / 표시 자체를 폐기할지
3. **완료 표시 강도** — 현재 폴더 opacity 0.55 + h3에 ✓. 시각상 약함. 카드 자체에 큰 ✓ 오버레이 / 폴더 색 변경 등 정밀화 자리
4. **스토리 카드 잠금** — pickone에서 스토리는 모두 unlocked 시작(주제 안에서 어느 스토리든 클릭 가능). 미래에 스토리 순차 잠금 룰 도입 시 빈 상태 / 잠금 비주얼 결정
5. **격자 gap·카드 사이즈 정밀화** — 현재 `gap: 1rem` + aspect 1.625. 스토리 6개 표시 시 시각 균형 검토
6. **빈 카테고리 처리** — `'스토리 준비 중입니다.'` 텍스트 1줄. 시각 보강 자리

### 5/17 세션362 결정

- **헤더+시트 결 통일**: 자료선택과 동일 — `.story-page-body`의 `border-radius: 18px 0 18px 18px` (좌상 라운드 18, 우상 직각 — 흰 탭과 자연 이어짐)가 정본. 자료선택의 `.phase-sheet`을 이 결에 맞춤
- **흰 탭 height 통일**: 회색 띠와 흰 탭 모두 64px. 이전 흰 탭 82px(솟음 18) → 64px. 같은 줄에서 좌우 분할되는 결. 두 화면 동일 적용

### Figma 참조

- `226.svg` — 헤더(다른 주제 선택 + 카테고리명) + 스토리 폴더 격자 layout
- 디자이너 의도 BG: 회색. 피터공 5/16 결정: BG = cat-color (자료선택까지 이어짐)

---

## 자료본문 (HTML: `source-detail` · Figma 프레임 샘플 1·2·3·4 = A·B·C·D)

### 한 줄 정의

자료선택 화면에서 활성 자료 카드를 클릭하면 진입한다. 같은 상단바·헤더 유지(자료선택과 연속) + 자료선택의 시트를 **핑크 박스**로 교체하는 결. 핑크 박스 안에 빈칸 복원 안내 + 자료 본문 + 인라인 빈칸 입력. 4 자료 type(A 편지/B 신문/C 사진/D 구술)이 **공통 결** — type별 세부 디테일은 다음 회기.

### 레이어 구조

| 레이어 | 요소 | 비고 |
|---|---|---|
| Layer 1 — 배경 | 화면 전체 BG = **cat-color** | 자료선택과 같은 결 |
| 상단바 | 앱 헤더 (타이머·로고·프로필) | 자료선택과 동일. 흰 로고 (`CAT_COLOR_BG_SCREENS` 포함) |
| 본문 헤더 | 주제 띠(회색) + 스토리 제목 탭(흰색) | 자료선택과 동일 — `.phase-banner` 재사용. 시트 라인 위 49 + 아래 15 가려짐 동일 |
| Layer 2 — 흰 시트 wrap | 흰 BG, 라운드 18 0 18 18, margin-top -15 | 자료선택 `.phase-sheet` 결과 좌표 동일 |
| Layer 3 — 주제색 박스 | cat-color BG, 사방 라운드 14, 흰 시트 안 자리 | 안내 영역(상단) + 본문 카드(아래)를 감싸는 카드 |
| 안내 영역 | "빈칸 복원하기" + X + 안내문. cat-color 위 흰 텍스트 | 주제색 박스의 상단 |
| Layer 4 — 본문 흰 카드 | 흰 BG, 사방 라운드 14, padding 1.4/1.2rem | 자료 type별 layout이 자리잡는 본문 프레임 |
| 오버레이 | 정답 모달 / 토스트 | 빈칸 정답 입력 시 |

### ASCII 도식 (4-layer)

```
┌────────────────────────────────┐
│ ⟦상단바: 30:00 · DMZ Archive · 프로필⟧│  ← Layer 1: 화면 BG cat-color
│                                │
│ DMZ 기본정보         DMZ의 탄생  │  ← 헤더 (자료선택과 동일)
│ ━━━━시트 라인━━━━━━━━━━━━━━━━│  ← 49 (margin-top -15)
│ ┌──────────────────────────┐  │
│ │ ⟦흰 시트⟧ (Layer 2)        │  │  ← 라운드 18 0 18 18, 흰 BG
│ │ ┌────────────────────────┐ │  │
│ │ │ ⟦주제색 박스⟧ (Layer 3) │ │  │  ← cat-color, 라운드 14
│ │ │  빈칸 복원하기      X  │ │  │  ← 상단 안내 (흰 텍스트)
│ │ │  빈칸 정답은 다른…      │ │  │
│ │ │ ┌──────────────────┐  │ │  │
│ │ │ │ ⟦흰 카드⟧ (Layer 4)│  │ │  │  ← 라운드 14, 흰 BG
│ │ │ │  자료 type별 본문 │  │ │  │
│ │ │ └──────────────────┘  │ │  │
│ │ └────────────────────────┘ │  │
│ └──────────────────────────┘  │
└────────────────────────────────┘
```

### 본문 elements (공통 결 5종)

| 요소 | 역할 | 비고 |
|---|---|---|
| 핑크 박스 헤더 | 핑크 BG. "빈칸 복원하기" 제목 + X 닫기 우상단 | 사방 라운드 또는 좌상 라운드 (시트 결과 합) |
| 안내문 | "빈칸 정답은 다른 자료에서 확인할 수 있습니다. 자료 X(...)를 읽어보세요." | 다른 자료 type 안내 자동 생성 |
| 흰 시트 | 자료 본문의 배경 박스 | 핑크 박스 안쪽 — 자료선택 phase-sheet 결 유지 |
| 자료 본문 | type별 layout (제목·메타·본문) | A·B·C·D 4종 다른 layout — 공통 결 우선, 세부 다음 |
| 인라인 빈칸 | 본문 안에 빈칸 [____] 입력 자리 | 클릭 → 정답 입력 모달 |

### 자료 type별 결 (A·B·C·D)

> 5/17 세션362: **공통 shell 우선** — 4종 모두 같은 헤더·핑크 박스·시트 결 사용. 본문 layout(제목·메타 위치, 본문 형식)도 일단 같은 결로 통일. type별 세부 디테일(편지 형식 보낸이/받는이, 신문 출처/매체, 사진 캡션, 구술 대화 말풍선)은 다음 회기 정밀화.

| 자료 | Figma 샘플 | 본문 layout (다음 회기 정밀화 자리) |
|---|---|---|
| A 편지 | 프레임 샘플 1 | 제목 + 날짜 + 보낸이/받는이 + 편지 본문 (letter-paper) |
| B 신문 | 프레임 샘플 2 | 헤드라인 + 출처 + 매체+날짜 + 기사 본문 (newspaper-paper) |
| C 사진 | 프레임 샘플 3 | 사진 이미지 + 캡션·메타 (photo-paper) |
| D 구술 | 프레임 샘플 4 | 인터뷰 형식 — 화자/대답 또는 말풍선 (oral-paper) |

### 상호작용

| 상태 / 이벤트 | 동작 |
|---|---|
| 자료선택에서 활성 카드 클릭 | 모달 진입 (`openSource(sourceId)`) |
| X 닫기 클릭 | 자료선택으로 복귀 (`closeSource()`) |
| 인라인 빈칸 [____] 클릭 | 정답 입력 모달 진입 |
| 정답 정확 입력 | 빈칸 채워짐 + 다음 자료 unlock + 진입 깜빡 큐 등록 |
| 빈칸 모두 풀이 완료 | 자료 status "복원 완료" → 닫고 다음 자료 진입 |

### CSS 매핑 (현재 코드)

```
화면 (L1)       → #source-detail-screen (BG cat-color, screen 패턴, CAT_COLOR_BG_SCREENS 포함)
content 컨테이너 → .source-detail-content (max-width 500, padding 0 1rem 2rem, gap 0.4rem)
헤더            → .phase-banner (자료선택과 같은 결 — 회색 띠 + 흰 탭)
흰 시트 (L2)    → .detail-white-sheet (BG white, border-radius 18 0 18 18, margin-top -15, padding 30 0.8 1.4)
주제색 박스 (L3) → .detail-topic-card (BG cat-color, border-radius 14, padding 1.2 1, color white)
안내 영역       → .detail-modal-header (transparent BG, 카드 상단에 자리)
제목 + X        → .detail-modal-title / .modal-close-x (흰 텍스트)
안내문          → .detail-modal-hint (흰 텍스트)
본문 프레임     → .detail-body-wrap (BG white, border-radius 14, padding 1.4rem 1.2rem, color navy)
자료 type 본문  → .letter-paper / .diary-paper / .scholar-paper / 등 (본문 프레임 안에 자리)
```

### 결정 자리 / 미해결

1. ~~**모달 자리 결 — fixed 100vh vs page-level** ⚠️~~ → **5/17 세션362 해소** — page-level로 정정. `#source-detail-screen` 별도 screen으로 분리. 자료선택과 같은 결(배경 cat-color + 상단바 + `.phase-banner` 헤더 + 핑크 시트). HTML 구조·CSS·JS(openSource/closeSource) 모두 page-level 결로 교체. `SCREEN_LABELS`·`CAT_COLOR_BG_SCREENS`에 자료본문 추가
2. **핑크 박스 헤더 라운드** — 현재 `0 0 16 16` (하단만). SVG 시트 결(좌상 라운드 18 + 우상 직각)과 통일?
3. **자료 type별 본문 layout 정밀화 (다음 회기)** — 편지 보낸이/받는이, 신문 출처/매체, 사진 캡션, 구술 대화. Figma 샘플 1·2·3·4 디자이너 의도와 비교
4. **인라인 빈칸 결** — 현재 paper styles에 자리잡고 있음. 공통 결로 추출하거나 type별 유지 자리
5. **스크롤 결** — 자료 본문 길이가 화면보다 길 때 스크롤 자리. 현재 `.source-detail { overflow-y: auto }` (모달 전체 스크롤). page-level 가면 시트만 스크롤로 변경 자리

### Figma 참조

- `프레임 샘플 1.svg` = A 편지 본문 (393×1315)
- `프레임 샘플 2.svg` = B 신문 본문 (393×1357)
- `프레임 샘플 3.svg` = C 사진 본문 (393×903)
- `프레임 샘플 4.svg` = D 구술 본문 (393×1097)
- 위치: `Assets/incoming/통일부/UI디자인샘플/figma_svg/`

---

## (다음 화면 — 주제선택)
