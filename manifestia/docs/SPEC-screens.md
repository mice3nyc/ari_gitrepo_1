---
created: 2026-06-22
author: 아리공
tags:
  - 개발
  - manifestia
  - SPEC
---

## SPEC — Manifestia 1단계 UI 빌드 (화면 구현 명세)

> 선문후코 코드-레디 명세. 이 문서 + `SPEC-prototype.md`(게임 로직) + `REF-artworz-original-UI.md`(원형 레퍼런스) + `wireframes/`(확정 와이어프레임 7장) 만으로 내일 코딩 가능해야 한다.
> 게임 로직·단어 경제·득점은 `SPEC-prototype.md`. 이 문서는 **화면을 어떻게 구현하는가**(디자인 토큰 + 7화면 + 라우팅/상태/i18n).
> 결정 로그: `SPEC-prototype.md §9` / 진행 체크리스트: `TASKS.md`

### 0. 현재 코드 상태 (출발점)

- Vite + React 18 + react-router-dom. `npm run build` 통과(6/18).
- **존재**: `src/App.jsx`(라우터+RequireCharacter 가드), `src/store/index.js`(상태 추상화), `src/components/NavBar.jsx`(4탭), `src/screens/{CharacterSelect,PosterMatch,ComingSoon}.jsx`, `src/i18n/ko.json`, `src/index.css`(336줄 기능용 — 토큰 시스템으로 교체).
- **빌드 대상**: 시작·결과·매니페스토쓰기·투표·단어주머니 5화면 신설/채움 + 전 화면 디자인 토큰 적용 + 언어 토글 + NavBar 탭 교체.
- 데이터: `data/posters.json`(120 포스터, 검증됨). 캐릭터 카드/폰트 자산은 `wireframes/assets/`에 사본 있음 → 앱 `public/`으로 이관 필요.

### 1. 디자인 토큰 (index.css 교체)

와이어프레임에서 확정. **실제 앱은 폰 목업 프레임을 쓰지 않는다**(와이어프레임의 폰 틀은 발표용). 풀스크린 모바일 우선, 데스크탑은 max-width 430 중앙 정렬.

**폰트** — 페이퍼로지 3 weight. `public/assets/fonts/Paperlogy-{4Regular,7Bold,9Black}.ttf` @font-face, family `'Paperlogy'`, 전역 적용.

**색 토큰**
```
--ink:#111;     /* 잉크(테두리·텍스트·검은 버튼) */
--paper:#fff;   /* 백색 배경 — 회색 금지(피터공 6/22) */
--pop:#f4d000;  /* 노란 완료 폭발 */
--muted:#999;   /* 보조 텍스트 */
--sub:#555;     /* 본문 보조 */
--hair:#ddd;    /* 헤어라인(네비 구분 점선) */
```

**컴포넌트 클래스**
- `.btn` — 테두리 3px ink, bg ink, color paper, weight 900, radius 10, pad 15~16. `.btn-pop` = bg `--pop`, color ink (완료 CTA: 매니페스토 제출).
- `.chip` — 테두리 2px ink, radius 18~20, pad 8/14, weight 700. `.chip.on` = bg ink/color paper(선택됨). `.chip.used` = dashed + muted + line-through(소모됨).
- `.card-box` — 테두리 3px ink, radius 10, bg paper.
- `.result-pop` — bg `--pop` + 테두리 3px ink. **완료 노란 폭발 전용**(매칭 성공 카드·투표 완료·결과 상위 3).
- `.nav-bar` — 하단 고정, height 66, border-top 3px ink, 4탭. 탭 비활성: color muted, bg paper, border-right 1px dashed hair. `.active`: bg ink, color paper, weight 900.

**"노란 폭발" 규칙**: `--pop`은 **완료·성취 순간에만**. 평상 화면(입력·선택·목록)은 백색+검정. (원형 아트워즈의 "평상 무채색 / 완료 노란" 리듬 계승)

### 2. 라우팅 & 흐름 (자유이동)

| route | 화면 | 상태 | 네비 |
|---|---|---|---|
| `/` | 시작 | 신설 | 없음 |
| `/character` | 캐릭터 선택 | 존재(리스타일) | 없음(관문) |
| `/match` | 포스터 매칭 | 존재(리스타일) | 매칭 |
| `/inventory` | 단어주머니 | 신설 | 주머니 |
| `/manifesto` | 매니페스토 쓰기 | 신설(ComingSoon 대체) | 쓰기 |
| `/vote` | 투표 | 신설(ComingSoon 대체) | 투표 |
| `/result` | 결과 | 신설 | 없음 |

- **흐름**: 시작 → (게임 시작) → 캐릭터 선택[RequireCharacter 관문] → 게임 화면 **자유이동**(하단 네비 4탭: 매칭/주머니/쓰기/투표) → 결과는 1단계 데모로 `/result` 접근(2단계는 세션 종료 트리거).
- **NavBar 변경**: 현재 탭 `character` → `inventory`로 교체. 최종 탭 = 매칭(`/match`) · 주머니(`/inventory`) · 쓰기(`/manifesto`) · 투표(`/vote`). 캐릭터는 관문이라 탭에서 제외. 시작·결과는 네비 숨김.

### 3. 상태 (store/index.js 확장)

