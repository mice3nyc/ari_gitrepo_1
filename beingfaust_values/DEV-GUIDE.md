# Being Faust Values — 개발 가이드

> **이 문서는 코드 수정 전 반드시 읽는다.**
> 에이전트가 이 문서를 기반으로 작업한다. 스펙 외의 수정은 금지.

**최종 업데이트**: 2026-04-06 (세션175)
**현재 버전**: v0.4 (카드 덱 스택 UX)
**배포**: GitHub Pages — `https://mice3nyc.github.io/ari_gitrepo_1/beingfaust_values/`

---

## 1. 파일 구조와 역할

```
beingfaust_values/
├── DEV-GUIDE.md          ← 이 파일 (개발 가이드, source of truth)
├── SPEC.md               ← 초기 기획서 (v0.1, 참고용. 코드와 불일치)
├── index.html            ← ★ 메인 플레이어 앱 (스와이프 UX, v0.3)
├── index-grid.html       ← 그리드 UX 백업 (v0.2, 탭 토글 방식)
├── dashboard.html        ← 진행자 대시보드 (PC용)
├── apps-script-guide.md  ← Google Apps Script 세팅 가이드 (피터공용)
├── imgs/                 ← 로고 (bf_logo_white.png 등)
├── valuecards/           ← 12개 카드 이미지 (앞면)
│   └── beingfaust_{id}.png  (id: love, beauty, faith, fame, family,
│                              freedom, knowledge, pleasure, power,
│                              progress, wealth, youth)
└── references/           ← 디자인 레퍼런스 (배포 안 함)
```

### 파일 관계

| 파일 | 용도 | 배포 | 상태 |
|------|------|------|------|
| `index.html` | 플��이어 메인 앱 (모바일) | ✅ GitHub Pages | ✅ v0.4 카드 덱 스택 |
| `index-grid.html` | 그리드 버전 백업 | ✅ 접속 가능 | ✅ 정상 동작 (API 연결 제외) |
| `dashboard.html` | 진행자 대시보드 (PC) | ✅ 접속 가능 | ⏳ API URL 필요 |

> **`index.html`이 메인이다.** `index-grid.html`은 스와이프가 불편할 경우의 대안.
> 두 파일은 Screen 2 (카드 선택)만 다르고, Screen 1/3/4/5와 JS 로직의 나머지는 동일.

---

## 2. 12개 가치 카드 데이터 (불변)

이 데이터는 원작(Being Faust, 2014)에서 확정된 것. **절대 수정 금지.**

```javascript
const VALUES = [
    { id: 'love',      en: 'LOVE',      kr: '사랑',     de: 'LIEBE',       color: '#E63946' },
    { id: 'beauty',    en: 'BEAUTY',    kr: '아름다움', de: 'SCHÖNHEIT',   color: '#9B59B6' },
    { id: 'faith',     en: 'FAITH',     kr: '믿음',     de: 'GLAUBE',      color: '#A8C256' },
    { id: 'fame',      en: 'FAME',      kr: '명예',     de: 'RUHM',        color: '#7A7A7A' },
    { id: 'family',    en: 'FAMILY',    kr: '가족',     de: 'FAMILIE',     color: '#E67E22' },
    { id: 'freedom',   en: 'FREEDOM',   kr: '자유',     de: 'FREIHEIT',    color: '#2980B9' },
    { id: 'knowledge', en: 'KNOWLEDGE', kr: '지식',     de: 'WISSEN',      color: '#27AE60' },
    { id: 'pleasure',  en: 'PLEASURE',  kr: '쾌락',     de: 'WOLLUST',     color: '#E84393' },
    { id: 'power',     en: 'POWER',     kr: '권력',     de: 'MACHT',       color: '#C5A55A' },
    { id: 'progress',  en: 'PROGRESS',  kr: '발전',     de: 'FORTSCHRITT', color: '#00BCD4' },
    { id: 'wealth',    en: 'WEALTH',    kr: '돈',       de: 'REICHTUM',    color: '#F1C40F' },
    { id: 'youth',     en: 'YOUTH',     kr: '젊음',     de: 'JUGEND',      color: '#85C1E9' }
];
```

