---
tags:
  - 개발
  - momak2026
  - TASKS
created: 2026-07-11
author: 아리공
---

## TASKS — MOMAK 마켓타임 v1 (Live 체크리스트)

> 상위 = [[PLAN]] · 명세 = [[SPEC-market]]. 에이전트는 이 노트 + SPEC만으로 작업 가능해야 한다.
> 완료 즉시 체크. 빌드 완료 시 하단 빌드 기록에 바이트·해시·날짜 append.

### Phase 0 — 기획·명세 (이번 세션)
- [x] 자료 전수 탐구 (엑셀·이미지·PDF·docx) — [[요청.26.0711.1950-MOMAK마켓타임]]
- [x] 결정 A1~A4 + B5~B8 확정
- [x] 덱스 codex_spec 검토
- [x] 미래에셋 데이터 추출 → `docs/data/market_config_miraeasset.json` (16아이템×11턴 min/delta)
- [x] PLAN·SPEC-market·TASKS 작성
- [x] 스케일·안정성·인프라 판단 → SPEC §12 단일 권위 서버로 정정 (200명 부하·셀네트워크·비용)
- [x] config에 code·color 추가 + assignments_default.json(라운드로빈 placeholder) 생성
- [x] HANDOFF.md(콜드 스타트 브리핑) 작성 + 다운로드 인수 패키지 번들(`~/Downloads/momak2026_handoff_260711/`)
- [ ] SPEC-market 피터공 리뷰 (가격 알고리즘·범위 확인)

### Phase 1 — 인프라 PoC (피터공+아리공 합동)
- [x] `momak2026-back` repo 골격 (최소 웹소켓 서버) — `server/` (Node24+TS+ws, tsx 실행, 빌드 불필요)
- [x] 방(세션) 생성 + 멀티 브라우저 접속 + 실시간 상태 브로드캐스트 PoC — DEMO 방 자동생성 + `?room=CODE`로 방별 격리, 연결 즉시 스냅샷 + 매 틱 브로드캐스트
- [ ] 놀공 AWS 최소 배포 경로 확인 (첫 합동 과제) — 피터공과 합동, 로컬 검증 후 별도 단계
- [x] 가격 Tick 엔진 골격 (BOUNDED_RANDOM_WALK, config JSON 로드) — `priceEngine.ts` SPEC §4 그대로, config 16아이템×11턴 로드, floor..ceiling clamp 양수정수
- [x] **검증**: 멀티 클라이언트 동기화 하니스 `verify.mjs` PASS (2 디스플레이 16/16 가격 동일 · 진동 · 양수정수) + 실브라우저 2탭 OPEN→가격 동시 진동 스크린샷 확인

### Phase 2 — 데이터·설정
- [ ] GameDefinition/Version/Session 모델 + 원장(Ledger) 스키마
- [ ] `market_config_miraeasset.json` → 서버 로드 + 검증
- [ ] 엑셀/CSV import 경로 (템플릿 6시트) — v1은 JSON 우선, import는 후속 가능
- [ ] AssignmentRule(MATRIX) — 미래에셋 팀·플레이어 배정표 확인·주입

### Phase 3 — 거래 코어
- [~] Quote — 현재는 서버 현재가 체결(표시가 즉시). priceVersion·validUntil grace는 후속(현장 지연 실측 후)
- [x] 주문 API (BUY/SELL) — `room.order`/`execOrder`, 서버 현재가 체결
- [x] clientOrderId 멱등 (`seen` 맵, 재전송 시 최초 결과 반환) — 단일 스레드라 직렬화 자명
- [x] append-only 원장 + 잔액/재고 (음수 가드 — INSUFFICIENT_CASH/INVENTORY)
- [~] 오류코드 일부 (MARKET_NOT_OPEN·INSUFFICIENT_CASH·INSUFFICIENT_INVENTORY·BAD_ITEM). 나머지(§6·11)는 후속
- [ ] 광클릭 하니스: 120명 동시 BUY / 20회/초 burst / 중복 ID 10회 → 중복·음수 0 검증(자동 하니스는 후속, 단건 멱등·음수 가드는 검증됨)

