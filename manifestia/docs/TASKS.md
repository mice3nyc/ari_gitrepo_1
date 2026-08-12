---
created: 2026-06-18
author: 아리공
tags:
  - 개발
  - manifestia
  - TASKS
---

## Manifestia TASKS

> 진행 작업 체크리스트. 명세: `docs/SPEC-prototype.md` / 계획: `docs/PLAN.md`

#### 1단계 — 폰 단독 프로토타입

**데이터·인프라**
- [x] `posters.json` 빌드 — 120 포스터, 결함 0, 4★ 30/30/30/30 검증. 번호 없는 신규 14개 임시 코드(9xxxx). `scripts/build_posters.py` 보존. (6/18)
- [x] `i18n/ko.json` 초기 키 — 전 UI 텍스트 키 분리 (캐릭터/매칭/네비/에러). 마스터 시트 골격(키|ko|en|de)은 2단계 build:i18n 때. (6/18)
- [x] 프레임워크 셋업 + 데이터/상태 추상화 레이어 — Vite+React. `src/store/index.js`가 posters 조회·PlayerState(localStorage `mnf_proto_`)를 단일 레이어로 감쌈. 화면은 store만 호출 → 2단계 서버 교체 시 store만 바꾸면 됨. (6/18)

**화면 (이번 pilot: 4개 중 2개)**
- [x] 캐릭터 선택 (4유형 자유 선택 → `initPlayer` → PlayerState 초기화 → /match 이동). `src/screens/CharacterSelect.jsx` (6/18)
- [x] 포스터 매칭 (번호 입력 → stars 판정 → 4★ 전부/부분 랜덤 1 획득 → 인벤토리·득점 +5/포스터, 재입력 시 acquired 슬롯 제외하고 없는 단어만 복구). `src/screens/PosterMatch.jsx` (6/18)
- [ ] 매니페스토 쓰기 (인벤토리 칩 조립 → draft/완성 목록 → 제출 시 소모+득점) — 다음 단계. `/manifesto` 라우트 + NavBar 탭 자리 마련됨(ComingSoon placeholder)
- [ ] 투표 (로컬 더미 풀, 월드컵 2지선다, 클릭당 +1) — 다음 단계. `/vote` 라우트 자리 마련됨

**검증**
- [x] 코드 레벨 정적 검증 — 58543 케이스(TANKER stars=4 4단어 전부 / HEALER·PROFESSOR stars=1 랜덤1 / ILLUSIONIST stars=2 랜덤1), 재입력 시 acquired 슬롯 제외, import 경로 전수 확인 (6/18)
- [x] `npm install` + `npm run build` — 아리공 환경에서 통과(41 modules, dist 236KB, vite v5). (6/18)
- [x] CDP 헤드리스 검증 — 캐릭터 선택→/match→58543 매칭: TANKER 4★ 4단어 전부+점수5+인벤토리 / HEALER 부분 1단어. 예외·콘솔에러 0. preview localhost:4173 라이브. (6/18)

#### 디자인 단계 — 와이어프레임 → 클로드디자인 보드 (6/22)

> 결정 로그: `SPEC-prototype.md §9` / 레퍼런스: `REF-artworz-original-UI.md` / 아키텍처: `ARCHITECTURE.md`

- [x] 원형 아트워즈 UI 캡쳐 카탈로깅 + 우리 7화면 매핑 (`REF-artworz-original-UI.md`). 발견: 관리자/세션 운영 화면까지 원형에 존재. (6/22)
- [x] 피터공 디자인 결정 4건 확정 — 시작·결과 둘 다 추가 / 단어주머니 별도 탭 / 흐름 자유이동 / 원형 "노란 폭발" 톤 채택. (6/22)
- [x] 7화면 흑백 HTML 와이어프레임 작성 — `wireframes/01~07`. 폰 틀 390×844, 평상 무채색+완료 노란, 하단 4탭 네비(매칭·주머니·쓰기·투표). (6/22)
- [x] 클로드디자인(DesignSync) 보드 생성 + 7카드 push. (6/22)
- [ ] 피터공 보드 검토 → 화면별 방향 확정
#### 1단계 코드 빌드 v1 — 내일 착수 (선문후코)

