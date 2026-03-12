# DMZ 다이어리 — 게임 구조도

> 게임의 화면 흐름, 데이터 구조, 주요 로직을 시각화한 문서.
> mermaid 다이어그램은 GitHub에서 자동 렌더링됩니다.

## 1. 화면 플로우

```mermaid
flowchart TD
    Login["<b>로그인</b><br>#login-screen<br>이름 + 코드 입력"]
    Select["<b>선택</b><br>#select-screen<br>캐릭터(시선) 선택"]
    Game["<b>게임</b><br>#game-screen"]
    GameList["<b>게임-목록</b><br>.game-content<br>자료카드 4개 나열"]
    GameViewer["<b>게임-뷰어</b><br>.source-detail<br>자료 전체화면 오버레이"]
    Phase3["<b>기록 선택</b><br>.archive-selection<br>2개 자료 선택"]
    Delivery["<b>전달</b><br>#delivery-screen<br>봉투 애니메이션"]
    Result["<b>결과</b><br>#result-screen<br>점수 + 요약"]

    Login -->|"이름+코드 입력<br>handleLogin()"| Select
    Select -->|"캐릭터 클릭<br>selectCharacter()"| Game
    Game --- GameList
    GameList -->|"자료카드 클릭<br>openSource()"| GameViewer
    GameViewer -->|"닫기 버튼<br>closeSource()"| GameList
    GameViewer -->|"좌우 네비/스와이프<br>navigateSource()"| GameViewer
    GameList -->|"4/4 빈칸 완료<br>올클리어팝업 → goToPhase3()"| Phase3
    Phase3 -->|"2개 선택 완료<br>confirmArchive()"| Delivery
    Delivery -->|"캐릭터 < 3<br>backToSelect()"| Select
    Delivery -->|"캐릭터 = 3(전체 완료)<br>showResult()"| Result
    Result -->|"처음부터 다시<br>resetGame()"| Login

    style Login fill:#fff,stroke:#000,stroke-width:2px
    style Select fill:#fff,stroke:#000,stroke-width:2px
    style Game fill:#f5f5f5,stroke:#000,stroke-width:2px,stroke-dasharray: 5 5
    style GameList fill:#fff,stroke:#000,stroke-width:2px
    style GameViewer fill:#fff,stroke:#000,stroke-width:2px
    style Phase3 fill:#fff,stroke:#000,stroke-width:2px
    style Delivery fill:#fff,stroke:#000,stroke-width:2px
    style Result fill:#fff,stroke:#000,stroke-width:2px
```

## 2. 데이터 구조

```mermaid
classDiagram
    class GAME_DATA {
        soldier: Character
        student: Character
        historian: Character
    }

    class Character {
        title: string
        icon: SVG
        charName: string
        desc: string
        location: string
        era: string
        destination: string
        soundNote: string
        sources: Source[4]
        blanks: Record~string, Blank~
        choices: Choice[4]
    }

    class Source {
        id: "A" | "B" | "C" | "D"
        type: "letter" | "diary" | "scholar" | "newspaper" | "photo" | "oral"
        icon: SVG
        title: string
        sub: string
        styleClass: string
    }

    class Blank {
        answer: string
        hint: string
        source: "A" | "B" | "C" | "D"
        altAnswers: string[]
    }

    class Choice {
        icon: SVG
        title: string
        meaning: string
    }

    class State {
        playerName: string
        currentChar: string | null
        currentSourceId: string | null
        solvedBlanks: Record~string, string~
        selectedRecords: number[]
        totalCranes: number
        completedStories: string[]
        catchwords: Catchword[]
    }

    class Catchword {
        sourceId: string
        wordIndex: number
        text: string
    }

    class LocalStorage {
        key: "dmz_diary_{playerName}"
        totalCranes: number
        completedStories: string[]
        playerName: string
    }

    GAME_DATA --> Character : 캐릭터 3명
    Character --> Source : sources[4]
    Character --> Blank : blanks (A,B,C,D)
    Character --> Choice : choices[4]
    Blank --> Source : source (교차참조 출처)
    State --> Catchword : catchwords (최대 3개)
    State --> LocalStorage : saveState() / loadStateForPlayer()
```

## 3. 자료 처리 플로우

```mermaid
flowchart TD
    Start["게임-목록<br>자료카드 4개"]
    OpenSource["자료카드 클릭<br>openSource()"]
    Viewer["게임-뷰어<br>자료 내용 + 빈칸 표시"]

    subgraph 빈칸_처리 ["빈칸 처리"]
        ClickBlank["빈 빈칸 클릭<br>.blank-slot.empty"]
        Modal["답변모달 열림<br>openAnswerModal()<br>힌트 표시"]
        Submit["정답 입력 → 확인<br>submitAnswer()"]
        Check{"checkAnswer()<br>정답 확인"}
        Correct["정답 토스트 ✓<br>빈칸 복원 (.filled)"]
        Wrong["오답 토스트 ✗<br>'다른 자료를 교차 참조'"]
    end

    subgraph 캐치워드 ["캐치워드 처리"]
        ClickText["본문 텍스트 클릭"]
        Highlight["형광연두 하이라이트<br>.catchword-highlight"]
        FIFO["최대 3개 유지 (FIFO)<br>4번째 → 가장 오래된 것 해제"]
    end

    AllClear{"4/4 빈칸<br>모두 복원?"}
    Popup["올클리어팝업<br>showAllClearPopup()"]
    Phase3["기록 선택 (Phase 3)<br>goToPhase3()"]
    SelectTwo["자료 2개 선택"]
    Confirm["선택 완료<br>confirmArchive()"]
    Delivery["전달 화면<br>봉투 애니메이션"]

    Start --> OpenSource
    OpenSource --> Viewer
    Viewer --> ClickBlank
    Viewer --> ClickText
    ClickBlank --> Modal
    Modal --> Submit
    Submit --> Check
    Check -->|정답| Correct
    Check -->|오답| Wrong
    Wrong --> Modal
    Correct --> AllClear
    AllClear -->|아니오| Viewer
    AllClear -->|예| Popup
    Popup --> Phase3
    Phase3 --> SelectTwo
    SelectTwo --> Confirm
    Confirm --> Delivery

    ClickText --> Highlight
    Highlight --> FIFO

    style 빈칸_처리 fill:#f9f9f9,stroke:#000,stroke-width:1px
    style 캐치워드 fill:#f9f9f9,stroke:#000,stroke-width:1px
    style Correct fill:#000,color:#fff,stroke:#000
    style Wrong fill:#fff,stroke:#d00,stroke-width:2px
    style Popup fill:#fff,stroke:#000,stroke-width:2px
```
