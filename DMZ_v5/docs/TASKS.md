---
created: 2026-05-14
tags:
  - DMZ
  - 통일부
  - 개발
  - 진행작업
author: 아리공
---
### DMZ v5 분기 진행 작업

> v4 통째 복사로 v5 신설. v4 마지막 미커밋 패치(`.bd-hidden .detail-close button` 가시화) 푸시 후 분기. mobile/offline/sequential 3 빌드 구조 유지. 새 변경은 v5에서.

---

#### 분기 ✅

- [x] v4 미커밋 패치 커밋 + 푸시 (`3a3435c`) — `.bd-hidden .detail-close button` 배경색 표시
- [x] `_dev/DMZ_v4/` → `_dev/DMZ_v5/` 통째 복사 (mobile + offline + sequential + shared + docs + scripts)
- [x] localStorage prefix 교체 — `dmz_v4_*` → `dmz_v5_*` (3 빌드 분리 유지, 한 도메인에서 v4/v5 동시 플레이 가능)
- [x] 경로/문서 참조 갱신 — `DMZ_v4` → `DMZ_v5` (README, docs 7종, scripts 2종, HTML 5개)
- [x] 빌드 재실행 — `bash scripts/build.sh` (mobile 163,496 / offline 163,495) + `bash scripts/build_sequential.sh` (sequential 170,927, mappings 71, JS OK)
- [x] 커밋 + 푸시 (`b2b5d95`)

#### 배포 URL

| 빌드 | URL |
| --- | --- |
| mobile | `.../DMZ_v5/mobile/` |
| offline | `.../DMZ_v5/offline/` |
| sequential | `.../DMZ_v5/sequential/` |

GitHub Pages 자동 배포 — `https://mice3nyc.github.io/ari_gitrepo_1/DMZ_v5/{mobile,offline,sequential}/`

#### 코드 리뷰 정리 ✅ (5/14)

- [x] docs 7종 v4→v5 헤더·본문 정정 + SPEC unlock 키 + SPEC-sequential isSourceUnlocked + DATA-SPEC 컬럼 + CODE-FORK-POINTS 라인 + UI-MAP sequential 컴포넌트 5종
- [x] HANDOFF.md 전면 재작성 — 3 빌드 비교 표 + LS 키 정책
- [x] PLAN/TASKS 코드 폴더 통합 (`_dev/DMZ_v5/docs/`)
- [x] _dev/CLAUDE.md 폴더 구조 + 위치 룰 갱신
- [x] DMZ_v4/mobile 누락 CSS 패치 일관화
- [x] 커밋·푸시 (`7b91e51`, `b470781`)
- 상세: [[요청.26.0514.1120-DMZv5코드리뷰|코드 리뷰 요청 노트]]

---

### Phase 1 — STORIES 외부화 (회의 후 진입)

> 이유: 5/14 10:46 정예공 cat01~06 신착(35 docx). 콘텐츠-코드 결합 해소. 선례: AI 리터러시 v06 `csv_to_yaml.py` round-trip. 명세: [[SPEC-data]] / [[PLAN]] §외부화

