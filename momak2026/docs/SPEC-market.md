---
tags:
  - 개발
  - momak2026
  - SPEC
created: 2026-07-11
author: 아리공
---

## SPEC-market — MOMAK 마켓타임 기술 명세 (v0.1 Draft)

> 상위 = [[PLAN]]. 이 문서는 코드 작성 전 명세다(선문후코). 코드와 동기화한다.
> 범위 = **Market Time v1** (BUY/SELL + 실시간 가격 + GM 제어). 제외 = TRADE·교환소·보드·정산·회고.
> 데이터 근거 = `docs/data/market_config_miraeasset.json` (미래에셋 16아이템 × 11턴 min/delta).
> 설계 상당수는 덱스(codex) 스펙에서 차용하되 범위·인프라·데이터를 우리 것으로 교체 → 근거 [[요청.26.0711.1950-MOMAK마켓타임]] 부록 B.

---

### 1. 설계 원칙

- 서버가 **시간·가격·잔액·재고의 유일한 원장**이다 (server-authoritative).
- 모든 화면은 같은 세션 상태와 **가격 버전(priceVersion)**을 구독한다.
- **화면에 표시된 가격으로 체결**되거나, 체결되지 않고 명확한 재시도를 요구한다 (임의 최신가 체결 금지).
- 같은 요청은 네트워크 재전송·광클릭 때문에 **두 번 처리되지 않는다** (멱등).
- **게임 규칙(불변 버전)**과 **운영 중 상태(세션 원장)**를 분리한다.
- GM의 모든 자금·상태 변경은 사유와 함께 감사 로그에 남긴다.
- 금액·가격은 **양수 정수**(최소화폐단위)로 저장한다.

---

### 2. 용어

| 용어 | 정의 |
|---|---|
| Game Definition | 아이템·턴·가격규칙·배정을 담은 게임 설계 원본 (편집 가능) |
| Game Version | 발행되어 불변인 Game Definition 스냅샷 |
| Session | 특정 Game Version으로 진행하는 한 번의 게임 |
| Market Channel | 태블릿 한 대에 표시할 아이템 묶음 (1~2개) |
| Quote | 플레이어가 보는 (가격, priceVersion, 유효시각)의 조합 |
| Tick | 서버가 가격을 한 번 갱신한 사건 |
| Order | 플레이어의 BUY/SELL 요청 |
| Ledger | 잔액·재고 변화의 append-only 원장 |

---

### 3. 데이터 모델

설정 계층 (덱스 구조 차용, 도면 init 6항목과 일치):

```
GameDefinition (편집 가능)
└── GameVersion (발행·불변)
    ├── GeneralRules   (통화, 팀규칙, featureFlags)
    ├── TurnDefinition[] (턴별 시간·활성아이템·가격규칙)
    ├── ItemDefinition[] (16아이템)
    ├── PriceRule[]      (아이템×턴 가격규칙)
    ├── AssignmentRule   (플레이어별 담당 아이템)
    └── MarketChannel[]  (태블릿 표시 구성)

Session = GameVersion 스냅샷 + 운영 상태 + 원장
```

**ItemDefinition** (미래에셋 16종, `market_config_miraeasset.json` 근거):

| 필드 | 설명 |
|---|---|
| code | 안정적 내부 ID (예: `OFFICE_BUILDING`) |
| ko / en | 한글명·영문명 |
| category | `core`(핵심역량 3) / `basic`(기본투자 9) / `highvalue`(고부가 4) |
| color | 화면 식별색 (2013 색체계 계승, 미확정분 TBD) |
| tradable | BUY/SELL 가능 (v1 전부 true) |
| orderUnit | 기본 거래 단위 (기본 1) |
| maxOrderQty | 한 주문 최대 수량 |
| exchangeEnabled | 물리 칩 교환 가능 여부 (v1 미사용, 확장 훅) |

> 16아이템: OFFICE_BUILDING·GLOBAL_CONSUMER_GOODS·LEISURE·RAW_MATERIALS·HOUSING·PUBLIC_SAFETY·MEDICAL·TRANSPORT·POWER·ICT_TECH·AEROSPACE·BIO_TECH·NEW_REGEN_ENERGY (기본9+고부가4) + CLIENT_PARTNERSHIP·INNOVATION·SOCIAL_CONTRIBUTION (핵심3).

