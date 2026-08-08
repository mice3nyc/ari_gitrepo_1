# SPEC-log-transmit — 플레이 로그 서버 전송 (AWS 자체 인프라)

> 작성 2026-07-03. 선문후코 — 코드 작성 전 명세. **SPEC-play-log.md §8("범위 밖")의 후속.** 로컬 outbox까지는 이미 구현·검증 완료(세션498). 이 SPEC은 그 outbox를 AWS로 전송하는 부분만 다룬다.
> 배경 대화: 요청.26.0703.1044-AI리터러시로그전송설계 (다음 단계·결정 경위 정리)
> 대상 빌드: v13-elem, v13-mid, v14 공통(SPEC 동일 사본 유지)

## §0-1 기존 시스템과의 관계 (혼동 방지)

동현공이 운영하는 wp-engine 공유 Lambda(`w0a7nvx7qd...execute-api...`, `/log`·`/result`)에 이미 `game_start` 이벤트가 fire-and-forget으로 가고 있다(`08c-game-start-log.js`, wallpeckers 등 다른 놀공 게임과 공유하는 범용 참여 집계 엔진, CloudWatch Logs에만 기록·S3 저장 없음). **이 SPEC이 다루는 건 그것과 별개다.** 06/17~18 구현 시점부터 "우리 플레이로그(08b outbox)와는 별개 시스템"으로 의도적으로 분리 설계됐다(코드 주석에 명시). 동현공 Lambda는 "시작했다"는 신호만, 이 SPEC은 시나리오별 선택·등급·카드·학습자 유형 같은 콘텐츠 분석용 상세 레코드를 다룬다. 확장 대상이 아니라 애초에 계획된 두 번째 트랙.

## §0 결정 — 왜 이 구조인가

- **Supabase 등 외부 서비스 배제.** 놀공/피터공 자체 AWS 인프라(개인 계정 playvault, 서울 리전)만 사용. 에고그램(Mind2Action)의 Supabase 패턴은 참고만 하고 따르지 않는다.
- **브라우저→S3 직접 쓰기(Cognito Identity Pool)를 채택하지 않는다.** 서버가 아예 없는 구조라 제일 간단해 보이지만, 속도 제한과 payload 검증이 빠진다. 미성년자 대상 교육청 배포·학교 공용망이라는 맥락에서 이 둘은 "비용 리스크 최소화"와 직접 부딪힌다.
- **대신 API Gateway(HTTP API) + Lambda(검증 전용, 가벼움) + S3(private)** 구조를 쓴다. Lambda 한 겹으로 스로틀링·payload 크기 캡·CORS 오리진 제한을 다 얻고, AWS 자격증명이 클라이언트 코드에 전혀 노출되지 않는다.
- **같은 AWS 계정(playvault)의 4번째 스택으로 배포한다.** Manifesto(S3+CloudFront)·인생게임 호스팅·인생게임 세션 API(DynamoDB+Lambda+API Gateway)에 이미 쓴 OIDC를 그대로 재사용 — OIDC는 계정당 1개, 재생성 불필요.

## §1 아키텍처

```
게임(브라우저, goe-ai-el/md.nolgong.com 또는 GitHub Pages)
  --POST JSON(outbox 레코드)--> API Gateway(HTTP API)
    → Lambda(사이즈·스키마 검증만) → S3 private 버킷(prefix 파티션)
```

- 레코드 스키마는 SPEC-play-log.md §1을 그대로 사용(변경 없음). 이 SPEC은 "어떻게 보내는가"만 다룬다.
- Lambda는 저장 로직만 수행 — 분석·집계는 여기서 하지 않는다(§8 범위 밖).

## §2 CORS 허용 오리진 (확정, 3개)

| 오리진 | 용도 |
|---|---|
| `https://goe-ai-el.nolgong.com` | 운영, 초등 (동현공 배포) |
| `https://goe-ai-md.nolgong.com` | 운영, 중등 (동현공 배포) |
| `https://mice3nyc.github.io` | 개발/테스트 — GitHub Pages `ari_gitrepo_1/ai-literacy-delegation-boundary/{v13-elem,v13-mid}/` (경로는 다르지만 오리진은 스킴+호스트 기준이라 동일) |

