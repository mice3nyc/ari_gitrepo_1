# SPEC-verbose-log — 전체 행동 기록 (풀 이벤트 스트림)

> 작성 2026-08-13. 선문후코 — 코드 작성 전 명세.
> 바탕: 동현공 「사용 기록 로깅 설계 — DMZ 아카이브」(`Assets/incoming/AI리터러시/20260723-usage-logging-design.md`, 2026-08-11 갱신). **목적·버퍼 전략·롤오버·kill switch를 계승**하되 이 프로젝트(바닐라 JS 단일 HTML · `build.py` 빌드 · 교육청 배포)에 맞춰 다시 설계했다.
> 검토: [[요청.26.0813.1406-AI리터러시로그동현공방식]]
> 대상 빌드: v13-elem · v13-mid · v14 공통(SPEC 동일 사본 유지). 코드 반영은 **r42**부터.

## §0 목표 (피터공 2026-08-13)

**동현공이 원하는 것도 작동하고, 우리가 만든 것도 작동한다.**

두 파이프가 서로를 모르는 채로 병렬로 돈다. 한쪽이 꺼지거나 실패해도 다른 쪽은 영향받지 않는다.

| | 무엇 | 모듈 | 엔드포인트 | 저장 |
|---|---|---|---|---|
| **A. 우리 것 (기존, 유지)** | 판 하나 = 압축 레코드 하나. 분석 화면 `/report`·`/stats`가 이걸 읽는다 | `08b` + `08d` | `POST /log` | `raw/{v}/…/{pid}.json` |
| **B. 동현공 방식 (신규)** | 행동 하나 = 이벤트 하나. 전체 궤적 | `08-event-log`(기존) + **`08e-verbose-log`(신규)** | `POST /log-ev` | `raw-ev/{v}/…/{pid}__{part}.ndjson` |

- **A는 한 줄도 바꾸지 않는다.** `SPEC-play-log.md`의 레코드 스키마·`SPEC-log-transmit.md`의 전송 흐름 그대로. `v` 필드가 분석 해석 기준이라 여기를 흔들면 지금까지 쌓인 것과 갈린다.
- B가 실패해도 A는 돈다. 반대도 같다. 둘 다 실패해도 게임은 돈다(전 경로 비동기 + `try/catch`).
- 이 병렬 구조는 새로운 게 아니다 — `08c`(동현공 참여 집계 Lambda)와 `08d`(우리 전송)가 이미 엔드포인트·모듈 모두 별개로 돌고 있다(SPEC-log-transmit §0-1). 세 번째 트랙이 붙는 것이다.

## §1 동현공 설계에서 그대로 가져오는 것

1. **풀 이벤트 스트림** — 「나중에 어떤 질문이 생길지 모르니 세밀히 쌓아두고 분석은 사후에」.
2. **세션당 파일 하나 · 버퍼 전체 재업로드** — S3엔 append가 없으므로 같은 키를 덮어쓴다. flush 한 번 실패해도 다음 flush가 전체를 다시 올려 자동 복구(멱등).
3. **48KB 롤오버** — `keepalive` 바디 상한이 64KB라 그 밑에서 파일을 마감하고 `part`+1. 좋은 설계라 그대로 쓴다.
4. **버퍼·카운터를 한 키에 원자적으로 영속** — `part`·`seq`를 메모리에만 두면 새로고침 시 이미 마감한 파일을 덮어써 유실된다.
5. **kill switch, 기본 off** — 상시 수집이 아니다.
6. **제거 방법을 미리 적어 둔다**(§9).

## §2 동현공 설계에서 바꾸는 것 (셋, 각각 이유가 있다)

### §2-1 전송지 — 익명 PUT 버킷이 아니라 우리 검증 Lambda

동현공이 S3 익명 PUT을 발명한 건 그쪽에 검증 계층이 없어서다. 공유 Lambda `/log`는 **4필드·1024B 고정**이라 스트림을 못 싣는다(그 문서 4절이 직접 그렇게 적었다).

**우리는 이미 있다.** `SPEC-log-transmit.md`의 API Gateway + 검증 Lambda + private 버킷 스택을 그대로 쓴다. 미성년·교육청 배포에 익명 PUT 버킷을 새로 여는 것은 우리 맥락에선 후퇴다(§4 보안 가드레일을 통째로 잃는다). 게다가 **피터공이 용량·비용을 직접 보려면 데이터가 우리 버킷에 있어야 한다**(§0 목표).

