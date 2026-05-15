# DMZ v5 — SPEC-data

> STORIES 데이터 외부화 명세. 베이스 HTML 인라인 → 외부 yaml + 빌드 시 자동 주입. 빈칸 정합·자료 type·choices·archivistType 모두 커버. mobile/offline/sequential 3 빌드 공통 사용.

---

## 분리 대상

`shared/index_base.html` L655~ `STORIES` 인라인 객체 (cat01·cat02·cat03 18 스토리 = 약 1500줄 추정).
`shared/index_sequential.html`도 동일 데이터 사용 — 한 yaml로 두 베이스 공유.

분리 후 베이스 HTML에는 `// __STORIES__` placeholder 한 줄만 남음. 빌드 스크립트가 yaml → JSON 변환 후 주입.

## 데이터 파이프라인 (5/14 결정)

**인간 face = CSV, 중간 = yaml, 빌드 = JSON 주입.** AI 리터러시 v06 패턴 차용.

```
인간 편집(CSV) → csv_to_yaml.py → yaml(주제별) → build_stories_json.py → 빌드 주입
                  ↑ round-trip
              yaml_to_csv.py
```

### CSV 단위 (회의 후 결정)

두 후보:
- **두 CSV 분리** — `stories.csv`(메타·blanks·choices) + `sources.csv`(자료 본문, type별 컬럼)
- **type별 CSV 분리** — `stories.csv` + `letters.csv`·`newspapers.csv`·`photos.csv`... 12개

12 type 가변 nested(paragraphs 배열·photos[]·kakao messages[]·qna 등) 때문에 단일 CSV 불가. 결정 후 SPEC 보강.

### 외부 데이터 위치

```
_dev/DMZ_v5/data/
├── csv/                       ← 인간 편집 face (CSV 단위 결정 후 확정)
│   └── ...
├── topics/                    ← 빌드 중간 형식 (yaml)
│   ├── 01-{주제명}.yaml         ← 한 주제 5~6 스토리
│   ├── 02-{주제명}.yaml
│   ├── ...
│   ├── 06-{주제명}.yaml
│   └── archivist_types.yaml
└── (round-trip 검증 보조: shared/dmz_blanks.csv 유지)
```

> archivist_types 분리 — 콘텐츠 측 편집 자리가 다르다(스토리는 정예공, 4유형 narrative는 피터공/아리공).
> 주제별 yaml 분할 이유: 한 파일 ~3000줄 위험 회피, 인간이 한 주제만 열어 편집, 아리공 변환·검증 호흡 작게.

## yaml 스키마

### topics/01-{주제명}.yaml (주제별 6개 파일)

```yaml
topic: cat01                        # 주제 키 (cat01~06)
topic_name: "DMZ의 탄생"            # 주제 이름 (파일명과 일치)
stories:
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
```

빌드 시 6개 yaml을 합쳐서 `STORIES = { cat01: [...], cat02: [...], ..., cat06: [...] }` 단일 객체로 주입.

### type별 templateData 스키마

13 type 각각 필드 (5/14 poster 추가):

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
| `poster` | `title`, `meta`, `paragraphs[]` | — |
| `report` | `header`, `paragraphs[]` | `meta` |
| `homework` | `paragraphs[]` | `heading`, `meta` |
| `text` | `messages[]: {text, sent: bool}` | `source` |
| `qna` | `question[]`, `answer[]` | `source` |
| `twitter` | `handle`, `date`, `paragraphs[]` | `bio` |

본문 안 빈칸은 `{{A}}`, `{{B}}`, `{{C2}}` 등 가변 키 마커. 정규식 `/\{\{([A-D]\d?)\}\}/g`로 파싱.

> **5/14 검증 룰 박힘**: 백도에 yaml schema 위임하기 전, 반드시 (1) 위 표 + (2) `shared/index_base.html` `renderSource()` 함수 case 코드를 직도 확인 → 백도 prompt에 type별 정확한 필드 인라인. SPEC-data만 보고 가는 것도 X — 코드와 1:1 매칭 확인. (cat05·06 사고: title/meta로 만든 newspaper 7건 + header/heading 혼동 1건 + 코드 case 없는 poster 1건. 9건 일괄 정정.)

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
# 0. (인간 편집 후) CSV → yaml 변환
python3 scripts/csv_to_yaml.py    # data/csv/* → data/topics/*.yaml

# 1. 6 yaml + archivist_types yaml → JSON 변환
python3 scripts/build_stories_json.py > /tmp/stories.js
# → const STORIES = { cat01: [...], ..., cat06: [...] };
# → const ARCHIVIST_TYPES = { ... };

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

## Round-trip — CSV ↔ yaml

- 인간 편집은 `data/csv/`에서 (CSV 단위 결정 후 확정)
- `csv_to_yaml.py` — 인간 편집 후 yaml 갱신
- `yaml_to_csv.py` — 현 yaml에서 인간 편집용 CSV 첫 export, round-trip 검증
- `dmz_blanks.csv`(기존)는 빈칸 정합 round-trip 보조로 유지

## 자리

| 자리 | 편집 책임 | 도구 |
|------|----------|------|
| `data/csv/` (CSV 단위 결정 후) | 정예공·박성렬 (콘텐츠) | 스프레드시트 |
| `data/topics/*.yaml` | 빌드 자동 생성 (csv_to_yaml.py) | — |
| `data/topics/archivist_types.yaml` | 피터공·아리공 | 직접 편집 |
| `dmz_blanks.csv` | 빌드 자동 export | round-trip 보조 |

## 미해결

- **CSV 단위** — 두 CSV 분리 vs type별 CSV 분리 (회의 후 첫 자리)
- `ARCHIVIST_TYPES`는 인라인 유지 vs 외부화 — 외부화 1차 추천 (피터공/아리공 편집 빈도가 높음)
- choices `archivistType` 필드 — 백도 정밀 분석 결과 인라인 데이터에 없음. choices.id가 그 역할. yaml에 명시할지 결정

## 변경 이력

| 날짜 | 버전 | 내용 |
|------|------|------|
| 2026-05-14 | v5.1 | STORIES 외부화 명세 신설. yaml + 빌드 주입 패턴 (sequential BLANK_SOURCE_LOOKUP 확장) |
| 2026-05-14 | v5.2 | 외부화 큰 방향 결정 — 인간 CSV face + 중간 yaml + 빌드 주입, 주제별 분할 6 yaml. CSV 단위는 회의 후 결정. |
