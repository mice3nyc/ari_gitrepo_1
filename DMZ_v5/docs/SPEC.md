# DMZ v5 — SPEC

> 두 플레이테스팅 빌드(mobile / offline) 기술 명세. 코드 작업 시 이 문서 + DATA-SPEC.md + BUILD-VARIANTS.md 함께 참조.

## 베이스

- **베이스 코드**: `_dev/DMZ_v5/shared/index_base.html` (정예공 4/28 빌드 + 영문화 패치)
- **원본 위치**: `Assets/incoming/통일부/dmz_game_jygong.html` (incoming 보존, shared/ 작업본 분리)
- **버전 관계**: v3.2 `_dev/DMZ/`(레거시 보존) → v4 `_dev/DMZ_v4/`(보존) → v5 `_dev/DMZ_v5/`(현재 작업)

## 데이터 구조

```js
const CATEGORIES = [6];          // cat01~06
const STORIES = {
  cat01: [Story...],             // 6개 완성
  cat02: [Story...],             // 6개 완성
  cat03: [Story...],             // 6개 완성
  cat04: [],                     // 7개 예정 (정예공 납품 대기)
  cat05: [],                     // 6개 예정 — 4/21 회의 "이번 주 갈등과협력"
  cat06: [],                     // 7개 예정 — "다음 주 평화관광"
};
```

각 Story:
```js
{ id, title, era, location, sources[4], blanks{}, choices[] }
```

각 Source: `{ id: 'A'|'B'|'C'|'D', type, templateData, src? }`

각 Blank: `{ answer, hint, source, altAnswers? }` — 빈칸 키는 `A`/`B`/`C`/`D` + `A1`/`A2`/`C2` 가변 (스토리마다 다름)

## 자료 type (12종)

`letter` `diary` `scholar` `newspaper` `photo` `oral` `kakao` `blog` `report` `homework` `text` `qna`

`renderSource(src, solvedBlanks, allBlanks)` 단일 함수가 type 스위치로 분기 렌더링. 빈칸 마커 `{{A}}`/`{{B}}` → `<span class="blank-slot">` 변환.

## AC/BD 분기 명세 (offline 빌드 전용)

### 분류
- **A, C 자료**: 모바일 화면에 본문 + 빈칸 모두 표시 (현재 동작)
- **B, D 자료**: 본문 가림 + `<현장의 출력물을 확인하세요>` 안내 카드. 빈칸 입력란만 표시.

### 동작 시퀀스

```
[자료 카드 4개] (cat01 카테고리 선택 → s0102 스토리 진입)
  ├─ A: 클릭 → source-detail 오버레이에 letter 본문 + 빈칸 표시 (정상)
  ├─ B: 클릭 → source-detail 오버레이에 [현장 안내 카드 + 빈칸 입력란만]
  │           → 빈칸 클릭 → 모달에서 정답 입력
  │           → 정답 맞춤 → 같은 오버레이 안에서 본문이 추가되어 보임 (in-place unlock)
  ├─ C: A와 동일 (정상)
  └─ D: B와 동일 (가림 → 정답 → unlock)
```

### unlock 상태 저장
- localStorage key: `dmz_v5_o_unlocks` (실제 코드: `LS_PREFIX + 'unlocks'`, offline 빌드에서 LS_PREFIX=`dmz_v5_o_`)
- 값: `{ [storyId]: ['B', 'D'] }` 형식 — unlock된 source.id 배열
- 재진입 시 unlock된 자료는 본문 보임 유지

### 안내 카드 디자인
- 자리: `source-detail` 오버레이의 본문 영역
- 텍스트: `현장의 출력물을 확인하세요` + 작은 부제 `정답을 입력하면 자료가 여기에 나타납니다`
- 시각: 점선 테두리 + 픽셀폰트 톤 유지 (Galmuri11/DotGothic16)

## 빌드 토글 메커니즘

`shared/index_base.html` 상단:
```js
const OFFLINE_MODE = false;  // 기본값. mobile 빌드는 그대로 / offline 빌드는 true로 변경
```