### §2-2 식별자 — 세션 UUID를 발명하지 않는다

동현공은 DMZ에 판 구분 id가 없어 `sessionId`를 발명하고 기기 영속 UUID(`dmz_client_id`)를 재사용했다. **우리는 정반대다** — 판 식별자 `pid`(`gameState.playId`)가 이미 있고, 그건 판마다 새로 나는 무작위 값이라 기기와 연결되지 않는다.

- 봉투의 판 식별 = **`pid` 그대로 재사용**. 신규 코드 없음. A 파이프와 **같은 키로 저절로 조인된다**(동현공이 «clientId + ts 근접»으로 감수해야 했던 제약이 우리에겐 없다).
- **기기 영속 UUID는 봉투에 넣지 않는다.** `CONFIG.clientIdKey`는 `08c` 전용으로 남긴다.

### §2-3 개인정보 — `ua` 원문을 받지 않는다

동현공 스키마의 `session_start.data.ua`(User-Agent 원문)와 기기 UUID는 우리 `수집항목-설명.md` §2가 「수집 안 함」으로 못 박은 항목이다(브라우저 지문·기기 식별자). 그 문서 §5는 「아래 목록이 전부」라고 적혀 있다.

**둘을 빼면 교육청 문서를 고치지 않고 간다.** 그리고 잃는 게 거의 없다 — 동현공 설계의 최대 분석 가치인 `blank_submit.input`(오답·오타 패턴)은 **AI리터러시에 자유 입력란이 없어서** 애초에 해당 없다.

기기 대신 필요한 것이 있으면 **비식별 파생값**만 쓴다(예: `vp:"1280x800"` 뷰포트 크기 구간). v1엔 넣지 않는다.

> ⚠️ **별건 — 이미 어긋난 자리 하나.** `08c`가 보내는 `clientId`는 localStorage에 영속하는 기기 UUID이고, 받는 동현공 Lambda는 레퍼런스 §3.1대로 **IP와 User-Agent를 CloudWatch에 기록**한다. 우리 교육청 문서는 그것을 다루지 않는다. 이 SPEC의 범위 밖이지만 **같이 정리할 사안**으로 남긴다(§10).

## §3 이벤트 카탈로그 — 새로 발명하지 않는다

**계측은 이미 배선돼 있다.** `08-event-log.js`의 `trackEvent`가 **28개 호출 지점**에서 발화한다. 동현공이 계측 22종을 새로 배선해야 했던 것과 달리, 우리가 할 일은 «전송을 붙이는 것»뿐이다.

채택 이벤트(현행 그대로, 신규 계측 0):

| 묶음 | eventType |
|---|---|
| 세션 | `session_started` · `session_continued` · `session_reset` |
| 진입 | `title_viewed` · `tutorial_viewed` · `scenario_selected` · `scenario_viewed` |
| 선택(핵심 루프) | `tier1_selected` · `tier2_selected` · `review_selected` |
| 결과 | `result_viewed` · `final_viewed` · `scenario_completed` · `exp_gained` · `level_up` |
| 재도전·이탈 | `replay_started` · `scenario_exited` · `game_over_triggered` |
| 자원·보조 | `resource_consumed` · `resource_recovered` · `rp_awarded` · `rp_distributed` · `hint_toggled` |
| 리포트 | `final_report_viewed` · `semester_report_viewed` · `report_print` |

### §3-1 payload 규칙 — 28개를 손으로 나열하지 않는다 (표가 아니라 규칙)

⚠️ 지금 `trackEvent`는 **매 이벤트에 `stateSnap()` 14필드**를 붙이고, `tier2_selected`·`review_selected`는 `before`+`after` **스냅샷을 둘 다** 싣는다. `final_report_viewed`·`semester_report_viewed`는 **`scenarioHistory` 배열 통째**를 싣는다. 그래서 이벤트 하나가 1KB를 넘기도 한다(실측 판당 29.1KB).

**이벤트 28종의 payload를 SPEC에 표로 박지 않는다.** 계측 코드가 바뀔 때마다 표가 조용히 어긋나고, 그 드리프트는 배포 뒤에야 드러난다. 대신 **걸러내는 규칙 하나**를 둔다.

**규칙**: 봉투를 만들 때 payload의 최상위 키 중 아래를 **버린다**.