### Phase 4 — 화면 (프런트)
- [x] Player App: 로그인(MoMA·팀/ID) + 담당 아이템 BUY/SELL + 보유수량 + 실시간 가격 + 체결 토스트 (`public/player.html`, 플레이어UI1·2 톤)
- [x] Market Channel Display: 1~2 아이템 초대형 (`public/channel.html`, MARKET_MARKETSCREEN 톤) + PAUSED/CLOSED 오버레이 + `?items=` 지정
- [x] Market Overview Display: 전체 16 가격 전 화면 분할 (`public/overview.html`) — 팀 거래지표는 후속
- [x] GM Console: 마켓 제어(OPEN/PAUSE/RESUME/CLOSE/NEXT TURN) (`public/gm.html`) — 자금 지급·대시보드는 후속
- [ ] LabelLayer dev 이름표 이식 (Vite 신규 관례) — 현재는 정적 html라 보류

### Phase 5 — 통합·튜닝
- [ ] 미래에셋 데이터로 실플레이 리허설 (소규모 → 확대)
- [ ] 가격 진동 손맛 튜닝 (진폭·드리프트·틱주기) → SPEC §4 갱신
- [ ] MVP 인수조건 8항목 통과 (SPEC §13)
- [ ] 피터공 확인 (SPEC §14 사람 눈 항목)

### 완료 조건 (v1)
120명 규모 세션에서 플레이어가 폰으로 실시간 진동하는 가격을 보고 BUY/SELL, 태블릿 티커·중앙 디스플레이가 같은 가격을 1초 내 공유, GM이 마켓을 열고닫고 자금을 지급하며 턴을 진행 — 표시가 체결·광클릭 안전·음수 0.

---

### 빌드 기록
- **2026-07-11 · Phase 1 PoC 착수·완료(로컬)** — `server/` 신설. 파일: `src/{config,priceEngine,room,server}.ts` + `public/{index,overview,gm}.html` + `verify.mjs`. Node24+ws+tsx, `npx tsc --noEmit` 통과(런타임 예외 0). 검증: `node verify.mjs` PASS(멀티 클라 16/16 동일·진동·양수정수) + 실브라우저 중앙디스플레이 2탭 OPEN→16아이템 동시 진동·타이머 카운트다운·GM OPEN/CLOSE 왕복 확인.
- **2026-07-11 · 같은 세션 대폭 확장(피터공 라이브 피드백 루프)** — 커밋 예정. 주요 변경:
  - **가격모델 재설계**: 랜덤워크 → 예측 가능한 톱니 사이클(저점→delta 상승→고점→저점 급락). 아이템별 속도·폭, 턴 시작 랜덤 위상. 튜닝 노브(priceStepSec·stepMult·amplitudeMult). 턴 5분→**10분**(원작 기준).
  - **거래 엔진**(Phase 3 코어): `room` 플레이어 지갑·`order`/`execOrder`(서버 현재가 체결·멱등 clientOrderId·음수 가드 INSUFFICIENT_CASH/INVENTORY·MARKET_NOT_OPEN)·append-only ledger. `config.loadAssignments`(배정표). 트레이드 테스트 스크립트로 왕복·멱등·거절 검증 PASS.
  - **화면 4종 완성**: `overview`(전 화면 16, 이름·숫자 대형) · `channel`(태블릿, 목업 스타일 + 아이템 선택기 1~2개) · `player`(로그인+담당 BUY/SELL, 가격 숨김·보유 대형·사파리 줌 방지) · `gm`.
  - **네트워크**: LAN 접속 안내(`http://<맥IP>:8787`), DEMO 방 자동데모.
  - 검증: 실브라우저로 4화면 전부 렌더·매수 체결(50000→변동·보유 증가·토스트) 확인. `tsc` 통과.
  - 미착수: 가격 이벤트층, Quote grace·광클릭 하니스, 팀 지표·GM 자금지급, AWS 배포(합동).
