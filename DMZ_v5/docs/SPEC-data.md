# DMZ v5 — SPEC-data

> STORIES 데이터 외부화 명세. 베이스 HTML 인라인 → 외부 yaml + 빌드 시 자동 주입. 빈칸 정합·자료 type·choices·archivistType 모두 커버. mobile/offline/sequential 3 빌드 공통 사용.

---

## 분리 대상

`shared/index_base.html` L655~ `STORIES` 인라인 객체 (cat01·cat02·cat03 18 스토리 = 약 1500줄 추정).
`shared/index_sequential.html`도 동일 데이터 사용 — 한 yaml로 두 베이스 공유.

분리 후 베이스 HTML에는 `// __STORIES__` placeholder 한 줄만 남음. 빌드 스크립트가 yaml → JSON 변환 후 주입.

## 외부 데이터 위치

```
_dev/DMZ_v5/data/
├── stories.yaml          ← STORIES 전체 (cat01~06, 모든 스토리)
├── archivist_types.yaml  ← ARCHIVIST_TYPES (A/B/C/D 4유형 설명)
└── (검증용 csv는 shared/dmz_blanks.csv 유지 — round-trip 검증 보조)
```

> archivist_types도 분리 — 콘텐츠 측 편집 자리가 다르다(스토리는 정예공, 4유형 narrative는 피터공/아리공).

## yaml 스키마

### stories.yaml

```yaml
cat01:                              # 카테고리 키 (cat01~06)
  - id: s0101                       # Story
    title: DMZ의 탄생
    era: "1953년 7월 27일"
    location: "판문점, 중부전선, DMZ 일대"
    soundNote: "포성이 줄어들다 침묵 → 벌레 소리, 바람 소리"   # 선택
    sources:
      - id: A
        type: letter                # 12 type 중 하나
        icon: "✉️"
        title: "군인의 편지"
        sub: "DMZ에서 발견된 편지"
        styleClass: source-letter
        templateData:
          heading: "총소리가 멈춘 밤에"
          meta: "1953년 7월 27일 · ..."
          paragraphs:
            - "어머니, 총소리가 멈췄습니다."
            - "오늘 밤 열 시를 기해 모든 총성이 그쳤습니다. 아침에 {{A}}이라는 곳에서 ..."
            - "..."
          sign: "아들 진우 올림"
          soundNote: "포성이 줄어들며… 침묵. 벌레 소리, 바람 소리."
      - id: B
        type: newspaper
        # ... (type별 templateData 필드 다름. 아래 type별 스키마 참조)
    blanks:
      A:
        answer: "판문점"
        hint: "정전협정 체결 장소"
        source: B                   # 정답 자료 (A/B/C/D)
        altAnswers: ["판문점리"]     # 선택
      B:
        answer: "해리슨"
        # ...
      # 가변 키 — A1/A2/C1/C2 등 스토리마다 다름
    choices:
      - id: A
        icon: "✉️"
        title: "감정을 따라가는 아키비스트"
        meaning: "..."
      # 항상 4개 (A/B/C/D)
  - id: s0102
    # ...
cat02:
  # ...
```

### type별 templateData 스키마

12 type 각각 필드:

| type | 필수 필드 | 선택 필드 |
|------|----------|----------|
| `letter` | `heading`, `meta`, `paragraphs[]`, `sign` | `soundNote` |
| `diary` | `meta`, `paragraphs[]` | `heading` |
| `scholar` | `heading`, `meta`, `paragraphs[]` | — |
| `newspaper` | `paperName`, `date`, `headline`, `paragraphs[]` | `meta` |
| `photo` | `photos[]: {src, alt, caption, credit}` | — |
| `oral` | `meta`, `quotes[]` | `soundNote` |
| `kakao` | `messages[]: {name, text, align?}` | `source` |
| `blog` | `title`, `meta`, `paragraphs[]` | — |
| `report` | `header`, `paragraphs[]` | `meta` |
| `homework` | `paragraphs[]` | `heading`, `meta` |
| `text` | `messages[]: {text, sent: bool}` | `source` |
| `qna` | `question[]`, `answer[]` | `source` |
| `twitter` | `handle`, `date`, `paragraphs[]` | `bio` |

