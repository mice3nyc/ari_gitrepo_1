---
author: 아리공
created: 2026-07-10
tags:
  - 도구검토
  - tm-bar
---

## herdr 검토 — tm-bar 대체 가능성

2026-07-10, 피터공 발견. "TM 바로 멀티 터미널 창 관리하려던 걸 herdr로 한 번에 해결 가능한가?" → 백도 2회(도구 대조 + socket-api 심화)로 검토. **결론: tm-bar 유지. herdr는 카테고리가 다르고, 하이브리드는 성립하나 수지가 안 맞음.**

### herdr가 뭐냐

`herdr = 마우스 우선 터미널 멀티플렉서(tmux 대체) + AI 에이전트 상태 자동 감지.` 별도 대시보드가 아니라 **터미널 세션 자체를 herdr가 소유**(client-server)하고 그 pane들을 감시한다. 상태는 herdr **TUI 사이드바**로 본다. 오픈소스·무료, macOS/Linux 정식(Windows 프리뷰), Claude Code 포함 14종+ 에이전트 인식.

핵심 기능: 워크스페이스/탭/pane 계층 · 에이전트 상태 자동 감지(blocked/working/done/idle/unknown) · 사이드바 롤업 · detach/reattach + 세션 복원 · 네이티브 에이전트 세션 재개.

### tm-bar와 대조

| 축 | tm-bar (우리) | herdr |
|----|--------------|-------|
| **정체성** | 수동 상태 수집기(패시브). 네이티브 창을 안 건드림 | 터미널 멀티플렉서. 터미널을 herdr가 소유 |
| **감지** | 색 상태는 CC 훅으로 자동(7/9 완료) / 프로젝트·상태 텍스트는 `tm.sh log` 수동 | 상태를 화면버퍼 스캔 + 훅으로 자동 분류. 프로젝트=워크스페이스명(1회) |
| **표시** | macOS 메뉴바(SwiftBar) — 다른 앱 쓰며 흘긋 | herdr TUI 사이드바 — herdr를 띄워야 보임 |
| **AI 세션** | CC 전용 설계(세션 UUID·훅 배선) | CC + Cursor/Copilot 등 14종+ |
| **플랫폼** | macOS 전용 | macOS/Linux 정식, Windows 프리뷰 |
| **볼트 연동** | todoy-bar 짝 · `flush`→Obsidian TM_log · 외부 AI 파킹 레인 | 없음 |

### 핵심 질문 — "CC가 지금 뭘 하는지 자동으로 모아주나?"

**활동 상태(state)는 자동 O. 의미 있는 한 줄(프로젝트·작업)은 자동 X.** herdr는 워크스페이스명 + 활동상태 + 라이브 터미널 버퍼로 대체한다. 즉 우리가 없애고 싶던 진짜 손수고 = `tm.sh log`의 큐레이션된 한 줄("SPEC 작성 중")을 herdr도 자동 생성하지 않는다. 게다가 tm-bar 색 상태는 이미 7/9에 훅으로 자동화됐으므로, herdr로 새로 자동화되는 이득이 사실상 없다.

### socket-api 하이브리드 — 성립하나 수지 안 맞음

유일하게 매력적인 길 = "herdr가 감지 → 우리 SwiftBar가 표시". 심화 조사 결과 **기술적으로 성립**한다:

- socket-api = **newline-delimited JSON over Unix domain socket** (`~/.config/herdr/herdr.sock`). CLI 래퍼 `herdr api snapshot`이 전체 상태를 **폴링용 JSON 스냅샷 한 방**으로 stdout에 뱉음.
- `agent_status` 값 = `working | blocked | idle | done | unknown` — 우리 색 상태 어휘와 일치.
- 인증 없음(로컬 소켓 파일 권한이 경계). 외부 프로세스(SwiftBar)가 소켓에 붙을 수 있음.
- **PoC 스케치** (SwiftBar 플러그인 ~5줄):
  ```bash
  #!/usr/bin/env bash
  # herdr.5s.sh
  snap=$(herdr api snapshot 2>/dev/null) || { echo "herdr ⚫"; exit 0; }
  echo "herdr $(echo "$snap" | jq -r '[.result.panes[].agent_status] | map(select(.=="blocked")) | length') 🔴"
  echo "---"
  echo "$snap" | jq -r '.result.panes[] | "\(.label // .pane_id)  \(.agent_status)  \(.cwd // "")"'
  ```

**결정적 비용**: 성립의 전제 = 클로드코드를 **herdr pane 안에서** 돌려야 함(agent_status 감지는 herdr가 PTY를 소유해야 작동). 따라서 하이브리드를 켜면 피터공의 `launch-4windows.command`(네이티브 4창 런처)를 **herdr 워크스페이스로 대체**해야 한다.

득실:

| | 얻음 | 잃음 |
|---|---|---|
| 하이브리드 | 터미널 화면 직접 감지 (근데 색상태는 이미 자동) | 네이티브 4창 런처, + 실측검증 4항목 |

남는 손수고(log 텍스트)는 herdr도 못 없애는데 그 대가로 창 관리 방식을 통째로 herdr에 넘기는 건 수지가 안 맞는다.

### 판단 · 재검토 트리거

- **지금**: tm-bar 유지. herdr 이주 비추.
- **재검토 시점**: 언젠가 여러 CC를 **진짜 병렬로 굴리며 관제**하고 싶어질 때 — 그땐 herdr로 가면서 socket-api 하이브리드로 메뉴바 글랜스까지 살릴 수 있다. 이 노트가 그 출발점.

### 실측 필요(재검토 시)

1. `herdr api snapshot` 실제 JSON 필드 경로 — `herdr api schema --json`으로 스키마 확정
2. 프로젝트명/cwd 노출 범위 — workspace `label` / pane `cwd` 파싱으로 유도 가능한지
3. SwiftBar 실행 컨텍스트(launchd·PATH·소켓경로)에서 기본 소켓에 실제로 붙는지 → 절대경로·`HERDR_SOCKET_PATH` 하드코딩 필요 가능성
4. 소켓 권한/인증 실동작 (단일 유저 로컬이면 무방)

출처: [Socket API](https://herdr.dev/docs/socket-api/) · [Plugins](https://herdr.dev/docs/plugins/) · [herdr docs](https://herdr.dev/docs/)

> 사람용 판단 요약 + 층위 구분(여러 CC vs 백도 병렬)은 볼트 본체 [[◈ tm-bar vs herdr — 멀티 인스턴스와 백도 병렬 구조]]로. 이 문서는 기술 정본(대조표·socket-api·PoC·실측)을 맡는다.
