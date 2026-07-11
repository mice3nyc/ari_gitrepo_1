# HANDOFF — MOMAK 마켓타임 개발 인수 브리핑 (콜드 스타트용)

> 이 문서 하나로 시작할 수 있게 자족적으로 썼다. 볼트나 이전 대화 없이 읽어도 된다.
> 상세 명세는 같은 폴더의 **SPEC-market.md**(기술 명세) · **PLAN.md**(기획) · **TASKS.md**(체크리스트).
> 데이터는 `data/` 안. 화면 톤 참고는 `mockups/` 안 이미지 4장.

---

## 0. 너의 임무 (한 문단)

MOMAK은 2013년 놀공(Nolgong)이 만든 현장형 멀티플레이어 빅게임이다. 10~15명이 한 팀이 되어 주식시장처럼 **실시간으로 가격이 오르내리는 아이템을 사고팔아(BUY/SELL)** 운영자금을 불린다. 너는 이 **Market Time(마켓타임)** 부분을, **로컬에서 완전히 돌아가는 풀스택 실시간 웹앱**으로 구현한다. 서버(권위) + 4개 웹 화면 + 실시간 가격 동기화 + 안전한 거래.

**절대 원칙: 서버가 시간·가격·잔액·재고의 유일한 원장이다(server-authoritative). 플레이어가 화면에서 본 가격으로 체결된다. 광클릭에도 중복 체결·음수 잔액이 절대 없다.**

---

## 1. 범위 — 이번에 만드는 것 / 안 만드는 것

**만든다 (v1, 로컬 MVP):**
- 실시간 가격 엔진 (아래 §5 알고리즘)
- Player App: 로그인 → 담당 아이템 BUY/SELL + 보유수량·운영자금
- Market Channel Display: 태블릿용, 1~2개 아이템 실시간 가격 티커
- Market Overview Display: 중앙 대형화면, 전체 가격 + 팀 거래지표
- GM Console: 마켓 OPEN/PAUSE/RESUME/CLOSE, 타이머, 자금 지급, 턴 전환
- 광클릭 안전 하니스(자동 테스트)로 MVP 인수조건 검증

**안 만든다 (후속, 절대 v1에 넣지 마라):**
- TRADE(주식→물리 칩 교환)·교환소·교환원
- 물리 보드·사업칩 배치·사업 완수·매출 정산(distribute)
- 회고·투표·랭킹 그래프
- 신사업·VALUE UP·WARNING 이벤트
- **AWS 배포** (별도 단계. 로컬까지만. §8 참조)

> 데이터 모델엔 `exchangeEnabled` 같은 확장 훅만 남겨두고 기능은 만들지 마라.

---

## 2. 스택 · 레포 구조

- **백엔드(신설)**: `momak2026-back` — Node.js + TypeScript + 웹소켓(`ws` 또는 동급). 단일 권위 프로세스가 가격엔진·주문·원장을 **인메모리로 소유**하고, 복구용으로 비동기 저장(로컬은 SQLite/파일이면 충분). *분산·Redis·다중노드 쓰지 마라 — 단일 프로세스가 옳다(이유 SPEC §12).*
- **프런트(기존 or 신설)**: `momak2026-front` — React + TypeScript + Vite. (있으면 그걸 쓰고, 없으면 새로 scaffold.) 화면 4종을 라우트로: `/player` `/display` `/overview` `/gm`.
- **연결**: 프런트가 `VITE_WS_URL`(예 `ws://localhost:8787`)로 서버에 붙는다.
- **모노레포 or 두 폴더**: 편한 쪽. 로컬에서 `npm run dev`(front)와 서버 프로세스를 각각 띄워 붙이면 된다.

---

## 3. 이 패키지 안의 파일

| 파일 | 무엇 |
|---|---|
| `HANDOFF.md` | 이 문서 |
| `SPEC-market.md` | 기술 명세 15절 — **개발 중 계속 참조.** 데이터모델·가격엔진·상태기계·주문·광클릭·오류코드·인수조건 |
| `PLAN.md` | 기획 배경·범위·결정 |
| `TASKS.md` | Phase 0~5 체크리스트 |
| `data/market_config_miraeasset.json` | **게임 설정 데이터.** 16아이템 × 11턴, 각 아이템 code·ko·en·category·color·턴별 min(바닥가)·delta(틱 진폭). 서버가 이걸 로드한다 |
| `data/assignments_default.json` | 플레이어↔담당 아이템 기본 배정표(라운드로빈, **교체 대상 placeholder**) |
| `mockups/*.png` | 화면 디자인 톤 참고 4장(§7) |

---

## 4. 게임 설정 데이터 읽는 법

`market_config_miraeasset.json` 구조:
```json
{ "edition":"miraeasset", "turns":11,
  "items":[
    { "code":"OFFICE_BUILDING", "ko":"오피스 빌딩", "en":"OFFICE BUILDING",
      "category":"basic", "color":"#5B8FF9", "initialPrice":1050,
      "prices":[ {"turn":1,"min":1050,"delta":10}, {"turn":2,"min":1103,"delta":11}, ... ] }
    ... 16개
  ] }
```
- `min[turn]` = 그 턴의 **바닥 가격**. `delta[turn]` = 틱당 **진폭**.
- category: `core`(핵심역량 3) / `basic`(기본투자 9) / `highvalue`(고부가 4).
- 11턴 = 1턴(튜토리얼) + 2~11(진행). turn=1 값도 있으니 그대로 씀.

---

## 5. 가격 엔진 — 정확히 이렇게 (핵심)

각 아이템·각 턴마다 `BOUNDED_RANDOM_WALK` (기본, 튜닝 대상):

