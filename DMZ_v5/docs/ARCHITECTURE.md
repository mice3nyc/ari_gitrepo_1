# DMZ v5 — ARCHITECTURE

> 게임 구조도 + 화면 흐름 + offline 분기. mermaid 다이어그램은 GitHub에서 자동 렌더.

## 1. 화면 플로우 (mobile + offline 공통)

```mermaid
flowchart TD
    Login["<b>로그인</b><br>#login-screen<br>이름 + 코드"]
    Tutorial["<b>튜토리얼</b><br>#tutorial-screen<br>4단계 (첫 플레이)"]
    Category["<b>카테고리</b><br>#category-screen<br>cat01~06"]
    Story["<b>스토리</b><br>#story-screen<br>스토리 카드 목록"]
    Game["<b>게임</b><br>#game-screen"]
    SourceList["<b>자료 카드 4개</b><br>.source-list<br>A/B/C/D"]
    SourceDetail["<b>자료 뷰어</b><br>.source-detail<br>본문 + 빈칸"]
    AnswerModal["<b>답변 모달</b><br>#answer-modal"]
    Completion["<b>완료</b><br>#completion-screen"]
    Archive["<b>보관소</b><br>#archive-screen<br>픽셀맵 + 아키비스트 유형"]
    Result["<b>결과</b><br>#result-screen"]

    Login -->|"이름+코드<br>handleLogin()"| Tutorial
    Tutorial -->|"완료 / skip"| Category
    Category -->|"카테고리 클릭<br>selectCategory()"| Story
    Story -->|"스토리 카드 클릭<br>selectStory()"| Game
    Game --- SourceList
    SourceList -->|"자료 카드 클릭<br>openSource()"| SourceDetail
    SourceDetail -->|"빈칸 클릭"| AnswerModal
    AnswerModal -->|"정답<br>submitAnswer()"| SourceDetail
    SourceDetail -->|"닫기"| SourceList
    SourceList -->|"4/4 빈칸 완료"| Completion
    Completion -->|"카테고리 복귀"| Category
    Completion -->|"전체 완료"| Result
    Result --> Archive
    Archive -->|"reset"| Login

    style Login fill:#fff,stroke:#000,stroke-width:2px
    style Tutorial fill:#f9f9f9,stroke:#000,stroke-dasharray:3 3
    style Category fill:#fff,stroke:#000,stroke-width:2px
    style Story fill:#fff,stroke:#000,stroke-width:2px
    style Game fill:#f5f5f5,stroke:#000,stroke-dasharray:5 5
    style SourceDetail fill:#fff,stroke:#000,stroke-width:2px
    style Archive fill:#fff,stroke:#000,stroke-width:2px
```

## 2. offline 분기 — BD unlock 플로우

```mermaid
flowchart TD
    Click["자료 B/D 카드 클릭<br>openSource()"]
    Branch{"OFFLINE_MODE<br>&& src.id ∈ {B,D}<br>&& !unlocked?"}
    LockedCard["<b>안내 카드 표시</b><br>'현장의 출력물을 확인하세요'<br>본문 자리에 점선 테두리<br>빈칸 입력란만 노출"]
    NormalView["<b>본문 + 빈칸 정상 표시</b>"]
    BlankClick["빈칸 클릭"]
    Modal["답변 모달<br>(현장 출력물 보고 입력)"]
    Check{"checkAnswer()"}
    Wrong["오답 토스트"]
    Unlock["<b>unlock 처리</b><br>localStorage 저장<br>(dmz_v5_offline_unlocks)"]
    Render["source-detail 다시 렌더<br>본문 추가 (transition)"]

    Click --> Branch
    Branch -->|"YES (가림)"| LockedCard
    Branch -->|"NO (A/C 또는 unlocked)"| NormalView
    LockedCard --> BlankClick
    NormalView --> BlankClick
    BlankClick --> Modal
    Modal --> Check
    Check -->|"오답"| Wrong --> Modal
    Check -->|"정답"| Unlock --> Render

    style LockedCard fill:#f9f9f9,stroke:#000,stroke-dasharray:5 5,stroke-width:2px
    style Unlock fill:#000,color:#fff
    style Render fill:#fff,stroke:#000,stroke-width:2px
```