- [x] **Phase 1.1** — 외부화 큰 방향 결정 (5/14): 인간 CSV face + 중간 yaml + 빌드 주입, 주제별 분할 6 yaml + archivist_types
- [ ] **Phase 1.2** — CSV 단위 결정: 두 CSV 분리(stories+sources) vs type별 CSV 분리 — **회의 후 진입 시 결정** (피터공 5/14 결: 일단 인간 face 보류, 아리공 직도로 cat04~06 채움 우선)
- [x] **Phase 1.3** — 베이스 HTML L655~1906 STORIES + ARCHIVIST_TYPES → `data/topics/01~06-{주제}.yaml` 6개 추출 (cat01~03 채움, cat04~06 빈 stories[])
- [x] **Phase 1.4** — `data/topics/archivist_types.yaml` 분리 (7 types: AB/AC/AD/BC/BD/CD/BALANCED)
- [x] **Phase 1.5** — 베이스 두 HTML(index_base.html, index_sequential.html)에 `// __STORIES_AND_TYPES__` placeholder 신설
- [x] **Phase 1.6** — `scripts/build_stories_json.py` 신설 — 6 yaml + archivist 합쳐서 JSON 변환 + stdout 출력
- [x] **Phase 1.7** — `scripts/build.sh` + `build_sequential.sh` 갱신 — yaml 주입 + JS syntax 검증 추가
- [x] **Phase 1.8** — `shared/index_sequential.html`도 같은 placeholder 패턴 적용
- [x] **Phase 1.9** — 빌드 + cat01~03 18 스토리 회귀 시각 검증 (mobile/offline/sequential 3 빌드 모두 STORIES + ARCHIVIST_TYPES 원본 1:1 일치)
- [ ] **Phase 1.10** — `scripts/yaml_to_csv.py` — 현 yaml에서 인간 편집용 CSV 첫 export (Phase 1.2 결정 후)
- [ ] **Phase 1.11** — `scripts/csv_to_yaml.py` — 인간 편집 CSV → yaml 변환 (역방향)
- [ ] **Phase 1.12** — round-trip 검증 (CSV → yaml → CSV 1:1 일치)
- [ ] **Phase 1.13** — `scripts/validate_stories.py` — yaml 스키마·빈칸·photos·dmz_blanks.csv round-trip 정합 검증

### Phase 2 — cat04~06 yaml 채우기 (아리공 직도 + 백도 위임)

> **방향 전환 (5/14)**: 정예공 docx → 자동 파서 대신 **아리공이 직도로 yaml 작성** (인간 검수는 보류). 백도 5개 병렬 = 한 호흡 ~30분/주제. 패턴: docx text dump → 백도 yaml 조각 → 메인 통합 빌드.

- [x] **Phase 2.1** — cat04 기정동 1 스토리 파일럿 (s0403, 4 type: diary/scholar/photo/kakao) ✅
- [x] **Phase 2.2** — cat04 사진 자료 일괄 복사 (`shared/photos/cat04/`)
- [x] **Phase 2.3** — cat04 나머지 5 스토리 백도 5개 병렬 위임 — s0401 선전마을 / s0404 사라진 마을들 / s0405 UN과 대성동 / s0406 대성동 초등학교 / s0407 민통선 마을 ✅
- [x] **Phase 2.4** — cat04 통합 빌드 + 정합 검증 (mobile 249k / offline 249k / sequential 255k) ✅
- [ ] **Phase 2.5** — cat04 6 스토리 브라우저 플테 (피터공 확인 자리)
- [x] **Phase 2.6** — cat05 6 docx 텍스트 dump → 백도 6개 위임 → 통합 빌드 ✅ (5/14 완료)
  - [x] 2.6.1 cat04 yaml 한 스토리 sample 추출 → 백도 spec
  - [x] 2.6.2 cat05 6 docx → text dump (textutil)
  - [x] 2.6.3 cat05 사진 자료 일괄 카피 (`shared/photos/cat05/` 14장)
  - [x] 2.6.4 백도 6개 병렬 sonnet → yaml element 회수
  - [x] 2.6.5 ruamel.yaml atomic 통합 (cat05 yaml 46,023 bytes)
  - [x] 2.6.6 통합 빌드 (mobile 300k → 353k / sequential 306k → 359k)
  - [x] 2.6.7 cat01~04 24 스토리 1:1 정합 유지 검증