```
턴 t, 아이템 i:
  floor    = min[t]
  ceiling  = min[t+1]           # 마지막 턴: min[t] + (min[t]-min[t-1])
  opening  = min[t]             # 턴 시작 = 바닥에서 출발
  deltaMax = delta[t]
  ticksPerMarket = marketDurationSec * 1000 / tickIntervalMs
  driftPerTick   = (ceiling - floor) / ticksPerMarket   # 우상향 추세

매 tick(기본 tickIntervalMs=1000):
  dir   = (+1 확률 0.55, -1 확률 0.45)
  step  = driftPerTick + uniform(-deltaMax, +deltaMax) * dir
  price = clamp(price_prev + step, floor, ceiling)   # 항상 양수 정수
  priceVersion += 1
```
→ 5분 마켓 동안 바닥에서 진동하며 다음 바닥 쪽으로 우상향. 턴 오를수록 계단식 상승(인플레 체감). **가격은 세션 전체에서 아이템당 하나**(채널마다 다르지 않다). PAUSE면 tick 정지, RESUME이면 이어서.

---

## 6. 열린 결정 — 이 기본값으로 진행하라 (물어보지 말고)

원래 "플레이 후 확정"인 것들. v1은 아래 기본값 못박고 간다:
- `tickIntervalMs` = 1000
- `quoteValidityMs` = 750 (본 가격 인정 시간)
- `orderUnit` = 1, 수량 입력 = 1개 광클릭 중심(빠른수량 버튼은 나중)
- `marketDurationSec` = 300 (턴당 5분)
- 개인 시작 운영자금 = 50000 (`money to all`로 GM이 지급)
- 플레이어당 담당 아이템 = 2개 (`assignments_default.json`)
- 팀 수·팀 크기 = 로컬 테스트는 2팀 × (5~15명) 자유
- 색 = config의 `color` 필드(기본 팔레트, 교체 가능)
- 중복 로그인 = "최근 로그인 우선"

---

## 7. 화면 디자인 톤 (`mockups/`)

2013 원본 톤을 계승한다. 목업 4장:
- `toray-28.png` — **Player App**. 다크 배경, 상단 TEAM/ID + 운영자금, 아이템별 색 헤더 + BUY/SELL 버튼, 보유수량.
- `MARKET_MARKETSCREEN_1.png`·`_2.png` — **Market Channel Display**. NAME(아이템색) + PRICE(아주 큰 숫자, 천단위 콤마, 색 박스). 상승/하락을 색으로.
- `중앙디스플레이.jpg` — **Overview Display**. 좌측 팀 지표(운영자금·주식소유량·현물교환량·구매/매각량), 우측 아이템 목록.

핵심: **다크 배경 + 채도 높은 아이템 색 + 가격 숫자 원거리 가독(아주 크게) + 액션 강조는 노랑.** 픽셀 단위 복제가 아니라 톤·위계 계승.

---

## 8. 로컬에서 돌리고 검증하는 법 (이게 완료 기준)

"로컬"=네 개발 머신에서 서버를 띄우고 브라우저로 붙는 것. AWS 아님.

1. 서버 실행(예 `npm run dev` → `ws://localhost:8787`), 프런트 실행(`npm run dev` → `localhost:5173`).
2. **브라우저 창 여러 개**로 여러 플레이어·디스플레이·GM을 동시에 띄운다(같은 머신 OK).
3. GM 창에서 마켓 OPEN → 모든 창에서 **같은 가격이 실시간으로 같이 움직이는지** 확인.
4. 플레이어 창에서 BUY/SELL → 본 가격으로 체결되고 잔액·보유량 갱신 확인.
5. **광클릭 하니스(자동)**: 한 세션에 가상 플레이어 120명을 붙여 동시 BUY / 초당 20회 burst / 같은 clientOrderId 10회 재전송 → **중복 체결 0, 음수 잔액·재고 0** 이면 통과.

**로컬 MVP 완료(Definition of Done):**
- [ ] 16아이템×11턴 config 로드, 가격이 §5대로 진동
- [ ] 여러 창이 같은 가격을 1초 내 공유(OPEN/PAUSE/CLOSE 즉시 반영)
- [ ] 표시가 == 체결가 (STRICT_QUOTE_WITH_GRACE: SPEC §7)
- [ ] 같은 clientOrderId 여러 번 → 원장 1회만
- [ ] 잔액·재고 음수 0
- [ ] 재접속 시 최신 상태 복구
- [ ] GM: OPEN/PAUSE/RESUME/CLOSE·타이머·자금지급(개인/전체/팀 1n)·턴전환 동작
- [ ] 4개 화면이 목업 톤으로 렌더

여기까지 되면 인계 완료. **AWS 배포는 절대 혼자 진행하지 마라** — 계정·자격증명·비용은 사람(놀공) 결정이다. 로컬 검증 후 별도 단계.

---

## 9. 반드시 지킬 것 (실패 방지)
- 가격·잔액·재고를 클라이언트가 계산하지 마라. **전부 서버 권위.**
- 주문은 반드시 마지막 Quote의 `priceVersion`+`price`를 실어 보낸다. 서버가 유효시간으로 판정(SPEC §6·§7).
- 플레이어별 주문을 **직렬화 큐**로 처리해 경합 방지. 원장은 **append-only**.
- 상태(SPEC §5 상태기계)·오류코드(SPEC §6·§11)를 그대로 따른다.
- 막히면 추측 대신 SPEC 해당 절을 먼저 본다. SPEC에도 없으면 §6 기본값으로 가고 `OPEN_QUESTIONS.md`에 적어 사람에게 넘긴다.

행운을 빈다. 이 게임은 14년간 만 명 넘게 플레이한 검증된 구조다 — 발명이 아니라 **정확한 재건**이 목표다.