**TurnDefinition**: `turnNo`(1~11), `label`(예 "2013"·"튜토리얼"), `isTutorial`, `marketDurationSec`(기본 **600 = 10분**, 원작 기준 턴 최소 10분 — 2026-07-11 피터공 확정), `activeItemIds`, `priceRuleOverrides`.

**PriceRule** (아이템×턴): 아래 §4.

**AssignmentRule**: v1은 `MATRIX`(Team-Player 번호별 담당 아이템 목록) 기본. import로 주입.

**MarketChannel**: `name`, `itemIds`(1~2), `layout`(SINGLE/DUAL), `duplicatePolicy`(허용/경고/금지).

---

### 4. 가격 엔진 (A4 핵심) — 예측 가능한 톱니 사이클 (2026-07-11 재설계)

> **정정**: 초기 `BOUNDED_RANDOM_WALK`는 폐기. 랜덤이면 예측이 불가능해 "저점 매수·고점 매도" 타이밍이 성립하지 않는다(피터공 지적 2026-07-11). 실제 MOMAK은 **관찰 가능한 주기의 톱니(sawtooth) 사이클**이다. 데이터 재확인: 엑셀에는 `min_price`(저점 baseline)·`delta_price`(스텝 상승폭)만 있고 고점·주기·이벤트는 없다 → 그 셋은 설계 결정.

**데이터 매핑** (`min_price 조정값`·`delta_price 조정값` 시트):
- `min[item][turn]` = 그 턴의 **저점(baseline)**. 턴마다 계단식 상승(인플레 체감).
- `delta[item][turn]` = **스텝당 상승폭**. 기본 아이템 10~20, 고부가(ICT·우주항공·생명공학) 14~28 → 아이템마다 오르는 속도 다름.

**SAWTOOTH 알고리즘:**

```
low   = min[turn]                       # 저점
high  = min[turn+1]                      # 고점 (= 저점 + "증가값". 마지막 턴 = min[t] + (min[t]-min[t-1]))
step  = delta[turn]                      # 한 스텝 상승폭
price(0) = low
매 가격변동(priceStepSec초마다):
  raised = price_prev + step
  price  = (raised >= high) ? low : raised   # 고점 찍으면 저점으로 급락(뚝), 아니면 상승
```

→ 저점에서 출발해 delta씩 오르다 고점 찍으면 저점으로 뚝 떨어지고 반복. 한 사이클 스텝 수 = `ceil((high-low)/step)`. 아이템마다 delta·폭이 달라 **속도·높이가 다르다** → 관찰·예측·대기·매매 성립. 턴이 오를수록 밴드 전체 상승.

**턴 시작 위상 = 아이템마다 랜덤** (2026-07-11 확정): 턴 시작 시 모든 아이템을 저점으로 리셋하지 않고, 각자 사이클 내 랜덤 지점(`low + step*k`, k∈[0, ticksPerCycle))에서 출발한다 → "다 같이 바닥" 순간 제거, 저점·고점 발생 시점이 처음부터 제각각. (주기 자체는 결정적이라 시작점만 관찰하면 이후 예측 가능.)

**튜닝 노브** (엑셀 값은 두고 배수·주기로 조정, 손맛 후 확정):
- `priceStepSec` = 가격변동시간, 몇 초마다 한 스텝 (**기본 1.5**, 2026-07-12 피터공). 0.5초 단위. 틱 엔진 = 500ms 간격이라 0.5초 해상도 지원(1.5=3틱). 타이머(secondsLeft)는 매 초 정확(2틱마다 1초 차감), 가격만 이 간격.
- `durationSec` = 총변동주기, 아이템별 기본을 **20~40초에 분산 배치**(2026-07-12 피터공. `20 + (i*13 mod 21)`로 이웃끼리 다르게). 엑셀 시드 대신 이 범위로.
- `stepMult` = 상승 속도 배수 (기본 1). `amplitudeMult` = 저점↔고점 폭 배수 (기본 1).
- `quoteValidityMs` = 750 (현장 네트워크로 조정).

