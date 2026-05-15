---
created: 2026-05-15
tags:
  - DMZ
  - SPEC
  - 데이터구조
author: 아리공
---
# DMZ v5 — SPEC-data v2 (5계층 + 마크다운 face)

> v1(SPEC-data.md) yaml templateData 12 type case 가변 nested 구조 → 5계층 + 마크다운 face + JSON 중간 + 빈칸 button. 5/15 피터공 결정. 선문후코 — 본 SPEC 확정 후 마이그레이션 진입.
>
> 5/14 cat05·06 사고 근본 해소(코드 case ↔ yaml field 다중 매칭 사라짐). 콘텐츠 작가 핸드오프 용이.

---

## 1. 5계층 구조

| 계층 | 이름 | 예시 | 책임 |
|---|---|---|---|
| (1) | **대분류** | A 개인서사자료 / B 공식기록자료 / C 시각매체자료 / D 구술증언자료 | 슬롯 위치 = 대분류 (4 고정) |
| (2) | **소분류** | diary, letter, newspaper, photo, oral... | 화면 표시 패턴 |
| (3) | **자료 타이틀** | "올해도 돌아왔습니다" | 자료 식별 헤딩 |
| (4) | **메타데이터** | date, credit, origin | frontmatter 구조화 필드 |
| (5) | **본문** | 마크다운 + 인라인 HTML + 빈칸 마커 + 사진 | 자유 포맷 |

## 2. 대분류 ↔ 소분류 매핑

**대분류 고정 4 (피터공 5/15 결정)**:

| 슬롯 | 대분류 명칭 | 허용 소분류 |
|---|---|---|
| **A** | 개인서사자료 | diary, letter, blog, homework, twitter |
| **B** | 공식기록자료 | newspaper, scholar, report, poster |
| **C** | 시각매체자료 | photo |
| **D** | 구술증언자료 | oral, kakao, text, qna |

- 슬롯 ↔ 대분류 일관성 강제. 빌드 시 검증 — 위반 시 에러.
- twitter는 A(개인 SNS 발화)로 분류. 결정 자리 1 참조.

## 3. 폴더 구조

```
data/sources/
├── cat01-DMZ-기본정보/
│   ├── s0101-DMZ의-탄생/
│   │   ├── _meta.md             # 스토리 메타 + blanks + choices
│   │   ├── A-개인서사.md         # 슬롯 A 자료
│   │   ├── B-공식기록.md
│   │   ├── C-시각매체.md
│   │   └── D-구술증언.md
│   ├── s0102-.../
│   └── ...
├── cat02-생태환경/
│   └── ...
└── archivist_types.md           # 4 아키비스트 narrative
```

- 폴더명 = `{topic_id}-{kebab-제목}` / 스토리 폴더 = `{story_id}-{kebab-제목}`
- 파일명 = `{슬롯}-{대분류-명칭-축약}.md` (인간 가독성)
- 한글 폴더명 허용 (macOS 자명, GitHub OK)

## 4. 자료 md 파일 — frontmatter + body

```markdown
---
slot: A
category: 개인서사자료
subtype: diary
title: 올해도 돌아왔습니다
meta:
  date: 2026년 1월
  credit: 일기 자료 재구성
  origin: 통일부 보도자료
---

올해도 {{A}}들이 시베리아에서 출발해 철원 평야에 도착했다.

오늘 강가에서 무리를 봤다.

![두루미 무리](photos/cat02/s0202/A-1.jpg "철원, 2026.1")

내일은 {{B}}로 가야 한다.
```

**frontmatter 필드**:
- `slot`: A/B/C/D (필수)
- `category`: 개인서사자료/공식기록자료/시각매체자료/구술증언자료 (필수, slot과 정합 검증)
- `subtype`: 소분류 ID (필수)
- `title`: 자료 헤딩 (필수)
- `meta.{key}`: 자유 키. 표시 위치는 subtype 렌더 패턴 따름 (필수 키는 subtype별로 다름 — §6 표 참조)