카드 이미지: `valuecards/beingfaust_{id}.png` (id는 위 배열의 id 값)

---

## 3. 화면별 상세 스펙

### 전체 플로우

```
[Welcome] → [Selection] → [Confirm] → [Priority] → [Done]
  입장        6개 선택      확인        순위 정렬     제출 완료
```

모든 화면은 `<section class="screen">`. 활성 화면에 `.active` 클래스.
화면 전환: `go(screenId)` 함수. CSS transition으로 fade+translateY.

---

### Screen 1: Welcome (`#welcome`)

**기능**: 이름 입력, 방 코드 입력, 입장

| 요소 | ID/Class | 동작 |
|------|----------|------|
| 이름 입력 | `#inp-name` | 필수. 비어있으면 shake 애니메이션 |
| 방 코드 | `#inp-room` | 필수. **index.html은 기본값 "Emerging Creative Workshop"** |
| 입장 버튼 | `#btn-enter` | → `enterGame()` → `go('selection')` |
| 로고 | `.mephisto-logo` | "MEPHISTØ & co." / "— since 1808 —" |

**주의**:
- index.html의 방 코드 기본값 `value="Emerging Creative Workshop"`는 의도된 것 (특정 워크숍용)
- index-grid.html은 빈 칸 + `maxlength="6"`

---

### Screen 2: Selection — 스와이프 버전 (`#selection` in index.html)

**기능**: 12개 카드를 카드 덱 스택 방식으로 넘기며, 위로 올려서 선택 (최대 6개)

| 요소 | ID/Class | 동작 |
|------|----------|------|
| 안내문 | `.sel-instruction` | "위로 올려서 선택 · 좌우로 넘기기" |
| 카운터 | `#sel-count` | 선택 수 표시. `.bump` 클래스로 pulse 애니메이션 |
| 트레이 | `#sel-tray` | 상단에 선택된 카드 미니어처 (28x42px). 클릭하면 해제 |
| 카드 영역 | `#swipe-area` | 터치 제스처 영역. `touch-action: none` |
| 카드 스택 | `.swipe-stack-card` | 3개 DOM 스택 (front/middle/back). JS가 동적 생성 |
| 선택됨 뱃지 | `.swipe-badge` | 이미 선택된 카드에 "✓ 선택됨" 표시 |
| 힌트 | `#swipe-hint` | "↑ 위로 올려서 선택". 첫 선택 후 사라짐 (z-index: 5) |
| 점 인디케이터 | `#card-dots` | 12개 점. 현재=흰색, 선택됨=빨강 |
| 다음 버튼 | `#btn-next` | 6개 선택 시 활성화 → `showConfirm()` |

**카드 덱 스택 구조** (v0.4):
- 3장의 카드가 겹쳐 보임: front(100% scale, z-3), middle(93% scale, 50% opacity, z-2), back(86% scale, 25% opacity, z-1)
- **좌우 스와이프**: `|dx| > 60` → 앞 카드가 회전하며 날아감, 뒤 카드가 transition으로 승격, 새 카드가 뒤에 추가
- **위로 스와이프**: `dy < -80` → 선택. fly-up 애니메이션 후 다음 미선택 카드로 이동
- 방향 판정: 첫 8px 이동으로 수평/수직 결정 (`sw.dir`)
- 드래그 중 뒤 카드가 점진적으로 올라옴 (progressive reveal)
- 6개 다 차면 더 이상 위로 스와이프 안 됨
- 마우스 이벤트도 지원 (데스크톱 테스트용)

