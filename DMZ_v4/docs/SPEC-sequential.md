# DMZ v4 — SPEC-sequential

> 세 번째 빌드(`sequential/`) 메카닉 명세. mobile/offline과 다른 게임 디자인 — 자료 순차 잠금 + 정답 자료 라벨 강조. 4/30 플테 후 신설.

---

## 핵심 메카닉

### 1. 자료 순차 잠금

각 스토리는 4개 자료(A, B, C, D)로 구성. 진입 시 **자료 A만 활성**, 나머지는 잠금.

**unlock 알고리즘**:
```js
function isSourceUnlocked(storyId, sourceId) {
  if (sourceId === 'A') return true;
  const order = ['A', 'B', 'C', 'D'];
  const idx = order.indexOf(sourceId);
  if (idx <= 0) return true;
  const prevSourceId = order[idx - 1];
  const story = STORIES[storyId];
  // 이전 자료의 빈칸 ID 추출 (blank_id가 prev로 시작하는 것)
  const prevBlankIds = Object.keys(story.blanks).filter(bid => bid.charAt(0) === prevSourceId);
  // 이전 자료에 빈칸이 0개면 자동 통과 (재귀)
  if (prevBlankIds.length === 0) return isSourceUnlocked(storyId, prevSourceId);
  // 이전 자료의 모든 빈칸이 풀렸는지
  return prevBlankIds.every(bid => state.solvedBlanks[bid]);
}
```

**진입 차단**: `openSource(sourceId)` 호출 시 `isSourceUnlocked` false면 무음으로 return (또는 짧은 진동/피드백).

**unlock 트리거**: `submitAnswer` 후 정답 통과 시 `renderExploration()` 다시 호출 → 자료 카드 상태 갱신.

### 2. 자료 카드 UI

```css
.source-card.locked {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none; /* 클릭 자체 차단 */
  filter: grayscale(0.8);
}
.source-card.locked .source-icon::after {
  content: " 🔒";
  font-size: 0.9em;
}
```

`renderExploration()`에서 자료 카드 렌더 시:
```js
const isLocked = !isSourceUnlocked(story.id, src.id);
const cardClass = isLocked ? 'source-card locked' : 'source-card';
```

### 3. 빈칸 모달 — 정답 자료 라벨

**모달 구조 변경**: 기존 `modal-hint` 위에 정답 자료 라벨 영역 신설.

```html
<div class="modal-source-hint" id="modal-source-hint">
  📍 정답은 <strong class="source-label-highlight" id="modal-source-label"></strong>에서 찾으세요
</div>
<div id="modal-hint"></div>
```

```css
.modal-source-hint {
  padding: 0.6rem 1rem;
  margin-bottom: 0.8rem;
  background: #fffbe6;
  border-left: 3px solid var(--accent);
  border-radius: 4px;
  font-size: 0.85rem;
}
.source-label-highlight {
  color: var(--accent);
  font-weight: bold;
}
```

**라벨 채우기 (openAnswerModal)**:
```js
function openAnswerModal(blankId) {
  const story = getCurrentStory();
  const blank = story.blanks[blankId];
  // 정답이 있는 자료 ID 조회
  const inSourceId = BLANK_SOURCE_LOOKUP[story.id + '_' + blankId];
  const sourceHintEl = document.getElementById('modal-source-hint');
  const sourceLabelEl = document.getElementById('modal-source-label');
  if (inSourceId) {
    const src = story.sources.find(s => s.id === inSourceId);
    if (src) {
      sourceLabelEl.textContent = `자료 ${inSourceId} — "${src.title}"`;
      sourceHintEl.style.display = 'block';
    } else {
      sourceHintEl.style.display = 'none';
    }
  } else {
    sourceHintEl.style.display = 'none';
  }
  // 기존 hint, label, input 채우기 ...
}
```

### 4. BLANK_SOURCE_LOOKUP 데이터

