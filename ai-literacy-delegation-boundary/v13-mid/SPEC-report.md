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

## §4. R3 — 위임 지도 "나의 위임 항로" [6/12 2차 게이트 확정 — 항로형]

### 4a. 형태 (피터공 확정)
시나리오를 세로로 내려가며 직접↔위임 위치를 꺾은선으로 잇는 **항로형**. 기울기가 곧 패턴 — 두 학생이 맞대면 선 모양 차이가 바로 보인다.

### 4b. 데이터 매핑
- 행 = scenarioHistory 순서 (5행 미만이면 있는 만큼만, 0행이면 섹션 생략)
- 가로 3칸 = tier1: A=직접 / B=부분 위임 / C=전체 위임 (패턴 판정 코드와 동일 해석)
- 노드 = 검토 깊이: R1=○(빈 원) / R2=◎(겹 원) / R3=◉(찬 원). hist.review 기준
- 노드 사이 꺾은선 = 항로 (점선, ink)

### 4c. 구현
- 11-report.js `_renderDelegationMap(hist)` — 인라인 SVG 1개 (인쇄 포함, no-print 아님). 색은 style 속성의 CSS 변수(var(--ink) 등)
- 배치: showFinalReport 상단 4박스·grade_note 아래, 카드 섹션 위 (지도가 패턴 서사의 진입)
- 텍스트: texts.yaml report.map {title, col_direct, col_partial, col_full, legend} + ui_texts.csv 동기
- 검증: 헤드리스에서 SVG 출현·노드 5개·polyline 존재 / R1·R2 회귀

### 4d. R3.5 — 항로 v2: 마이크로 항로 + 만화 타임라인 [6/12 3차 게이트 확정: 매핑 ①깊이 + 배치 ㉮대표컷+펼치기]

#### 4d-1. 데이터 확인 결과 (6/12, 시안 설계의 전제)
- **tier2 번호(1·2·3)는 위임 깊이 순서가 아니다.** 시나리오 5종 tier2 라벨 전수 확인:
  - groupwork C1~C3은 AI 위임 축이 아님 (회의 생략 / 친구에게 맡김 / 모양 먼저) — career C도 동일 (남이 좋다는 길)
  - selfintro C3 "AI 글을 받은 뒤 내 글로 다시 쓴다"는 오히려 직접 쪽으로 **돌아옴**
  - tier2 옵션의 top-level delegation/knowledge ± 필드는 옛 모델 효과값 (career·studyplan에만 잔존) — 위치 매핑 근거 불가
- 따라서 "tier1 칸 안에서 번호만큼 오프셋"(초안 후보)은 **가짜 기울기** 위험 → 매핑 후보를 아래 둘로 재정의

#### 4d-2. 마이크로 항로 — 세 비트 구조
- 시나리오 행(rowH 확대)을 세 비트로: 1차 선택 → 2차 선택 → 검토. 세로로 미세 하강(행 안 3단), 가로는 위임 스펙트럼
- 1차 비트: 기존과 동일 — tier1 칸(A직접/B부분/C전체) 위치, 작은 노드
- 검토 비트: 기존 검토 깊이 노드(○◎◉) 유지 — 행의 마지막 점이자 매크로 항로의 연결점 (시나리오 간 폴리라인은 검토 비트끼리 잇는다)
- 2차 비트 가로 위치 = **3차 게이트 결정**:
  - **후보 ①depth — 수기 깊이 매핑 (추천)**: tier2 45개에 깊이 보정값 한 개씩(`microOffset`: -1/0/+1, tier1 칸 기준 직접쪽/유지/위임쪽). 아리공이 라벨 기준 초안 작성 → 피터공·다연샘 검수 가능한 데이터(yaml)로 외부화. 돌아옴(selfintro C3 등)이 정직하게 보임. 비용: 45개 판정 한 벌
  - **후보 ②flat — 가로 고정**: 2차 비트는 1차와 같은 가로 위치, 라벨 텍스트만 동행. 기울기는 시나리오 간(매크로)에서만 의미. 비용 0, 행 안 기울기 정보 없음
- 행 헤더: 시나리오 제목 + 등급·점수 흡수 (만화 섹션 헤더가 하던 역할)