- [x] **Phase 2.7** — cat06 6 docx 텍스트 dump → 백도 6개 위임 → 통합 빌드 ✅ (5/14 완료, cat06 yaml 46,559 bytes)
- [x] **Phase 2.7.1** — schema 사고 진단 + 일괄 정정 (5/14 사후) — 9건 필수 정정 + poster case 신규 추가
  - newspaper 7건: `title`/`meta` → `paperName`/`date`/`headline` (s0501·s0503·s0505·s0506·s0603·s0604·s0605)
  - scholar 1건: `header` → `heading` (s0502 B)
  - poster 1건: `shared/index_base.html` + `shared/index_sequential.html` `case 'poster'` 신규 추가 (s0601 B)
  - kakao 6 messages: `sender` → `name`, `time` 제거 (s0606 D)
  - SPEC-data 13 type 표 갱신 + 검증 룰 박음
- [x] **Phase 2.7.2** — dmz_blanks.csv cat04~06 보충 (5/15) — sequential lock 메카닉 미반영 진단. CSV 71 매핑(cat01~03 18 스토리만) → 143 매핑(36 스토리 전부). yaml `blanks[].source` 회수 후 72행 append. sequential 빌드 재실행 정상(143 mappings, JS OK).
- [ ] **Phase 2.7.3** — surplus 키 38건 결정 대기 (피터공) — yaml에 있으나 코드 미렌더. 모두 콘텐츠 의미 있음(출처·제목·서명·바이오·빈칸 마커 포함). 두 선택지:
  - (a) 코드 렌더 추가 — diary.heading 19/report.meta 9/kakao.source 4/newspaper.meta 1/qna.source 1/text.source 1/twitter.bio 1/twitter.source 1/diary.sign 1
  - (b) yaml 삭제 — 콘텐츠 손실(특히 s0606.B `report.meta` 안 `{{B}}` 빈칸 마커는 게임 기능 영향)
  - 권고: (a). 패턴은 blog/poster 기존 메타 렌더 그대로
- [ ] **Phase 2.8** — cat01~03 갱신본 통합 (정예공 신착 본문 vs 인라인 diff) — 후순위
- [ ] **Phase 2.9** — `scripts/export_review_csv.py` — 검수 시트 export (Phase 1.10~12 결정 후)

### Phase 3 — 검수·베타 (5/26 전)

- [ ] **Phase 3.1** — cat01~06 36 스토리(+α) 전체 완주 테스트
- [ ] **Phase 3.2** — 정예공·박성렬 검수 시트 발송
- [ ] **Phase 3.3** — 검수 round-trip (CSV/yaml → 코드)
- [ ] **Phase 3.4** — 5/26 인턴 베타 빌드 확정

#### 미해결 / 결정 대기

- [x] yaml 단일 vs 카테고리별 → 주제별 분할 확정 (5/14)
- [x] 인간 편집 face → CSV 확정 (5/14, AI 리터러시 패턴)
- [ ] **CSV 단위** — 두 CSV 분리 vs type별 CSV 분리 (회의 후 첫 자리)
- [ ] `ARCHIVIST_TYPES` 외부화 여부 — 1차 외부화 권고
- [ ] choices `archivistType` 필드 명시 여부 — 현재 인라인 데이터에 없음, choices.id가 그 역할
- [ ] docx 헤딩 구조 일관성 — 1개 docx 샘플로 검증 후 파서 설계
- [ ] `twitter` type — 백도 정밀 분석에서 실제 사용 2건 발견 (dead branch 아님). SPEC.md 미해결 섹션의 dead branch 표시 정정 필요

#### 메모

- v4는 보존 상태 유지 — 필요 시 `b2b5d95` 이전 커밋 또는 `_dev/DMZ_v4/` 직접 참조
- v4→v5 분기 시 교체 항목 (메모리 [[memory/feedback_version_branch_checklist|버전 분기 시 연결 값 교체]] 적용):
  - storageKey prefix ✅
  - 빌드 산출 경로 ✅
  - GitHub Pages URL (자동, 폴더 이름만 다름)
  - 문서 내 경로 인용 ✅

→ [[PLAN|v4 PLAN]] / [[TASKS-sequential|v4 sequential TASKS]] / [[2026-05-14]]