현재 `DEFAULT_STATE`에 `manifestos` 누락 → 추가. 추가 함수:
```
DEFAULT_STATE: { character, inventory:[], acquired:{}, manifestos:[], score:0 }
getInventory()                       // 미소모 단어 목록
submitManifesto(wordIds, text)       // 사용 단어 inventory에서 제거(소모) + manifestos에 {id,status:'submitted',wordIds,text} push + addScore(+20)
saveDraft(wordIds, text)             // status:'draft' 저장/갱신
getManifestos()                      // draft+submitted 목록
castVote(manifestoId)                // 1단계: addScore(+1)만 (집계는 더미)
```
기존 함수(getPosterByNo·initPlayer·addWordToInventory·recordAcquired·addScore·countStars·getAcquiredSlots) 유지. **2단계 서버 전환 시 이 store 내부만 API로 교체**(화면 불변) — 추상화 레이어 원칙 유지.

### 4. i18n (언어 토글)

- 현재 NavBar가 `ko.json` 직접 import → **`t(key)` 헬퍼 + lang 상태**로 교체. lang은 localStorage `mnf_proto_lang`, 기본 `'ko'`(개발).
- `src/i18n/{ko,en,de}.json` 3개. 1단계: ko 완비, **en/de는 키 동일·값 placeholder**(TODO 마킹) — 토글 동작 구조만 깔고 번역은 추후.
- 신규 키: `nav.inventory`(주머니). 시작 화면 토글이 lang 상태 변경.
- **범위(슈테델 6/22)**: 운영 배포 = 독/영만, 한국어 = 개발·테스트용. 우선순위 독>영>한. 슈테델 빌드는 KO 토글 숨김 + DE 기본.

### 5. 화면별 구현 명세

각 화면 = `wireframes/0N-*.html`이 시각 기준. 아래는 구현 디테일.

**① 시작 `/` (신설)** — `wireframes/01-start.html`
- 상단 DE·EN·KO 세그먼트 토글(lang 상태). STÄDEL×놀공 라벨 + MANIFESTIA 타이틀(Paperlogy 900) + 부제 + 게임 시작 btn → 캐릭터 있으면 `/match`, 없으면 `/character`. 하단 안내 "슈테델 운영: DE·EN · 개발 테스트: KO".

**② 캐릭터 선택 `/character` (존재·리스타일)** — `wireframes/02-character.html`
- 2×2 카드 이미지 그리드: `card_healer/tanker/illusionist/prof.png`(public/assets/char/). 선택 시 4px ink ring + "선택됨" 태그. 이 캐릭터로 시작하기 → `initPlayer(type)` → `/match`. 캐릭터 type 매핑: 치유자=HEALER·전사=TANKER·환영가=ILLUSIONIST·교수=PROFESSOR.

**③ 포스터 매칭 `/match` (존재·리스타일)** — `wireframes/03-poster-match.html`
- 번호 입력 → `getPosterByNo` → `countStars(poster,character)`. 4★=4단어 전부 / 1~3★=미보유 슬롯 중 랜덤 1 → `addWordToInventory`+`recordAcquired`+`addScore(+5)`. 결과 `.result-pop`(노란): 월계관 ★별점 + `text_ko` 인용구 + 획득 chips + "+5점". 없는 번호 에러 안내. (로직 기존 구현 있음 — 리스타일 + 노란 결과 카드화)

**④ 단어주머니 `/inventory` (신설)** — `wireframes/04-inventory.html`
- `getInventory()` → chip 그리드. 개수 표시 + "쓴 단어는 사라져요(소모성)". 소모된 단어는 `.chip.used`(빗금).

**⑤ 매니페스토 쓰기 `/manifesto` (신설, ComingSoon 대체)** — `wireframes/05-manifesto.html`
- 조립 캔버스(선택 chips + ＋단어 슬롯) + 가방 chips(탭해서 배치/해제) + 문장. 제출 btn `.btn-pop`(노란) → `submitManifesto(wordIds,text)` (사용 단어 소모 + +20점). 1단계 최소: 단일 draft + 제출(완성 목록은 manifestos에 누적).

**⑥ 투표 `/vote` (신설, ComingSoon 대체)** — `wireframes/06-vote.html`
- 1단계 더미 풀(샘플 매니페스토 + 본인 제출분) 월드컵 2지선다. 선택 → `castVote(id)`(+1점). 완료 피드백에 노란 톤.

**⑦ 결과 `/result` (신설)** — `wireframes/07-result.html`
- 1단계 더미 순위 데이터. 1~6위 목록, 상위 3 `.result-pop`(노란). 내 선언 다시 보기 btn.

### 6. 자산 이관

- `wireframes/assets/fonts/Paperlogy-*.ttf`(3) → 앱 `public/assets/fonts/`.
- `wireframes/assets/char/card_*.png`(4) → 앱 `public/assets/char/`. (원본: `Assets/incoming/Manifesto Game/img/`)
- 추후 탑재: 슈테델 공식 폰트·로고(현재 페이퍼로지 + 텍스트 플레이스홀더).

### 7. 검증 항목 (선문후코 — 빌드 후)

- **[아리공 자가점검]**: `npm run build` 통과 · CDP 헤드리스로 7화면 라우팅 전수(시작→캐릭터→매칭 매칭성공→주머니→쓰기 제출→투표→결과) · 런타임 예외 0 · 매칭 로직 회귀(4★/부분/재입력) · 언어 토글 상태 전환.
- **[피터공 확인]**: 페이퍼로지 무게감·백색 톤·노란 폭발 위치 · 화면 전이 리듬 · 카드/칩 눈높이 · 라이브 URL.