**아직 안 만든 층 — 이벤트(다음 설계 대상)**: 폭락/급등, 저점 이벤트·고점 이벤트(저점에 더 사고 고점에 더 팔게). 데이터에 없음 → 빈도·폭·대상(아이템별 vs 전체)·발동방식 피터공과 결정 후 얹는다. `SCRIPTED`(예약 시나리오)·GM 수동 충격(§10)도 이 층.

- 가격은 항상 `low ≤ price ≤ high`, 양수 정수.
- Market `PAUSED`이면 스텝 정지, RESUME 시 이어감.

#### 4.1 라이브 세팅 편집 (중앙화면 오버레이) — 2026-07-12

원작 도면의 GM 리모콘 "ITEM 가격 값/변동"(init 3·4)을 **플레이 중 실시간 편집**으로 구현. 진동을 보며 손맛을 바로 튜닝하기 위함.

- **진입**: `overview.html?edit=1` → 우측 슬라이드 패널. `?edit` 없으면 순수 디스플레이(벽면 화면엔 편집 UI 안 뜸).
- **편집 입력 = 4개**(아이템별). 변동폭은 입력이 아니라 **파생값**(2026-07-12 피터공 정리 — 넷이 있으면 폭은 종속이라 입력에서 뺌):
  - `low`(저점) · `high`(고점).
  - `stepSec`(**변동시간/변동주기** = 몇 초마다 한 스텝, 아이템별. 전역→아이템별 승격).
  - `durationSec`(**총변동주기** = 한 사이클 저→고→저에 걸리는 총 시간).
  - 전역 `priceStepSec` = 전체 변동시간 **일괄 설정** + 신규/리셋 기본값.
- **파생**: 스텝수 `= max(1, round(총주기/변동시간))`, `변동폭(step) = clamp(round(밴드/스텝수), 1, 밴드폭)`. (밴드÷스텝수를 round — ceil이면 좁은 밴드에서 총주기가 언더슛하므로.) ticksPerCycle = ceil(밴드/폭). 입력 4개 중 무엇이 바뀌든 폭을 다시 계산. 밴드(저/고)·변동시간·총주기가 독립, 폭은 항상 자동. → 셋이 서로 충돌하던 재조정 규칙 자체가 사라짐(입력 자유도 = 4, 종속 1).
- **표시**: 패널·중앙화면에 계산된 변동폭을 읽기전용으로 보여줌(입력 아님).
- **반영**: 입력 즉시 서버 권위 상태 변경 → 전 화면 브로드캐스트. 클램프: `high ≥ low+1`, **변동시간 0.5초 단위 `0.5 ≤ stepSec ≤ 15`**, `durationSec ≥ stepSec`, 파생 폭은 `1 ≤ step ≤ 밴드폭`, 현재가는 `[low, high)`로 당겨넣음, 가격은 양수 정수. (틱 엔진 500ms granularity → 총주기는 스텝수×변동시간으로 반올림돼 정확히 안 떨어질 수 있음, 결과 총주기 표시. cycleSec은 소수(예 19.5)일 수 있음.)
- **범위·기본(v1)**: 밴드(low/high)는 **현재 턴 한정**(NEXT TURN 시 config에서 재계산). **변동시간·총주기는 지속**(모션 정의이므로 턴 넘겨 유지, 새 밴드에 맞춰 폭 자동 재계산). **기본값**: 변동시간 1.5초(전역), 총주기는 아이템별 20~40초 분산(엑셀 시드 대신).
- **명령**(WS, `gm`·`overview` 역할 허용): `setPlan{itemId, low?, high?, stepSec?, durationSec?}`(변경된 필드만, step 입력 없음) / `setPriceStepSec{value}`(전체 stepSec 일괄).

---

### 5. 상태기계

**Session**: `DRAFT → LOBBY → READY → IN_PROGRESS → FINISHED → ARCHIVED`
- DRAFT(설정)·LOBBY(접속)·READY(검증완료)·IN_PROGRESS(턴진행)·FINISHED(거래종료)·ARCHIVED(보관).

**Market**: `CLOSED → OPEN ↔ PAUSED → CLOSED`
- OPEN: Tick·주문 허용. PAUSED: 타이머·Tick 정지, 신규 주문 거부(잠깐 멈춤). CLOSED: 턴 거래 확정, 종합화면 종가 표시.

