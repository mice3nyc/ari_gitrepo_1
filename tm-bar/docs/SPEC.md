# SPEC — TM (TerminalMonitor)

여러 클로드코드 창(A/B/C/D)의 "지금 무엇을 하는가"를 메뉴바에서 모니터링하는 SwiftBar 확장.
todoy-bar(계획축, "오늘 할 일")의 짝 = 실행축("지금 어느 창이 뭘"). 폐기된 now-bar의 멀티창 부활.

## 1. 아키텍처

```
_dev/tm-bar/
  tm.sh                       ← 상태 변경 헬퍼 (절대경로 호출, jq)
  data/windows/{A,B,C,D}.json ← 창별 상태 (현재 작업 + 당일 로그)
  swiftbar-plugins/tm-bar.3s.sh ← 렌더 플러그인 (3초 새로고침 = 로테이션 주기)
  docs/{SPEC,PLAN,TASKS}.md
```

**SwiftBar PluginDirectory 제약**: SwiftBar는 폴더 하나만 로드하며 현재 `_dev/todoy-bar/swiftbar-plugins`로 고정.
정본은 `_dev/tm-bar/swiftbar-plugins/tm-bar.3s.sh`에 두되, **SwiftBar가 심볼릭 링크를 따라가지 않음이 확인됨**(심링크로 걸면 메뉴바에 안 뜸) → `install.sh`로 **실파일을 복사** 배포한다. 코드 수정 시 `install.sh` 재실행.
(SwiftBar bundle id = `com.ameba.SwiftBar`)

## 2. 데이터 모델 — `data/windows/{ID}.json`

```json
{
  "id": "B",
  "date": "2026-07-05",
  "session": "b-77504853",
  "term_session": "C40CCC66-C5B8-4F0E-94C7-2006B9CE7159",
  "project": "TM 앱",
  "status": "SPEC 작성 중",
  "state": "working",
  "updated_at": 1751698560,
  "state_at": 1751698600,
  "active": true,
  "log": [
    {"t": "07:16", "msg": "창B로 recall 복원"},
    {"t": "07:40", "msg": "TM 앱 설계 착수 — SPEC 작성"}
  ]
}
```

- `project` = 현재 작업 대상(짧은 이름), `status` = 지금 상태 한 줄. 이 둘이 메뉴바 표시.
- `session` = 부모 세션 UUID(clear-무관, whoami용). `term_session` = **터미널 창 앵커**(`$ITERM_SESSION_ID` 우선, 없으면 `$TERM_SESSION_ID`). 훅↔창 매핑용(§9). register가 자기 env에서 자동 캡처.
- `state` = 색 상태(`working`|`attention`|`done`). 훅이 갱신(§9). 빈 값/없음=working. `state_at` = state 갱신 epoch초(state는 `updated_at`을 건드리지 않음 — 로테이션 핀 churn 방지).
- `updated_at` = epoch초. **로테이션 핀 판정용**(최근 갱신 창을 잠깐 우선 표시).
- `active` = 창 살아있음(register↔unregister). 유휴/종료 창은 false.
- `log` = 당일 누적. `date`가 오늘과 다르면 렌더/플러시가 무시(자정 넘김 안전).

## 3. tm.sh 명령어

절대경로 `/Users/p.air15/Neo-Obsi-Sync/_dev/tm-bar/tm.sh`로 호출(settings allowlist 매칭, cd 금지).