#### 4d-3. 만화 타임라인 — 컷 배치 (3차 게이트 결정)
- 공통: 하단 report-comic 독립 섹션 폐지. getCutImageFor·getCutCaptionFor 재사용. reportReflection(핵심 돌아보기)은 행 하단으로 이동
- **후보 ㉮rep — 대표 컷 + 클릭 확장**: 항로 행 우측에 대표 컷 2장(c2=1차 장면, c5=검토 장면). 클릭하면 행 아래로 5컷 전체 펼침. 화면 가독 최선. **인쇄는 펼침 상태 고정**(print CSS에서 전체 컷 강제 표시)
- **후보 ㉯two — 좌항로·우만화 2단**: 좌 40% 항로 SVG, 우 60% 시나리오별 5컷 한 줄(소형). 행 높이를 컷 행과 정렬. 모든 컷 상시 노출, 컷이 작아짐(~90px)
- 캡션: 소형 컷에서는 생략, 확장/인쇄에서만 표시 (가독)

#### 4d-4. 시안 라운드 산출물
- `mockups/r35-sian.html` — 빌드 밖 독립 페이지. 샘플 history 5행(변화 있는 경로)로 매핑 ①② × 배치 ㉮㉯ 비교 렌더. 실제 컷 webp 사용(`../../images/`)
- 커밋·푸시 → 라이브 링크로 피터공 "툭보고 탁답" → 3차 게이트 확정 후 본 구현(11-report.js)
- 본 구현 시: 인쇄 길이·SVG 폭 재계산, R1~R3 헤드리스 회귀

### 4e. R3.6 — 항로 비용 열 + AI 표시 [피터공 6/12 제안 "실제 선택한 항목의 시간/에너지 비용을 열 맞춰 + AI 있는지 없는지 표시"]

의도: 항로는 방향(직접↔위임)만 보여준다. 선택마다 실제 지불한 시간·에너지를 **고정 열**로 세워 다섯 행을 세로로 훑으면 "위임이 쌌는지, 직접이 비쌌는지"가 보인다. 거기에 그 선택에 AI가 개입했는지를 표시하면 "위임했지만 AI가 아니라 친구였다" 같은 결이 드러난다.

#### 4e-1. 데이터
- **비용**: history 행의 `discounts[]` (§3a R2). stage `tier1`/`tier2`/`review` 엔트리의 `time`/`energy` = 실제 지불값(할인 반영 후). 같은 stage 중복 엔트리는 합산. R2 이전 옛 세이브는 discounts 부재 → 비용 열 생략(빈 칸), 항로는 그대로
- **AI 개입**: 기존 필드로 도출 불가(전체 위임 갈래에 사람-위임·회피 섞임, §4d-1과 같은 이유) → `data/ai_flags.yaml` 신설. 시나리오별 tier1 3개(A/B/C) + tier2 9개(A1~C3) = 60항목 수기 태깅, 라벨 주석으로 검수 가능(micro_offsets 패턴). 판정 기준: **선택지 라벨의 행동에 AI가 도구·주체로 명시 또는 함의되는가** (검색·유튜브·친구·학원·작년 시험지는 false)
- build.py: `AI_FLAGS` 주입 + 시나리오·id 전수 일치 검증 + 값 boolean 검증 (micro_offsets 검증과 동형)

#### 4e-2. 렌더 — SVG 안 고정 열 (열 맞춤 보장)
- viewBox 확장: 560 → **760** (행·헤더 SVG 동일). 0~560 항로 영역 무변, 565에 구분 점선, **575~755 비용 열 영역**
- 각 비트 y(18%/52%/84%)에 맞춰: `시간 n · 에너지 n` 텍스트(x=580 고정, 10.5px, ink-soft) — 1차·2차·검토 세 줄. 고정 x라 행 간 세로 열 정렬 자동
- **AI 칩**: x=705 고정, 1차·2차 비트만(검토는 비대상). AI 개입 true면 잉크색 칠한 작은 라운드 사각 + 흰 글자 `AI`. false면 표시 없음(없음=직접·사람·회피)
- 헤더 SVG: 비용 열 위에 `비용 (시간·에너지)` + AI 자리 위에 `AI` 라벨
- 2차 라벨(t2label) 우측 anchor 한계 `_RMAP_W-180` 기준은 항로 영역(560) 유지 — 비용 열 침범 금지
- `.rmap-route` 폭 58% → **74%** (항로 렌더 폭 보존: 0.74×560/760≈0.55). 모바일(≤760px) 100% 무변
- 인쇄: SVG 안이라 자동 포함, 별도 print CSS 불요
- texts.yaml `report.map`에 `col_cost`(비용 (시간·에너지))·`col_ai`(AI)·`cost_time`(시간)·`cost_energy`(에너지) 신설 + legend에 AI 칩 설명 한 구 추가 → ui_texts.csv 동기