**턴 전환**: GM `NEXT TURN` → 이전 턴 CLOSED 검증 → 다음 턴 시작가·규칙·활성아이템 적용 → 전 화면에 turn.changed → GM이 OPEN할 때까지 주문 불가.

---

### 6. 거래 (BUY/SELL)

**Quote** (클라이언트가 받는 것):
```json
{ "sessionId":"S1", "turnNo":3, "itemId":"POWER", "price":1450,
  "priceVersion":872, "effectiveAt":"...", "validUntil":"...", "marketState":"OPEN" }
```

**주문 요청 필드**: sessionId, playerId, itemId, side(BUY/SELL), quantity, quotedPrice, priceVersion, **clientOrderId**(기기생성 유일 ID), clientSentAt.

**서버 처리 순서** (하나의 트랜잭션):
1. 인증·세션 권한 확인
2. `clientOrderId` 중복 조회 → 있으면 최초 결과 재전송(멱등)
3. Session/Turn/Market == OPEN 확인
4. 아이템 활성·**담당 권한**·수량 제한 확인
5. **Quote 버전·유효시간 확인** (§7 체결정책)
6. BUY 잔액 / SELL 재고 확인
7. Order·Ledger 기록 + 잔액·재고 변경을 한 트랜잭션 커밋
8. 개인 결과 응답 + 집계 이벤트 발행

**체결 결과**: 성공(체결가·수량·잔액·보유량) / `PRICE_EXPIRED`(재시도+최신Quote) / `INSUFFICIENT_CASH` / `INSUFFICIENT_INVENTORY` / `MARKET_NOT_OPEN` / `DUPLICATE_ORDER`(최초결과) / `RATE_LIMITED`.

**원장(Ledger)**: append-only. `entryId, playerId/teamId, assetType(CASH/ITEM), assetId, delta, balanceAfter, reason(BUY/SELL/GM_ADJUSTMENT/REVERSAL), relatedOrderId, actorId, createdAt`. 수정은 행 변경 대신 반대 방향 `REVERSAL` 추가.

---

### 7. 표시가격 체결 + 광클릭 (피터공 핵심 요구)

**체결 정책 = `STRICT_QUOTE_WITH_GRACE`** (덱스 차용):
- 요청한 priceVersion이 현재 버전이면 그 가격으로 체결.
- 현재 Tick이 바뀌었어도 `validUntil` 전에 서버가 수신하면 **과거 Quote 가격으로 체결**.
- 유효시간 지나면 `PRICE_EXPIRED` 거절 + 최신 Quote 반환.
- 네트워크 지연을 이유로 서버가 임의로 최신가에 체결하지 않는다. → **"본 가격과 다른 가격 체결" 제거.**

**광클릭·중복 방지**:
- 버튼 클릭마다 새 `clientOrderId`. 같은 클릭의 네트워크 재시도는 같은 ID 재사용.
- 서버는 같은 ID를 한 번만 처리, 이후 최초 결과 반환.
- **플레이어별 주문을 짧은 논리 큐로 직렬화** → 잔액·재고 경합 방지. 순서 = 서버 수신순.
- 클라이언트는 처리 중 시각 피드백. 버튼 완전 잠금은 설정 가능.
- Rate limit = 서버 보호 목적(부정행위 방지 아님), 정상 광클릭 수용하게 높게: soft 10 orders/sec·burst 20 → 초과 시 `RATE_LIMITED`(429 아닌 거래결과).

**상태전환 경쟁**: CLOSE와 동시 주문 = 서버 논리순, CLOSE 전 커밋된 것만 성공. PAUSE와 Tick = 세션 명령 큐 순서화.

---

### 8. 실시간 이벤트 / 동기화

- **WebSocket** 양방향 채널 기본. 연결 직후 `snapshot + latestSequenceNo` 수신.
- 이벤트에 세션 내 증가 `sequenceNo`. 클라이언트가 누락 감지 시 최신 스냅샷 재요청.
- 공용 이벤트: `session.state.changed`·`turn.changed`·`market.state.changed`·`timer.updated`·`price.tick`.
- 개인 이벤트: `order.result`·`wallet.updated`·`inventory.updated`.
- 기기 이벤트: `display.channel.changed`·`connection.degraded`.
- 단기 단절 중 거래 버튼 비활성. 재연결 후 누락 재생 또는 스냅샷 재조회. 응답 못 받은 주문은 같은 clientOrderId로 상태 조회.
- 디스플레이는 데이터가 오래되면 정상값처럼 두지 않고 **stale 명시**.