`dmz_blanks.csv`의 `in_source` 컬럼 → JS 객체로 변환.

**형식**:
```js
const BLANK_SOURCE_LOOKUP = {
  's0101_B': 'C',
  's0101_D': 'A',
  's0102_A1': 'A',
  's0102_B': 'D',
  // ... 71행
};
```

**생성 방법**: 빌드 스크립트(`scripts/build_sequential.sh`)가 CSV → 매핑 JS 자동 생성:

```bash
python3 -c "
import csv
mapping = {}
with open('shared/dmz_blanks.csv') as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row.get('in_source'):
            key = f\"{row['episode_id']}_{row['blank_id']}\"
            mapping[key] = row['in_source']
import json
js = 'const BLANK_SOURCE_LOOKUP = ' + json.dumps(mapping, ensure_ascii=False, indent=2) + ';'
print(js)
" > /tmp/blank_source_lookup.js
```

빌드 시 이 JS 스니펫을 베이스 file의 `// __BLANK_SOURCE_LOOKUP__` 마커 위치에 주입.

### 5. LocalStorage 분리

```js
const LS_PREFIX = 'dmz_v4_s_';
const LS_STATE_KEY = LS_PREFIX + 'state';
const LS_TUTORIAL_KEY = LS_PREFIX + 'tutorial';
```

mobile(`dmz_v4_m_*`), offline(`dmz_v4_o_*`)과 완전 분리. 한 도메인에서 세 빌드를 다 플레이해도 진행 상태 충돌 없음.

---

## 베이스 fork 작업 — mobile에서 제거할 코드

`shared/index_base.html` (mobile/offline 통합 베이스) → `shared/index_sequential.html`로 복사 후:

1. `const OFFLINE_MODE = false;` 선언 + 모든 OFFLINE_MODE 분기 제거
2. `isOfflineUnlocked()` 함수 + `LS_OFFLINE_UNLOCKS_KEY` 제거
3. `.bd-hidden`, `.bd-hidden::before`, `.src-heading` 관련 CSS 전부 제거
4. `submitAnswer` 안 OFFLINE_MODE unlock 블록 제거
5. `openSource` 안 bd-hidden 클래스 add/remove 제거
6. `LS_PREFIX` → `dmz_v4_s_`로 변경

---

## 빌드 산출

```
shared/index_sequential.html   ← 단일 source (작업 대상)
                ↓ build
sequential/index.html          ← 산출물
sequential/photos/             ← shared/photos에서 cp -R
```

빌드 스크립트:
```bash
#!/bin/bash
SHARED_SEQ="shared/index_sequential.html"
TARGET="sequential/index.html"

# CSV → JS 매핑 주입
python3 scripts/gen_blank_source_lookup.py > /tmp/lookup.js

# 베이스 + 매핑 주입
awk '/\/\/ __BLANK_SOURCE_LOOKUP__/{system("cat /tmp/lookup.js");next}1' "$SHARED_SEQ" > "$TARGET"

# photos 카피
mkdir -p sequential/photos
cp -R shared/photos/* sequential/photos/
```

---

## 검증 체크

- [ ] 진입 시 A만 활성, B/C/D 회색 자물쇠
- [ ] A 모든 빈칸 풀이 후 B 활성 (즉시 카드 색 복원)
- [ ] 빈칸 클릭 시 모달에 "정답은 자료 X" 라벨 노란 박스로 표시
- [ ] cross-source 정답 (예: s0101 B → 자료 C) 라벨 정상
- [ ] 빈칸 0개 자료(예: s0103 B 누락) 자동 통과
- [ ] LS 키 prefix `dmz_v4_s_` 확인 (다른 빌드와 분리)
- [ ] JS syntax (`node -e new Function(...)`)
- [ ] 한 스토리 완주 (s0101) 시 4개 자료 다 unlock

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-04-30 | 신설 — 4/30 플테 후 새 디자인 |
