# DMZ v5 — DATA-SPEC

> 데이터 구조, photos 영문화 규칙, 빈칸/자료 타입 정의. v3.2 DATA-SPEC.md 갱신본 — v3.2의 `char{N}_photo{M}` 규칙은 폐기.

## photos 영문화 (★ v3.2 규칙 폐기, v5 신규)

### 네이밍 규칙

```
photos/cat{N}/{N}-{M}.{ext}
```

- `{N}`: 카테고리 번호 (01~06)
- `{M}`: cat 내 이미지 순번 (1부터)
- `{ext}`: `jpg` / `png` / `jpeg` (원본 보존)

설명/출처/라이선스는 파일명에 박지 않고 **`photos_manifest.csv`에 보존**.

### resized/ 폴더

s0101 전용 잔존:
- `photos/resized/01_signing_1953.jpg` (정전협정 서명식)
- `photos/resized/02_mdl_marker.jpg` (MDL 표지판)

cat01과 별도 유지. 향후 cat01에 통합 가능(현재는 정예공 의도 보존).

### photos_manifest.csv

위치: `_dev/DMZ_v5/shared/photos_manifest.csv`

컬럼:
```
new_filename, old_filename, category, number, source_caption, source_organization, license, extension, used_by_story
```

**의미**:
- `new_filename`: 영문화된 새 파일명 (예: `1-2.jpg`)
- `old_filename`: 정예공 원본 한글 파일명 (보존)
- `category`: cat01~06, resized
- `number`: cat 내 순번 (예: `1-2`, `2-9`)
- `source_caption`: 의미 부분 (한글 OK, 예: `MDL 표식물`)
- `source_organization`: 출처 (`USAF` `NARA` `UNESCO` `문화재청` `한국일보` 등)
- `license`: `CCBY` `CCBYSA3` `CCBYSA4` `PD` `KOGL` `UNESCO` 등
- `extension`: `jpg` `png` `jpeg`
- `used_by_story`: 코드 참조 스토리 ID (`s0102`, `s0203;s0204`, 또는 빈 값)

### 신규 이미지 추가 절차

1. `photos/cat{N}/` 안에 `{N}-{M}.{ext}` 형식으로 추가
2. `photos_manifest.csv`에 한 행 추가 (모든 컬럼 채움)
3. `shared/index_base.html`의 STORIES 안 src 갱신
4. `bash scripts/build.sh` 재빌드

### 한글 파일명 처리 정책

- **새 자산은 영문 파일명만**. 한글 파일명 들어오면 영문화 후 manifest에 한글 원본 보존
- macOS NFD vs HTTP 서버 NFC 충돌 회피 — 영문화는 그 회피책

## STORIES 데이터 구조

### Story 객체

```js
{
  id: "s0102",                   // 4자리: cat 2자리 + 스토리 2자리
  title: "DMZ 명칭의 의미",
  era: "1953",
  location: "DMZ 일원",
  sources: [
    { id: "A", type: "letter", templateData: {...}, meta: {...} },
    { id: "B", type: "newspaper", templateData: {...}, meta: {...} },
    { id: "C", type: "photo", src: "photos/cat01/1-2.jpg", caption: "...", meta: {...} },
    { id: "D", type: "oral", templateData: {...}, meta: {...} }
  ],
  blanks: {
    A: { answer: "비무장지대", hint: "...", source: "B", altAnswers: ["DMZ"] },
    A1: { ... },                 // 가변 키 (A1, A2, C2 등)
    B: { ... },
    C: { ... },
    D: { ... }
  },
  choices: [
    { icon, title, meaning, archivistType: "A"|"B"|"C"|"D" }
  ]
}
```

### 빈칸 키 가변

v3.2 시점: 항상 A/B/C/D 4개  
v5: 스토리마다 가변. 예:
- s0103 (`DMZ의 지리적 위치`): 3개 (B 없음)
- s0102 (`DMZ 명칭의 의미`): 5개 (A1, A2, B, C, D)

자료(source)는 항상 4개(A/B/C/D), 빈칸(blank)이 가변.

### 빈칸 마커