| 버리는 키 | 왜 |
|---|---|
| `snap` · `before` · `after` | 누적 스냅샷. `v` + 선택 시퀀스로 재계산되거나 분석 무가치 — SPEC-play-log §5에서 우리가 이미 내린 판단 |
| `history` | `scenarioHistory` 배열 통째. A 파이프의 `sc[]`가 같은 것을 압축해 이미 갖고 있다 |
| `items` | 아이템 객체 배열. 개수만 있으면 되고 목록은 A 파이프 `end.cards`에 있다 |

**그리고 남은 payload를 직렬화해 512B를 넘으면 자른다**(`{__cut:N}` 표시를 남겨 잘렸음을 분석에서 알 수 있게). 규칙이 못 잡은 새 무거운 필드가 들어와도 크기가 터지지 않게 하는 안전망이다. **자른 건 조용히 넘기지 않는다** — 잘린 이벤트 수를 세어 `session` 마감 시 한 번 남긴다.

- 로컬 `trackEvent`(콘솔·DebugPanel)는 **지금 모양 그대로 둔다**. 전송 봉투만 걸러서 따로 만든다.
- 걸러낸 뒤 실측 크기는 §7 표에서 구현 후 갱신한다.

### §3-2 pid — 언제 생기나, 그 전 이벤트는 어디로 가나

`gameState.playId`는 `makePlayRecord`가 **첫 호출 시점에 지연 발급**한다(`08b:25`). 그래서 `session_started`·`title_viewed`·`tutorial_viewed`는 **playId가 아직 없는 구간**에서 발화한다.

- 버퍼에 pid가 없으면 **부트스트랩 pid**(`p_b…`)를 발급해 그 구간을 담는다.
- 이후 `gameState.playId`가 나타나 버퍼의 pid와 **다르면 회전한다** — 현재 part를 마지막으로 한 번 올려 마감하고, 새 pid로 `part=0`부터 다시 쌓는다.
- 판 파일은 `pid`로 A 파이프 레코드와 그대로 조인된다. `seq`는 그 pid 안에서 1부터.

⚠️ **지연 발급의 대가 — 첫 시나리오가 부트스트랩 파일로 간다** (2026-08-13 검증에서 발견). `playId`는 `makePlayRecord` 첫 호출, 즉 **1번 시나리오를 끝낸 시점**에 생긴다. 그래서 회전 지점이 게임 시작이 아니라 1번 시나리오 종료다 — 판 파일만 보면 **첫 시나리오가 통째로 빠진 것처럼 보인다**(실측: 2시나리오 플레이인데 판 파일 11줄).

**처방 = 새 파일 첫 줄에 `__rotate` 이벤트**(`d:{from, fromPart}`)를 남겨 두 파일을 이어 붙일 수 있게 한다.

게임 시작 시점에 `playId`를 미리 발급하면 회전 자체가 없어지지만, 그러려면 08e가 08b의 `makePlayRecord`를 불러야 한다 — **§0의 「A와 B는 서로를 모른다」를 깨므로 쓰지 않는다.** A를 들어내도 B가 그대로 도는 것이 이 설계의 값이다.

### §3-2 봉투

```
{v, pid, seq, at, t, d}
```

| 필드 | 의미 |
|---|---|
| `v` | `CONFIG.version` — 해석 기준. A 파이프와 같은 값 |
| `pid` | 판 식별자(`gameState.playId`) 재사용. **기기 UUID 아님** |
| `seq` | 판 내 순번(1,2,3…). `part` 넘어도 리셋 안 함 — 순서·누락 판정 |
| `at` | epoch ms 정수(A 파이프와 통일. ISO 문자열 아님 — 크기) |
| `t` | eventType |
| `d` | 이벤트별 payload(현행 `trackEvent` payload에서 `before`/`after` 스냅 제거) |

## §4 저장·전송

- 신규 CONFIG 키: `evOutboxKey: 'ai-literacy-delegation-boundary-{변종}-evbuf'`
- 구조: `{ pid, datePath, part, seq, lines }` — 한 키에 원자적으로 영속(§1-4). `datePath`는 판 시작 시 1회 고정(자정 넘어 키가 바뀌면 멱등이 깨진다).
- 전송: `POST {CONFIG.logEvEndpoint}`, `Content-Type: application/x-ndjson`, `keepalive:true`, `credentials:'omit'`.
- S3 키: `raw-ev/{v}/{yyyy}/{mm}/{dd}/{pid}__{part}.ndjson`
  - **prefix를 `raw/`와 갈라 둔다** — 안 가르면 `/report`·`/stats`가 verbose 파일까지 세어 집계가 오염되고 `MAX_RECORDS` 5,000 상한을 verbose가 먹는다.
