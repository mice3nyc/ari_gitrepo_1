# DMZ v5 — SPEC-pickone

> 네 번째 빌드(`pickone/`) 메카닉 명세. **sequential 룰 + 첫 자료 슬롯 변경 가능**. 5/15 세션355 신설.

---

## 핵심 메카닉

### 1. 자료 잠금 — sequential 룰 그대로, 시작점만 가변

sequential은 진입 시 **자료 A 고정 활성**. pickone은 진입 시 **데이터에서 지정된 슬롯**이 활성. 이후 잠금 해제 순서는 그 슬롯부터 A·B·C·D **사이클**.

예: 첫 슬롯 = `B`
- 진입: B 활성, A·C·D 잠금
- B 빈칸 풀이 완료 → C unlock
- C 빈칸 풀이 완료 → D unlock
- D 빈칸 풀이 완료 → A unlock

자료 카드 UI 표시 순서(A→B→C→D 4 칸)는 그대로. 잠금 해제 진행만 사이클.

### 2. 첫 자료 데이터 — `data/first_source.csv`

```csv
episode_id,slot,default_reason
s0101,B,photo=C | owner=B
s0102,A,photo=C | owner=A
...
```

24행, 한 스토리 한 행.
- `episode_id`: 스토리 ID
- `slot`: 첫 자료 슬롯 (`A`/`B`/`C`/`D`)
- `default_reason`: 디폴트 산출 근거 (편집 시 인지용, 빌드 무관)

**디폴트 산출 룰** (1회 자동, 이후 편집 가능):
- `dmz_blanks.csv`에서 `answer_from`이 photo 슬롯인 빈칸을 찾는다.
- 그 빈칸의 owner 슬롯(`blank_id` 첫 글자)을 첫 자료로 지정한다.
- 같은 스토리에서 여러 owner가 있으면 첫 등장 owner.
- photo answer_from이 없으면 `A` fallback (reason에 명시).

24 스토리 산출 결과:
- owner 명확 11개: s0101→B, s0102~s0104→A, s0403→B, s0404→B, s0405→A, s0601→C, s0602→C, s0604→C, s0605→C
- A fallback 13개: photo answer_from 없는 스토리 (편집 시 검토)

### 3. unlock 알고리즘

```js
const SOURCE_ORDER = ['A','B','C','D'];
const FIRST_SOURCE_LOOKUP = /* __FIRST_SOURCE_LOOKUP__ */ {};

function getStoryFirstSlot(storyId) {
  return FIRST_SOURCE_LOOKUP[storyId] || 'A';
}

function getUnlockOrder(storyId) {
  const first = getStoryFirstSlot(storyId);
  const idx = SOURCE_ORDER.indexOf(first);
  return SOURCE_ORDER.slice(idx).concat(SOURCE_ORDER.slice(0, idx));
}

function isSourceUnlocked(story, sourceId) {
  const order = getUnlockOrder(story.id);
  const first = order[0];
  if (sourceId === first) return true;
  const idx = order.indexOf(sourceId);
  if (idx <= 0) return true;
  const prevSourceId = order[idx - 1];
  return isSourceCompleted(story, prevSourceId);
}
```

sequential 대비 변경:
- `SOURCE_ORDER` 그대로 (표시 순서)
- 새 함수 `getUnlockOrder(storyId)` — 첫 슬롯 기준 사이클 배열 반환
- `isSourceUnlocked` 시그니처 동일, 내부에서 `getUnlockOrder` 사용

### 4. closeSource flash 로직

```js
// closeSource 안:
const order = getUnlockOrder(story.id);
const idx = order.indexOf(closingSourceId);
const nextSourceId = order[idx + 1];  // 사이클 다음
```

sequential은 `SOURCE_ORDER.indexOf(closingSourceId) + 1`. pickone은 동적 order.

### 5. LocalStorage 분리

```js
const LS_PREFIX = 'dmz_v5_p_';   // pickone
```

mobile(`dmz_v5_m_*`), offline(`dmz_v5_o_*`), sequential(`dmz_v5_s_*`)과 완전 분리.

### 6. 진입 시 첫 자료 깜빡 + 잠긴 자료 토스트 (5/15 세션355 추가)

#### 진입 시 첫 자료 깜빡

`startStory(storyId)` 안 — `getStoryFirstSlot(storyId)` 슬롯을 `state.justUnlockedSourceId`에 넣어 첫 렌더 시 `.just-unlocked` 클래스 적용. `card-unlock-flash` 키프레임 3회 반복(0.55s × 3 = 1.65s). 1700ms 후 `state.justUnlockedSourceId` null로 자동 해제. `flashedSources`에 미리 push해서 중복 깜빡 방지.

#### 잠긴 자료 클릭 → 토스트

기존 sequential 베이스는 `pointer-events: none`으로 클릭 자체 차단. pickone은 차단 해제 + `openSource` 안에서 잠김 분기:

```js
if (!isSourceUnlocked(story, sourceId)) {
  // 해당 카드 흔들기 + 토스트
  showToast('locked', '🔒 잠긴 자료', '자료 X의 빈칸을 먼저 풀어야 열립니다');
  return;
}
```

토스트 type `locked` 추가 — 아이콘 🔒, 기존 토스트 CSS 재활용. 카드는 `.locked-shake` 클래스로 0.4s 좌우 흔들기.

### 7. BLANK_SOURCE_LOOKUP

sequential과 동일. `dmz_blanks.csv`의 `answer_from` → 모달 정답 자료 라벨.

---

## 빌드

```
shared/index_pickone.html      ← 단일 source
data/first_source.csv          ← 첫 자료 슬롯 (편집 가능)
shared/dmz_blanks.csv          ← answer_from
data/topics/*.yaml + data/sources/*  ← STORIES
                ↓ build_pickone.sh
pickone/index.html             ← 산출물
pickone/photos/                ← shared/photos 카피
```

빌드 스크립트(`scripts/build_pickone.sh`):
1. `shared/index_pickone.html` 읽기
2. STORIES + ARCHIVIST_TYPES 주입 (`build_stories_json.py`)
3. BLANK_SOURCE_LOOKUP 주입 (`dmz_blanks.csv` answer_from)
4. **FIRST_SOURCE_LOOKUP 주입** (`data/first_source.csv` slot)
5. JS syntax 검증
6. photos 카피

---

## 검증 체크

- [ ] 진입 시 데이터 지정 슬롯만 활성, 나머지 잠금 (예: s0101 B 활성, A·C·D 잠금)
- [ ] 첫 슬롯 빈칸 풀이 완료 → 사이클 다음 슬롯 unlock
- [ ] cycle 끝 → 처음 슬롯으로 돌아오지 않음 (모든 자료 다 unlock 후 종료)
- [ ] FIRST_SOURCE_LOOKUP 누락 시 A fallback
- [ ] LS 키 prefix `dmz_v5_p_` 확인
- [ ] BLANK_SOURCE_LOOKUP 모달 라벨 정상 (sequential과 동일)
- [ ] JS syntax (`node -e new Function(...)`)
- [ ] 디버그 패널 작동 (자동 풀이 시 사이클 진행 확인)

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-05-15 | 신설 — 세션355. sequential 베이스 + 첫 자료 슬롯 가변. `data/first_source.csv` 신설. |