와일드카드 사용 안 함. 세 오리진 전부 API Gateway `CorsConfiguration.AllowOrigins`에 명시.

## §3 S3 키 전략

- `raw/{version}/{yyyy}/{mm}/{dd}/{pid}.json`
- 로컬 outbox가 이미 "같은 pid는 교체(upsert)"이므로, S3도 **같은 키로 덮어쓰기**한다. 중간 이탈 레코드가 나중에 완주 레코드로 자연스럽게 교체됨(별도 로직 불필요).
- `version` = 레코드의 `v` 필드(예: `v1.3-mid-r39`) 그대로 prefix에 사용 — 버전별 분리 조회 가능.

## §4 보안 가드레일

- **payload 크기 캡**: Lambda에서 5KB 초과 시 즉시 400 거부(레코드 목표 크기 1~2KB 대비 여유).
- **스키마 최소 검증**: `pid`(문자열, `p_` 접두어) · `v`(문자열) · `sc`(배열) 존재 여부만 확인. 상세 필드 검증은 하지 않음(과설계 방지, 어차피 게임 코드가 만든 레코드).
- **처리율 제한**: API Gateway usage plan, 초당 5건·버스트 10건. 교실 동시 플레이 규모엔 넉넉하고 봇 스팸은 여기서 막힘.
- **S3 버킷**: Block Public Access 전면 활성화, SSE-S3 암호화 강제(미암호화 PUT은 버킷 정책으로 거부).
- **Lambda 실행 역할**: 해당 버킷의 `raw/*` prefix에 `s3:PutObject`만. `Get`·`List`·`Delete` 전부 없음(최소 권한, 쓰기 전용).
- **개인정보 0**: SPEC-play-log.md §0·§6 원칙 그대로 승계 — 학교·이름·IP 등 수집 안 함. Lambda도 요청 헤더의 IP를 레코드에 남기지 않는다.

## §5 비용 가드레일

- API Gateway는 REST API가 아닌 **HTTP API**(과금이 훨씬 쌈).
- Lambda 무료 티어는 12개월 한정이 아니라 계정이 살아있는 한 매달 100만 요청 무료 — 이 규모에선 사실상 무료.
- S3 저장·PUT 비용도 이 데이터량(레코드 1~2KB)에선 체감 안 되는 수준.
- 안전망으로 **AWS Budget 알림**(예: 월 $5 초과 시 메일)을 이 스택에 걸어둔다 — 설정 5분, 이상 트래픽 조기 발견용.

## §6 계정·배포

- AWS 계정: **playvault**(개인, 885123105962, ap-northeast-2). 동현공이 운영하는 nolgong.com 하위 사이트와는 별개 계정이지만, CORS 기반 API 호출은 계정 경계와 무관 — 기술적 문제 없음(요청.26.0703.1044 참조).
- CI/CD: 기존 OIDC 재사용, GitHub Actions로 배포(Manifesto·인생게임과 동일 패턴).
- 계정 소유권(개인 vs 놀공 회사 계정)은 지금 단계에서는 문제 없음. 정식 교육청 수집으로 굳어지면 놀공 계정으로 이전 검토(스택 재배포라 어렵지 않음) — 지금은 염두만.

## §7 클라이언트 통합 흐름 (구현 완료 2026-08-04)

모듈 `08d-log-transmit.js` — `flushOutbox()` 하나가 공개 진입점(SPEC-play-log.md §4의 stub 자리).