- flush 트리거(동현공 §8과 동일): 이벤트 10개 · 60초 주기 · 마일스톤(`scenario_completed`·`final_report_viewed`·`session_reset`) · `pagehide`/`visibilitychange(hidden)`.
- 실패 처리: A 파이프(`08d` §7)와 같은 규칙 — 일시 실패는 버퍼 유지 후 다음 기회, 영구 거부(400·413·422)는 폐기.

## §5 kill switch

- `CONFIG.verboseLog`(불리언) + `CONFIG.logEvEndpoint`. **둘 다 있어야 켜진다**(fail-safe — 엔드포인트 누락 시 통째 off).
- 주입은 빌드 타임. 우리는 Next가 아니라 `build.py`이므로 `NEXT_PUBLIC_*`이 아니라 **`build.py` 인자로 `CONFIG`에 박는다**(SPEC-build-system 참조).
- **기본 off.** 학교 배포본은 플래그 없이 나가고, 피터공 테스트 빌드(GitHub Pages)에서만 켠다.
- off면 `08e`는 전 함수 즉시 반환 — 리스너조차 걸지 않는다.

## §6 먼저 막을 것 — localStorage 무제한 누적 (verbose와 무관 · 지금 라이브의 문제)

⚠️ **이것은 verbose 때문에 생기는 문제가 아니다.** `08-event-log.js`는 「v0.2 보존」 모듈이고 git으로 최소 2026-05-09(v10)까지 거슬러 올라간다. **오늘 나가는 r41 빌드(mid·elem)에 그대로 들어 있다.** verbose는 코드가 아직 0줄이다.

- `trackEvent`는 **트리밍이 없다**(`08-event-log.js:29-31`). `clearEvents()`는 **DebugPanel「전부 삭제」에서만** 불린다 — 새 학기 시작에도, 리셋에도 안 불린다.
- `saveGame()`엔 **`try/catch`가 없다**(`07-storage.js:4`). 호출처 32곳 중 **선택 핸들러 3곳**이 포함된다(`03-engine.js:45·68·109` = 1차·2차·검토 선택).

### §6-1 실측 (2026-08-13, CDP 헤드리스 · `v1.3-mid-r41`)

**누적** — 5시나리오 완주 1판 = **이벤트 58건 / 29,139B**. 연속 3판을 같은 브라우저로 돌리면 29,139 → 58,277 → 87,415B로 **정확히 선형 누적**(비워지지 않는 것을 실측으로 확인). localStorage 5MB까지 **약 172판**.

| 키 | 1판 완주 후 |
|---|---|
| 이벤트 로그(`…-events`) | **29,197B** ← 계속 누적 |
| 세이브(`…-v13-mid`) | 9,716B (판마다 교체, 안 불어남) |
| outbox(`…-outbox`) | 918B (upsert + 전송 성공 시 제거) |

**고장 재현** — 여유 공간을 0·2·8KB로 두고 플레이:

| 여유 | 결과 |
|---|---|
| 8KB | 시나리오 1개는 통과, **2개째 `onReview`에서 터짐** |
| 2KB | `onTier2`부터 터짐 |
| 0KB | `onTier1`부터 터짐 |

⚠️ **증상이 예상과 달랐다. 화면은 멈추지 않는다.** cut 1→6까지 정상으로 넘어가고 예외는 콘솔에만 뜬다. 대신 **진행이 안 잡힌다** — `scenarioHistory` 0건. **세 번 다시 해도 계속 0건**이다. 아이 눈에는 시나리오를 끝냈는데 게임은 안 끝난 것으로 안다(다시 해도 마찬가지).

그리고 **두 파이프 어디에도 안 찍힌다** — outbox 레코드가 안 생기고(우리 `/report`에 없음), `game_start`는 그 전에 이미 나갔다(동현공 쪽엔 정상 시작으로 보임). **교실에서 아이가 손을 들어야만 알 수 있다.**

### §6-2 처방 (verbose보다 먼저, 별도 빌드로)

