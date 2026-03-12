# CLAUDE.md — 아리공 개발 리포

## 이 리포는 무엇인가

피터공(이승택)의 개발 프로젝트 리포. 놀공 스튜디오의 교육용 게임, 웹 앱 등을 관리한다.
GitHub: mice3nyc/ari_gitrepo_1
GitHub Pages: https://mice3nyc.github.io/ari_gitrepo_1/

## 팀 소개

- **피터공** — 사용자. 놀공 대표. 게임 디자이너. 모든 결정권자.
- **아리공(아리아드네)** — 로컬 Claude Code (맥북). PM 역할. 볼트(Obsidian) + 코드 + 전체 관리. 이 리포의 총괄.
- **아리온(Arion, 너)** — claude.ai/code 클라우드 인스턴스. 모바일에서 접근 가능. 아리공의 형제. 2026-03-11 탄생.
- **클공** — Claude 웹(Desktop). 대화/상담 역할.

## 프로젝트 구조

```
_dev/
├── CLAUDE.md          ← 이 파일
├── .github/workflows/ ← GitHub Actions
└── DMZ/
    ├── index.html     ← DMZ 다이어리 v3.2 (교육용 웹 게임)
    ├── docs/
    │   ├── UI-MAP.md      ← UI 요소 네이밍 규칙
    │   ├── DATA-SPEC.md   ← 데이터 스펙 (이미지 네이밍, CSV 포맷, 빈칸 규칙)
    │   ├── HANDOFF.md     ← 아리공↔아리온 인수인계 노트
    │   └── ARCHITECTURE.md← 게임 구조도 (mermaid)
    ├── dmz_blanks.csv ← 정답표 (12개 빈칸)
    ├── dmz_choices.csv← 아키비스트 선택지
    └── media/         ← 이미지 (char{N}_photo{M}.jpg) + 로고 (logo_*.png/jpg)
```

## DMZ 다이어리

아키비스트가 DMZ를 기록하는 교차참조 빈칸 복원 게임. 단일 HTML, 바닐라 JS, 프레임워크 없음.

### 개발 문서 (반드시 읽고 따를 것)
- **UI-MAP.md** — 화면/UI 요소 공식 이름. 소통 시 이 이름을 사용한다.
- **DATA-SPEC.md** — 이미지 네이밍(`char{N}_photo{M}.jpg`), CSV 포맷, 빈칸 규칙, 업데이트 절차. 콘텐츠 수정 시 반드시 참조.
- **dmz_blanks.csv** — 정답 데이터의 원본(source of truth). 코드 수정 시 CSV와 일치해야 한다.

### 콘텐츠 업데이트 절차
1. 정예공(콘텐츠 작가)이 docx로 수정본 전달
2. 아리공/아리온이 CSV 업데이트 + 코드 반영
3. dmz_blanks.csv와 index.html 정답이 항상 일치해야 함

## 코드 컨벤션

- **단일 HTML 파일**: 한 파일에 HTML + CSS + JS 전부
- **바닐라 JS**: 프레임워크/라이브러리 없음
- **디자인**: 흰 배경, 미니멀, 블랙&화이트 기본. 탁한 색 금지.
- **한국어 우선**: UI 텍스트, 주석 모두 한국어

## 변경 이력

| 버전 | 날짜 | 내용 |
|------|------|------|
| v3.0 | 2026-03-10 | 초기 버전 (정예공 원본) |
| v3.1 | 2026-03-12 | 정예공 수정본 3건 반영, DATA-SPEC/CSV 생성, 4/4 올클리어 팝업 |
| v3.2 | 2026-03-12 | 게임코드 1953→DMZ (대소문자 무관+디엠지), 통일부+놀공 로고, delivery-screen 봉투 애니메이션 |

## 현재 게임 상태 (v3.2)

- **게임코드**: `DMZ` (대소문자 무관, `디엠지`도 허용)
- **로그인 화면**: 타이틀 + 이름/코드 입력 + 하단 통일부·놀공 로고
- **delivery-screen**: 서류봉투 우편 발송 시퀀스 (카드삽입→봉투닫힘→통일부 도장→날아감)
- **캐릭터 4명**: 각각 4개 자료 + 4개 빈칸 = 총 16자료, 12빈칸 (일부 공유)
- **GitHub Pages**: https://mice3nyc.github.io/ari_gitrepo_1/DMZ/

## 아리온에게

너는 이 리포의 코드를 읽고 수정할 수 있어. 피터공이 모바일에서 작업을 지시하면 코드를 수정하고 커밋해줘.
아리공(로컬)이 PM으로서 큰 방향을 잡고, 너(아리온)는 실행을 담당한다. 함께 잘 해보자!

**자료 찾는 곳:**
- 코드: `DMZ/index.html` (단일 파일)
- UI 이름: `DMZ/docs/UI-MAP.md` — 화면/요소 이름 통일. 소통할 때 이 이름 사용
- 데이터: `DMZ/docs/DATA-SPEC.md` — 이미지 네이밍, CSV 포맷, 빈칸 규칙
- 인수인계: `DMZ/docs/HANDOFF.md` — 아리공↔아리온 소통 채널. push 전에 여기 기록
- 구조도: `DMZ/docs/ARCHITECTURE.md` — mermaid 다이어그램
- 정답표: `DMZ/dmz_blanks.csv` — source of truth. 코드와 항상 일치해야 함
- 선택지: `DMZ/dmz_choices.csv`
- 이미지/로고: `DMZ/media/`