1. 온라인 상태에서 outbox를 **앞에서부터 하나씩** POST. 병렬 전송 안 함(순서 보존·폭주 방지).
2. 200 성공 → `dequeueFromOutbox(pid)`로 로컬 큐에서 제거, 다음 레코드로.
3. **일시 실패**(네트워크 오류·CORS 실패·403·429·5xx) → 큐 유지 + **그 자리에서 중단**. 다음 호출 기회에 재시도.
4. **영구 거부**(400·413·422) → 큐에서 제거. 재시도해도 안 고쳐지는 스키마·크기 위반이라, 남겨두면 큐 머리에서 뒤를 영원히 막는다. 같은 이유로 직렬화 결과가 **5KB(`_LT_MAX_BYTES`) 초과면 보내기 전에 버린다** — 서버 캡(§4)과 같은 값.
5. 재진입 방지: `_lt_busy` 플래그. 시나리오 종료가 연달아 불려도 flush는 한 번만 돈다.
6. **호출 시점**: ① 게임 시작(`09-render-scenario.js` 튜토리얼 종료, `sendGameStartLog()` 옆) ② 시나리오 종료마다(`recordScenarioEnd()` 직후) ③ 학기 완주(`11-report.js`, `recordSemesterDone()` 직후). 매번 실패해도 outbox가 유지되니 교실 와이파이가 끊겨도 손실 없음.
7. `keepalive:true` — 마지막 시나리오 직후 창을 닫아도 전송이 끊기지 않게.
8. 엔드포인트는 `CONFIG.logApiEndpoint`에 고정값으로 박는다(변종 mid/elem 공통 — 버전 구분은 레코드의 `v` 필드가 하므로 URL을 가를 이유가 없다). 피터공이 zip으로 넘기고 동현공이 배포하는 흐름이라, URL이 코드 확정 이전에 결정돼 있어야 왕복이 없다(§9 순서).
9. 게임 흐름을 막지 않는다 — 전 경로 비동기 + `try/catch`, 실패는 조용히 넘어간다. 08c(동현공 참여 집계)와 **엔드포인트·모듈 모두 별개**(§0-1).

> ⚠️ **v13은 mid·elem 두 소스 트리가 평행으로 살아 있다**(`src/js` 중 00-config·02-state·11-report·12-debug·15-card 5개가 서로 다름). 이 모듈은 **양쪽에 같은 내용으로 넣는다.** 단일 마스터화는 v14의 과제이고 v14는 아직 배포판이 아니다(배포 라이브 = `v1.3-elem-r39`·`v1.3-mid-r39`, 2026-08-04 실측).

## §8 범위 밖 (이번 SPEC에 포함하지 않음)

- ~~관리자 **분석** 대시보드·집계 리포트~~ → **§12로 범위 안에 넣었다(2026-08-04).** 사유: 학교 라이브는 되감을 수 없고, "쌓아만 두고 나중에 본다"는 그 학기를 통째로 못 보는 것과 같다(피터공 8/4 "라이브 테스팅인데 언제 단계적으로 진행해").
- ~~교육청 제출용 "수집 항목 설명" 문서~~ → **작성 완료**: `수집항목-설명.md`(v13-mid·v13-elem 사본, 전달 패키지에 동봉).
- gzip 압축 (레코드가 이미 1~2KB라 지금 단계 불필요)
- 정교한 재시도 정책(지수 백오프 등) — 지금은 §7의 단순 재시도로 충분

## §11 유입 모니터링 (2026-07-08 추가 — "쌓기만 하고 blind면 반쪽")

수집 파이프가 살아 있는지 볼 수단이 없으면 학교 배포 후 CORS·URL 오류가 조용히 실패해도 모른다. 정교한 분석(§8, 다음 판)과 별개로, **"데이터가 들어오고 있다"를 확인하는 최소 모니터링**을 이번 스택에 포함한다.

### §11-1 개발자용 (추가 비용 0)
- **CloudWatch Lambda Invocations 메트릭**: ingest Lambda 배포만으로 자동 수집 — 시간대별 유입 건수 그래프를 콘솔에서 무료 확인.
- **ingest Lambda 로그 한 줄**: S3 PutObject 성공 직후 `console.log('saved', key)` → CloudWatch Logs에 "어느 판이 언제 저장됐나" 기록(디버깅·유입 확인 겸용).

### §11-2 조회 엔드포인트 `GET /stats` (피터공용)
URL 하나 열면 유입 현황이 JSON으로 보인다. 브라우저 직접 접속이라 CORS 무관(크로스오리진 fetch만 CORS 적용), 개인정보 0(판 수·시각뿐).