빌드 산출 시(BUILD-VARIANTS.md 참고):
- `mobile/index.html` ← shared/index_base.html 그대로 카피
- `offline/index.html` ← 카피 + `OFFLINE_MODE = false` → `true` 한 줄 변경

런타임 분기:
```js
function renderSource(src, solvedBlanks, allBlanks) {
  if (OFFLINE_MODE && (src.id === 'B' || src.id === 'D') && !isUnlocked(src.id)) {
    return renderLockedCard(src);  // 안내 카드 + 빈칸만
  }
  return renderNormal(src, solvedBlanks, allBlanks);
}
```

`submitAnswer()` 정답 시 → unlock 상태 저장 → `source-detail` 다시 렌더 → 본문 트랜지션으로 추가.

## 베이스 패치 (Phase 3 — 두 빌드 fork 전 공통 적용)

`shared/index_base.html`에 미리 반영해서 두 빌드 모두 혜택:

1. **s0101 D 빈칸 altAnswers 부활** — `'사', '4km', '4킬로미터'` 추가
2. **`normalizeAnswer` 부활** — 공백/괄호 제거 + 소문자 비교 (4/21 회의 "복수정답=필수" 정신)
3. **`localStorage` 키 분리** — 기존 `dmz_diary_v2`(고정)을 v5용 `dmz_v4` 또는 플레이어별로 (인턴 24명 동시 플레이 시 덮어쓰기 방지)
4. **cat02 `2-6_` 번호 충돌 정정** — Phase 1 백도에서 처리 완료(용늪 → 2-9.jpg)

## 정답 검증

```js
function normalizeAnswer(s) {
  return s.trim().replace(/\s+/g, '').replace(/[()（）]/g, '').toLowerCase();
}

function checkAnswer(input, blank) {
  const n = normalizeAnswer(input);
  if (normalizeAnswer(blank.answer) === n) return true;
  if (blank.altAnswers && blank.altAnswers.some(a => normalizeAnswer(a) === n)) return true;
  return false;
}
```

## 디버그 패널

> 5/15 세션354 신설. 베타 테스트·개발 중 빠른 상태 조작. AI 리터러시 v11 패턴 차용.

### 진입

- **버튼**: 화면 우하단 작은 `디버그` 토글 (검은 배경, 11px)
- **URL 파라미터**: `?reset=1` 로드 시 localStorage 즉시 clear 후 reload
  - (Ctrl+Shift+R 하드 리로드는 브라우저가 캐치해서 페이지가 받지 못함. URL 파라미터 또는 버튼이 유일한 자동 초기화 방법)

### 기능

| 버튼 | 동작 |
|------|------|
| 🧹 **상태 초기화** | `dmz_v5_*` 키 전부 삭제 후 페이지 reload |
| ⚡ **현 스토리 자동 풀이** | 현 스토리 모든 빈칸을 정답으로 채움 (블랭크 답 + altAnswers 첫 항목) |
| 🎯 **카테고리 완료** | 현 카테고리 전체 스토리를 completed로 마킹 |
| 🏁 **전체 완료** | 24 스토리 전부 completed로 마킹 |

### 상태 표시

- 완료 스토리: `state.completedStories.length / 24`
- 아카비스트 카운트: A/B/C/D 각각
- 현 화면 ID
- 빌드 모드 (mobile/offline)

### 스타일

- 패널: 우하단 fixed, max-width 420px, 검은 배경, monospace
- 베타에서도 표시 (인턴 베타 자체 테스트 자리). 런칭 시 토글 버튼 숨김 옵션 추후 결정

## DMZ 픽셀 맵 (archive 화면)

> 5/15 세션354 갱신. 런칭 스코프 5 카테고리 × 24 스토리 정합.

archive(리포트) 화면 상단 `buildDmzMapSvg()`가 그리는 픽셀 SVG. DMZ 곡선 형태(서쪽 넓고 중부 남하, 동쪽 상승) 5행 그리드. 각 셀 = 1 스토리. 완료 스토리 수만큼 좌→우, 위→아래 순서로 카테고리 색상으로 채워짐.

### 카테고리 인덱스 ↔ ID 매핑 (5 cats)