---

### 9. 화면별 명세

**9.1 Player App** (개인 폰, 세로)
- 로그인: 세션코드 + Player ID/PIN 또는 QR. 중복로그인 = 최근우선/다중금지 설정. 재접속 시 서버 최신값 복구.
- 메인: 상단 `TEAM:n / ID:n-n` + 운영자금 + (후속 `$SEND`). 담당 아이템 카드마다: 아이템명·색, 보유수량, **BUY / SELL**. 좌우 스와이프로 담당 아이템 넘김.
- **폰에는 가격을 띄우지 않는다** (2026-07-11 확정, 플레이어UI1 목업 근거): 플레이어는 방의 **마켓 채널·중앙 디스플레이(§9.2·9.3)를 올려다보며** 저점·고점을 읽고, 폰은 매매 리모컨 역할만 한다 → "거래소 현장" 물성(고개 들어 큰 화면 보기). 폰이 시세판이 되면 빅게임이 아니라 앱이 된다. (개발/단독 테스트 편의로 `?price=1`이면 폰에도 가격 표시.)
- 거래 흐름: BUY/SELL 선택 → 수량(기본 1) → 서버 결과 → 잔액·재고·체결 토스트 갱신.
- 디자인: 2013 톤(다크 + 사업군 색밴드, 액션 강조=노랑). 플레이어UI1(MAIN)·UI2(LOGIN) 목업 기준.

**9.2 Market Channel Display** (태블릿, 가로)
- 등록: Display URL → **화면 내 아이템 선택기**("＋ 아이템 선택")로 전체 16 중 **1~2개 토글 선택**(2개 초과 시 오래된 것 밀어냄) → 확인. 선택은 `?items=` URL에 반영돼 새로고침에도 유지. GM 사전 고정 배정은 후속.
- 표시 = **MARKET_MARKETSCREEN 목업 스타일**: NAME(왼쪽, 아이템 색 대형) + PRICE(오른쪽 색 박스, 흰 숫자·천단위 콤마) 가로 배치. 1~2행. 현재 턴·남은시간 상단. 거래버튼·개인정보 없음.
- 오버레이: `PAUSED`·`MARKET CLOSED`·`연결 끊김`.

> 참고: "이름 상단 대형 + 가격 초대형 숫자(빡)"는 **중앙 디스플레이(§9.3)**용 강조이지 채널이 아니다(2026-07-11 정정). 채널은 목업 비율 유지.

**9.3 Market Overview Display** (중앙 대형, 읽기전용)
- 게임명·현재턴·마켓상태·남은시간 + 전체 활성아이템 현재가 + 변동액/률 + 상승/하락/유지 시각구분.
- 팀 거래 지표(중앙디스플레이 목업): 팀별 운영자금·주식소유량·현물교환량·총주식구매량·총주식매각량. (사업완수·수익은 v1 제외 — 보드타임.)
- **디자인 = `MARKET_MARKETSCREEN_1` 스타일 전 화면 분할** (2026-07-11 확정, 플테 가독 우선): 차콜 배경 + 좌상 "Market" 타이틀/밑줄 + 우상 Turn·Time·상태 pill. 본문 = 아이템 수만큼 정사각 그리드(16→4×4)로 **뷰포트를 꽉 채워 스크롤 없음**. 각 패널 = 아이템명(아이템 색 대형 볼드 + EN) + **가격 박스**(아이템 색 배경, 흰 숫자 `clamp` 초대형·천단위 콤마) + ▲변동액 / 고점 급락 시 ▼저점 + 밝기 플래시. 원거리·룸 스케일 가독이 목적.
- 후속 레이아웃 옵션: `TICKER`/HEATMAP/FOCUS·아이템 많을 때 자동 순환.

**9.4 GM Console** → §10.

---

### 10. GM 콘솔 (도면 서버 리모콘이 원본 스펙)

**운영 대시보드**: 세션·턴·마켓 상태·남은시간 / 접속 플레이어·태블릿·디스플레이 수 + heartbeat·지연 / 전체 거래량·실패율·최근 오류 / 팀·플레이어별 현금·재고 조회.

