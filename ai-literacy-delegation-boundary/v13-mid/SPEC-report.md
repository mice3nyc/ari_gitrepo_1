# SPEC — 리포트 트랙 (11-report.js)

> 2026-06-12 신설. PLAN-report.md의 기술 명세. 라운드 착수 시 해당 절을 먼저 확정하고 코드를 쓴다 (선문후코).
> 현재 리포트 코드 지도: showReport(회기 리포트) / showFinalReport(학기 종합) / _renderGrowthReport(§18 통합 블록) / extractReportData(Phase 2 서버 페이로드)

## §1. 현재 상태 진단 (6/12 기준)

- 종합 리포트 상단 4박스: 총점 / Lv / **판단하는 힘 ±값** / **아는것의 힘 ±값** — ± 개념은 6/11 HUD 대공사에서 폐지됨 (선택/능력 0시작 원 미터, 표시만·내부 로직 불변)
- 학습자 유형: getCompetencyType(d,k) → pp/pn/np/nn/mid 4분면 (DECISIONS §10.13) — 같은 ± 전제
- _renderGrowthReport에 별도의 **선택 기반 패턴 5종**(selfStart/aiHeavy/reviewWeak/reviewStrong/recoveryNeeded)이 이미 있음 — 새 모델과 정합
- legacy competencyCards가 _reportAllCards·_reportCardsByScenario·extractReportData에 잔존 (deprecated)
- scenarioHistory 기록 필드: scenarioId, tier1, tier2, review, leaf, finalScore, grade, item, dlgDelta/knlDelta/dlgTotal/knlTotal
- trackEvent 로그: localStorage(CONFIG.eventLogKey)에 상태 스냅샷 포함 전체 적재 — 리포트 미사용, Phase 2 재료로 보존
- 할인(쿠폰) 사용: _calculateCardEnergyDiscount가 details 배열까지 계산하나 **저장 안 함**

## §2. R1 — 옛 모델 정리 [6/12 1차 게이트 확정]

### 2a. 종합 리포트 상단 4박스
- 유지: 학기 총점, 최종 레벨
- 교체: 판단하는 힘/아는것의 힘 ± 숫자 → **HUD와 동일한 선택/능력 원 미터 표현 (6/12 확정)**. 매핑은 setCircleMeter(§4g v8)와 동일: filled=clamp(raw,0,7), 0개 시작·마이너스 없음. 라벨도 HUD와 같이 "선택"/"능력" (stat_labels 갱신)
  - ⚠️ 정정 기록: 초안의 "기본 3 채움"은 6/11 오전 임시안. §4g v8에서 0시작으로 닫혔음 — R1 1차 구현이 이 낡은 문구로 3+값 매핑을 했다가 메인 검증에서 교정 (6/12)
- effectiveCompetency ± 표기·mint/pink 색 분기 제거

### 2b. 학습자 유형
- **compType 4분면 폐지, _renderGrowthReport의 선택 패턴 5종으로 통일 (6/12 확정).** 패턴 라벨·본문은 texts.yaml(growthReport.patterns) 기존 키 활용, 노출 위치는 §18 박스 1곳으로 일원화
- _reportNarrative의 (1) 4유형 블록 제거, (2) 카드 누적·(3) tier1 분포는 유지
- getCompetencyType·resultTextsByType은 코드에서 호출 제거 (데이터 키는 보존 — 되돌리기 가능)

### 2c. 등급 산정 한 줄
- 종합·회기 리포트의 등급 표시 옆에 1문장: 등급은 비교 서열이 아니라 "이 경로의 trade-off 결과"라는 정의. 문구는 texts.yaml report.grade_note 신설 + ui_texts.csv 동기
- R4(영수증) 전까지의 임시 다리 — 영수증이 들어오면 문구 재검토

### 2d. 회기 리포트(showReport)
- 위임 선택력/지식 ± 박스 2개 제거 → 점수·등급 + 획득 카드 표시로 단순화
- "너의 경로" 줄 유지

### 2e. legacy 정리
- _reportAllCards·_reportCardsByScenario·extractReportData에서 competencyCards(track:'legacy') 분기 제거
- 기존 세이브에 legacy 카드가 있어도 무시될 뿐 깨지지 않음을 헤드리스로 확인

## §3. R2 — 기록 보강 (화면 무변) [6/12 확정]

### 3a. 할인 사용 기록 — consumeStage 단일 후킹
모든 자원 소비가 consumeStage(04-resources)를 지나고, cost 객체에 `_discount` 메타(rawTime/rawEnergy/cardDiscount/cardDetails/dlgEffect/knlEffect)가 이미 실려 있다. consumeStage 진입부(0비용 early return보다 앞 — 전액 할인도 영수증 대상)에서 `gameState._scDiscounts[]`에 적재:
```
{stage, rawTime, rawEnergy, time, energy, cardDiscount, cardDetails(≤4), dlgEffect, knlEffect}
```
- 리셋: startScenario·replayScenario의 상태 초기화 블록에서 `_scDiscounts=[]`
- 시나리오 완료 시 history push에 `discounts:(gameState._scDiscounts||[]).slice()` 동봉

### 3b. 재도전 — 확인 결과: history는 덮어쓰기(splice 후 재기록)
- `gameState.replay[scid]`에 {played, improved, bestScore, bestGrade, resourceSnapshot}이 이미 보존됨 (startScenario 생성, 완료 시 갱신) → R6 재료 절반은 존재
- 추가: replayScenario [1]에서 splice 직전, `replay[scid].firstAttempt={score,grade}` (최초 1회만) + `replay[scid].attempts` 카운트
- 곁가지 가드: replayScenario 끝의 `replay[scid].resourceSnapshot=` 직전에 replay[scid] 존재 보장 (stale 세이브 TypeError 방지)
- 곁가지 수정: `_couponSelections` 리셋이 startScenario에만 있고 replayScenario에 없음 → 재도전 시 이전 판 쿠폰 선택이 모달 없이 자동 적용되던 것 교정 (리셋 추가)

### 3c. 카드 획득 맥락
pilotAwardCards에 choiceLabel 파라미터 추가 (_pilotChoiceLabel을 호출부에서 1회 계산해 전달) → 인벤토리 엔트리에 `choiceLabel` 필드. 컷6 일괄 지급(03-engine)은 leaf가 이미 맥락이라 무변

### 3d. 호환 가드
- 새 필드 전부 optional — 부재 시 안전 폴백 (기존 진행 중 세이브 깨지지 않게). 헤드리스로 신규 필드 적재·firstAttempt 보존 확인

## §4. R3 — 위임 지도 [착수 시 작성]

골격만: 5행(시나리오) × 경로 시각화. tier1(A/B/C)을 가로 위치로, review 깊이(R1/R2/R3)를 표식으로. 인쇄(print CSS) 포함. 상세는 R3 착수 시 이 절에서 확정.

## §5. R4~R7 [각 라운드 착수 시 작성]

- R4 영수증: §3a discounts + 미획득 카드 → "아낀 X vs 못 기른 Y" 한 줄 템플릿
- R5 가지 않은 길: finals 결과 문장만, 점수·등급 비공개 (6/12 확정). 노출 UI 수위는 게이트 질문
- R6 재도전 서사: firstAttempt → 현재 grade 변화 표시
- R7 교실 한 장: print 전용 블록 + 빈칸 2줄. 문구 다연샘 합의 후