> 명세: `SPEC-screens.md` (화면별 구현·토큰·상태·라우팅). 순서대로. 각 항목 완료 즉시 체크.

- [ ] **① 디자인 토큰** — `index.css` 토큰 시스템으로 교체(Paperlogy @font-face, 색 토큰, `.btn`/`.btn-pop`/`.chip`/`.card-box`/`.result-pop`/`.nav-bar`). 폰 목업 프레임 제거(풀스크린). 완료=토큰으로 한 화면 렌더 확인.
- [ ] **② 자산 이관** — `wireframes/assets/fonts/*.ttf`(3)·`char/card_*.png`(4) → 앱 `public/assets/`. 완료=경로 로드 확인.
- [ ] **③ store 확장** — `DEFAULT_STATE`에 `manifestos:[]` 추가 + `getInventory`/`submitManifesto`/`saveDraft`/`getManifestos`/`castVote`. 완료=콘솔에서 제출 시 단어 소모+점수 +20.
- [ ] **④ i18n 토글 구조** — `t(key)` 헬퍼 + lang 상태(localStorage `mnf_proto_lang`, 기본 ko) + `en/de.json` 스텁(키 동일, 값 placeholder) + `nav.inventory` 키. 완료=토글로 lang 상태 전환.
- [ ] **⑤ NavBar 교체** — 탭 `character`→`inventory`. 최종 4탭 매칭/주머니/쓰기/투표. 완료=4탭 라우팅.
- [ ] **⑥ 시작 `/` 신설** — 언어 토글 + 타이틀 + 게임 시작 → 캐릭터/매칭. 완료=라우팅.
- [ ] **⑦ 캐릭터 선택 리스타일** — 카드 이미지 2×2 + 선택 ring → `initPlayer` → `/match`. 완료=4유형 선택 동작.
- [ ] **⑧ 포스터 매칭 리스타일** — 노란 `.result-pop` 결과 카드(별점·인용구·획득 단어·+5). 기존 로직 유지. 완료=4★/부분/재입력 회귀.
- [ ] **⑨ 단어주머니 `/inventory` 신설** — `getInventory` 칩 그리드 + 소모 빗금. 완료=획득 단어 표시.
- [ ] **⑩ 매니페스토 쓰기 `/manifesto` 신설** — 조립 캔버스 + 가방 칩 + 노란 제출 → `submitManifesto`. 완료=제출 시 소모+20점.
- [ ] **⑪ 투표 `/vote` 신설** — 더미 풀 2지선다 → `castVote`(+1). 완료=투표 동작.
- [ ] **⑫ 결과 `/result` 신설** — 더미 순위, 상위 3 노란. 완료=순위 표시.
- [ ] **⑬ 검증** — `npm run build` 통과 + CDP 헤드리스 7화면 라우팅 전수(시작→캐릭터→매칭→주머니→쓰기 제출→투표→결과) 예외 0 → 피터공 확인용 라이브 URL.

#### 빌드 기록

- 2026-06-22 디자인 단계 진입. 와이어프레임 7장(`wireframes/*.html`, 각 `@dsCard` 마커) → 클로드디자인 보드 "Manifestia — 슈테델 게임 와이어프레임"(projectId 696fc534-266f-4c96-8bda-4c7feef66e2e)에 카드 7개 push 완료(written:7). claude.ai/design에서 검토.
- 2026-06-22 와이어프레임 v2 — 피터공 피드백 반영: 폰트 페이퍼로지(`assets/fonts/` 3 weight @font-face), 회색 배경 제거→백색 기반(B&W+노란 완료), 캐릭터 선택은 원형 아트워즈 카드 이미지 4종(`assets/char/card_*.png`) 사용. 보드 재push(written:14, html 7+폰트 3+카드 4). 헤드리스 스크린샷 자가검증(02·07 렌더 OK).
- 2026-06-18 프레임워크 셋업 + 2화면 pilot. Vite+React, react-router-dom. 파일: `package.json`·`vite.config.js`·`index.html`·`src/{main,App,index.css}`·`src/store/index.js`·`src/i18n/ko.json`·`src/screens/{CharacterSelect,PosterMatch,ComingSoon}.jsx`·`src/components/NavBar.jsx`. node_modules `.gitignore` 등록. npm install/build는 미실행(권한).
