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

> 이유: 5/14 10:46 정예공 cat01~06 신착(35 docx). 콘텐츠-코드 결합 해소. 선례: AI 리터러시 v06 `texts.yaml`. 명세: [[SPEC-data]] / [[PLAN]] §외부화

- [ ] **Phase 1.1** — yaml 형식 결정 (단일 vs 카테고리별) — 피터공 결정 자리
- [ ] **Phase 1.2** — 베이스 HTML L655~ STORIES 인라인 추출 → `data/stories.yaml`
- [ ] **Phase 1.3** — `data/archivist_types.yaml` 분리
- [ ] **Phase 1.4** — 베이스에 `// __STORIES__` placeholder 신설
- [ ] **Phase 1.5** — `scripts/build_stories_json.py` — yaml → JSON 변환 + 주입
- [ ] **Phase 1.6** — `scripts/build.sh` 갱신 — yaml 인젝션 단계 추가
- [ ] **Phase 1.7** — `shared/index_sequential.html`도 같은 패턴 적용
- [ ] **Phase 1.8** — `scripts/validate_stories.py` — yaml 스키마·빈칸·photos 정합 검증
- [ ] **Phase 1.9** — `dmz_blanks.csv` round-trip 검증
- [ ] **Phase 1.10** — 빌드 + cat01~03 18 스토리 회귀 시각 검증

### Phase 2 — 외부 데이터 변환기 (Phase 1 후)

> 명세: [[SPEC-import]]. 35 docx 처리, 자동화 비율 40~50%, 파서 + 검토 9~15시간.

- [ ] **Phase 2.1** — cat04 1개 스토리 파일럿 (파서 + 1개 변환 + 품질 확인)
- [ ] **Phase 2.2** — `scripts/import_jygong.py` 본격 개발 — docx 파서 + 사진 매핑
- [ ] **Phase 2.3** — cat04 6 스토리 변환 + 수동 검토 (blanks/choices)
- [ ] **Phase 2.4** — cat05 6 스토리
- [ ] **Phase 2.5** — cat06 6 스토리
- [ ] **Phase 2.6** — cat01~03 갱신본 통합 (인라인과 diff)
- [ ] **Phase 2.7** — `scripts/export_review_csv.py` — 검수 시트 export

### Phase 3 — 검수·베타 (5/26 전)

- [ ] **Phase 3.1** — cat01~06 36 스토리(+α) 전체 완주 테스트
- [ ] **Phase 3.2** — 정예공·박성렬 검수 시트 발송
- [ ] **Phase 3.3** — 검수 round-trip (CSV/yaml → 코드)
- [ ] **Phase 3.4** — 5/26 인턴 베타 빌드 확정

#### 미해결 / 결정 대기

- [ ] yaml 단일 vs 카테고리별 — 1차 단일 권고, 피터공 결정
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