- `trackEvent` 로컬 로그에 **상한**(최근 N건 링버퍼). 판당 58건이므로 N=200이면 최근 3~4판이 남고 크기는 ~100KB에 묶인다.
- `saveGame()`에 **`try/catch`** + 실패 시 이벤트 로그를 먼저 비우고 1회 재시도. 세이브는 어떤 경우에도 이벤트 로그보다 우선한다.
- 부팅 시 1회 정리도 검토(이전 학기 잔여 로그).

## §7 용량·비용 (피터공 판단 재료, 2026-08-13 산정)

한 판 완주 기준. 학기 1만 판 가정.

**전부 실측(2026-08-13, `v1.3-mid-r41`, 5시나리오 완주 1판)** — 이벤트 **58건**.

| | 판당 | 판당 PUT | 학기 1만 판 | 학기 비용 |
|---|---|---|---|---|
| A. 우리 레코드 | **918 B** | ~6 | 9 MB | ~$0.3 |
| B. verbose (구현본) | **10,885 B** · 줄당 188 B | **7** | 109 MB | ~$0.35 |
| (참고) 같은 판 `snap` 포함 시 | 29,199 B | — | 292 MB | — |

§3-1 걸러내기가 **29.2KB → 10.9KB로 2.7배** 줄였다. 둘을 합쳐도 학기당 **$1 미만** — **비용은 제약이 아니다.**

제약은 셋이고 둘은 답이 있다 — `keepalive` 64KB는 48KB 롤오버가(§1-3, 검증됨), `/report` 5,000건 상한은 `raw-ev/` prefix 분리가 막는다. **남는 하나가 §6의 localStorage이고 그건 verbose와 무관한 기존 문제다.**

- S3 PUT $0.005/1,000 · 저장 $0.025/GB·월 · HTTP API $1/100만 · Lambda 무료 티어 안.
- **비용은 제약이 아니다**(학기당 1~2달러). 제약은 셋이고 둘은 이미 답이 있다 — `keepalive` 64KB는 48KB 롤오버가, `/report` 5,000건 상한은 prefix 분리가 막는다. **남는 하나가 §6의 localStorage다.**
- ⚠️ 위 수치는 **산정치**다. 실측은 §8-1에서 한 판 돌려 확정하고 이 표를 갱신한다.

## §8 검증

### §8-1 실측(구현 전에 먼저)
기존 하니스(`scripts/verify-log-transmit-cdp.mjs` T4)가 실제 1판을 돌린다. 그 자리에서 `getEvents()`의 **건수와 바이트**를 찍어 §7 표를 실측으로 교체한다. 추정으로 설계를 고정하지 않는다.

### §8-2 구현 후 — **2026-08-13 완료, 19/19 PASS**

하니스 `scripts/verify-verbose-log-cdp.mjs`(+ `scripts/measure-logsize-cdp.mjs`). 로컬 수집 sink(8791)로 받아 실제 올라간 바이트를 뜯어본다.

| | 결과 |
|---|---|
| **T1 OFF = 완전 no-op** | `evbuf` 키 자체가 안 생김 · 네트워크 0건 · 게임 정상 |
| **T2 ON** | 이벤트 누적 · `seq` 연속(누락 0) · 봉투 6필드 고정 · **금지 키 0**(snap·before·after·history·items) · **UA·기기UUID 미포함** · `application/x-ndjson` · 키 스킴 정규식 일치 · **A 파이프 `pid`와 동일(조인됨)** |
| **T3 A·B 독립**(§0 본체) | B 엔드포인트를 죽여도 A 정상 · A를 죽여도 B 정상 · 둘 중 하나가 죽어도 게임 완주 |
| **T4 48KB 롤오버** | `part` 0→1, 버퍼 비움, `seq`는 판 전역 연속 유지 |
| **T5** | 런타임 예외 0 |
| **회전 스티치** | 판 파일 첫 줄 `__rotate.d.from`이 부트스트랩 파일을 정확히 가리킴. 11 + 13 = 24줄로 이어붙음 |

**남은 것 = 실서버 검증**. 지금은 로컬 sink 기준이라 CORS·실제 route는 아직 안 봤다.

### §8-1 서버 쪽 (2026-08-16 신설 — 「콘솔에서 열면 된다」가 틀렸다)