**body (마크다운)**:
- 표준 마크다운 (CommonMark + 확장)
- 인라인 HTML 허용 (`<br>`, `<span class>`, `<small>` 등)
- 빈칸 마커: `{{A}}`, `{{B}}`, `{{C1}}`, `{{D2}}` 등 (정규식 `\{\{([A-D]\d?)\}\}`)
- 사진: `![alt](path "캡션")` 표준 마크다운 (alt → caption / title 속성 → credit)

## 5. _meta.md — 스토리 단위

```markdown
---
id: s0202
topic: cat02
title: 두루미들의 대장정
era: 2026년 겨울
location: 철원 평야
soundNote: 학울음, 바람 (선택)
blanks:
  A:
    answer: 두루미
    altAnswers: [학]
    from: B
    hint: ...
  B:
    answer: 학울음터
    from: C
choices:
  - id: A
    icon: 📔
    title: 감정의 아키비스트
    meaning: ...
  - id: B
    icon: 📰
    title: 사실의 아키비스트
    meaning: ...
  - id: C
    icon: 📷
    title: 시각의 아키비스트
    meaning: ...
  - id: D
    icon: 🎙️
    title: 증언의 아키비스트
    meaning: ...
---
```

본문 비워둠 (frontmatter만). choices.id는 슬롯 A~D와 1:1.

## 6. 소분류별 화면 표시 패턴

> body 자체는 마크다운이라 자유. 단 frontmatter `meta` 필드는 subtype별 화면 위치 규약.

| subtype | meta 필드 (필수) | meta 필드 (선택) | 화면 표시 위치 |
|---|---|---|---|
| `diary` | date | credit, sign | 상단 헤더(date) + 본문 + 하단 sign |
| `letter` | date, sign | credit, soundNote | 상단(date) + 본문 + 하단(sign) + 사운드 |
| `blog` | author, date | credit | 상단 헤더 |
| `homework` | author, school, grade | credit | 상단 헤더 |
| `twitter` | handle, date | bio | 상단(@handle · date) + bio(선택) |
| `newspaper` | paperName, date | credit | 상단 헤더 + 본문 |
| `scholar` | author, source | credit | 상단 출처 + 본문 |
| `report` | issuer, date | credit | 상단 발행처 + 본문 |
| `poster` | issuer, date | credit | 상단 발행처 + 본문 |
| `photo` | — | credit (전체) | body가 `![](){}` 시퀀스 (1~여러 장 캡션+크레딧) |
| `oral` | speaker, age | credit, soundNote | 상단 화자 정보 + 본문(인용) + 사운드 |
| `kakao` | participants | credit | body가 카톡 줄 패턴 (아래 참조) |
| `text` | participants | credit | body가 문자 패턴 |
| `qna` | source | credit | body가 Q./A. 패턴 |

**kakao body 마크다운 규약**:
```markdown
> **이름** [left|right]: 메시지 본문
```
또는 줄 패턴 — 파서 결정 자리(아래).

## 7. 빈칸 button

- md `{{A}}` → 파서가 변환:
  ```html
  <button class="blank-input" data-key="A" type="button">A</button>
  ```
- 클릭 → 입력 모달 (기존 동작 유지)
- 채워진 후 → `<span class="blank-filled" data-key="A">두루미</span>`

## 8. 사진 처리

**일반 자료 안 단일 이미지**:
```markdown
![두루미 무리](photos/cat02/s0202/A-1.jpg "철원, 2026.1")
```
→
```html
<figure>
  <img src="photos/cat02/s0202/A-1.jpg" alt="두루미 무리">
  <figcaption>철원, 2026.1</figcaption>
</figure>
```

**photo subtype 자료 (시각매체 전용)**:
body가 `![](){}` 시퀀스. 파서가 `subtype: photo` 감지 시 wrapper `<div class="photo-frame">` 자동 추가.

