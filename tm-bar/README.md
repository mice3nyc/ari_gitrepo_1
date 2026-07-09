# TM (TerminalMonitor) — 창이 읽는 사용법

여러 클로드코드 창(A/B/C/D)이 "지금 뭘 하는지"를 메뉴바에 모으는 도구.
todoy-bar(오늘 할 일)의 실행축 짝. 메뉴바 표시명 = `TermMo`.

**각 창(=클로드 인스턴스)이 `tm.sh`를 호출해 자기 상태를 써야만 데이터가 갱신된다.**
앱(SwiftBar 플러그인)은 그 JSON을 읽어 그릴 뿐이다. 안 쓰면 안 보인다.

## tm.sh 명령 (절대경로로 호출)

`/Users/p.air15/Neo-Obsi-Sync/_dev/tm-bar/tm.sh`

| 명령 | 예 | 언제 |
|------|-----|------|
| `slot` | `tm.sh slot` | 비어있는 창 번호 확인(A→D) |
| `whoami <UUID>` | `tm.sh whoami 77504853-...` | 세션 UUID로 이미 등록된 창 ID 조회(clear→recall 자동 복원) |
| `register <ID> <UUID>` | `tm.sh register B 77504853-...` | 창 첫 진입 시 1회. UUID를 세션으로 저장 |
| `log <ID> <project> <status>` | `tm.sh log B "TM 앱" "SPEC 작성"` | **주력.** 현재 작업 갱신 + 당일 로그 남김 |
| `set <ID> <project> <status>` | `tm.sh set B "TM 앱" "빌드 중"` | 헤더만 갱신(로그 안 쌓음, 자잘한 변화) |
| `note <ID> <msg>` | `tm.sh note B "커밋 완료"` | 헤더 안 바꾸고 로그만 추가 |
| `unregister <ID>` | `tm.sh unregister B` | 창 종료(goodbye) 시 |
| `flush [YYYY-MM-DD]` | `tm.sh flush` | 그날 전 창 로그를 마크다운으로(goodbye가 노트에 씀) |

- ID는 A/B/C/D. 창은 자기 ID를 기억 못 하므로 **진입 시 피터공에게 물어서** 정한다.

## 피터공 손입력 (드롭다운에서 직접 타이핑) — v0.3

클로드 자동 갱신 말고 **피터공이 메뉴바에서 클릭 → 입력창에 직접 적는** 경로. 헬퍼 `tm-edit.sh`가 osascript 다이얼로그를 띄워 값을 받고 쓴다(취소하면 안 씀). 플러그인 항목이 이걸 `bash=`로 부른다.

- **창 상태 손편집**: 각 창 서브메뉴 맨 아래 `✏️ 상태 입력…` → 프로젝트·상태 두 입력창(기존값 미리 채움) → `tm.sh set`. 클로드가 안 켜진 창이나 즉석 메모용.
- **외부 AI 레인**: 드롭다운 하단 `외부 AI · 손입력` 구분선 아래 **Codex / ChatGPT / Claude / Gemini** 고정 4줄. 클릭하면 "지금 뭐 시켜놨나" 입력창 → `data/ext/{dex,gpt,claude,google}.txt`에 저장. 비면 회색 "(비어있음)". ⚠️ 이건 자동 갱신 아니라 **손으로 최신화 안 하면 stale** — 라이브 창(A~D)과 성격이 다르다(파킹 메모).

`tm-edit.sh win <ID>` / `tm-edit.sh ext <key>` 로 직접도 호출 가능(주로 플러그인이 부름). 코드 고치면 `install.sh` 재실행.

## 창이 할 일 (생명주기)

### 1. 진입 시 (recall / goodmorning)

창 번호는 **실제 세션 UUID**에 묶는다. `/clear`는 컨텍스트만 지우고 이 UUID는 안 바뀌므로 `memento→clear→recall` 사이클엔 **자동 복원**된다.

> ⚠️ **어떤 UUID인가 (2026-07-05 교훈)**: env `CLAUDE_CODE_SESSION_ID`와 스크래치패드 경로(`/private/tmp/.../{UUID}/scratchpad`)의 UUID는 **자식 세션**이라 clear마다 바뀌고 등록값과 안 맞는다 → whoami가 이미 등록된 창을 "미등록"으로 오판한다. **실제 세션 UUID = 이 창이 이번 세션에 launch한 백그라운드 에이전트의 `output_file` 경로 `.../{UUID}/tasks/...` 에서 `tasks/` 바로 위 UUID.** 자식 세션이라도 에이전트 tasks는 안정적인 부모 세션 디렉토리로 가므로 이 값이 사이클 내내 불변이다. `register`·`whoami` 둘 다 이 값으로.
```bash
tm.sh whoami <SESSION_UUID>   # 이미 등록된 창이면 ID(예 B) 출력, 처음이면 빈 출력
```
- **ID가 나오면**: 이 창은 그 번호다. 묻지 않고 `tm.sh log <ID> "<프로젝트>" "<상태>"`로 상태만 갱신.
- **비면(그 창 첫 등록)**: 피터공이 번호를 말했으면 그대로, 아니면 `tm.sh slot`으로 빈 번호 제안하며 물음 →
```bash
tm.sh register B <UUID>          # UUID를 세션으로 저장 → 다음 clear 후 자동 복원의 근거
tm.sh log B "<지금 프로젝트>" "<지금 상태 한 줄>"
```

### 2. 작업 중
- **새 작업/요청 착수 · 작업 전환 · 큰 단계 완료 · 백도 launch/완료 · 방향 전환** 시 `tm.sh log`.
- **안 하는 것**: 매 툴콜, 매 파일 편집, 자잘한 중간 단계. (퍼포먼스·소음 안전선)
- **메뉴바 status는 짧게**(노치 화면). 긴 설명은 `note`로 로그에 쌓는다 — 드롭다운 서브메뉴에서 본다.

### 3. 마감 시
- **clear 사이클(`memento→clear→recall`)**: `unregister` 하지 않는다 — 창은 유지되고 다음 recall이 UUID로 자동 복원. memento는 TM을 건드리지 않는다.
- **터미널 창 완전 종료(마지막 창 goodbye)**:
```bash
tm.sh unregister B
tm.sh flush            # → TM_log_YYMMDD 노트에 반영 (스킬이 처리)
```

## 왜 이렇게

now-bar(이 도구의 전신)가 죽은 이유 = "아리공이 손으로 적어야 산다". 이번엔 스킬(recall/goodmorning/goodbye) + CLAUDE.md 행동 룰로 호출 시점을 고정해 그 약한 고리를 메운다.

## 코드 고쳤을 때

SwiftBar는 심볼릭 링크를 안 따라간다. 플러그인(`swiftbar-plugins/tm-bar.3s.sh`)을 수정하면 배포 스크립트로 실파일을 PluginDirectory에 복사한다:
```bash
/Users/p.air15/Neo-Obsi-Sync/_dev/tm-bar/install.sh
```

## 설계 상세

`docs/SPEC.md` · `docs/PLAN.md` · `docs/TASKS.md` · 요청 노트 [[요청.26.0705.0716-TM터미널모니터]]
