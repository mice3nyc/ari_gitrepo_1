---
created: 2026-05-25
tags:
  - DMZ
  - dmz-layout
  - SPEC
  - 개발
author: 아리공
---
### dmz-layout SPEC — 추출 원칙 + 운영 규칙

> 화면 레이아웃 자체의 명세는 정본 [[../../DMZ_v5/docs/SPEC-screens|SPEC-screens]]에 있다. 이 문서는 그것을 standalone 정적 HTML로 뽑을 때의 추출 원칙과 작업장 운영 규칙만 다룬다.

---

#### 폴더 구조

```
_dev/dmz-layout/
├── source-select.html      ← 자료선택 화면 (첫 산출)
├── assets/                 ← pickone/assets 통째 복사본
│   ├── fonts/              ← Paperlogy 4Regular·7Bold·9Black
│   ├── icons/              ← personal/news/photo/oral_tab, status_*, profile 등
│   └── images/             ← title_logo_cat0*, dmz_top_logo 등
└── docs/
    ├── PLAN.md
    ├── TASKS.md
    └── SPEC.md             ← 이 파일
```

화면이 늘면 `{화면}.html`을 루트에 추가. 자산은 공유.

#### 추출 원칙

1. **발췌, 복사 아님**: `pickone/index.html`을 통째 복사해 깎지 않는다. 해당 화면에 필요한 CSS 셀렉터와 마크업만 추려 가벼운 새 파일로 작성한다. 의존 셀렉터(공통 유틸·믹스인 포함)는 빠짐없이.
2. **값 보존**: 발췌한 CSS의 수치·색·clip-path는 원본 그대로. 작업장에서 의도적으로 바꿀 때만 변경하고 그 변경을 TASKS에 적는다.
3. **자산 상대경로**: 모든 자산은 `assets/...` 상대경로. 폴더에 `assets/`가 있으므로 pickone과 동일하게 작동.
4. **로직 없음**: JS 게임 로직(렌더 함수·상태·unlock·localStorage·내비게이션·디버그 패널)은 가져오지 않는다. 인터랙션 미포함, 순수 정적 레이아웃.
5. **모바일 기준**: `<meta viewport>` 포함, 393px 폭 기준.

#### 더미 데이터 컨벤션

- 게임 데이터 대신 정적 하드코딩.
- **비주얼 상태를 한눈에**: 한 화면이 가질 수 있는 상태(활성·완료·잠금 등)를 가능한 한 한 화면에 모두 노출해 레이아웃 점검이 쉽도록 구성.
- 카테고리는 cat-01(핑크) 고정. 다른 카테고리 색 확인이 필요하면 `:root`의 `--cat-color`만 교체.
- 텍스트는 그럴듯한 더미. 실제 콘텐츠 정합은 이 작업장의 관심이 아니다 (레이아웃만).

#### source-select.html 현재 구성 (5/25)

- 카테고리 cat-01 고정 (`--cat-color: var(--cat-01)`)
- 주제 띠 "DMZ 기본정보" / 스토리 제목 탭 "DMZ의 탄생"
- 자료 카드 4장 = 위치 고정 슬롯: 1번 A(편지)/2번 B(신문)/3번 C(사진)/4번 D(구술)
  - 1번 solved(복원 완료) / 2번 활성(복구 필요) / 3번 locked 홀수회색 / 4번 locked 짝수회색
  - 아이콘 위치 기반 (`personal/news/photo/oral_tab`), z-index 1~4, margin-top -40 겹침

자세한 레이어 구조·컴포넌트 정의는 SPEC-screens "## 자료선택" 참조.

#### source-detail.html 현재 구성 (5/25) — 본문 포맷팅 무대

피터공 목적: "핑크색 바탕 안 흰색 라운딩 박스, 그 안에 들어갈 본문 HTML 포맷팅". 자료본문(source-detail) 화면의 핵심 두 겹만 떼어낸 미니 무대.