| 명령 | 인자 | 동작 |
|------|------|------|
| `register` | `<ID> [session]` | 창 켬. 파일 생성/초기화, `active=true`, date=오늘. 오늘 아닌 로그면 리셋 |
| `log` | `<ID> <project> <status>` | **주력.** project+status 교체 + updated_at + 로그 append(`HH:MM status`) |
| `set` | `<ID> <project> <status>` | 헤더(project+status)만 교체 + updated_at. 로그 없음(자잘한 갱신) |
| `note` | `<ID> <msg>` | 헤더 안 바꾸고 로그만 append(부가 기록) |
| `unregister` | `<ID>` | 창 끔. `active=false` |
| `render` | | 플러그인용 — 활성 창 배열 JSON(오늘 date만) |
| `slot` | | 다음 빈 창 ID 제안(A→D 중 비활성 첫 칸) |
| `whoami` | `<UUID>` | 부모 세션 UUID로 등록 창 ID 조회(clear→recall 복원) |
| `whoami-term` | `<anchor>` | **터미널 앵커**(`$ITERM_SESSION_ID`/`$TERM_SESSION_ID`)로 창 ID 조회(훅→창 매핑, §9) |
| `state` | `<ID> <working\|attention\|done>` | 색 상태만 교체(+state_at). `updated_at` 안 건드림. 미등록 창이면 조용히 무시 |
| `term` | `<ID>` | 자기 env의 터미널 앵커를 창 파일 `term_session`에 저장(백필용. register가 자동 하므로 보통 불필요) |
| `flush` | `[YYYY-MM-DD]` | 그날 전 창 로그를 마크다운으로 stdout(goodbye가 노트에 씀) |

- ID 유효값 A/B/C/D. 잘못된 ID는 거부.
- `log`/`set`은 `register` 안 된 ID여도 자동 생성(방어). 단 정상 흐름은 register 먼저.
- `register`는 호출된 셸 env에서 `term_session`을 자동 캡처(§9). 스킬은 기존대로 `register <ID> <UUID>`만 부르면 됨.

## 4. 플러그인 렌더 — tm-bar.3s.sh

**노치 화면 확정(26.0705)**: 노치 있는 화면은 상태영역이 좁아 TM의 상시 텍스트가 todoy를 노치 뒤로 밀어냈다. → **로테이션 텍스트를 뺐다.** 메뉴바는 최소 폭(라벨+개수)만, 상세는 드롭다운.

**메뉴바 첫 줄**(최소 폭, 라벨 = `TermMo`):
- 활성 0개: `TermMo`(회색)
- 최근 `PIN_SECS`(12초) 내 갱신 창 있음: `TermMo {N} ●`(파랑) — "뭔가 움직였다" 신호만
- 그 외: `TermMo {N}` (N = 활성 창 수)

**드롭다운**:
- 헤더 `TM · 활성 N창 | color=gray`
- 활성 창 목록 — **ID순 고정(A→D)**. 열린 창은 항상 이 순서(2창이면 A·B, 1창이면 A). 한 줄 `{ID} · {project} — {status}`. 색: 최근 갱신=파랑 `#1100ff` > 대기(project 빈·status "대기")=회색 > 일반=검정. 헤더 길이 상한 `DROPDOWN_MAX`(48, 넘으면 말줄임). register 직후 기본 status="대기".
  - 서브메뉴 `--`: 당일 로그 최근 `LOG_SHOW`(8)개(`HH:MM  msg`), 최신이 위. 없으면 `(로그 없음)`.
- 하단: `TM_log_YYMMDD 열기`(obsidian URI href) · `데이터 폴더 열기` · `새로고침`

**변수**(플러그인 상단): `LABEL`·`PIN_SECS`·`LOG_SHOW`·`DROPDOWN_MAX`. 조절은 여기서.
**성능**: 3초 새로고침 bash 재실행은 무시할 수준. render는 jq 한 번.

## 5. 창 생명주기 · 스킬 연동

**창 식별 = 세션 UUID**(스크래치패드 경로 `.../{UUID}/scratchpad`에 있음). `/clear`는 컨텍스트만 지우고 프로세스는 유지 → UUID 불변 → `memento→clear→recall` 사이클에 **자동 복원**(매번 다시 안 물음). 창을 완전히 닫고 새로 열면 UUID가 바뀌어 그때만 새로 물음.