**JS 함수 (index.html 전용)**:
- `initSwipe()` — 3개 카드 DOM 생성, 점/트레이 초기화, 터치+마우스 이벤트 등록
- `showCard(idx)` — 스택 전체를 idx 기준으로 리빌드 (뱃지 갱신용)
- `flyCard(direction, onComplete)` — 앞 카드 날리기 + 스택 승격 + 새 카드 추가
- `applyStackPositions()` — 스택 3장의 CSS 클래스/스타일 갱신
- `updateDots()` — 점 인디케이터 갱신
- `resetFrontCard()` — 드래그 취소 시 snap-back
- `refreshCount()` — 카운터 업데이트, 버튼 활성화
- `renderTray()` — 트레이 갱신 (선택 카드 + 빈 슬롯)
- `deselectCard(id)` — 트레이 클릭 시 선택 해제
- `swStart/swMove/swEnd` — 터치 핸들러

---

### Screen 2: Selection — 그리드 버전 (`#selection` in index-grid.html)

**기능**: 12개 카드를 3x4 그리드로 표시. 탭하면 선택 토글 (최대 6개)

| 요소 | ID/Class | 동작 |
|------|----------|------|
| 안내문 | `.sel-instruction` | "당신이 욕망하는 가치를 선택하세요" |
| 그리드 | `#card-grid` | `grid-template-columns: repeat(3, 1fr)` |
| 카드 셀 | `.card-cell` | 탭 토글. `.on`=선택, `.off`=6개 찬 후 미선택 (흐려짐) |
| 체크마크 | `.card-chk` | 선택된 카드 우상단 원형 체크 |

**JS 함수 (index-grid.html 전용)**:
- `buildGrid()` — 12개 카드 DOM 생성
- `toggle(id)` — 선택/해제
- `refreshSelection()` — 카운터+카드 상태 업데이트

---

### Screen 3: Confirm (`#confirm`) — 양쪽 동일

**기능**: 선택한 6개 카드를 2열 그리드로 확인

| 요소 | ID/Class | 동작 |
|------|----------|------|
| 이름 표시 | `#cfm-name` | "{이름}님," |
| 카드 그리드 | `#cfm-grid` | `grid-template-columns: repeat(2, 1fr)` |
| 다시 선택 | `#btn-reselect` | → `go('selection')` |
| 순위 정하기 | `#btn-to-pri` | → `showPriority()` |

**JS 함수**: `showConfirm()` — 이름 표시 + 선택 카드 렌더링

---

### Screen 4: Priority (`#priority`) — 양쪽 동일

**기능**: 선택한 6개를 드래그(또는 화살표)로 순위 정렬

| 요소 | ID/Class | 동작 |
|------|----------|------|
| 리스트 | `#pri-list` | flex column. 각 항목 = `.pri-item` |
| 순위 번호 | `.pri-rank` | 1~6. 가치 고유 색상 |
| 드래그 핸들 | `.pri-handle` | ☰ 아이콘. `touch-action: none` |
| 썸네일 | `.pri-thumb` | 34x50px 카드 이미지 |
| 화살표 | `.arr-up`, `.arr-dn` | 위/아래 이동 버튼 |
| 이전 | `#btn-back-cfm` | → `go('confirm')` |
| 제출 | `#btn-submit` | → `submit()` |

**JS 함수**:
- `showPriority()` — selected → priority 배열 복사, 렌더
- `renderPriList()` — DOM 생성 + `initDrag()` 호출
- `moveItem(id, dir)` — 화살표 이동
- `syncPriority()` — DOM 순서 → state.priority 동기화
- `initDrag()` — 터치 드래그&드롭 (핸들 기반)

---

### Screen 5: Done (`#done`) — 양쪽 동일

**기능**: 제출 완료 화면. 자신의 순위 표시.

| 요소 | ID/Class | 동작 |
|------|----------|------|
| M 로고 | `.done-m` | 원형 "M" |
| 제목 | `.done-title` | "당신의 가치가 기록되었습니다" |
| 결과 리스트 | `#done-list` | 순위 + 한국어 + 영어 + 컬러닷 |

**JS 함수**:
- `submit()` — `syncPriority()` → payload 생성 → `renderDone()` → `go('done')` → API 전송 (백그라운드)
- `renderDone()` — 순위 리스트 렌더링

---

### Dashboard (`dashboard.html`) — 진행자용 PC

**기능**: 방 코드로 조회 → 가치 선택 통계 시각화

