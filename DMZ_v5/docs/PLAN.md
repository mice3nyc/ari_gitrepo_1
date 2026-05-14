# DMZ v5 — PLAN

> 개발 계획 (Live document). 방향 전환 시 즉시 갱신. 진행 체크리스트는 [[TASKS|v5 TASKS]] / 기술 명세는 [[SPEC]] / [[SPEC-sequential]].

## 5/14 v5 미션 — STORIES 데이터 외부화

### 왜

1. **콘텐츠가 도착했다** — 5/14 10:46 정예공이 `Assets/incoming/통일부/최종 원고/` 에 cat01~06 6 카테고리 모두 신착. cat04~06(빈 배열)을 채우는 작업 + cat01~03 갱신본이 같이 들어옴.
2. **현재 구조는 콘텐츠-코드 결합** — `shared/index_base.html` L655~ 인라인 STORIES. 베이스 코드 안 직접 박혀 있어 정예공 docx → 수동 파싱 → 코드 직접 수정 파이프라인. cat04~06 추가 시 베이스 2400→4000+ 줄로 커지고 콘텐츠 한 줄 수정도 코드 변경.
3. **선례** — AI 리터러시 v06가 `texts.yaml`로 콘텐츠 분리해서 정혜공/손소장 같은 비개발 협업자가 직접 편집. 같은 방향.
4. **검수 가능성** — CSV/yaml 분리 시 빈칸 정합, 정답 일관, source 라벨 검증을 빌드 단계에서 자동화 가능.

### 무엇

- **베이스 HTML에서 STORIES 인라인을 분리**해서 외부 편집 가능한 데이터 파일로.
- 외부 콘텐츠(`최종 원고/` 폴더 정예공 자료) → 우리 데이터 포맷으로 **변환하는 스크립트**.
- 빌드 단계에서 외부 데이터를 HTML에 **자동 주입**(현재 sequential의 BLANK_SOURCE_LOOKUP 주입 패턴 확장).

### 제약

- **단일 HTML 유지** — file:// 동작 + GitHub Pages 호스팅 + 인턴 베타 환경. fetch() 외부 파일 로드 X.
- **5/26 인턴 베타까지 안정성** — D-12. 큰 구조 변경이 베타를 깨면 안 됨.
- **회의 전 2시간 안에 PLAN+SPEC 골격**, 코드 진입은 회의 후.

## 후보 형식 — 외부화 어떻게

> 백도 정밀 분석 회수 후 확정. 현재 시점 1차 비교:

| 형식 | 사람 편집 | nested 구조 | round-trip | 빌드 |
|------|---------|----------|----------|------|
| **단일 yaml** | ◎ 가장 직관 | ◎ 깊은 nested 지원 (templateData paragraphs 등) | python yaml 라이브러리 | yaml → JSON 인젝션 |
| **단일 JSON** | △ 따옴표·escape 부담 | ◎ | 직접 JSON.parse | 그대로 인젝션 |
| **복수 CSV** | ◎ 스프레드시트 편집 | × nested 표현 어려움 (paragraphs 배열, photos[] 등) | 여러 CSV → 조립 코드 필요 | csv 파싱 후 인젝션 |
| **혼합 (CSV + yaml 본문)** | ◎ 메타·정답은 CSV, 본문은 yaml | ◎ | 분리 round-trip | 두 단계 인젝션 |

**1차 추천**: 단일 yaml. 이유 — Story 객체가 깊은 nested(templateData paragraphs/quotes/photos 배열), 가변 빈칸 키, 12 type 다양성을 한 파일에서 표현 가능. 정혜공/정예공 등 비개발 협업자가 텍스트 에디터로 편집 가능. csv는 평면 데이터(빈칸 정답 정합 검증 등 보조)에 유지.

(백도 분석 회수 후 확정/조정)

## Phase

### Phase 1 — 분리 (회의 후 진입)

- Phase 1.1 — 베이스 HTML L655~ STORIES 인라인 추출 → `data/stories.yaml`
- Phase 1.2 — 빌드 스크립트(`scripts/build.sh`)에 yaml → JSON 인젝션 단계 추가 (BLANK_SOURCE_LOOKUP 주입 패턴 확장)
- Phase 1.3 — 베이스 HTML에 `// __STORIES__` placeholder 신설
- Phase 1.4 — 빌드 + 시각 검증(cat01~03 18 스토리 회귀 테스트)
- Phase 1.5 — sequential 빌드도 같은 데이터 사용 (`shared/index_sequential.html`도 placeholder)

### Phase 2 — 외부 데이터 변환기 (분리 작업 후)

- Phase 2.1 — `최종 원고/` 폴더 자료 형식 정밀 분석 (백도)
- Phase 2.2 — 변환 스크립트 `scripts/import_jygong.py` — 정예공 자료 → `stories.yaml` 갱신본
- Phase 2.3 — 검증: 빈칸 정합(in_source/answer_from), 자료 type 매핑, photo 경로 확인
- Phase 2.4 — cat04~06 통합

### Phase 3 — 검수 & 베타 (5/26 전)

- Phase 3.1 — 5/26 베타 시나리오 완주 테스트
- Phase 3.2 — 콘텐츠 검수 시트(스프레드시트로 export) — 정예공·박성렬 검수용
- Phase 3.3 — 정정 round-trip (CSV/yaml → 코드)

## 외부화 형식 결정 자리

- [ ] 백도 분석 회수 후 단일 yaml vs 혼합 형식 결정 (피터공)
- [ ] sequential 빌드도 같은 데이터 공유 vs 별도 — 같이가 자연 (cat04~06 동일 콘텐츠)
- [ ] 변환기 자동화 정도 — 100% 자동 vs 변환 후 수동 다듬기 (외부 자료 형식 자유도에 따라 결정)

## 미해결

- 최종 원고 폴더가 cat01~03 갱신본도 포함하는지 (덮어쓰기 여부)
- 검수 시트 포맷 (스프레드시트 컬럼 설계)
- 정혜공/박성렬 검수 워크플로우 — yaml 직접 편집 vs 스프레드시트 → yaml 변환

## 인계

- 베이스 코드: `_dev/DMZ_v5/shared/index_base.html` L655~ STORIES 인라인
- 외부 데이터: `Assets/incoming/통일부/최종 원고/01.~06./`
- 참조 패턴: AI 리터러시 v06 `data/texts.yaml`, DMZ sequential의 `BLANK_SOURCE_LOOKUP` 자동 주입
- 변경 이력 / 의사결정: [[요청.26.0514.1120-DMZv5코드리뷰|코드 리뷰 요청 노트]]