**진행 제어**: Market `OPEN·PAUSE·RESUME·CLOSE` / 타이머 시작·정지·증감·지정 / 현재·다음 턴 선택 / 가격 Tick 정지 / 개별 아이템 가격 고정·수동변경·충격 이벤트.
- **구현(2026-07-12)**: 개별 아이템 low/high/step + 전역 priceStepSec 라이브 편집 = §4.1(중앙화면 `?edit=1` 오버레이). 충격 이벤트(spike/crash)·폰 GM 컨트롤은 다음 단계.

**플레이어 제어** (도면 리모콘 그대로):
- 자금: 개별/팀/전체 `ADD·SUBTRACT·SET`, `money to team`(선택팀 1/n 분배).
- 아이템: 개별 플레이어 `ADD·SUBTRACT·SET`.
- 담당 아이템 재배정 / 계정 잠금·로그아웃·PIN 재발급.
- (후속) `$SEND` P2P 송금 — featureFlag.

**안전장치**: 모든 조작에 대상·이전값·새값·사유·조작자·시각 기록. `SET`·대량변경은 재확인. CLOSE 확인 후 실행. 닫힌 턴 재개는 관리자권한+사유. **DB 직접수정 금지 — 운영 개입도 일반 원장 통해 반영.** 대량 지급 전 대상 수·총액 표시.

---

### 11. 게임 설정 import (B6)

- 엑셀/CSV import 우선. 템플릿 시트: `Game`·`Turns`·`Items`·`Prices`·`Assignments`·`Channels`.
- 미래에셋 원본 엑셀 → `market_config_miraeasset.json` 변환기 이미 존재(`docs/data/`). 이를 import 경로의 첫 소스로.
- 업로드는 발행 아닌 Draft 반영. 오류는 시트·행·열 단위 표시.
- **발행 규칙**: Published Version 불변, 수정은 새 버전. Session 시작 시 버전 전체 스냅샷.
- **검증(발행 차단)**: 턴 없음/중복 / 활성아이템에 가격규칙 없음 / floor>opening>ceiling 위반 / delta·tickInterval·quoteValidity 범위 밖 / 채널이 활성아이템 미포함 / 거래가능 아이템에 담당자 없음.

---

### 12. 아키텍처 — 단일 권위 서버 (2026-07-11 확정)

> 정정: 덱스의 분산 스택(ECS 다중태스크·ElastiCache·leader lease)은 **다중 세션 동시 운영/SaaS**를 위한 것이지 부하(200명)를 위한 게 아니다. 200명 규모에선 분산의 복잡성이 오히려 싱크·안정성을 위협한다. **놀공은 직접, 한 번에 한 판 운영** → 세션당 단일 권위 서버가 기본이자 목표. (배경 = [[요청.26.0711.1950-MOMAK마켓타임]] 부록 D.)

**12.1 부하 산정 (200명 기준, 여유 큼)**
- 동시 연결 = 200 플레이어 + 태블릿 ~30 + 중앙/GM ~5 ≈ **235 연결**. 웹소켓 서버 1개가 1만+ 연결 수용 → 여유.
- 가격 전파 = 16아이템 묶어 1초 1스냅샷 = **초당 ~235 메시지**(텍스트 수 KB). 무시할 수준.
- 주문 폭주(광클릭) = 최악 초당 ~2,000 주문. **인메모리 권위 상태 + 그룹커밋 비동기 저장**이면 노드 1개가 수용. (동기 fsync per-order 금지 — 게임머니라 크래시 시 마지막 체크포인트+리플레이로 복구, fail-closed 병행.)
- 결론: **양(scale)이 아니라 (a)싱크 정확성 (b)단일 이벤트 안정성 (c)현장 네트워크**가 진짜 리스크.

**12.2 기본 구조 = 세션당 단일 권위 프로세스 (수직)**
- 한 프로세스가 **가격엔진·주문·원장을 인메모리로 소유**(가격 단일 순서·플레이어별 직렬화가 자명하게 성립). 복구용으로 Postgres 등에 **비동기 그룹커밋**.
- 확장은 수직(박스 키우기). 200명은 소형 인스턴스로 충분.
- 여러 행사가 겹치면 **독립 서버 인스턴스를 N개 띄운다**(격리) — 멀티테넌트 공유 클러스터로 만들지 않는다. → 분산 SaaS 복잡성 회피.
- 정적앱(Player/Display/GM)은 S3+CloudFront(놀공 관례).

