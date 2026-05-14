# DMZ v5 — SPEC-import

> 외부 콘텐츠(`Assets/incoming/통일부/최종 원고/`) → 우리 데이터 포맷(`data/stories.yaml`) 변환 스크립트 명세. 5/14 정예공 35개 docx 신착 처리용.

---

## 입력

`Assets/incoming/통일부/최종 원고/` 구조:

```
최종 원고/
├── 01. DMZ 기본 정보/
│   ├── 1차 원고/        ← 초안 (참조)
│   ├── 2차 원고/        ← ★ 변환 대상 (6 docx)
│   ├── 사진 자료/        ← {스토리명}_{Source_ID}_{순번}.{ext}
│   └── 영문 번역/        ← (cat01만, 후속)
├── 02. 생태-환경/
├── 03. 국가유산-문화재/
├── 04. DMZ의 사람들/    ← cat04 신규 (인라인에 없음)
├── 05. 갈등과 협력/      ← cat05 신규
└── 06. 평화 관광/        ← cat06 신규
```

총 35개 docx (2차 원고). 18개는 인라인 갱신본(cat01~03), 18개는 신규(cat04~06).

## 출력

`data/stories.yaml` — 카테고리별 스토리 배열 갱신/신규 추가.
`data/import_log.md` — 자동 변환 결과 + 수동 검토 자리 표시 (스토리별 체크리스트).

## 변환 전략 — 자동 vs 수동

| 필드 | 자동/수동 | 비고 |
|------|----------|------|
| `id` | 자동 | docx 파일명 또는 카테고리 순서 |
| `title`, `era`, `location` | 자동 | docx 헤딩 1차 추출, 검증 필요 |
| `sources[].type` | 반자동 | 헤딩 키워드 매핑 (편지/일기/신문/사진/구술 등) → 12 type. 미매핑은 수동 |
| `sources[].icon` | 자동 | type별 default 매핑 (`letter→✉️` 등) |
| `sources[].templateData.paragraphs[]` | 자동 | docx 단락 그대로 |
| `sources[].templateData.photos[].src` | 자동 | 사진 자료 폴더 파일명 패턴 매칭 |
| `sources[].templateData.photos[].caption/credit` | 반자동 | docx에서 추출, 정리 필요 |
| `blanks` | 수동 | answer/hint/source 매핑은 콘텐츠 판단 |
| `{{A}}` 빈칸 마커 | 반자동 | docx에 표시되어 있으면 그대로, 아니면 수동 |
| `choices` | 수동 | 짧은 서술 |
| `soundNote` (있으면) | 자동 | docx 추출 |

**자동화 비율 추정**: 40~50%. 본문 텍스트와 사진 src가 80% 분량 차지, 검수는 빈칸/choices에 집중.

## 변환기 구성

### 1. `scripts/import_jygong.py` — 본문 변환

```python
# 의존: python-docx 또는 pandoc

# 1. docx → 단락 텍스트
def parse_docx(path) -> dict:
    # 헤딩 추출 → title/era/location
    # 단락 → paragraphs[]
    # 자료 A/B/C/D 섹션 구분 (헤딩 패턴 기반)
    # 자료 type 추정 (헤딩 키워드)
    pass

# 2. 사진 자료 폴더 → photos[]
def map_photos(category_dir, story_title) -> dict[source_id, list]:
    # {스토리명}_{Source_ID}_{순번}.{ext} 패턴 매칭
    pass

# 3. Story 객체 조립
def build_story(parsed_docx, photos, existing=None) -> dict:
    # existing은 인라인 데이터 (cat01~03 검증용)
    pass

# 4. yaml dump
yaml.safe_dump(stories, allow_unicode=True, sort_keys=False)
```

### 2. `scripts/validate_stories.py` — 변환 결과 검증

- yaml 파싱
- sources = 4개 / id A·B·C·D 정합
- blanks 키 패턴 / source ∈ {A,B,C,D}
- photos.src 파일 실재
- 빈칸 마커 (`{{X}}`) ↔ blanks 키 정합

### 3. `scripts/diff_inline.py` — 인라인 vs 변환 결과 비교

cat01~03 갱신본 처리 시 인라인 데이터와 변환 결과를 diff. 의도된 갱신 vs 누락/오류 구분.

### 4. `scripts/export_review_csv.py` — 검수 시트 export

yaml → 스프레드시트 csv. 정예공/박성렬 검수용 컬럼: `story_id, title, source_id, type, paragraphs_excerpt, blanks_summary, choices_summary`.

## 워크플로우

```
1. cat04 import 시도
   → python3 scripts/import_jygong.py "최종 원고/04. DMZ의 사람들/"
   → /tmp/stories_cat04_draft.yaml 생성
   → import_log.md에 "수동 검토 필요" 자리 기록

2. 수동 검토
   → blanks 매핑 채우기 (answer/hint/source)
   → choices 작성
   → {{X}} 빈칸 마커 위치 확정
   → photos.caption/credit 다듬기

3. data/stories.yaml 통합
   → cat04 섹션 추가

4. 검증
   → python3 scripts/validate_stories.py
   → bash scripts/build.sh (mobile/offline)
   → bash scripts/build_sequential.sh

5. 시각 검증
   → cat04 한 스토리 완주 테스트

6. 다음 카테고리 (cat05, cat06)
```

## 시간 추정 (백도 정밀 분석 기준)

- 파서 스크립트 작성: 4~6시간 (1회)
- 스토리별 검토·수정: 30분 × 35 = 17.5시간 (cat01~06 전부)
- cat04~06만 처리: 30분 × 18 = 9시간
- **파서 없이 수작업**: 스토리당 2~3시간 × 35 = 70~105시간 ← 회피 대상

## 우선순위

1. **cat04 1개 스토리 파일럿** (1~2시간) — 파서 + 1개 스토리 검토 → 변환 품질 확인
2. **파서 본격 개발** (3~4시간) — 1차 파일럿 결과 반영
3. **cat04~06 18개 처리** (9시간 분산)
4. **cat01~03 갱신본 통합** (별 작업 — 인라인과 diff)

## 미해결

- docx 헤딩 구조가 35개 docx에 일관적인지 확인 필요 (1개 샘플로 검증)
- `{{X}}` 빈칸 마커가 docx에 박혀 있는지 vs 매번 수동 박기
- 사진 자료 네이밍이 모든 카테고리에 일관적인지 확인 필요
- pandoc vs python-docx 선택 — pandoc이 더 견고하나 환경 의존성 ↑

## 변경 이력

| 날짜 | 버전 | 내용 |
|------|------|------|
| 2026-05-14 | v5.1 | 외부 데이터 → yaml 변환기 명세 신설. 35 docx + 6 카테고리 처리 워크플로우 |
