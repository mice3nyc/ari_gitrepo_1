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

- **파일럿**: `pickone/index.html` (가장 최근 빌드, 안전)
- **propagate 후보**: mobile / offline / sequential — pickone OK 후 동일 face 적용

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