```markdown
![캡션1](photos/cat02/s0202/C-1.jpg "출처: ICF")

![캡션2](photos/cat02/s0202/C-2.jpg "출처: 문화재청")
```
→
```html
<div class="photo-frame">
  <img...><div class="photo-caption">캡션1</div><div class="photo-source">출처: ICF</div>
</div>
<div class="photo-frame">...</div>
```

**경로 규약**: `photos/{cat}/{story}/{slot}-{N}.{ext}` — 빌드 시 `shared/photos/` 그대로 복사.

## 9. JSON 중간 형식 (빌드 산출)

파서가 모든 md → 단일 JSON:

```json
{
  "cat02": [
    {
      "id": "s0202",
      "title": "두루미들의 대장정",
      "era": "2026년 겨울",
      "location": "철원 평야",
      "sources": [
        {
          "slot": "A",
          "category": "개인서사자료",
          "subtype": "diary",
          "title": "올해도 돌아왔습니다",
          "meta": { "date": "2026년 1월", "credit": "..." },
          "bodyHtml": "<p>올해도 <button class=\"blank-input\" data-key=\"A\">A</button>...</p>..."
        },
        ...
      ],
      "blanks": { "A": { "answer": "두루미", "from": "B", ... } },
      "choices": [...]
    }
  ],
  ...
}
```

- 단일 파일 `data/stories.json`
- 인라인 X — 빌드 스크립트가 placeholder 주입

## 10. 파서 — `scripts/md_to_json.py`

**라이브러리**: `python-markdown` + `python-frontmatter` (둘 다 stdlib에 가까운 안정 라이브러리)

**파이프라인**:
```
1. scan data/sources/cat*/s*/
2. for each story folder:
   a. _meta.md frontmatter → story metadata (id/era/location/blanks/choices)
   b. for slot in [A,B,C,D]:
        load {slot}-*.md → frontmatter + body
        slot/category 일관성 검증 (mismatch 시 에러)
        body markdown → html (markdown.markdown(..., extensions=['extra','attr_list']))
        {{X}} regex 치환 → <button>
        ![](){} → <figure><img><figcaption>
        if subtype=='photo' → <div class="photo-frame"> wrapper
3. validate:
   - 모든 스토리 sources = 4 (A/B/C/D)
   - blanks 키 ∈ {A,A1,A2,B,B1,...,D}
   - blanks[key].from ∈ {A,B,C,D}
   - photos 파일 실재 확인
4. output: data/stories.json + archivist_types.json
```

**검증 모드**: `python3 md_to_json.py --validate` — JSON 출력 없이 검증만.

## 11. 빌드 파이프라인 (변경)

```bash
# 기존 build_stories_json.py + yaml → 폐기
# 새: md_to_json.py
python3 scripts/md_to_json.py > /tmp/stories.js
# const STORIES = {...}; const ARCHIVIST_TYPES = {...};

# 이후 단계 기존과 동일 (placeholder 주입, OFFLINE_MODE 토글, JS syntax 검증)
```

`scripts/build.sh` + `build_sequential.sh` 갱신.

## 12. dmz_blanks.csv

`_meta.md` frontmatter `blanks`가 source of truth.
파서가 빌드 시 `dmz_blanks.csv` 자동 export — round-trip 검증 보조 유지.

## 13. 코드 변경 — renderSource

기존 switch 14 case → 단순화:

```javascript
function renderSource(src, solvedBlanks, allBlanks) {
  // bodyHtml에 이미 빈칸 button 박혀 있음
  // solvedBlanks 적용 — button → filled span 변환
  let html = src.bodyHtml;
  for (const key of Object.keys(solvedBlanks)) {
    if (solvedBlanks[key]) {
      html = html.replace(
        new RegExp(`<button class="blank-input"[^>]*data-key="${key}"[^>]*>[^<]*</button>`, 'g'),
        `<span class="blank-filled" data-key="${key}">${solvedBlanks[key]}</span>`
      );
    }
  }
  return `<div class="src-frame src-${src.subtype} cat-${src.slot}">
    <div class="src-title">${src.title}</div>
    ${renderMeta(src.meta, src.subtype)}
    <div class="src-body">${html}</div>
  </div>`;
}
```

