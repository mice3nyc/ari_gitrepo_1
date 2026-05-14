# DMZ v4 — CODE-FORK-POINTS

> `shared/index_base.html` (160KB / ~2,392줄)에서 두 빌드 분기와 베이스 패치가 발생할 라인 정찰. 실제 작업 시 이 문서 + SPEC.md를 함께 펼쳐 놓고 진행.

## 핵심 라인 인덱스 (빠른 점프)

| 라인 | 위치 | 무엇 |
|------|------|------|
| 5 | `<meta>` viewport | `user-scalable=no, maximum-scale=1.0` |
| 8 | `@import` Google Fonts | Galmuri11, DotGothic16 |
| 23 | `body` font-family | 픽셀폰트 적용 |
| 36, 66, 80, 88, 150 ... | CSS `max-width` | 400~500px 컬럼 패턴 (offline 디바이스 분기 시 핵심) |
| 517 | `function renderSource()` | ★ BD 가림 분기 1차 후보 |
| 1895 | localStorage load | `dmz_diary_v2` 읽기 |
| 1918 | tutorial 분기 | `dmz_diary_tutorial_done` 체크 |
| 1927 | tutorial 저장 | 첫 완료 시 |
| 2187 | `function openSource()` | 자료카드 클릭 핸들러 |
| 2213 | `function openAnswerModal()` | 빈칸 클릭 핸들러 |
| 2233 | `function submitAnswer()` | ★ 정답 처리 + unlock 트리거 후보 |
| 2313 | localStorage save | `dmz_diary_v2` 쓰기 |
| 2386~2387 | `localStorage.removeItem` | reset 처리 |

## 분기 1: BD 가림 (offline 빌드 ★ 핵심)

### 위치
`renderSource(src, solvedBlanks, allBlanks)` — L517

### 변경 방식
함수 진입부에 분기 한 블록 추가:

```js
function renderSource(src, solvedBlanks, allBlanks) {
  // [추가] offline 빌드 + B/D 자료 + 미unlock = 안내 카드 반환
  if (OFFLINE_MODE && (src.id === 'B' || src.id === 'D') && !isUnlocked(currentStoryId, src.id)) {
    return renderLockedCard(src, allBlanks);
  }
  // [기존 그대로]
  switch (src.type) { ... }
}
```

### 신규 헬퍼

```js
function isUnlocked(storyId, sourceId) {
  const unlocks = JSON.parse(localStorage.getItem('dmz_v5_offline_unlocks') || '{}');
  return (unlocks[storyId] || []).includes(sourceId);
}

function renderLockedCard(src, allBlanks) {
  // 안내 카드 + src의 빈칸 입력란만 보여주기
  // UI-MAP.md `.bd-locked-card` 참고
  const myBlanks = Object.entries(allBlanks).filter(([k, b]) => b.source === src.id);
  return `
    <div class="bd-locked-card">
      <div class="bd-locked-icon">📄</div>
      <div class="bd-locked-title">현장의 출력물을 확인하세요</div>
      <div class="bd-locked-sub">정답을 입력하면 자료가 여기에 나타납니다</div>
    </div>
    <div class="bd-locked-blanks">
      ${myBlanks.map(([k, b]) => `<button class="blank-slot empty" data-blank="${k}">${k}</button>`).join('')}
    </div>
  `;
}
```

### 주의
- 빈칸이 위치한 source(`b.source === src.id`)와 빈칸 키(`A`/`B`/`C`/`D`/`A1`/`A2` 가변)는 다른 개념. 정확히 source.id 기준으로 필터.
- 빈칸 클릭 → 답변 모달은 그대로 (`openAnswerModal`이 처리). 변경 불필요.

## 분기 2: 정답 입력 → unlock (offline ★)

### 위치
`submitAnswer()` — L2233

### 변경 방식

정답 처리 직후, OFFLINE_MODE이고 B/D였으면 unlock 저장 + source-detail 다시 렌더:

```js
function submitAnswer() {
  // [기존 정답 검증 + state 갱신]
  ...
  if (correct) {
    // [기존 toast + filled 처리]
    ...
    // [추가] offline 빌드 unlock 처리
    if (OFFLINE_MODE) {
      const blank = currentStory.blanks[currentBlankKey];
      const sourceId = blank.source;
      if (sourceId === 'B' || sourceId === 'D') {
        const unlocks = JSON.parse(localStorage.getItem('dmz_v5_offline_unlocks') || '{}');
        if (!unlocks[currentStory.id]) unlocks[currentStory.id] = [];
        if (!unlocks[currentStory.id].includes(sourceId)) {
          unlocks[currentStory.id].push(sourceId);
          localStorage.setItem('dmz_v5_offline_unlocks', JSON.stringify(unlocks));
        }
        // 현재 source-detail이 잠긴 자료라면 다시 렌더
        if (currentSourceId === sourceId) {
          openSource(sourceId);  // 같은 자료 다시 열어 본문 노출
        }
      }
    }
  }
}
```

