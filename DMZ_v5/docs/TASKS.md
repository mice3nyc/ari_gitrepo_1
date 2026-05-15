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
- [x] **Phase 2.7.3** — surplus 키 38건 진단 완료 (5/15) — 피터공 결정: **5계층 + 마크다운 face 재구조화 진입**. surplus는 새 구조에서 모든 콘텐츠가 body에 박혀 자동 해소. → [[SPEC-data-v2]] / [[../../../../../.claude/plans/1-2-5-dazzling-parrot]]
- [ ] **Phase 2.8** — cat01~03 갱신본 통합 (정예공 신착 본문 vs 인라인 diff) — 후순위
- [ ] **Phase 2.9** — `scripts/export_review_csv.py` — 검수 시트 export (Phase 1.10~12 결정 후)

### Phase 4 — 5계층 + 마크다운 face 재구조화 (5/15~ / 베타 후 일괄)

> 피터공 결정 5/15. SPEC: [[SPEC-data-v2]]. Plan: `~/.claude/plans/1-2-5-dazzling-parrot.md`. 결정 자리 8건 모두 확정.

**Phase 4.1 — 파일럿** (5/15~5/17, 베타 위협 X)

- [x] 4.1.1 폴더 구조 생성 `data/sources/cat02-생태환경/s0202-두루미-월동지/`
- [x] 4.1.2 s0202 yaml → md 5파일 마이그레이션 (_meta.md + A/B/C/D-{대분류}.md)
- [x] 4.1.3 `scripts/md_to_json.py` 파서 v0.1 — 13 subtype 처리, slot/category 일관성 검증, photo/oral/kakao/text/qna 패턴 파서
- [x] 4.1.4 `scripts/build_stories_json.py`에 md 덮어쓰기 분기 추가(임시) — yaml 35 + md 1 = 36 스토리 합본
- [x] 4.1.5 빌드 회귀 — mobile 353,288 / offline 353,287 / sequential 360,608 bytes, JS syntax OK, s0202 콘텐츠 본문 유지 확인
- [x] 4.1.6 피터공 obsidian에서 `data/sources/cat02-*/s0202-*/` 5 md 열어 사진 미리보기 + 편집 체험 (5/15 세션353)
- [x] 4.1.7 **SPEC v2 §17 마크다운 face 결정 박힘** (5/15 세션353) — 텍스트 subtype 9종 frontmatter 표시 메타 폐기, 본문 통째 markdown → HTML
- [x] 4.1.8 `md_to_json.py` v0.2 — TEXT_SUBTYPES, md_block_to_html, extract_h1 폴백, build_template_data 새 분기
- [x] 4.1.9 s0202 A diary + B newspaper 본문화 패턴 재구성 (H1·em·H2 본문 안)
- [x] 4.1.10 `index_base.html` + `index_sequential.html` — diary/scholar/newspaper case `if (d.html)` 새 분기 + CSS 셀렉터 매핑 (`.newspaper-paper h1`, `.diary-paper h1` 등)
- [x] 4.1.11 빌드 회귀 — mobile 355,248 / offline 355,247 / sequential 362,568 bytes, JS syntax OK, 143 blank mappings, 커밋 `4f38e45` push
- [x] 4.1.12 두루미 본문화 빈칸 작동 검증 — A·B 5 빈칸(시베리아·재두루미·202·203·학) 플테 ✅ 5/15 세션354 피터공 mobile 플테 통과

**Phase 4.2 — 일괄 마이그레이션** (베타 후, 5/27~6/3)

- [ ] 4.2.1 결정 자리 #2~#5 콘텐츠 짝 재배치 (정예공/박성렬 검수)
  - s0102.A qna → 슬롯 D / s0103.D scholar → 슬롯 B / s0506 B·C swap / s0603.C report → 슬롯 B