| index | id | 스토리 수 |
|-------|-----|----------|
| 0 | cat01 (DMZ 기본정보) | 6 |
| 1 | cat02 (생태환경) | 6 |
| 2 | cat03 (국가유산·문화재) | 4 |
| 3 | cat04 (DMZ의 사람들) | 4 |
| 4 | cat06 (평화 관광) | 4 |

총 24 셀.

### 색상 — `CAT_COLORS` (5 entries)

```javascript
const CAT_COLORS = ['#3B82F6', '#22C55E', '#A855F7', '#EF4444', '#06B6D4'];
//                   cat01 청    cat02 녹    cat03 보    cat04 적    cat06 청록
```

### 맵 데이터 — 5행 × 가변 col

```javascript
// 0=cat01(6) 1=cat02(6) 2=cat03(4) 3=cat04(4) 4=cat06(4)
// 총 24 셀, DMZ 곡선 형태 (서쪽 넓고 중부 남하, 동쪽 상승)
const map = [
  [-1,-1,-1,-1,-1,-1,-1,-1,-1, 4, 4],
  [-1,-1,-1,-1,-1, 2, 3, 3, 3, 4, 4],
  [ 0, 0, 1, 1, 2, 2, 2, 3,-1,-1,-1],
  [ 0, 0, 1, 1, 1,-1,-1,-1,-1,-1,-1],
  [ 0, 0, 1,-1,-1,-1,-1,-1,-1,-1,-1],
];
// 검증: 0→6, 1→6, 2→4, 3→4, 4→4 = 24 ✓
```

### catCounter

각 카테고리 완료 셀 카운터. 길이 = CATEGORIES.length = 5.

```javascript
const catCounter = [0, 0, 0, 0, 0];
```

### 변경 이력 — DMZ 픽셀 맵

| 날짜 | 변경 | 사유 |
|------|------|------|
| 이전 | 6 cats × 36 cells (6+5+6+7+6+7=37, cat02·cat04·cat06 셀 수 콘텐츠 수와 불일치) | 디자인 단계 가상 수치 |
| 2026-05-15 (세션354) | 5 cats × 24 cells (정확 정합) | cat05 통삭 + 8 스토리 archive 후 런칭 스코프 24로 정합 |

## 의존성

- 외부 CDN: Google Fonts (Galmuri11, DotGothic16) — 픽셀 게임 폰트
- 브라우저 API: localStorage, fetch (없음 — 인라인 데이터)
- 프레임워크 없음 (단일 HTML + 바닐라 JS)

## 미해결 (확인 필요)

- cat04~06 콘텐츠 도착 일정 (정예공). cat04~06 STORIES는 현재 빈 배열
- `twitter` type — renderSource switch에 case 존재하나 STORIES 사용 0건 (dead branch). cat04~06 데이터 확정 시 사용/제거 결정
- 한글 파일명 NFD/NFC 이슈 → 영문화로 해결됐는지 GitHub Pages 실서버 테스트 필요
- offline 빌드 디바이스 명세 (몇 인치 화면? 터치/마우스? 자동 reset?)

## 게임 코드 (로그인)

- v3.2~v5.0: `DMZ` (대소문자 무관, `디엠지` 허용)
- **v5.1 (2026-05-15)**: `1233` (단순 비교, 베타 테스트 입력 간소화)
- 자리: `shared/index_base.html` + `shared/index_sequential.html` `checkLogin()` 함수

## 변경 이력

| 날짜 | 버전 | 내용 |
|------|------|------|
| 2026-04-29 | v4.0-prep | 베이스 + AC/BD 분기 명세 |
| 2026-05-14 | v5.0 | v5 분기 인계. unlock 키 문자열 정정(`dmz_v5_offline_unlocks` → `dmz_v5_o_unlocks`), v3.2→v4→v5 관계 명시 |
| 2026-05-15 | v5.1 | 게임 코드 DMZ → 1233 (베타 테스트 입력 간소화). SPEC-data v2 §17 마크다운 face 결정 박힘 (텍스트 subtype 9종 본문 통째 markdown → HTML). 두루미 s0202 본문화 파일럿 완료 |