### 주의
- `openSource(sourceId)`가 source-detail을 재구성한다고 가정. 실제 구현 확인 필요.
- 트랜지션은 CSS로 처리(UI-MAP.md `.bd-unlock-transition`).

## 분기 3: localStorage 키 분리 (베이스 패치)

### 위치
- L1895 (load): `localStorage.getItem('dmz_diary_v2')`
- L2313 (save): `localStorage.setItem('dmz_diary_v2', ...)`
- L2386~2387 (reset): `removeItem`

### 변경 방식

상수로 빼서 관리:
```js
const LS_KEY = 'dmz_v5_state';                    // 또는 플레이어 이름별
const LS_TUTORIAL_KEY = 'dmz_v5_tutorial_done';
const LS_OFFLINE_UNLOCKS_KEY = 'dmz_v5_offline_unlocks';
```

플레이어 이름별 분리(인턴 24명 동시 플레이 환경 대응):
```js
const LS_KEY = `dmz_v5_state_${state.playerName || 'anon'}`;
```

### 빌드별 prefix (옵션)
mobile/offline 같은 도메인이라 키 충돌 가능. prefix 권장:
- mobile: `dmz_v5_m_*`
- offline: `dmz_v5_o_*`

또는 `OFFLINE_MODE`로 동적:
```js
const LS_PREFIX = OFFLINE_MODE ? 'dmz_v5_o_' : 'dmz_v5_m_';
const LS_KEY = LS_PREFIX + 'state';
```

## 분기 4: normalizeAnswer 부활 (베이스 패치)

### 위치
`submitAnswer()` 안 정답 비교 (L2233 근처)

### 변경 방식

```js
function normalizeAnswer(s) {
  return (s || '').trim()
    .replace(/\s+/g, '')
    .replace(/[()（）]/g, '')
    .toLowerCase();
}

function checkAnswer(input, blank) {
  const n = normalizeAnswer(input);
  if (normalizeAnswer(blank.answer) === n) return true;
  if (Array.isArray(blank.altAnswers) && blank.altAnswers.some(a => normalizeAnswer(a) === n)) return true;
  return false;
}
```

기존 `input.trim() === blank.answer` 직접 비교를 `checkAnswer(input, blank)` 호출로 교체.

## 분기 5: s0101 D altAnswers 부활 (베이스 패치)

### 위치
STORIES.cat01 안 s0101 객체. (L600~700 근처 추정 — 작업 시 grep으로 정확화)

### 변경 방식

```js
// before
D: { answer: '4', hint: '...', source: 'D' }

// after
D: { answer: '4', altAnswers: ['사', '4km', '4킬로미터'], hint: '...', source: 'D' }
```

## 분기 6: 디바이스 차이 (offline 빌드 옵션)

offline이 공간 설치물(대형 디스플레이)에 들어가면, `OFFLINE_MODE` 토글과 별도로 다음을 조정:

### 6-1. viewport (L5)
```html
<!-- before -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">

<!-- after (대형 디스플레이용 옵션) -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

### 6-2. max-width 일괄 확대 (L36 외 다수)

CSS 변수로 빼서 한 번에 조정:
```css
:root {
  --container-max: 500px;  /* mobile 기본 */
}
@media (min-width: 1024px) {
  :root { --container-max: 800px; }  /* 대형 디스플레이 */
}
.category-grid, .story-list, .detail-inner, .answer-modal, .archive-container { max-width: var(--container-max); }
```

### 6-3. 폰트 크기 (L23 등)
```css
html { font-size: 16px; }
@media (min-width: 1024px) {
  html { font-size: 22px; }  /* 1.4배 — 대형 디스플레이 원거리 시청 */
}
```

> 6번은 offline 빌드 디바이스 명세가 확정되면 진행. 5/26 인턴 베타는 모바일이라 mobile 빌드만 우선.

## 작업 권장 순서

1. **베이스 패치 먼저** (분기 3, 4, 5) — 두 빌드 공통
2. **빌드 토글 추가** — `OFFLINE_MODE` 상수 + `scripts/build.sh`
3. **offline 분기** (분기 1, 2) — `renderSource`, `submitAnswer`, 헬퍼 추가, CSS `.bd-*` 추가
4. **검증** — mobile 빌드 회귀 테스트(전과 동일하게 동작) + offline 빌드 BD unlock 시나리오
5. **(필요 시) 디바이스 분기** (분기 6) — offline 디바이스 명세 받은 후

## 변경 이력

| 날짜 | 버전 | 내용 |
|------|------|------|
| 2026-04-29 | v4.0-prep | 6개 분기 지점 정찰 (BD 가림, unlock, localStorage, normalizeAnswer, altAnswers, 디바이스) |