- [ ] 4.2.2 24 스토리 일괄 변환 (백도 5개 병렬, 주제별 cat01~04·cat06)
- [ ] 4.2.3 renderSource 단순화 — switch 14 case → bodyHtml 주입 + meta 헤더 자동
- [ ] 4.2.4 빈칸 button UI — md `{{X}}` → `<button>` → 클릭 입력 모달
- [ ] 4.2.5 dmz_blanks.csv auto-export from _meta.md frontmatter
- [ ] 4.2.6 24 스토리 회귀 시각 검증
- [ ] 4.2.7 yaml 폐기 — `data/topics/*.yaml` archive
- [ ] 4.2.8 build_stories_json.py md 분기 정리 → 단일 경로

**Phase 4.5 — 콘텐츠 canon 정합 (베타 후)**

> 5/15 세션354 발견. 통일부 docx 2차원고(5/7) + xlsx 정답표(5/14) = canon. 현 게임 데이터(yaml/md)는 빈칸 위치·답 다수 어긋남. 두루미(s0202) 예시 [[CONTENT-DIVERGENCE-두루미-26.0515]] 참조. 베타 5/26은 현 데이터로 진행.

- [ ] 4.5.1 24 스토리 docx 2차원고 vs 현 yaml 빈칸 위치 자동 비교 스크립트
- [ ] 4.5.2 cat01·cat02 잔류 ID/제목/답 불일치 정리 (s0103↔s0104 ID swap 등)
- [ ] 4.5.3 정예공/박성렬 합의 — 런칭 정본 결정 (canon vs 현 게임 본문)
- [ ] 4.5.4 합의 후 일괄 정정 (Phase 4.2와 묶어 진행)

**Phase 5.0 — 런칭 스코프 축소 + 베타 사전 인프라** (5/15 세션354 완료) ✅

> 5/14 회의 결정 반영. 베타 5/26 인턴 대상.

- [x] 5.0.1 런칭 스코프 36 → 24 스토리 축소
  - cat05 통째 archive (`data/_archive_pre_beta_5_15/`)
  - cat03 2건(s0303 허준·s0304 병자호란), cat04 2건(s0401 선전마을·s0406 대성동초등학교), cat06 2건(s0603 임진각·s0606 판문점관광) archive
  - `build_stories_json.py` TOPIC_FILES에서 cat05 제거, `index_base/sequential.html` categories cat05 카드 제거, `dmz_blanks.csv` 48행 삭제(143→95)
- [x] 5.0.2 자동 수정 (canon 정합)
  - s0506 B↔C 슬롯 swap (5계층 정합 — archive 분에 적용)
  - s0205 [B]·[D] 답 + altAnswers, s0602 [D] 답 + altAnswers
- [x] 5.0.3 SPEC §14 결정 자리 #1/#6/#7 확정 (twitter→A·kakao blockquote·출처 필수)
- [x] 5.0.4 canon 발견 + 노트 작성
  - 통일부 docx 2차원고(5/7) + xlsx 정답표(5/14) = canon
  - `docs/CONTENT-AUDIT-26.0515.md` + `docs/CONTENT-DIVERGENCE-두루미-26.0515.md`
  - 베타 후 Phase 4.5에서 정합화
- [x] 5.0.5 **DMZ 픽셀 맵 5 카테고리 × 24 셀 정합** (archive 화면)
  - `CAT_COLORS` 6→5 entries, map 5행×11열 24셀 재설계 (zones 0:6, 1:6, 2:4, 3:4, 4:4)
  - `catCounter [0,0,0,0,0,0]` → `[0,0,0,0,0]`
  - 양 베이스 동일 갱신, SPEC.md §DMZ 픽셀 맵 신설
- [x] 5.0.6 **디버그 패널** (인턴 베타 자체 테스트 자리)
  - 우하단 토글, 상태 표시 + 초기화 + 자동 풀이 3종 (현 스토리·카테고리·전체)
  - URL `?reset=1` 파라미터 로드 시 localStorage clear + reload (Ctrl+Shift+R 대체)
  - SPEC.md §디버그 패널 신설
  - 양 베이스(index_base + index_sequential) 동일 갱신
- [x] 5.0.7 빌드 회귀 — mobile 260,536 / offline 260,535 / sequential 266,591 bytes, JS syntax OK