- **무대 범위 = 미니 무대**: 핑크 박스 + 흰 본문 박스 + 안내영역. 상단바·헤더(주제 띠·제목 탭)·흰 시트(Layer 2)는 생략. 통째 무대는 보류 (피터공 명시 확인 대기)
- **핑크 바탕** = `.detail-topic-card` (cat-color, 라운드 14, padding 1.2rem 1rem, 흰 텍스트) — pickone 값 그대로
- **안내영역** = `.detail-modal-header` ("빈칸 복원하기" 제목 + X 닫기 + 안내문). 안내문은 더미
- **흰색 라운딩 박스** = `.detail-body-wrap` (흰색, 라운드 14, padding 1.4rem 1.2rem, navy 텍스트) — pickone 값 그대로. ★ 본문 HTML 작업 자리
- **본문 자리**: 빈 박스 + 점선 placeholder + `<!-- 여기에 자료 type별 본문 -->` 주석. 본문 채우면 placeholder 제거
- cat-01 핑크 고정

자료 type별 본문(A 편지 / B 신문 / C 사진 / D 구술) 포맷팅이 이 흰 박스 안에서 진행될 자리. type별 layout 결은 정본 SPEC-screens 자료본문 § "자료 type별 결" 참조. 여기서 다듬은 본문 결은 확정 후 pickone `renderSource`로 역반영.

#### 자료본문 fill 파이프라인 (5/25 세션381)

source-detail의 흰 박스 안 본문 작업이 "한 자료 무대 만들기"에서 "92자료 일괄 변환"으로 확장됐다. 통일부 자료 92개를 type별 템플릿에 맞춰 renderedBodyHtml(흰 박스 inner HTML)로 변환해 마스터 CSV 본문 컬럼을 채운다.

**입력/출력**
- 소스: `Assets/incoming/통일부/본문 데이터 HTML/260521_통일부_{주제}.md` 5개 (주제별)
- 마스터 CSV: 같은 폴더 `사진링크용.csv` (92행, 본문 컬럼 비어있음)
- 산출: `사진링크용_본문채움.csv` (본문 컬럼 채움, 원본 보존)

**파이프라인**
```
clean/{주제}.md          ← grep -v 'data:image|base64' (base64 제거, 15~28KB)
  → 백도 5개 sonnet      ← _변환SPEC.md 따라 자료별 renderedBodyHtml
  → clean/out_{주제}.html ← ITEM 구분자: <!--ITEM|스토리|타이틀|타입--> … <!--/ITEM-->
  → scripts/merge.py     ← (주제+타이틀) 매칭 + 사진 {{PHOTO_URL}} 치환 → 본문채움 CSV
  → scripts/preview_csv.py ← 핑크헤더+흰박스 통합 미리보기 (검수용)
  → scripts/verify.py    ← 행 순서·중복·빈본문·사진수·제목정합 검증
```

**변환 규칙** (상세: `본문템플릿/_변환SPEC.md`)
- 산출 범위: 흰 박스 inner HTML만. 핑크 헤더(태그·메타데이터)는 동현공 chrome이라 제외
- 빈칸: MD `[A][B][C]` 마커 → cyan span (`dmz-blank`, data-blank, 정답 텍스트 없음)
- 사진: `{{PHOTO_URL}}` placeholder → merge가 CSV 사진 컬럼 + `https://res.nolgong.com/dmz-archive/`로 치환
- 폰트 클래스: `handwriting`/`typewriter`/기본 Paperlogy (동현공 임베드 약속)
- 색 토큰: 핑크 #FF6EC7 / cyan #3FE0DC / 네이비 #1a2b4a / 그레이 #6E6E6E
- type→템플릿: `본문템플릿/01~11` 14종

**매칭 키 = 주제 + 타이틀** (스토리 제외). 백도가 MD 기준 스토리명("DMZ 명칭의 의미")을 쓰는데 CSV는 다름("명칭의 의미"). 타이틀은 주제 안에서 유니크해 충돌 없음. normalize는 공백 + 구분자(`/ · ・ | ,`) 제거.

**검증 결과 (세션381)**: 92/92 채움, 행 순서 원본 동일, (주제,타이틀) 중복 0, 빈 본문 0, 사진 수 정합 전건 일치, 미변환 placeholder 0, 제어문자 0. 미리보기 카드 순서 = CSV 행 순서 1대1.

#### 역반영 (작업장 → pickone)

작업장에서 확정한 CSS·마크업 변경은 pickone `shared/index_pickone.html`로 옮긴 뒤 빌드한다. 절차는 TASKS 미해결 항목으로 열려 있음 (수동 발췌 vs 자동). 작업장 파일은 정본이 아니다.

→ [[PLAN]] / [[TASKS]]