**12.3 현장 네트워크 (2026-07-11 확정)**
- **플레이어 = 각자 셀네트워크(필수).** 행사장 Wi-Fi 하나에 200대 몰리는 최대 병목 제거. 연결이 서로 독립.
- **Wi-Fi/유선 = 마켓 태블릿(~30) + 중앙/GM(~5)만.** 전용 AP 또는 유선, GM·중앙화면은 유선 우선.
- 셀 지연은 플레이어마다 다름(50~150ms, 가끔 튐) → `quoteValidityMs`를 셀 지연 덮게 튜닝(§4·§15). 셀 핸드오프 끊김은 재접속→스냅샷(§8)로 흡수.

**12.4 안정성 (단일 이벤트, 재시도 없음)**
- **예비 서버 대기**(warm standby) + **fail-closed 자동 PAUSE**로 가용성 확보(액티브-액티브 대신).
- Fail-closed 트리거: Quote 신뢰버전 못 읽음 / 원장 커밋 불가 / 서버시간 편차 초과 → 신규거래 거부 + Market 자동 PAUSE. 복구 후 GM RESUME. 장애 중 주문 소급체결 안 함. 오프라인 거래 불허.
- 행사 전 리허설: AWS endpoint 지연·셀 지연·웹소켓 지속연결 부하 테스트. GM 콘솔에 client별 RTT·heartbeat·stale 표시.

**12.5 비용 산정 (이벤트 하루)**
- 서버 1대(4vCPU/8GB, 과분) Fargate/EC2 ~$0.1~0.24/hr × 6hr = **$1~3**. DB 소형 하루 **<$1**. 웹소켓 트래픽·정적호스팅 **<$1**. → **이벤트 컴퓨트 ≈ $5~10**(예비 포함 $10~20).
- **주의: 안 쓰는 무거운 스택 상시 가동 금지.** Aurora 최소 ACU·multi-AZ·ElastiCache 상시 = 월 수십~수백 달러 낭비. → **이벤트 사이 인프라 내리고 행사 전날 scheduled 업.** 월 baseline은 dev/staging 최소분만.

**12.6 목표 상태 (분산은 언제만?)**
덱스 풀스택(ALB+ECS 다중태스크+ElastiCache+Aurora+RDS Proxy+Cognito)은 **오직 "여러 판 동시 + 셀프서비스 SaaS"로 사업을 전환할 때만** 의미. 그전까지 단일 권위 서버가 정답. 이 문서는 SaaS 전환을 1차 요구로 두지 않는다.

---

### 13. MVP 인수조건

- [ ] 서로 다른 두 게임 버전을 코드 수정 없이 생성·실행 (미래에셋 + 최소 대조본)
- [ ] 아이템 16개, 플레이어 120명, 태블릿 8대, 종합화면 1대가 **같은 가격** 표시
- [ ] OPEN/PAUSE/RESUME/CLOSE가 전 화면 **1초 이내** 반영
- [ ] 동일 Quote 승인 거래 = 표시가 == 체결가
- [ ] 같은 clientOrderId 여러 번 → 원장 **한 번만** 변경
- [ ] 잔액·재고 **음수 0건**
- [ ] 재접속 후 최신 잔액·재고·주문결과 복원
- [ ] GM 운영 개입 전부 감사 로그 확인

---

### 14. 검증 범위 (선문후코 — 역할 못박기)

**[아리공 기계 판정]**: 런타임 예외 0 / 데이터 정합(16아이템×11턴 로드) / 광클릭 중복·음수잔액 0(헤드리스 하니스) / OPEN·CLOSE 전파 지연 측정 / 재접속 스냅샷 복구.

**[피터공 사람 눈]**: 마켓 가격 진동의 손맛(진폭·속도가 "주식시장 같은가") / 플레이어 폰 BUY/SELL 반응 체감 / 마켓 티커·중앙 디스플레이 원거리 가독 / GM 콘솔 조작 흐름 / 2013 디자인 톤 계승 정도.

---

### 15. 열린 결정 (진행하며 확정)

