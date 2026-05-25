---
created: 2026-05-25
tags:
  - DMZ
  - dmz-layout
  - 개발
  - 진행작업
author: 아리공
---
### dmz-layout 진행 작업

> 화면별 standalone 정적 HTML 작업장. 완료 즉시 체크. 방향: [[PLAN]] / 명세: [[SPEC]]

---

#### 셋업 ✅ (5/25 세션379)

- [x] `_dev/dmz-layout/` 폴더 신설 (게임 코드와 분리된 독립 프로젝트)
- [x] `pickone/assets/` 통째 복사 (3.9M — Paperlogy 폰트 3 + 아이콘 12 + 이미지 8). 상대경로 작동 확인
- [x] 3계층 노트 세팅 (PLAN / TASKS / SPEC)

#### 자료선택 (source-select.html) — 추출

- [x] pickone에서 자료선택 화면 발췌 (백도 sonnet) — `:root` 토큰 + @font-face + .app-header + .phase-banner/cat-tab/story-tab + .phase-sheet + .source-card 일습. 10.6KB
- [x] 자료 카드 4장 더미 하드코딩 — 1번 완료(solved) / 2번 활성 / 3·4번 잠금(홀짝 회색 변주). z-index + margin-top -40 겹침 재현
- [x] 자산 경로 `assets/` 상대경로 검증 (폰트·아이콘·로고)
- [x] 한글 인코딩 검증 (NFD·제어문자 없음)
- [ ] **피터공 브라우저 검증** — 레이아웃 골격(헤더-시트 결합)·자료 카드 묶음(겹침·아이콘·z위계)·상태 비주얼 확인
- [ ] 검증 피드백 반영 (수정 자리 나오면)

#### 자료본문 (source-detail.html) — 본문 포맷팅 무대 (5/25 세션379)

> 피터공 목적: "핑크색 바탕 안 흰색 라운딩 박스, 그 안에 들어갈 본문 HTML 포맷팅". 본문 작업 무대.

- [x] 무대 범위 = **미니 무대** 결정 (피터공 표현 "핑크 바탕 + 흰 박스"에 맞춤. 통째 무대는 보류) — 추론 확정, 피터공 명시 확인 대기
- [x] 자료본문 4-layer 중 핵심 2겹 추출 — 핑크 박스(`detail-topic-card`) + 흰 본문 박스(`detail-body-wrap`). 안내영역(빈칸 복원하기 + X + 안내문) 포함. 상단바·헤더·흰 시트는 생략
- [x] 흰 본문 박스 비움 + 점선 placeholder — 본문 HTML 들어갈 자리 표시
- [x] cat-01 핑크 고정, 토큰·폰트 source-select에서 재사용. 인코딩 검증(NFC·제어문자 없음)
- [x] **본문 HTML 포맷팅** — 자료 type별 본문 → 14종 템플릿화 (아래 본문템플릿 섹션)
- [x] type별 시작 결정 — 해소. 전 타입 템플릿 동시 제작 후 92자료 일괄 채움 방식

#### 본문템플릿 14종 ✅ (5/25 세션380)

> 자료 type별 renderedBodyHtml 템플릿. `_dev/dmz-layout/본문템플릿/`. design_sample PNG 기준.

- [x] 01-손글씨, 02-신문, 03-사진, 04-메시지(대화/독백/타임라인), 05-지식인, 06-학술논문, 07-신문_표, 08-신문_연표, 08-트위터, 09-백과사전, 10-블로그, 11-시험지문
- [x] 변환 규칙 확정 (흰 박스 inner HTML / 인라인 스타일 / 빈칸 cyan span / 색 토큰 / 폰트 클래스)
- [ ] 손글씨 폰트 확정 (현재 데모 Nanum Pen Script, 동현공 임베드 약속)
- [ ] 트위터 반응수치/아이콘 통일 여부 피터공 결정

#### 92자료 본문 채우기 (5/25 세션381) — 진행

> 통일부 자료 92개를 타입 템플릿에 맞춰 renderedBodyHtml로 변환 → 마스터 CSV(`사진링크용.csv`) 본문 컬럼. 스펙 `본문템플릿/_변환SPEC.md`, 스크립트 `scripts/{preview,merge}.py`.

- [x] clean MD 5개 생성 (base64 제거, 15~28KB)
- [x] 백도 공유 변환 SPEC 작성 (`_변환SPEC.md`)
- [x] pilot 백도 — 국가유산/문화재 16자료 → `out_heritage.html`. 미리보기 검수 통과 (매칭 0실패, 빈칸 21)
- [x] preview.py / merge.py 작성 (타이틀 normalize 매칭 + 사진 URL 치환)
- [x] 나머지 4 카테고리 백도 병렬 (DMZ기본정보 24 / 생태환경 20 / 사람들 16 / 평화관광 16)
- [x] merge.py로 CSV 본문 컬럼 병합 → `사진링크용_본문채움.csv` (92/92, 실패 0)
- [x] verify.py 검증 — 행 순서 원본 동일 / (주제,타이틀) 중복 0 / 빈 본문 0 / 사진 수 정합 전건 / placeholder 잔재 0
- [x] 전체 미리보기 `preview_all.html` (92카드, 사진 CDN 로드, 카드 순서 = CSV 행 순서)
- [ ] 빈칸 2장짜리 사진(before/after) **순서** 육안 확인 (개수는 정합, 의미 순서 7건)
- [ ] 피터공 미리보기 육안 검토 — 걸리는 카드는 번호로 지정 → 해당 백도 재실행 + 재병합
- [ ] 원본 `사진링크용.csv` 교체 여부 + 동현공 전달 (renderedBodyHtml이 최종 산출)

#### 다음 화면 (후보 — 피터공 신호 후 진입)

- [ ] 스토리선택 (story-screen) standalone
- [ ] 주제선택 (category-screen) standalone

#### 미해결 / 결정 대기

- [ ] 확정 레이아웃 pickone 역반영 흐름 — 작업장에서 다듬은 CSS를 pickone `index_pickone.html`로 옮기는 절차 (수동 발췌 vs 빌드 자동)
- [ ] 파일명 컨벤션 — 영문(`source-select`) 유지 vs 한글 화면명. 현재 영문 (NFD·git 안전)
- [ ] `_dev/CLAUDE.md` 프로젝트 구조에 dmz-layout 등록 여부

→ [[PLAN]] / [[SPEC]] / 원본 [[../../DMZ_v5/docs/SPEC-screens|SPEC-screens]]