### 4f. R3.7 — 항로 레이아웃 조정 [피터공 6/12 라이브 확인 후 6건]

1. **시나리오 제목 = 좌측 블록**: 상단 가로 바(rmap-row-header) 폐지 → 행 좌측에 행 전체 높이 블록(`.rmap-title`, flex 0 0 110px, stretch). 제목 14px 볼드 + 점수·등급 12.5px 아래 줄. 헤더 행에는 같은 폭 스페이서로 열 정렬 유지. 모바일(≤760px)은 가로 바로 폴백
2. **글씨 확대·진하게**: 열 헤더 13.5px ink(회색 폐지) / 2차 라벨 10.5→12px ink / 비용 숫자 **18px 볼드 ink** (비교가 목적이라 가장 큼) / 비트 점 r5→6
3. **위임 열 간격 축소**: `_RMAP_COLX` A:100/B:280/C:460 → **A:70/B:185/C:300** (간격 180→115), `_RMAP_OFFPX` 70→50. 절약한 폭을 비용 열에 양보
4. **시간·에너지 독립 열**: "시간 n · 에너지 n" 한 줄 텍스트 폐지 → 시간 x=430·에너지 x=500 각각 **숫자만** 고정 열(anchor middle). 열 이름(시간/에너지/AI)은 헤더 SVG로 이동. `col_cost` 키 폐기
5. **행 간 항로 연결선 제거**: entry/exit 경계 통과선 폐지 (시나리오 간 선택은 서로 영향 없음 — 메타포 과잉). 행 안 세 비트 폴리라인·5컷 보기는 유지
6. **검토 원 직관화**: ○(R1 빈 원)·◐(R2 왼쪽 반 찬 원)·●(R3 꽉 찬 원), r=11. 기존 ◎(가운데 점)·◉ 폐지. legend 동기
- viewBox 760→**620** (내용 폭 축소로 동일 컨테이너에서 렌더 스케일 ↑ = 글씨 실질 확대 효과). `.rmap-route` 74% 유지

### 4g. R3.8 — 항로 정보 보강 + 컬러코딩 [피터공 6/12 12건]