**Phase 6.0 — pickone 빌드 신설 (5/15 세션355)** ✅

> sequential 형제 빌드. 진입 시 첫 자료 슬롯 데이터에서 지정 가능. 이후 사이클 unlock.

- [x] 6.0.1 디폴트 첫 슬롯 자동 산출 — `dmz_blanks.csv` answer_from=photo 빈칸 owner 슬롯
- [x] 6.0.2 `data/first_source.csv` 24행 신설 (episode_id, slot, default_reason)
- [x] 6.0.3 `docs/SPEC-pickone.md` 신설
- [x] 6.0.4 `shared/index_pickone.html` 신설 — index_sequential.html 복사 + getStoryFirstSlot/getUnlockOrder + isSourceUnlocked 사이클 + closeSource flash 사이클 + LS_PREFIX `dmz_v5_p_` + 디버그 패널 모드 라벨
- [x] 6.0.5 `scripts/build_pickone.sh` 신설 — STORIES + BLANK_SOURCE_LOOKUP + FIRST_SOURCE_LOOKUP 주입 + JS syntax 검증
- [x] 6.0.6 빌드 회귀 — pickone 267,564 bytes / 95 blank + 24 first / JS OK
- [ ] 6.0.7 피터공 브라우저 플테 — 첫 슬롯 활성 + 사이클 unlock 작동 확인
- [ ] 6.0.8 photo answer_from 누락 13 스토리 검토 (정예공/박성렬)
- [ ] 6.0.9 커밋·푸시

**Phase 4.3 — 작가 핸드오프** (6/4~)

- [ ] 4.3.1 정예공/박성렬에 폴더 + 마크다운 편집 가이드 (`docs/CONTENT-AUTHORING.md` 신설)
- [ ] 4.3.2 vscode/obsidian 셋업 안내
- [ ] 4.3.3 검수 round-trip — md 수정 → 빌드 → 시각 확인

### Phase 6 — 비주얼 디자인 v1 (5/15 도입)

> 통일부 디자이너 샘플 9장 + 자료 타입 아이콘 4종 + SD 카드 타이틀 + Paperlogy 폰트.
> SPEC: [[SPEC-ui-design]]. 파일럿 = pickone. 피터공 OK 후 mobile/offline/sequential propagate.

- [x] 6.1 자산 통합 — `assets/{icons,fonts,images}/` 신설. 아이콘 9개 + SD카드 + Paperlogy 3 weight
- [x] 6.2 SPEC §UI-design 신설 — 컬러 토큰 6 카테고리 + 폰트 시스템 + 자료 type↔icon 매핑 + 화면별 컴포넌트
- [x] 6.3 pickone 파일럿 — 로그인(SD카드)·튜토리얼(핑크/cyan)·카테고리(폴더격자)·스토리(폴더격자)·자료 리스트(핑크 카드+이미지 아이콘)·자료 본문 모달(핑크 헤더)·빈칸(cyan)
- [x] 6.4 게임 코드 검증 OFF (5/15 임시) — `code !== '1233'` 제거. 아무거나 입력 통과
- [x] 6.5 빌드 + JS syntax OK (282,075 bytes) + 브라우저 플테 합격
- [~] 6.6 mobile / offline / sequential propagate — **폐기 5/15** 피터공 결정: pickone만 계속 업데이트. 나머지 3 빌드는 5/15 상태로 동결
- [ ] 6.7 잔여 화면 다듬기 — completion / result / archive / 자료 paper 스타일(letter·diary·newspaper 등 B&W → 새 톤)
- [ ] 6.8 카카오 자료 본문 새 디자인 — 분홍/회색 말풍선 + 캐릭터 아바타
- [ ] 6.9 카테고리 6 vs 5 — 디자이너 갱신 또는 cat05 복원
- [ ] 6.10 타이머 기능 활성 — 현재 placeholder만(30:00 고정 표시)
- [ ] 6.11 자료 타입별 폰트 변주 — letter 손글씨·poster 임팩트 등 도입
- [ ] 6.12 Kr/En 토글 동작

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