- 마켓 채널 = 표시 전용(한 아이템 세션 단일 가격) 확정. 채널별 다른 시장은 안 함.
- Quote 유효시간 750ms → 현장 네트워크 실측 후 확정.
- 플레이어당 담당 아이템 기본 2~3개 (미래에셋 배정표로 확정).
- BUY/SELL 수량: 1개 광클릭 중심 + 빠른수량 버튼 여부 (플레이 후).
- 색체계: 2013 사업군 색 → 미래에셋 16아이템 매핑 (디자인 확정).
- **턴 타이머 만료 시 자동 CLOSE** (Phase 1 PoC 기본값): `secondsLeft`=0이면 서버가 Market을 자동 CLOSED로 전환, GM이 NEXT TURN 하기 전까지 종가 유지. 현장에선 GM 수동 CLOSE를 기본으로 두고 자동 CLOSE는 안전망으로 둘지 플레이 후 확정.

---

### 16. 구현 현황 (Phase 1 PoC — 2026-07-11)

`server/`에 단일 권위 웹소켓 서버 최소 구현. 코드↔SPEC 매핑:
- `src/config.ts` — §3 데이터모델·§6 기본값 로드 (`market_config_miraeasset.json`).
- `src/priceEngine.ts` — §4 **SAWTOOTH 사이클**(planTurn: low/high/step/ticksPerCycle · nextPrice: 결정적 톱니) + TUNING 노브(stepMult·amplitudeMult). seededRng는 향후 이벤트층용 보관.
- `src/room.ts` — §5 상태기계(CLOSED↔OPEN↔PAUSED, 턴전환) + §8 스냅샷 브로드캐스트. 타이머 매 초, 가격은 `priceStepSec`(기본 2초)마다 스텝. 스냅샷에 아이템별 low/high/step/cycleSec 동봉(디스플레이 디버그용). **자동데모**(`startAutoDemo`): DEMO 방이 조작 없이 OPEN 유지+턴 순환(손맛/플테용).
- `src/server.ts` — §12 단일 권위 프로세스: 인메모리 방 레지스트리, `?room=CODE&role=` 구독, GM 명령(open/pause/resume/close/nextTurn). DEMO 방 자동데모 기동.
- `src/room.ts` (거래) — §6 플레이어 지갑·주문: `joinPlayer`(cash 50000)·`order`(멱등 seen맵)·`execOrder`(서버 현재가 체결·음수 가드 INSUFFICIENT_CASH/INVENTORY·MARKET_NOT_OPEN)·append-only ledger·`assignedItems`(배정표). 단일 스레드=직렬화 자명.
- `src/config.ts` (배정) — `loadAssignments`: `assignments_default.json`에서 player 번호→담당 아이템.
- `public/overview.html` — §9.3 중앙 디스플레이. **MARKET_MARKETSCREEN_1 스타일 전 화면 분할**(4×4) + 디버그 오버레이(저점·고점·변동폭·주기).
- `public/channel.html` — §9.2 마켓 채널(태블릿). MARKET_MARKETSCREEN 목업 그대로 NAME+PRICE 박스, `?items=CODE,CODE`로 1~2종 초대형 + PAUSED/CLOSED 오버레이.
- `public/player.html` — §9.1 플레이어 앱. 플레이어UI2(LOGIN: MoMA·팀/ID)→UI1(MAIN: TEAM/ID·운영자금·담당 아이템 색밴드+실시간가+BUY/SELL+보유·체결 토스트). role=player·`?team&id`.
- `public/gm.html` — §10 GM 콘솔 최소판(마켓 제어). `public/index.html` = 랜딩(LAN 접속 안내).
- **네트워크**: `http.listen`이 전 인터페이스 바인딩 → 같은 WiFi 기기가 `http://<맥LAN>:8787/`로 접속(플레이어=폰, 채널=태블릿). 
- **미구현(범위대로 후속)**: 가격 이벤트층(폭락/급등·저점/고점 이벤트, §4 하단), Quote priceVersion·validUntil grace(§7, 지금은 현재가 즉시체결)·나머지 오류코드·광클릭 자동 하니스(§7), TRADE·정산(범위밖), import(§11 = Phase 2), 팀 지표·감사로그·GM 자금지급/플레이어 제어(§9.3·§10), AWS 배포(§12 = 합동).