## 3. 데이터 구조

```mermaid
classDiagram
    class CATEGORIES {
        cat01: "DMZ 기본정보"
        cat02: "생태환경"
        cat03: "국가유산·문화재"
        cat04: "DMZ의 사람들 (대기)"
        cat05: "갈등과 협력 (대기)"
        cat06: "평화 관광 (대기)"
    }

    class STORIES {
        cat01: Story[6]
        cat02: Story[6]
        cat03: Story[6]
        cat04: Story[]
        cat05: Story[]
        cat06: Story[]
    }

    class Story {
        id: "s0101"~"s0606"
        title: string
        era: string
        location: string
        sources: Source[4]
        blanks: Record~string, Blank~
        choices: Choice[]
    }

    class Source {
        id: "A" | "B" | "C" | "D"
        type: "letter"|"diary"|"scholar"|"newspaper"|"photo"|"oral"|"kakao"|"blog"|"report"|"homework"|"text"|"qna"
        templateData: object
        src: string
        meta: object
    }

    class Blank {
        answer: string
        hint: string
        source: "A"|"B"|"C"|"D"
        altAnswers: string[]
        key: "A"|"B"|"C"|"D"|"A1"|"A2"|"C2" (가변)
    }

    class State {
        playerName: string
        currentCat: string
        currentStory: string
        solvedBlanks: Record~string, string~
        archivistCounts: A,B,C,D
        completedStories: string[]
    }

    class OfflineState {
        unlocks: Record~storyId, sourceId[]~
        key: "dmz_v5_offline_unlocks"
    }

    CATEGORIES --> STORIES
    STORIES --> Story
    Story --> Source : 4개
    Story --> Blank : 가변 (4~5개)
    Blank --> Source : source(교차참조)
    State --> OfflineState : OFFLINE_MODE 시
```

## 4. 자료 type 분기 (renderSource)

```mermaid
flowchart LR
    Render["renderSource(src, solved, blanks)"]
    Lock{"OFFLINE_MODE<br>&& B/D<br>&& !unlocked"}
    LockedCard["renderLockedCard()"]
    TypeSwitch{"src.type"}

    Letter["letter / diary / scholar"]
    News["newspaper / blog / report"]
    Photo["photo"]
    Oral["oral / qna"]
    Etc["kakao / homework / text"]

    Render --> Lock
    Lock -->|YES| LockedCard
    Lock -->|NO| TypeSwitch
    TypeSwitch --> Letter
    TypeSwitch --> News
    TypeSwitch --> Photo
    TypeSwitch --> Oral
    TypeSwitch --> Etc
```

각 type별 CSS 클래스: `.letter-paper`, `.diary-paper`, `.newspaper-paper`, `.photo-frame`, `.oral-player`, `.kakao-bubble` 등 — UI-MAP.md에서 정리.

## 5. 빌드 산출 흐름

```mermaid
flowchart LR
    Shared["shared/index_base.html<br>OFFLINE_MODE = false"]
    Build["scripts/build.sh"]
    Mobile["mobile/index.html<br>OFFLINE_MODE = false"]
    Offline["offline/index.html<br>OFFLINE_MODE = true (sed)"]
    Push["git push"]
    Pages["GitHub Pages"]
    URLm["DMZ_v5/mobile/"]
    URLo["DMZ_v5/offline/"]

    Shared --> Build
    Build --> Mobile
    Build --> Offline
    Mobile --> Push
    Offline --> Push
    Push --> Pages
    Pages --> URLm
    Pages --> URLo
```