> ⚠️ **위 문단은 「콘솔에서 `/log-ev`를 연 뒤」라고 적었고 작업 큐도 그것을 «유일한 관문»으로 적었다. 실물 대조 결과 틀렸다.** `infra/ai-literacy-log-api.yaml`에 route가 없고 verbose 수신 Lambda도 없다. 콘솔에 켤 스위치가 있는 게 아니라 **받는 쪽이 안 지어져 있었다.** 라이브 실측 = `POST /log-ev → 404`(양쪽 API), `POST /log → 400`(살아 있음).
>
> 그리고 route만 열었으면 **두 번 더 막혔다.** 이 둘은 route를 열어 봐야 드러나지도 않는다(첫 번째로 죽는 자리 하나만 진짜다):
> - **IAM** — `s3:PutObject`가 `${PlayLogBucket.Arn}/raw/*`로만 열려 있다. `raw-ev/…`는 이 패턴에 **안 걸린다**(`raw/`는 슬래시까지가 prefix). 403
> - **CORS** — `AllowHeaders`가 `Content-Type` 하나뿐인데 클라이언트는 `X-Log-Key`를 보낸다. 브라우저 preflight에서 차단

수신 계약은 클라이언트(`08e-verbose-log.js`)가 이미 정해 놓았다. 서버는 그것을 그대로 받는다.

| | 값 |
|---|---|
| 메서드·경로 | `POST /log-ev` |
| Content-Type | `application/x-ndjson` |
| 키 | 헤더 `X-Log-Key` = `raw-ev/{v}/{yyyy}/{mm}/{dd}/{pid}__{part}.ndjson` |
| 바디 | NDJSON. 같은 키에 **덮어쓰기**(flush가 그 part 전체를 다시 올린다 — 멱등) |
| 크기 | 롤오버 48KB, `keepalive` 상한 64KB → 서버 캡 **64KB** |

**설계 결정 — 파이프 A와 다른 Lambda·다른 역할로 가른다.** 기존 `IngestFunction`에 경로 분기를 넣지 않는다. A 파이프는 지금 KT 라이브를 받고 있어서, verbose 쪽 버그가 그것을 멈추면 안 된다. 함수를 가르면 실패 영역이 갈리고, 역할도 갈라서 **A 역할은 `raw-ev/`에 못 쓰고 B 역할은 `raw/`에 못 쓴다**(최소권한 유지, `SPEC-log-transmit.md` §11-2와 같은 결).

**키는 클라이언트가 주는 값이라 서버에서 정규식으로 조인다.** 검증 없이 S3 키로 쓰면 임의 경로 쓰기가 된다. 통과 조건:

```
^raw-ev/[A-Za-z0-9._-]{1,32}/\d{4}/\d{2}/\d{2}/p_[A-Za-z0-9_-]{1,64}__\d{1,6}\.ndjson$
```

`raw-ev/` 접두어를 강제하는 것이 `/report`·`/stats` 오염 방지(§1-4 prefix 분리)와 같은 자리다.

**남은 것 = 스택 업데이트 후 §10-3 방식(preflight curl)으로 오리진 3개 확인 + 실제 1판 end-to-end.**

## §9 제거 방법 (관찰 종료 후)

`08e-verbose-log.js` 삭제 + `build.py`의 `verboseLog`·`logEvEndpoint` 주입 2줄 삭제 + `08-event-log.js`의 전송 훅 1줄 삭제. `trackEvent` 본체·DebugPanel·A 파이프는 **남긴다**. 그 전까지는 플래그 off로 비활성(코드가 남아도 무해).

## §10 범위 밖 / 남은 사안

- **v14에 `08d-log-transmit.js`가 없다.** A 파이프 전송 모듈이 v13-elem·v13-mid에만 있고 v14엔 없다(`logApiEndpoint`도 없음). verbose와 별개로 이식이 필요하다.
- **`08c`의 IP·UA 기록**(§2-3 ⚠️) — 교육청 문서에 한 줄 추가 / `08c` 제거 / 동현공에게 이 게임만 미기록 요청. 셋 중 하나.
- SPEC 두 장(play-log·log-transmit)이 `r39`/`r40` 표기인데 라이브는 **r41** — 현행화 필요.
- `v13-elem`의 `eventLogKey`·`outboxKey` 문자열이 `v13-mid`로 되어 있다(오리진이 달라 실사용 충돌은 없으나 로컬 검증에서 섞인다).
- verbose 데이터의 **분석 화면은 만들지 않는다.** 지금은 파일을 내려받아 사후 분석. `/report`는 A 파이프 전용으로 둔다.
