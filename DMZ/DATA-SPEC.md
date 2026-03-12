# DMZ 다이어리 — 데이터 스펙

콘텐츠 데이터의 구조, 네이밍 규칙, 업데이트 절차를 정의한다.

## 캐릭터 (에피소드) 매핑

| charN | episode_id | charName | title |
|-------|-----------|----------|-------|
| 1 | soldier | 군인 | DMZ의 탄생 |
| 2 | student | 초등학생 | 대성동 초등학교 |
| 3 | historian | 역사학자 | 철원성 |

캐릭터 추가 시 charN을 순번으로 부여한다 (char4, char5, ...).

## 이미지

### 네이밍 규칙

```
media/char{N}_photo{M}.jpg
```

- `{N}` = 캐릭터 번호 (위 매핑 참고)
- `{M}` = 사진 순번 (1부터)
- 확장자: `.jpg` (다른 형식 필요 시 협의)

### 현재 이미지 목록

| 파일명 | 캐릭터 | 내용 | 출처 |
|--------|--------|------|------|
| char1_photo1.jpg | soldier | 정전협정 서명식 | NARA, RG 111, SC-423678 |
| char1_photo2.jpg | soldier | MDL 표지판 | USAF, Scott Stewart (1993) |
| char2_photo1.jpg | student | 대성동초등학교 표지판 | Edward N. Johnson, Wikimedia |
| char2_photo2.jpg | student | 대성동 마을 전경 | Park Jong-u (2022), Wikimedia |
| char3_photo1.jpg | historian | 철원평야 전경 | 국방부 "2012년 전선에 서다" |

### 이미지 추가/변경 절차

1. 피터공이 `media/` 폴더에 `char{N}_photo{M}.jpg`로 추가
2. `dmz_blanks.csv`의 photo 열에 파일명 기입
3. 빌드 스크립트 실행 또는 수동 코드 업데이트
4. 사진 수 변경 시 TEMPLATES의 해당 source C 섹션도 업데이트

## 소스 자료 구조

각 에피소드는 4개 소스(A~D)로 구성:

| source_id | type | 코드 클래스 | 설명 |
|-----------|------|-----------|------|
| A | letter/diary/scholar | .letter-paper / .diary-paper / .scholar-paper | 개인 서술 (편지, 일기, 학술 노트) |
| B | newspaper | .newspaper-paper | 뉴스/신문 보도 |
| C | photo | .photo-frame + img | 사진 자료 + 캡션 |
| D | oral | .oral-player | 구술 인터뷰 |

## 빈칸 (Blanks) 규칙

- 에피소드당 4개 (A, B, C, D), 각 소스에 1개씩
- 텍스트 안에서 `[A]`, `[B]`, `[C]`, `[D]`로 표기
- **크로스 참조**: 빈칸의 정답은 반드시 다른 소스에서 찾아야 함
- `answer`: 기본 정답
- `altAnswers`: 대체 정답 배열 (세미콜론 구분, CSV에서)
- `source`: 정답을 찾을 수 있는 소스 ID
- `evidence`: 정답 근거 설명 (CSV 기록용)

### 정답 검증 로직

```javascript
normalizeAnswer(str) → trim + 공백제거 + 괄호제거 + lowercase
checkAnswer(input, blank) → normalize 후 answer 또는 altAnswers 중 매칭
```

## CSV 포맷

### dmz_blanks.csv — 정답표

```csv
episode_id,blank_id,answer,alt_answers,in_source,answer_from,evidence,hint
soldier,A,판문점,,A,B,B 신문 제목,이 편지 속 장소는...
```

- `alt_answers`: 세미콜론(`;`) 구분
- `in_source`: 빈칸이 위치한 소스
- `answer_from`: 정답을 찾을 수 있는 소스

### dmz_choices.csv — 아키비스트 선택지

```csv
episode_id,choice_index,icon_type,title,meaning
soldier,1,envelope,군인의 편지,개인의 감정과 체험을 기록으로 남긴다
```

## 정예공 원고 (docx) 표준 구조

정예공이 보내는 `.docx` 파일은 아래 순서를 따른다:

1. 헤더: 카테고리 | 세부 주제
2. 콘텐츠 개요 테이블
3. 자료 A ~ D (각각 메타 테이블 + 본문 텍스트)
4. 크로스 참조 빈칸 정답표 (테이블)
5. 선택 메카닉 (선택지 테이블)
6. 게임 플로우 (테이블)
7. 연출 노트

### docx 파일명 규칙

```
YYMMDD_{주제명}_수정본.docx
```

저장 위치: `Assets/incoming/codeSamples/data_DMZ/`

## 업데이트 파이프라인

```
정예공 docx → 아리공 파싱 → CSV 업데이트 → 피터공 검토 → 코드 반영
```

### 수동 업데이트 (현재)
1. docx에서 변경사항 추출
2. `index.html`의 GAME_DATA + TEMPLATES 직접 수정
3. 브라우저 테스트

### 자동 업데이트 (향후)
1. `dmz_build.py`가 CSV → JSON → index.html 자동 생성
2. docx 파서가 원고에서 CSV 자동 변환

## 변경 이력

| 날짜 | 버전 | 내용 |
|------|------|------|
| 2026-03-11 | v3 | 초기 3 에피소드. UI-MAP.md 생성. 이미지 네이밍 확립 |
| 2026-03-12 | v3.1 | 정예공 수정본 반영 (blanks 재배치, 텍스트 수정). DATA-SPEC.md 생성 |
| 2026-03-12 | v3.1 | GitHub Pages 배포. all-clear 팝업 UX 추가. GitHub: c491ee6 |