- **등록/복원(recall·goodmorning)**: 먼저 `tm.sh whoami <UUID>` → ID가 나오면 이미 등록된 창이므로 묻지 않고 `log`로 상태만 갱신. 비면 첫 등록 → 피터공이 번호 지정했으면 그대로, 아니면 `slot` 제안하며 물음 → `tm.sh register <ID> <UUID>`(UUID를 세션으로 저장해야 다음 clear 후 복원 근거가 됨).
- **갱신(log/set)**: 작업 중 아리공이 상태를 갱신(§6 행동 룰).
- **clear 사이클(memento)**: `unregister` 하지 않음 — 창 유지, 다음 recall이 자동 복원. memento는 TM을 건드리지 않음.
- **완전 종료(unregister+flush)**: 터미널 창을 닫는 마지막 `/goodbye`에서 `tm.sh unregister <ID>` 후, 자기 로그를 `TM_log_YYMMDD` 노트에 반영:
  - 노트 없으면 생성(제목 `TM_log_260705`, author 아리공, 위치 `_클로드코드노트/` 또는 `current_notes/` — 확정 대기) + 오늘 DN "오늘의 링킹"에 링크.
  - 있으면 자기 창 섹션(`#### 창 B`) append/갱신.
  - 로그 소스 = `tm.sh flush`의 해당 창분.

## 6. 상태 업데이트 행동 룰 (CLAUDE.md에 반영, 퍼포먼스 안전선)

`tm.sh log` 호출 **시점**:
- 새 작업/요청 착수 · 작업 전환 · 큰 단계 완료 · 백도 launch/완료 · 방향 전환

**안 하는 것**: 매 툴콜, 매 파일 편집, 자잘한 중간 단계. → 로테이션 표시가 시끄럽지 않고 파일 쓰기도 드묾.
자잘하지만 메뉴바 표시만 바꾸고 싶으면 `set`(로그 안 쌓임).

## 7. 검증 항목

- **[아리공 자가점검]** tm.sh 각 명령 후 JSON 정합(jq 파싱) · 플러그인 SwiftBar 문법(첫 줄/`---`/`--`/param) · 심볼릭 링크로 SwiftBar 로드 · 로테이션·핀 계산 손검증 · flush 마크다운 형식
- **[피터공 확인]** 메뉴바에 실제로 뜨는지 · 3초 로테이션 체감 · 새 업데이트 핀 튀어나옴 · 서브메뉴 로그 가독성 · goodbye 후 TM_log 노트 결과물

## 9. 색 상태 — 빨강/초록 (26.0709, Q2 구현)

**목적**: 창 4개를 Cmd-Tab으로 순회할 때 "어느 창이 나를 기다리나"를 메뉴바 색으로 즉시 파악.

**4-상태 → 색** (피터공 모델 26.0709). 파랑·검정은 **글씨 색만**(마커 없음), 초록·빨강은 마커(🟢🔴):
| state | 의미 | 색 | 마커 | 트리거 훅 |
|-------|------|-----|------|-----------|
| `working` | **진행 중**(실제 처리 중) | 🔵 파랑 `#1100ff` | — | UserPromptSubmit(무조건) · PostToolUse(빨강일 때만=승인 복귀) |
| `done` | **시킨 일이 끝남** = 당신 차례 | 🟢 초록 `#2e9e44` | 🟢 | Stop |
| `idle` | **그냥 대기**(중립, register 초기값) | ⚫ 검정(기본) | — | (훅 전이 없음 — 초기 상태로만) |
| `attention` | **YES 눌러야 넘어가는 블록**(권한) | 🔴 빨강 `#e5484d` | 🔴 | Notification(권한) |

**핵심 규칙 (26.0709 피터공)**: **완료(초록)는 다음 지시(UserPromptSubmit) 전까지 유지된다.** 유휴 알림이 초록을 검정으로 덮지 않는다. 상태 순환: idle(초기) → [지시] working🔵 → [완료] done🟢 →(유지)→ [새 지시] working🔵 … / 중간에 권한 필요하면 attention🔴 → [승인·계속] working🔵(§승인 복귀로 배선).

메뉴바 집계색 우선순위: 개입(빨강 `!`) > 완료(초록 `✓`) > 진행중(파랑 `●`) > 기본.