본문 텍스트 안에 `{{A}}`, `{{B}}`, `{{C2}}` 등으로 박힘. 정규식 `/\{\{([A-D]\d?)\}\}/g`로 파싱하여 `<span class="blank-slot">`으로 변환.

## 자료 type 12종

| type | 의미 | CSS 클래스 |
|------|------|----------|
| `letter` | 편지 | `.letter-paper` |
| `diary` | 일기 | `.diary-paper` |
| `scholar` | 학술 노트 | `.scholar-paper` |
| `newspaper` | 신문 | `.newspaper-paper` |
| `photo` | 사진 | `.photo-frame` |
| `oral` | 구술 인터뷰 | `.oral-player` |
| `kakao` | 카톡 메시지 | `.kakao-bubble` |
| `blog` | 블로그 글 | `.blog-post` |
| `report` | 보고서 | `.report-doc` |
| `homework` | 숙제/과제 | `.homework-paper` |
| `text` | 일반 텍스트 | `.text-block` |
| `qna` | Q&A | `.qna-pair` |

## AC/BD 자료 분류 (offline 빌드)

`source.id`가 분류 키:
- **A, C**: 모바일에 본문 표시 (열람 가능)
- **B, D**: 모바일에 본문 가림 (현장 출력물 의존) → 정답 입력 시 unlock

Story 작성 시 의도적으로 출력물용 자료(B, D)에 시각 자료(사진/포스터 등)나 긴 본문을 배치하면 출력물 가치 ↑.

## 정답 검증 규칙

### normalizeAnswer (v5 부활)

```js
normalizeAnswer(s) = trim → 공백 제거 → 괄호 제거 (한·영) → lowercase
```

### checkAnswer 매칭 순서

1. `answer` (기본 정답)
2. `altAnswers[]` (대체 정답 — 세미콜론 구분으로 CSV 저장)

### altAnswers 정책 (4/21 회의 "복수정답=필수")

각 빈칸은 다음 케이스를 altAnswers에 포함:
- 영문 표기 (예: `해리슨` ↔ `Harrison`)
- 단위 변형 (예: `4` ↔ `4km` ↔ `4킬로미터`)
- 약어/풀네임 (예: `UN` ↔ `유엔` ↔ `United Nations`)
- 같은 단어 다른 발음/표기

## CSV — dmz_blanks.csv (예정 갱신)

위치: `_dev/DMZ_v5/shared/dmz_blanks.csv`

컬럼 (실제 CSV 헤더 기준):
```
episode_id, blank_id, answer, alt_answers, in_source, answer_from, evidence, hint
```

- `episode_id`: `s0102` (스토리 ID)
- `blank_id`: `A`, `B`, `C`, `D`, `A1`, `A2`, `C2` 등 가변
- `alt_answers`: 세미콜론(`;`) 구분
- `in_source`: 빈칸이 위치한 source ID
- `answer_from`: 정답을 찾을 수 있는 source ID. **비어 있는 행**(현재 3행: `s0104_B`, `s0301_A`, `s0306_C`)은 in_source 자체에서 풀이 가능한 자기완결 빈칸 — sequential 빌드 `BLANK_SOURCE_LOOKUP`에서 자동 제외

→ v3.2 CSV는 12 빈칸만. v5 갱신 시 18 스토리 → 약 70+ 빈칸 (cat04~06 추가 시 더 늘어남).

## 정예공 원고 → 코드 반영 파이프라인

```
정예공 docx (cat04~06 신규)
  ↓ (수동 파싱)
shared/index_base.html STORIES.cat0N 배열에 Story 객체 추가
  ↓
photos/cat0N/ 신규 이미지 카피 (영문화 명칭)
  ↓
photos_manifest.csv 행 추가
  ↓
dmz_blanks.csv 행 추가
  ↓
bash scripts/build.sh
  ↓
git push → GitHub Pages 자동 배포
```

## 변경 이력

| 날짜 | 버전 | 내용 |
|------|------|------|
| 2026-04-29 | v4.0-prep | 영문화 매핑, photos_manifest 도입, 12 type, 가변 빈칸 키 |
| 2026-05-14 | v5.0 | 컬럼명 실제 CSV 헤더 기준으로 정정 (`story_id`→`episode_id`, `blank_key`→`blank_id`), `answer_from` 빈 행 처리 명시 |