| 패널 | 내용 |
|------|------|
| 선택 빈도 | 12개 가치별 수평 막대 (선택 횟수순 정렬) |
| 가중 랭킹 | 1위=6점 ~ 6위=1점. TOP3/MIDDLE/LOWER/BOTTOM 티어 |
| 1순위 분포 | 1순위로 뽑힌 빈도 막대 |
| 참가자 목록 | 이름 + 선택 가치 컬러닷 |

**JS 함수**:
- `loadData()` — API 호출 → `render(rows)`
- `render(rows)` — 집계 + 4개 패널 렌더링
- `findValue(str)` — "사랑(LOVE)" 형식 파싱

---

## 4. 데이터 플로우

```
[플레이어 index.html]
    ↓ submit() — POST, mode: 'no-cors'
    ↓ payload: { name, room, values: ["사랑(LOVE)", "자유(FREEDOM)", ...] }
    ↓
[Google Apps Script] — doPost → Sheets 행 추가
    ↓
[Google Sheets] — 열: timestamp | room | name | rank1~rank6
    ↓
[대시보드 dashboard.html]
    ↑ loadData() — GET ?room=XXX
    ↑ doGet → JSON 응답: { status, count, data: [{ name, values: [...] }] }
```

**현재 상태**: `API_URL = ''` (빈 문자열) → 로컬 모드 (콘솔 출력만)

---

## 5. DO NOT TOUCH — 수정 금지 영역

> 아래 항목은 **동작 검증 완료**. 에이전트가 수정하면 안 된다.

### 절대 수정 금지

| 항목 | 파일 | 이유 |
|------|------|------|
| `VALUES` 배열 | 전체 | 원작 데이터. 색상 포함 |
| 카드 이미지 경로 | 전체 | `valuecards/beingfaust_{id}.png` 고정 |
| 카드 덱 스택 | index.html | `flyCard/swStart/swMove/swEnd/applyStackPositions`. v0.4 완료 |
| 트레이 로직 | index.html | `renderTray/deselectCard` |
| 그리드 선택 로직 | index-grid.html L747~L794 | `buildGrid/toggle/refreshSelection` |
| 드래그&드롭 | 양쪽 `initDrag()` | 터치 드래그 순위 조정. 동작 확인 완료 |
| 화면 전환 | 양쪽 `go()` | CSS transition 기반 |
| Welcome 폼 | 양쪽 `enterGame()` | shake 유효성 검증 포함 |
| 디자인 시스템 | 전체 CSS 변수 `:root` | 다크 테마, 폰트, 색상 |
| HTML 구조 | 양쪽 `<section>` 구조 | 5개 화면 레이아웃 |
| `submit()` 함수 구조 | 양쪽 | 로컬모드/API모드 분기. API_URL만 채우면 됨 |

### 수정 시 주의

| 항목 | 주의 사항 |
|------|-----------|
| `API_URL` | 유일하게 수정해야 할 변수. 빈 문자열 → Apps Script URL |
| `inp-room` 기본값 | index.html에만 있음. 워크숍별로 변경 가능 |
| 화면 텍스트 (안내문) | 수정 가능하나 두 파일 모두 동기화 필요 |

---

## 6. 남은 작업 (스텝 바이 스텝)

### TASK 1: Apps Script 배포 URL 연결

**전제**: 피터공이 Apps Script 배포 완료 후 URL 전달

**스텝**:

1. 피터공에게서 URL 수신 (형식: `https://script.google.com/macros/s/.../exec`)
2. `index.html` 열기
3. L1115의 `const API_URL = '';`를 찾아서 URL 삽입:
   ```javascript
   const API_URL = 'https://script.google.com/macros/s/XXXXX/exec';
   ```
4. `index-grid.html` 열기
5. L937의 `const API_URL = '';`에 같은 URL 삽입
6. `dashboard.html` 열기
7. L373의 `const API_URL = '';`에 같은 URL 삽입
8. 테스트:
   - index.html에서 이름+방코드 입력 → 6개 선택 → 순위 → 제출
   - 브라우저 콘솔에서 `[BF] 전송 완료` 확인
   - Google Sheets에서 행 추가 확인
   - dashboard.html에서 방코드로 조회 → 데이터 표시 확인