1. 헤더 `직접` → **`내가 직접`** (col_direct)
2. **선택 텍스트 전 비트 표시**: 1차 라벨(tier1)·2차 라벨(tier2)·검토 라벨(reviews[].label, 없으면 "검토 n회") — 각 비트 옆 12px ink
3. **CMY 컬러코딩**: 내가 직접=Cyan(#00a3d4) / 부분 위임=Magenta(#e6007e) / 전체 위임=Yellow(#eab000, 가독 톤). 헤더 라벨 + 열 점선 + 선택 원에 적용
4. **선택 원 = 위임 정도**: 내가 직접=꽉 찬 원 / 부분=왼쪽 반 찬 원 / 전체=빈 원, **전부 r9 동일 크기**, 갈래 색. 검토 원도 r9 통일(ink, 채움=검토 횟수 — §4f-6 유지). 문법 통일: "내 손이 많이 갈수록 채워진다"
5. **구분선**: 시나리오 행 사이 가로 실선(.rmap-row border-top) + 비용·점수·AI 열 사이 세로 점선(SVG)
6. **제목 = 번호+제목만**: 박스·점수 제거, 15px 볼드, 줄바꿈 없음(nowrap), 폭 150px
7. **점수 열 신설**: 비트별 점수(getTier1Points·getTier2Points·getReviewPoints) — 에너지 우측, AI 좌측
8. **비용 0 숨김**: 시간·에너지 숫자가 0이면 그 숫자는 표시 안 함
9. **대표 컷 1장**(c2)만 + 5컷 보기 유지
10. **하단 범례 삭제** (legend 키 폐기)
11. **"시나리오별 결과" 섹션 삭제** (showFinalReport (6) 블록 — 항로가 대체)
12. studyplan title `시험 2주 전 — 공부를 어떻게` → **`시험공부 어떻게`** (scenarios.yaml, 선택 화면 등 전역 반영)
- 좌표 재배치: viewBox 640, COLX A60/B165/C270·OFFPX 45, SEP 352, 시간 388·에너지 448·점수 512·AI 585, 열 점선 418/478/548

### 4h. R3.9 — 숫자 축소 + 선택 텍스트 2줄 + 상단 헤더 정리 + 학습자 유형 전면 배치 [피터공 6/12 4건]

1. **비용·점수 숫자 크기 축소**: 현재 18px와 선택지 텍스트(12px) 사이 → viewBox 확장(640→820)으로 on-screen 환산. vb 단위 18 유지 = on-screen 약 14px (기존 18→14, 라벨 12 유지)
2. **선택 텍스트 2줄 + 위임 열 간격 확대**:
   - 라벨 20자 초과 시 중간점에 가장 가까운 공백에서 2줄 분리(tspan), 말줄임 폐지. 1줄=baseline y+5, 2줄=y-3/y+15
   - `_RMAP_COLX` A:70/B:230/C:390 (on-screen 간격 비율 0.164→0.195), `_RMAP_OFFPX` 50
   - anchor: x>330이면 end(C 갈래), 이하 start(A·B 갈래 — 우측 공간이 넓음). 최장 라벨(43자, eorinwangja B1 offset+1 x=280) 워스트 케이스 598 < SEP 625 검증
   - 2줄 세로 공간 확보: `_RMAP_ROWH` 96→128 (비트 y = 0.18/0.52/0.84 유지 → 23/67/108)
3. **상단 헤더 블록 제거 (일단 뺌, 데이터·키 보존)**: final_report.subtitle 안내문 + 4박스(학기 총점·최종 레벨·선택/능력 원 미터) + grade_note 한 줄 — showFinalReport에서 렌더 제거. _renderMiniCircleMeter 함수·texts 키·stat_labels는 보존(되돌리기 가능)
4. **학습자 유형 전면 배치**: 그 자리(타이틀 바로 아래, 항로 위)에 선택 패턴 박스 이동. 본문은 **문장 단위 줄바꿈**(마침표+공백 → `<br>`, 피터공 "너무 길게 줄이 이어져 안 읽혀" 보정 6/12).
   - **6종 확장 (피터공 6/12 확정 — "가려서 맡기는 유형 추가해서 6종으로 가자")**: `selective`를 판정 최상위에 신설. 기준 = 섞인 항로 + 좋은 결과: 직접(A) 비율 ≥0.4 **그리고** 위임(B+C) 비율 ≥0.4 **그리고** 등급 S·A 비율 ≥0.6 (5개 기준 직접 2+·위임 2+·S/A 3+). 게임의 목표 행동(가려 맡기기)이라 다른 모든 유형보다 먼저 잡는다. 기존 5종 판정·우선순위는 무변, 기본값 selfStart 유지(섞인 항로+평범한 등급은 여전히 기본값 — 추후 중립 유형 후보) _renderGrowthReport의 패턴 판정을 `_judgePattern(hist)`로 추출, 하단 §18 박스의 패턴 블록은 제거(성장 카드 블록만 남음). **유형 이름 신설**(growthReport.pattern_names 5종) + 본문 재집필(growthReport.patterns) — 거울 문장(항로 사실 서술) → 레슨 연결(직접 경험·검토가 위임을 싸게 만든다) → 다음 한 걸음 구조. 문안은 피터공 검토 대기 초안
- 좌표 재배치: viewBox 820, COLX 70/230/390·OFF 50, SEP 625, 시간 660·에너지 706·점수 752·AI 796, 열 점선 683/729/775. 스케일 보정: 라벨 12→15vb·헤더 13.5→17vb·AI 칩 11.5→14vb(rect 40×25 rx12)·원 r9→11 stroke3·폴리라인 stroke3 dash 9,6·열 점선 stroke2 dash 2.5,6 (전부 on-screen 기존 크기 유지)

### 4i. R3.10 — 항로 SVG → 표(HTML table) 전환 [피터공 6/16 세션487, 덱스 문서 검토]

방향 전환: 행 간 연결선 폐지(§4f) 이후 항로 SVG는 시나리오별 3점 마크 = 아이콘에 가까워짐. 정보를 나르는 건 지그재그가 아니라 컬럼 위치(직접/부분/전체) → HTML 표로 전환. `_renderDelegationMap`을 SVG에서 `<table class="rt">`로 재작성. SVG 헬퍼(`_rmapRowSvg`·`_rmapHeaderSvg`·`_rmapChoiceCircle`·`_rmapBeatXs`·`_rmapSplitLabel`)는 미사용으로 보존(되돌리기 가능). `_rmapBeatLabels`·`_rmapCosts`·`getCutImageFor`·`getCutCaptionFor`·`MICRO_OFFSETS`는 표에서 재사용.

1. **시나리오당 4행 구조** (rowspan): 시나리오 이름(좌, rowspan=4) + 비트 3행(1차/2차/검토 위에서 아래로) + 종합 1행(colspan=7). 각 비트 행에 위임 컬럼 마커·시간·에너지·점수·선택 텍스트가 **같은 줄에 정렬**.
2. **컬럼 = 직접/부분/전체** (성향 세로 스캔). 비트가 떨어진 컬럼에 ● 마커. 매핑은 항로와 동일: 1차=tier1 컬럼 / 2차=tier1+`MICRO_OFFSETS`(−1 직접쪽·+1 위임쪽, clamp 0~2) / 검토=2차와 같은 컬럼. `_rtBeatCols(r)` 신설.
3. **마커 색 = 위임 정도(컬럼) 고정** (피터공 6/16): 직접 #00a3d4 / 부분 #e6007e / 전체 #eab000. 옛 "1차 갈래 색" 폐지(2차가 옮겨가도 1차 색을 끌어 컬럼과 어긋나던 문제). 검토 마커도 자기 컬럼 색(ink 검정 폐지).
4. **비용·점수 = 비트별**: `_rmapCosts(r)`의 단계별 실지불(시간·에너지), 점수는 `getTier1/2/ReviewPoints().points`. 1차는 비용 0 → 빈 칸(마커·선택 텍스트만). 선택 텍스트 = `_rmapBeatLabels`(1차/2차/검토 + 라벨), 좌정렬(`.rt td.rt-choicetext` specificity로 `.rt td` 중앙정렬 누름).
5. **할인 인과** (피터공 6/16 — 카드→비용 고리): `_rtDiscounts(hist)` — 시나리오를 칠 때까지 "완료한"(cleared) 시나리오 카드 누적 장수. 시간 할인=위임 카드(인간중심+성장)·에너지 할인=능력 카드(도메인), §4p A 모델·`_lockedCardCount` 규칙과 동일 출처. **행별**: 종합 행에 "그때까지 모은 카드로 시간 −N·에너지 −M 가벼워졌어"(복기). **전체 1회**: 학습자 유형 박스(우측 컬럼)에서 최종 카드 수로 성장 프레임 설명("비용이 싸진 게 아니라 역량이 자라 수월해진 것").
6. **컬럼 헤더 시나리오마다 반복** (`rt-grouphead`, 피터공 6/16): 단일 상단 thead 폐지 → 시나리오 블록마다 레이블 반복(스크롤·PDF 페이지 자족). `rt-scn-first` 경계선은 grouphead border-top로 대체.
7. **5컷**: 버튼·펼침 폐지 → 작게 항시 노출(`rt-strip` max-width 660px, `_rmapToggle` 미사용 보존).
8. **학습자 유형 박스**: 라벨 "학습자 유형" → **"AI리터러시 유형"**(texts `final_report.learner_type_label`). 좌(유형 이름·설명)/우(성장·할인) **2컬럼**, 좌정렬, 글씨 키움(설명 16px·이름 23px). 검토 라벨 "검토 N회" → "검토".
9. **카드 섹션 헤더**: "인간중심 역량 카드" → **"인간중심 역량"**(texts `final_report.delegation_header`). 도메인("능력 카드 — 도메인 역량")은 미변경(피터공 추후 결정).
- texts.yaml: `report.map.title` "나의 위임 항로" → "시나리오별 위임 선택", `col_scn` 신설.
- **미반영(다음 증분)**: 죽은 `_reportNarrative` 해석 되살리기 / 핵심 레슨 한 줄 / 카드 섹션 맨 아래 재배치 / 비트의 컬럼 안 번호 마커.

## §5. R4~R7 [각 라운드 착수 시 작성]

- R4 영수증: §3a discounts + 미획득 카드 → "아낀 X vs 못 기른 Y" 한 줄 템플릿
- R5 가지 않은 길: finals 결과 문장만, 점수·등급 비공개 (6/12 확정). 노출 UI 수위는 게이트 질문
- R6 재도전 서사: firstAttempt → 현재 grade 변화 표시
- R7 교실 한 장: print 전용 블록 + 빈칸 2줄. 문구 다연샘 합의 후
