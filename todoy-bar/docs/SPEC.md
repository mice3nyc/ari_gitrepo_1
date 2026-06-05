---
tags:
  - 개발
  - todoy-bar
  - SPEC
created: 2026-06-02
author: 아리공
---
## todoy-bar — 기술 명세 (SPEC)

> 코드보다 먼저. 변경 시 이 문서 먼저 갱신(선문후코).

### 한 줄

오늘 할 일 체크리스트 메뉴바 앱. now-bar(현재형)의 짝 = 계획축(오늘). 굿모닝 세팅 / ACTIVE 선택 / 횟수·시간 카운팅 / 완료 체크 / 굿바이 이월.

### 결정 (2026-06-02, 피터공)

- 이름 = **todoy-bar** (today + todo)
- DN "오늘 할 일"과 **독립** (동기화 안 함)
- now-bar와 **별도** 앱 (ACTIVE↔status 통합 안 함, 추후 가능성만)

### 데이터 모델

- 위치: `_dev/todoy-bar/data/YYYY-MM-DD.json` (날짜 단위 파일)
- 형식: 항목 객체의 JSON 배열

```json
[
  {
    "id": "i12345",          // 유니크 id
    "text": "AI리터러시 시나리오 3개 초안",
    "done": false,           // 완료 여부
    "active": false,         // 지금 작업 중(ACTIVE) — 한 번에 하나만 true
    "switches": 0,           // 이 항목을 ACTIVE로 켠 횟수
    "seconds": 0,            // 누적 작업 시간(초). active 구간이 끝날 때 정산
    "active_since": null,    // 현재 active면 켠 시각(epoch초), 아니면 null
    "carried": false         // 어제에서 이월됐으면 true (선택)
  }
]
```

- **시간 누적 규칙**: active로 켜는 순간 `active_since = now(epoch)`, `switches += 1`. 끄거나 다른 항목으로 전환하거나 완료하면 `seconds += now - active_since`로 정산하고 `active=false, active_since=null`. 현재 active 항목의 표시 시간 = `seconds + (now - active_since)` (라이브 계산, render에서 `live_seconds`로 제공).
- **단일 ACTIVE**: activate 시 다른 모든 항목을 정산·비활성. 같은 항목을 다시 누르면 토글 off(정산).

### 컴포넌트

1. **`todoy.sh`** — 상태 변경 헬퍼 (절대경로 호출 → settings allowlist 매칭)
   - `setup` — 오늘 파일 없으면 생성. 직전 날짜 파일의 미완료 항목을 상태 초기화해 이월(carried=true). 굿모닝용.
   - `add "텍스트"` — 항목 추가
   - `add-dialog` — osascript 입력창 띄워 add (메뉴바에서 직접 입력)
   - `activate <id>` — 단일 ACTIVE 토글 + 시간 정산 + switches 카운트
   - `done <id>` — 완료 토글 (켜져 있으면 정산)
   - `carryover` — 미완료 항목 텍스트 목록 출력. 굿바이용.
   - `render` — 현재 시각 기준 live_seconds 계산한 JSON 출력 (플러그인이 읽음)

2. **`swiftbar-plugins/todoy-bar.5s.sh`** — SwiftBar 메뉴바 플러그인 (5초 갱신)
   - 메뉴바: ACTIVE 항목 있으면 `▸ {텍스트} {누적시간}`, 없으면 `▸ todoy {완료}/{전체}`
   - 드롭다운: 항목마다 `☐/☑ {텍스트} ×{switches} {시간}`(텍스트 체크박스로 완료 상태 표시). **메인 클릭 = ACTIVE(지금 작업으로)**. 서브메뉴(`--`)에 `☑ 완료로 표시`(완료 토글) + ACTIVE면 `⏸ 지금 작업 해제`. ACTIVE 항목은 파란색+볼드(`md=true` 마크다운), 완료 항목은 초록색(`#009443`, 끝난 것 표시).
   - ⚠️ SwiftBar 메뉴 항목은 한 줄 전체가 단일 클릭 영역 → "체크박스 칸만 따로 클릭"은 불가. 그래서 메인=ACTIVE, 완료=서브로 분리(2026-06-02 피터공 정정). `checked=true`는 SwiftBar가 빈 체크칸을 안 그려서 텍스트 `☐/☑`로 대체.
   - `＋ 할 일 추가`(add-dialog), 데이터 폴더 열기, 새로고침

### 굿모닝/굿바이 연동 (다음 단계)

- 굿모닝 스킬: `todoy.sh setup` 호출(이월 자동) → 아리공이 오늘 할 일 항목을 `todoy.sh add`로 세팅
- 굿바이 스킬: `todoy.sh carryover`로 미완료 기록 → 세션 마감 노트/다음날 리마인드

### 표시·디자인

- 흰 배경 메뉴 기본(SwiftBar). 강조색 `#1100ff`(now-bar와 통일, ACTIVE는 볼드까지), 완료는 초록 `#009443`(끝난 것 = 굿). 시스템 폰트.
- 마커: `○` 미완료 / `●` ACTIVE / `✓` 완료
- **메뉴바 줄은 now-bar와 시각 구분.** now-bar = `▸ {작업} {시간}`(흐름). todoy = `✓ {완료}/{전체} · {ACTIVE명}`(체크리스트 = 진행률 앞세움). 둘 다 `▸`로 시작하면 같은 도구로 보인다는 피터공 지적(2026-06-02) 반영.
