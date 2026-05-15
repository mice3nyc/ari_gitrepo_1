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