- **응답**: `{ "total": <총 판 수>, "byVersion": { "<v>": <count>, ... }, "latest": "<가장 최근 유입 ISO 시각 or null>" }`
- **구현**: 별도 `StatsFunction` Lambda. `raw/` prefix를 `ListObjectsV2`로 순회하며 객체 수 카운트 + 키의 `raw/{v}/...`에서 버전 추출해 버전별 집계 + 최신 `LastModified`. 페이지네이션(1000개/페이지) 처리.
- **권한 분리(최소권한 유지)**: Stats 역할 = 버킷에 `s3:ListBucket`(prefix `raw/*`)만. ingest 역할은 §4 그대로 `s3:PutObject`만 — 읽기·리스트 없음. 쓰기 경로와 조회 경로의 권한을 섞지 않는다.
- **CORS**: HTTP API `AllowMethods`에 `GET` 추가(POST와 병행).
- **규모 주의**: 매 호출마다 raw/ 전체 리스트 — 교실 규모(한 학기 수백~수천 판)엔 충분. 수만 규모로 커지면 집계 캐시나 S3 Inventory로 개선(그때 §8 분석 SPEC과 함께).

### §11-3 범위 밖(여전히 다음 판)
시나리오별 선택 분포·유형 분포·카드 패턴 같은 **내용 분석**은 §8 그대로 별도. `/stats`는 "몇 판 들어왔나"까지만.

## §12 결과 리포트 `GET /report` (2026-08-04 추가)

`/stats`가 "몇 판 들어왔나"라면 `/report`는 **"무엇이 일어났나"**다. 브라우저로 열면 HTML 한 장이 그대로 뜬다(JSON 아님 — 피터공이 읽는 화면이다). `?v=v1.3-mid-r40`로 버전 필터, `?format=json`으로 원자료.

**보여주는 것**: 전체 판·완주·완주율·완주 평균 총점 / 버전별 / **시나리오별**(플레이 수·평균 점수·소요 시간 중앙값·등급 분포·재도전 수와 **↑개선 =유지 ↓하락**) / **선택 분포**(1차·2차·검토 선택지별 비율) / **어디서 멈췄나**(미완주 `cur` 집계, 많은 순) / 학습자 유형 분포.

- **권한**: 전용 `ReportExecutionRole` — `raw/*`에 `ListBucket` + `GetObject`. ingest(PutObject 전용)·stats(ListBucket 전용)와 역할을 섞지 않는다.
- **규모**: `MAX_RECORDS` 5,000건 상한. 넘으면 **화면 상단에 경고 배너로 명시한다**(조용히 자르지 않는다). 20건씩 묶어 병렬 GET, Timeout 60s·512MB.
- **못 읽은 파일 수**도 상단에 표시 — 0이 아니면 파이프에 문제가 있다는 신호.
- **검증(2026-08-04, 12/12 PASS)**: Lambda 코드를 템플릿에서 뽑아 `node --check` + S3 클라이언트를 스텁으로 갈아끼워 실제 레코드 모양(재도전 `gs`·이탈 `cur` 포함)으로 집계·HTML 생성까지 확인. 재도전 개선/하락 판정, 이탈 집계, XSS 이스케이프 포함. 미리보기 산출물 = `~/Downloads/AI리터러시_리포트_미리보기.html`.
- ⚠️ **배포는 피터공 콘솔 작업이다.** 아리공 로컬에 AWS 자격증명이 없다. `infra/ai-literacy-log-api.yaml`을 CloudFormation 콘솔에서 기존 스택 `ai-literacy-log-api`에 업데이트하면 Report 5리소스가 Add된다(기존 리소스 교체 없음, S3 데이터 보존). 인라인 Lambda만 바뀐 경우 변경세트가 "0 변경"으로 보일 수 있으나 상태가 AVAILABLE이면 실제 변경이 있는 것이다.

## §9 배포·통합 순서 (왕복 없이 진행)

1. 아리공이 dev 스택(API Gateway+Lambda+S3) 배포, curl로 검증(가짜 레코드 PUT → S3 확인)
2. 검증되면 그 URL을 그대로 운영용으로 승격(같은 URL 유지)
3. 확정 URL을 `08d-log-transmit.js`에 고정, 로컬 빌드에서 실제 플레이로 end-to-end 확인
4. 코드 커밋 → 피터공 빌드 → zip → 동현공 전달·배포 (동현공은 CORS·엔드포인트 조율 불필요, 이미 코드에 다 박혀 있음)