**수정 범위**: 3개 파일의 `API_URL` 값만. 다른 코드 수정 없음.

---

### TASK 2: (선택) 방 코드 기본값 변경

워크숍마다 방 코드를 바꿔야 할 때.

**스텝**:

1. `index.html` L658의 `value="Emerging Creative Workshop"` 수정
2. 끝. 다른 건 안 건드림.

---

### TASK 3: Screen 2 스와이프 UX 개선 — 카드 덱 스택 ✅ 완료

**구현 완료** (v0.4, 2026-04-06):
- 단일 `#swipe-card` DOM → 3개 `.swipe-stack-card` DOM 스택으로 변경
- 좌우 스와이프 시 앞 카드가 회전하며 날아가고 뒤 카드가 부드럽게 승격
- 위로 스와이프 선택(fly-up) 유지, 뒤 카드 자동 승격
- 드래그 중 progressive reveal (뒤 카드가 점진적으로 올라옴)
- 12개 카드 무한 순환 (날아간 카드는 덱 뒤로 재활용)
- 마우스 이벤트 지원 (데스크톱 테스트)
- `renderTray()`, `deselectCard()`, `refreshCount()` 미수정

---

### TASK 4: (미확정) 추가 기능

아래는 피터공이 결정해야 할 사항:

- [ ] 카드에 독일어 표시 추가?
- [ ] Welcome 배경 이미지 사용?
- [ ] 대시보드 추가 시각화?
- [ ] QR 코드 생성 (대시보드에)?

**이 항목들은 피터공 확정 전에 구현하지 않는다.**

---

## 7. 수정 전 체크리스트

에이전트가 코드를 수정하기 전에 반드시 확인:

```
□ 이 DEV-GUIDE.md를 읽었는가?
□ 수정 대상이 "DO NOT TOUCH" 영역에 해당하지 않는가?
□ 수정 범위가 남은 작업(TASK)에 명시된 범위 안인가?
□ index.html과 index-grid.html 중 어느 것을 수정하는지 명확한가?
□ 양쪽 파일에 동일하게 적용해야 하는 변경인가? (Screen 3/4/5/공통 로직은 양쪽)
□ 수정 후 5개 화면 전체 플로우를 테스트했는가?
```

---

## 8. 디자인 시스템 요약

```css
--bg-deep: #0D0D0D;       /* 최하단 배경 */
--bg: #141414;             /* 일반 배경 */
--bg-card: #1C1C1C;        /* 카드/패널 배경 */
--bg-elevated: #222222;    /* 올라온 요소 */
--text: #F0EDE8;           /* 기본 텍스트 */
--text-secondary: rgba(240,237,232,0.6);
--text-muted: rgba(240,237,232,0.28);
--accent: #C04040;         /* 주요 버튼, CTA */

/* 폰트 */
--font-display: 'Bodoni Moda'   /* 로고, 헤더 */
--font-quote: 'Cormorant Garamond'  /* 인용, 질문 */
--font-body: 'Noto Sans KR'    /* 본문, UI */
```

**원칙**: 다크 테마 (메피스토의 상점). 원작 앱 무드 계승. 탁한 색 금지.

---

## 9. 변경 이력

| 버전 | 날짜 | 내용 |
|------|------|------|
| v0.1 | 2026-04-06 | SPEC.md 작성, 12개 카드 자료 검토, Phase 1 프로토타입 (5화면 그리드) |
| v0.2 | 2026-04-06 | Google Sheets 연동 구조 (dashboard.html + apps-script-guide.md) |
| v0.3 | 2026-04-06 | 스와이프 UX (index.html). 좌우 넘기기 + 위로 날려 선택, 트레이, 점 인디케이터 |
| — | 2026-04-06 | GitHub Pages 배포 완료 (3회 커밋+푸시) |
| v0.4 | 2026-04-06 | 카드 덱 스택 UX — 3장 스택, fly-out, progressive reveal, 마우스 지원 |