**Notification 훅 두 갈래** (26.0709 D창 빨강 오작동 수정): Notification은 (1)권한 프롬프트 **와** (2)60초 유휴 알림("waiting for your input") 양쪽에 발동한다. `tm-hook.sh`가 stdin의 `.message`를 보고 가른다 — 권한 문구면 `attention`(빨강), **유휴 문구면 no-op**(상태 안 바꿈 → 완료 초록 유지). 실측 검증: `data/notif.log`에 실제 메시지 `"Claude is waiting for your input"`(유휴) / `"Claude needs your permission to use …"`(권한) 확인됨.

**승인 복귀 — PostToolUse(빨강 자동 해제) (26.0709 Q2 후속)**: attention(빨강)을 끄는 트리거가 원래 UserPromptSubmit(새 지시)·Stop(완료)뿐이라, **YES(권한 승인)로 작업이 이어질 때 빨강이 안 풀리는 사각지대**가 있었다(스펙엔 "[승인·계속]→working🔵"이라 적혔으나 배선 누락). YES를 누르면 반드시 **도구가 실행**되고 그 직후 `PostToolUse` 훅이 발동한다 → `tm-hook.sh resume`가 이를 잡아 **현재 state가 attention일 때만 working으로 전환**한다(그 외 상태면 no-op). "attention일 때만" 조건이 핵심: PostToolUse는 매 툴콜 발동이므로, 조건 없이 걸면 매 편집마다 파일을 쓴다(§6 "매 툴콜 아님" 안전선 위반). 조건부라 평상시(이미 파랑)엔 파일을 안 쓰고, 승인 직후 첫 도구 한 번만 빨강→파랑을 쓴다. done(초록)→working은 항상 UserPromptSubmit이 선행하므로 이 훅이 초록을 건드리지 않는다. UserPromptSubmit의 `working`은 무조건(done→working 포함)이라 `resume`과 별도 트리거 키로 분리했다.

**창 매핑 (블로커 해결)**: 훅 stdin의 `session_id`는 자식/활성 UUID라 등록값(부모 UUID)과 mismatch. **해법 = 터미널 창 앵커**. 훅 프로세스 env에 `TERM_SESSION_ID`(Apple Terminal)/`ITERM_SESSION_ID`(iTerm)가 그대로 넘어오고, 이건 창 정체성이라 clear·세션 교체와 무관하게 불변. register가 이 값을 `term_session`으로 저장 → 훅이 자기 env의 같은 값으로 `whoami-term` 조회 → 창 ID 확정.

**배선 (`tm-hook.sh` 디스패처)**: 훅 3종이 `tm-hook.sh <state>`를 호출. 스크립트가 stdin(훅 JSON) 흡수 후 자기 env 앵커로 창을 찾아 `tm.sh state`. 미매핑이면 조용히 종료(no-op). settings.local.json의 `Stop`/`Notification`/`UserPromptSubmit` 훅(async, timeout 5).

**렌더 우선순위** (per-window + 메뉴바 집계):
- per-window 색: `attention`(빨강) > `done`(초록) > 최근갱신(파랑) > 대기(회색) > 일반(검정)
- 메뉴바 라벨: 하나라도 attention이면 🔴 + `!`, 아니면 done 있으면 🟢, 아니면 최근갱신 `●`(파랑), 아니면 기본. 드롭다운 안 열고 파악.

**검증**: [아리공] state 명령 JSON 정합·whoami-term 매핑·플러그인 색 문법·훅 async 무해. [피터공] 실창 2~3개서 빨강↔초록 라이브 전환 + 메뉴바 집계색.

## 8. 확정 (26.0705)

- 형태 = SwiftBar 확장·별도 아이콘 / 메뉴바 라벨 = `TermMo`
- 노치 대응 = 상시 텍스트(로테이션) 제거, 아이콘+풀다운 / 배포 = `install.sh` 실파일 복사(심링크 불가)
- 로그 노트명 = `TM_log_YYMMDD`(라벨은 TermMo지만 파일명은 짧게 유지 — 플러그인 href·스킬에 이미 박힘)
- 저장 위치 = `_클로드코드노트/`