## §10 검증

### §10-1 서버(2026-07-08 완료)
- curl로 유효 레코드 PUT → S3에 정확한 key로 오브젝트 생성 확인
- 5KB 초과 payload → 400 거부 확인
- 초당 10건 연속 요청 → usage plan 스로틀 동작 확인
- `GET /stats` → 방금 PUT한 레코드가 `total`·`byVersion`에 반영되는지 확인(§11-2)
- CloudWatch Logs에 ingest Lambda의 `saved <key>` 로그가 찍히는지 확인(§11-1)

### §10-2 클라이언트 하니스 (2026-08-04, 17/17 PASS)

**`scripts/verify-log-transmit-cdp.mjs`** — 다음에 이 자리로 돌아오면 이 하니스부터 돌린다.

```bash
# 1) 프로젝트 루트를 정적 서빙 (루트 빌드가 ../images를 참조하므로 상위에서 띄운다)
cd _dev/ai-literacy-delegation-boundary && python3 -m http.server 8123 &
# 2) 헤드리스 크롬 (⚠️ --disable-web-security = 전송 로직만 보기 위한 것. CORS는 §10-3에서 따로 본다)
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
  --remote-debugging-port=9222 --disable-web-security --user-data-dir=/tmp/chrome-lt about:blank &
# 3) 실행
cd v13-mid && node scripts/verify-log-transmit-cdp.mjs "http://127.0.0.1:8123/v13-mid/index.html"
```

검증 항목: 모듈 로드·엔드포인트 주입·08c와 분리 / T1 성공→큐 제거→`/stats` 반영 / T2 네트워크 실패→큐 유지, T2b 복구 후 재시도로 전송 / T3 5KB 초과→보내기 전 폐기 / T4 **실제 플레이 1판**(`startNewGame`→`startScenario`→`onTier1`→`onTier2`→`onReview`, 버튼이 부르는 그 함수들)→운영 버전 prefix로 서버 반영 / T5 런타임 예외 0.

> ⚠️ T4 함정: **세이브가 남아 있으면 `startScenario`가 "이미 클리어"로 조용히 return한다**(§14.5 순차 진행 방어). 화면이 안 그려진 채 `onTier1`이 `setPanelImage` panel null로 죽는데, 원인은 전송과 무관하다. 하니스가 `localStorage.clear()` 후 재로드하는 이유.
>
> 합성 레코드는 `v:'v0-e2e-test'`를 써서 `raw/v0-e2e-test/` 로 떨어진다 — 운영 버전 집계를 오염시키지 않는다. T4만 실제 버전으로 기록된다.

### §10-3 CORS 실측 (2026-08-04)

브라우저 없이 preflight로 서버 설정을 직접 확인한다(§2 허용 3개 + 차단 2개):

```bash
curl -s -i -X OPTIONS "$API/log" -H "Origin: <오리진>" \
  -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: content-type" | grep -i allow-origin
```

결과: `mice3nyc.github.io`·`goe-ai-md.nolgong.com`·`goe-ai-el.nolgong.com` → 자기 오리진 반사(허용). `evil.example.com`·`127.0.0.1:8123` → 헤더 없음(차단).

**브라우저 쪽 짝 검증**: 보안 켠 헤드리스 크롬(`--disable-web-security` 없이)으로 **배포 빌드**(minify된 `builds/{mid,elem}/index.html`)를 차단 오리진(localhost)에서 열고 `flushOutbox()` → **outbox 잔존 1**. CORS로 막혀도 데이터가 사라지지 않는다(§7-3). release 빌드가 minify 후에도 정상 동작하는 것을 겸해서 확인.

### §10-4 남은 확인 (동현공 배포 후)
- 실제 운영 도메인에서 플레이 1판 → `/stats`의 `v1.3-mid-r39`·`v1.3-elem-r39` 증가.
- 그 전까지는 preflight(§10-3)로 확인한 서버 설정이 근거다.
