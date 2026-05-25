---
created: 2026-05-25
tags:
  - DMZ
  - dmz-layout
  - 개발
  - 개발계획
author: 아리공
---
### dmz-layout — DMZ 화면 레이아웃 작업장 PLAN

> Live document. 방향 전환·주요 결정 시 즉시 갱신.

#### 무엇인가

DMZ 다이어리(`_dev/DMZ_v5/pickone`)의 화면 레이아웃을 게임 코드 없이 격리해, 화면별 정적 HTML로 디자인을 빠르게 다듬는 작업장. 2026-05-25 신설.

게임 빌드(`pickone/index.html`, 293KB)는 자료선택 같은 화면 하나를 보려 해도 타이틀·주제선택·스토리선택을 거쳐야 도달한다. 렌더 함수·상태·unlock 사이클·localStorage가 얽혀 있어 레이아웃만 만지기에 무겁다. 이 작업장은 한 화면을 정적으로 떼어내 단독으로 열어 점검·수정한다.

#### 왜 분리했나

- **도달 비용 제거**: 내비게이션 없이 파일을 열면 바로 그 화면.
- **로직 분리**: JS 게임 로직이 없어 CSS·마크업만 또렷이 보인다.
- **iterate 속도**: 빌드 스크립트 없이 HTML 직접 수정 후 새로고침.
- **게임 빌드 안전**: 레이아웃 실험이 pickone 빌드를 건드리지 않는다.

#### 원본과의 관계

| 자리 | 정본 위치 |
|---|---|
| 화면 레이아웃 명세 | `_dev/DMZ_v5/docs/SPEC-screens.md` (화면별 레이어·컴포넌트·CSS 매핑) |
| 추출 소스 (CSS·자산·마크업) | `_dev/DMZ_v5/pickone/index.html` + `pickone/assets/` |
| 디자인 토큰·폰트 | `pickone/index.html` `:root` + `assets/fonts` Paperlogy |

확정된 레이아웃은 이 작업장에서 만든 뒤 **pickone으로 역반영**한다. 작업장이 정본을 대체하지 않는다. SPEC-screens.md가 화면 레이아웃의 정본이고, 이 작업장은 그것을 구현·실험하는 자리.

#### 화면 목록

| 화면 | 파일 | 상태 |
|---|---|---|
| 자료선택 (game-screen / Figma 240) | `source-select.html` | 추출 완료, 피터공 검증 대기 |
| 자료본문 (source-detail / 프레임 1~4) | `source-detail.html` + `본문템플릿/01~11` | type별 템플릿 14종 완료. 92자료 본문 renderedBodyHtml 변환 완료 (CSV `사진링크용_본문채움.csv`). 검증 통과 |
| 스토리선택 (story-screen / 226) | (미정) | 후보 |
| 주제선택 (category-screen) | (미정) | 후보 |

#### 작성 원칙 (요약 — 상세는 SPEC)

- **발췌 방식**: index.html 통째 복사 후 깎기 X. 해당 화면에 필요한 CSS·마크업만 추려 가벼운 새 파일.
- **자산 경로**: `assets/`를 폴더에 통째 복사. 상대경로(`assets/...`)가 그대로 작동.
- **더미 데이터**: 게임 데이터 대신 정적 하드코딩. 비주얼 상태(활성·완료·잠금)를 한눈에 보이게 구성.
- **로직 없음**: 클릭·상태 전환 등 인터랙션 미포함. 순수 레이아웃.

→ [[TASKS]] / [[SPEC]] / 원본 [[../../DMZ_v5/docs/SPEC-screens|SPEC-screens]]