renderMeta는 §6 표 따라 subtype별 헤더 출력. CSS는 기존 `.diary-paper` `.letter-paper` 등 그대로 — wrapper class만 새로.

## 14. 결정 자리 (피터공)

| # | 결정 자리 | 권고 | 영향 |
|---|---|---|---|
| 1 | **twitter 대분류** | A 개인서사자료 (개인 SNS 발화) | s0203.A·s0204.A 정합 |
| 2 | **s0102.A qna → 슬롯 변경** | 슬롯 D로 이동 (구술증언자료) | 콘텐츠 짝 재배치, blanks.from 정정 |
| 3 | **s0103.D scholar → 슬롯 변경** | 슬롯 B로 이동 (공식기록자료) | 동일 |
| 4 | **s0506 B·C 슬롯 swap** | 현 B=photo·C=newspaper → B=newspaper·C=photo | blanks.from 정정 |
| 5 | **s0603.C report → 슬롯 변경** | 슬롯 B로 이동 | blanks.from 정정 |
| 6 | **kakao body 마크다운 규약** | `> **이름** [right]: 메시지` blockquote 패턴 | 파서 정규식 |
| 7 | **scholar.author / scholar.source / report.issuer 필수화** | 필수 — 모든 자료 출처 명시 | 콘텐츠 회수 |
| 8 | **archivist_types 분리 위치** | `data/sources/archivist_types.md` frontmatter | 편집 자리 분리 |

> 결정 자리 2~5는 콘텐츠 짝 재배치 — 정예공/박성렬 검수 짝지어야 함. 단순 mv 아님. 베타 후 권고.

## 15. 단계별 진행 — Phase 1 ~ 3

**Phase 1 — 파일럿** (베타 D-11, 5/15~5/17, 베타 위협 X)
- [ ] 1.1 본 SPEC 피터공 검토 + 결정 자리 1·6·7 확정
- [ ] 1.2 s0202 한 스토리 yaml → md 5개 마이그레이션 (아리공 직도)
- [ ] 1.3 `md_to_json.py` 파서 v0.1 작성 — s0202만 처리
- [ ] 1.4 단일 스토리 JSON 출력 → 베이스 HTML 인라인 주입 → 빌드 → 회귀 시각 확인
- [ ] 1.5 피터공 obsidian에서 s0202/A-개인서사.md 편집 체험

**Phase 2 — 일괄 마이그레이션** (베타 후, 5/27~6/3)
- [ ] 2.1 결정 자리 2·3·4·5 확정 (콘텐츠 짝 재배치)
- [ ] 2.2 36 스토리 일괄 변환 (백도 6개 위임, 주제별)
- [ ] 2.3 빌드 통합 — renderSource 단순화 + 빈칸 button
- [ ] 2.4 dmz_blanks.csv auto-export
- [ ] 2.5 회귀 검증 + 36 스토리 시각 확인
- [ ] 2.6 yaml 폐기 (`data/topics/*.yaml` 삭제 또는 archive)

**Phase 3 — 콘텐츠 작가 핸드오프** (6/4~)
- [ ] 3.1 정예공/박성렬에 폴더 + 마크다운 편집 가이드 전달
- [ ] 3.2 vscode/obsidian 셋업 안내
- [ ] 3.3 검수 round-trip — md 수정 → 빌드 → 확인

## 16. 변경 이력

| 날짜 | 버전 | 내용 |
|---|---|---|
| 2026-05-15 | v2.0-draft | 5계층 + 마크다운 face + JSON 중간 + 빈칸 button + 파서 명세. SPEC-data v1(yaml templateData) 대체 예정. 피터공 결정 자리 8건 박음. |