본문 안 빈칸은 `{{A}}`, `{{B}}`, `{{C2}}` 등 가변 키 마커. 정규식 `/\{\{([A-D]\d?)\}\}/g`로 파싱.

### archivist_types.yaml

```yaml
A:
  name: "감정의 아키비스트"
  description: "..."
B:
  name: "사실의 아키비스트"
  description: "..."
# C, D 동일
```

## 빌드 파이프라인

기존 `scripts/build.sh`에 yaml 인젝션 단계 추가:

```bash
# 1. yaml → JSON 변환
python3 scripts/build_stories_json.py > /tmp/stories.js
# → const STORIES = { ... }; const ARCHIVIST_TYPES = { ... };

# 2. shared/index_base.html의 // __STORIES__ placeholder 위치에 주입
awk '/\/\/ __STORIES__/{system("cat /tmp/stories.js");next}1' \
  shared/index_base.html > /tmp/base_filled.html

# 3. OFFLINE_MODE 토글 후 mobile/offline 산출 (기존 패턴)
cp /tmp/base_filled.html mobile/index.html
sed 's/const OFFLINE_MODE = false;/const OFFLINE_MODE = true;/' \
  /tmp/base_filled.html > offline/index.html

# 4. JS syntax 검증
node -e "new Function(require('fs').readFileSync('mobile/index.html', 'utf8'));"
```

sequential 빌드도 동일 — `shared/index_sequential.html`에 placeholder 추가하고 같은 yaml 주입.

## 검증 단계

빌드 후 자동 체크:

- [ ] yaml 파싱 0 오류 (`python3 -c "import yaml; yaml.safe_load(open('data/stories.yaml'))"`)
- [ ] 모든 Story `sources` = 4개 (A/B/C/D)
- [ ] `blanks` 키가 `^[A-D]\d?$` 패턴
- [ ] `blanks[key].source` ∈ {A,B,C,D}
- [ ] `choices` = 4개
- [ ] `photos.src` 경로가 `shared/photos/cat0N/`에 실재
- [ ] `dmz_blanks.csv` 행과 yaml `blanks` 일치 (round-trip 검증)
- [ ] JS syntax 통과
- [ ] 빌드 산출물 file size ≈ 기존 + yaml 분량

## Round-trip — csv 보조 유지

- `dmz_blanks.csv`는 빈칸 정합 검증·검수 시트 export용으로 유지
- 빌드 스크립트가 yaml `blanks` ↔ csv 1:1 검증, 불일치 시 빌드 fail
- 콘텐츠 검수 단계에서 정예공/박성렬 검수 시트는 csv로 export (스프레드시트 편집)

## 자리

| 자리 | 편집 책임 | 도구 |
|------|----------|------|
| `data/stories.yaml` 본문 | 정예공 (콘텐츠) | 텍스트 에디터 또는 변환기 출력 |
| `data/stories.yaml` blanks 매핑 | 아리공 + 피터공 | 검증 가능한 형태 |
| `data/archivist_types.yaml` | 피터공·아리공 | 직접 편집 |
| `dmz_blanks.csv` | 빌드 자동 export | round-trip 보조 |

## 미해결

- yaml 단일 파일 vs 카테고리별 6개 yaml — 단일이 일관성 ↑, 6개가 검수 분담 ↑. 1차 단일로 진입, 18+ 스토리 추가 후 재검토
- `ARCHIVIST_TYPES`는 인라인 유지 vs 외부화 — 외부화 1차 추천 (피터공/아리공 편집 빈도가 높음)
- choices `archivistType` 필드 — 백도 정밀 분석 결과 인라인 데이터에 없음. choices.id가 그 역할. yaml에 명시할지 결정

## 변경 이력

| 날짜 | 버전 | 내용 |
|------|------|------|
| 2026-05-14 | v5.1 | STORIES 외부화 명세 신설. yaml + 빌드 주입 패턴 (sequential BLANK_SOURCE_LOOKUP 확장) |
