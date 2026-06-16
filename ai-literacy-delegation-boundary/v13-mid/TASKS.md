## TASKS — v1.3-mid (중등)

**최종 업데이트**: 2026-06-16 세션491 (성장 리포트 상단 요약 스트립 + 시나리오 행 등급·점수 — 빌드 989,296B)

### ✓ 세션491 (6/16) — 성장 리포트 상단 요약 스트립 + 시나리오 행 등급·점수 (라이브 빌드, 피터공 라이브 확인 대기)

피터공 라이브 요청 두 줄: (1) 리포트 상단에 총점·능력레벨·위임레벨 표시 (2) 시나리오 컬럼 타이틀 아래 여백에 등급·점수.

- [x] SPEC §4j + PLAN-report R3.11 선문후코
- [x] 상단 스트립(`showFinalReport` 타이틀 바 아래): 총점=`totalScore` / 능력레벨=`_abilityCardCount` / 위임레벨=`_delegationCardCount` (HUD `FX_META` 명칭·출처 동일). `.report-topstats`/`.rts-box` CSS
- [x] 시나리오 행(`_renderDelegationMap` `.rt-scnname`): 타이틀 아래 등급 배지 + 점수(`.rt-grade-badge`·`.rt-scn-score`), `r.grade`·`r.finalScore`
- [x] 빌드 989,296B + CDP 헤드리스 검증(`dbgShowReport('A')`: 스트립 총점410·능력0·위임0 / 5행 모두 A·82점, 예외 0)
- [x] **r41 추가 요청(같은 세션)**: 시나리오 선택 완료 배너 → 픽셀 폰트(`--font-pixel`)·연두 박스(`--acc-mint`)·기울임 제거. 빌드 989,402B + CDP 검증(배너 fontFamily=Mulmaru·bg #b9eed7). SPEC-intro-crt r41
- [x] **r42 추가 요청(같은 세션)**: 테스팅용 화면 네비 바([타이틀][튜토리얼][시나리오 선택][리포트], 좌하단 디버그 토글 위). 셸 `#dev-nav` + `.dev-nav` CSS + `_isLocalEnv`/`_initDevNav`/`devNavReport`(12-debug.js, 14-init서 호출). 리포트 버튼은 기록 없으면 `dbgShowReport('A')` 샘플 채움. 인쇄 숨김. 빌드 991,160B + CDP 검증(노출·4화면 전환 OK). SPEC-intro-crt r42
- [x] **r42b**: dev-nav **라이브에서도 노출**(피터공 "라이브도 있어야 테스팅"). `_initDevNav` 항상 `hidden=false`. `_isLocalEnv` 헬퍼 보존 — KT 전달 직전 가드 복원으로 배포본만 숨김 가능
- [x] **r43(§4q v9.4) 추가 요청(같은 세션)**: 선택지 하나 고르면 비선택 카드 **회색 처리**(이미 못 누르는 상태 시각화). `runChoiceDiscount`가 클릭 카드에 `.fx-selected`(done서 제거), CSS `.cascade-locked .choice-card:not(.fx-selected)` opacity .4 + grayscale .85. 빌드 991,828B + CDP 검증(선택 opacity 1·filter none / 비선택 0.4·grayscale·pointer-events none / 박스 등장). SPEC-ui-hud §4q v9.4
- [x] **r43b 추가 요청**: 완료 배너 줄바꿈 금지(nowrap·내용폭) + 폰트 28px + 노랑 글씨 + 초록 text-shadow(타이틀 톤). 빌드 991,962B + CDP(rects 1줄·#ffdb31·shadow #219b6c). SPEC-intro-crt r43b
- [x] **r43c 추가 요청**: 상단 스트립 "라벨 : 값" 한 줄(`.rts-colon`) + 하늘색 박스(`--acc-cyan`). "시나리오 총점 : 410" 형태. 빌드 992,258B + CDP(3박스 1줄·bg #63d8f1). SPEC-report §4j r43c
- [ ] 피터공 라이브 확인 후 미세조정(레벨 색 구분·점수 단위 등)

> 요청 노트: `current_notes/요청.26.0616.1604-리포트상단요약.md`

---

### ✓ 세션489 (6/16) — 전체 시나리오·전체 브랜칭 검토표 재생성 (완료, 피터공 검토 대기)

피터공 요청: "시나리오|선택1|시간비용|에너지비용|점수|역량카드|능력카드||선택2|...||검토|..." 가로 펼침 검토용 문서를 현행 데이터로 다시. 옛 펼침본(v07 6/8자)은 카드가 결말 기준 + 죽은 컬럼이라 stale.

- [x] 소스 확인 — `scenarios.yaml` 6/12 최종(점수·비용·delta 현행). 카드는 `15-card-per-choice.js` 런타임 규칙(선택별 도출, finals 미사용)
- [x] **신규 스크립트** `data/build_branch_table.py` — yaml 직독(점수·비용) + 카드 규칙 포팅(axisTagMap·getAxisDelta·getLeafDelta 1:1). 한 행=한 경로 가로 펼침
- [x] **산출** `data/exports/검토_260616/전체브랜칭_가로펼침_135행.csv` + `0_읽는법.md` (5×27=135행)
- [x] 검증 — 등급별 카드 기울기 S2.9/A2.6/B1.9/C0.9/D0.6 (PLAN-card-per-choice 의도 S3.1→D0.6 일치) / 샘플 A1R3·C3R1·B2R2 대조 OK
- [x] 다운로드 사본 `~/Downloads/AI리터러시_전체브랜칭_260616/`
- [ ] 피터공 CSV 검토 / 필요 시 구글시트 업로드

---

### ✓ 세션488 (6/16) — 회복카드 정리 + §4q 할인 박스 전면 개편 (완료, 피터공 라이브 확인)

요청: (1) 회복력 팝업이 카드 획득과 연속으로 뜨는 것 → 시나리오 완료 후로 (2) 회복력 카드 시킬까 칸 + [회복 역량] 표기 통일 (3) 할인 박스 레이아웃 먼저 → 기능 조정.

- [x] **(1) 회복력 모달 타이밍** — chain `[1.5]`→`[4]`(철컥 뒤)로 이동. 카드 획득·완료 후에 모달(SPEC-ui-hud §4s)
- [x] **(2) 회복/도전 역량 표기** — texts.yaml growthCards `display` + `_cardDisplayName` 확장 → "회복 역량"·"도전 역량" 일괄 (§4s)
- [x] **(3) §4q v8 레이아웃** — 3줄(헤드+위임/능력레벨 / 동일폭 카드 / ← + -N + 라벨 + 적용하기). `FX_META.levelLabel`·`_fxLevelFor`
- [x] **v8.1** — 카드 최대 3장 + 버튼과 구별(드롭쉐도우 없는 라운드 카드·싱글라인)
- [x] **v9 선택→선택할인→다음** — 자동 캐스케이드 폐기. `selectChoiceWithDiscount`+`runChoiceDiscount`: 선택 클릭 시 그 선택지 할인만 박스→적용→진행. tier2·review 양쪽. disable=할인 후 비용 기준(기존 충족, 검증 확인)
- [x] **v9.1 마이크로 연출** — 펄스 팝+살짝 빠르게(360→300) / 마지막 숫자 finalpop / 카드 빈 점선 슬롯→회전 비행 채움(reveal)
- [x] **v9.2** — 박스 20px 좌측(cut3/cut2 경계 걸침, dfx-host overflow:visible+z-index) / 시킬까! 헤드 그림자 제거+21px
- [x] **v9.3** — 채운 카드 solid 테두리(base `.fx-clone` border 추가, 빈칸 점선→채움 solid)
- [x] `node --check` OK. **CDP 헤드리스 검증**: 클릭→박스(위임레벨·-N·적용하기)→적용→cut3 진행 / 빈슬롯→비행채움(이름 정상)→finalpop / 자원 17이면 할인후 18만 disabled / 예외 0
- [x] 빌드 986,615B
- [x] 커밋·푸시 → 라이브 반영 (c78de55, main)
- [ ] 피터공 최종 라이브 확인 / 도전력 "도전 역량" 통일 의도 확인

---

### ✓ 세션486 (2) — 할인 효과 박스 + HUD 제목/전체점수 (완료, 피터공 라이브 확인 대기)

피터공: "펄스 효과로 할인 보여주는 게 전혀 안 읽혀." → 효과를 선택지 박스 우측으로. 추가로 HUD 제목 크롭·형식 + 전체점수 두 줄.

- [x] **할인 정보창(§4q v3, 피터공 정정 2회)**: 옆 칸(tier2→cut3, review→cut5)에 **선택 버튼 우측 같은 크기**로 배치(스페이서 정렬, minHeight=버튼높이). 타이틀·선택지 텍스트 반복 X. 박스 = 시킬까!→카드(목록 디자인 복제)→`시간 할인`+우측 -N. 카운트다운: **선택창 비용 2배 줌**+하나씩↓, -N 0→-N 펄스↑(동시). 끝에 비용 final 초록+줌 해제. dock 레일 펄스 폐지
- [x] **카드 색(§4)**: 빨강 계열 제거 → 파랑·초록·보라 재매핑(texts.yaml 16곳). 노랑은 흰글자 칩 가독성 때문에 보류(도메인 카드엔 가능 — 피터공 확인 필요)
- [x] 게임 락 방지: seq `.catch`로 실패해도 `_cascadeBusy` 해제. 할인0이면 정보창 없음
- [x] **HUD(§4r)**: 중앙 제목 `상황: X`→`'X' 시나리오 점수` 한 줄 + 크롭 해소 / 전체점수 두 줄(작은 라벨+큰 숫자)
- [x] `node --check` OK. 헤드리스(cut3): 박스2·복제카드5·타이틀X·라벨`시간 할인`·disc -3/-1/-1·cut2 비용 final 초록(비할인 plain)·줌 해제·busy 해제, ERR=[]
- [x] **v4 다듬기(피터공)**: 효과 카드 88×30 고정 / 시킬까→내가 할까 순서 교체(박스=선택지 크기, 안 쌓음) / 위임(hc) 카드명 +"역량"(주체성 역량, `_hcName` dock·rail·팝업·fx 일괄) / 박스 drop shadow 제거
- [x] 헤드리스 v4 검증: hcname="주체성 역량"·dockLabel="경청 역량"·잔여 fx-sec 1개(last=energy)·clone 88×30·shadow none·ERR=[]
- [x] **v5 다듬기(피터공)**: 줄 맞춤(cut2 .choices-area 미러=.dfx-area+숨긴 질문+minHeight 슬롯, 상단 정렬) / 선택지에 더 가깝게(dfx-host 좌패딩↓, 그리드 gutter는 유지) / 계산 끝나면 박스 사라짐(`_fxFadeRemove`→끝나면 cut3 비우고 dfx-host 제거) / show·burst rAF→setTimeout(가시성)
- [x] 헤드리스 v5 검증: 박스 show=true·head 시킬까!·카드 burst=true / 끝: cut3 본문 비움·dfx-host 제거·cut2 비용 초록 유지·busy 해제·ERR=[]
- [x] **v5.1 줄 맞춤 정정**: 각 선택지 `getBoundingClientRect`로 위치 측정, 박스 `position:absolute top=card.top−host.top−clientTop`(요약·질문 높이 무관). 오차 ≤1px
- [x] **v6 자동애니 폐기(피터공: "자동으로 나오니 넘 정신없다")**: 타이핑·카운트다운·빵빵·자동순차 전부 제거 → 각 할인 선택지 정보를 **한 번에 정적 표시**(시킬까!+카드+시간할인 -N / 내가할까!+카드+에너지할인 -M) + **[적용확인] 버튼**. 클릭 시 그 선택지 비용 final 초록 확정→다음 박스. 마지막 확인 후 cut3 원복+선택지 잠금 해제. 폐기 함수/CSS 정리
- [x] 헤드리스 v6 검증: 정적 박스 → 클릭 시 비용 초록+다음 → cut3 비움·잠금 해제, ERR=[]
- [x] **v7 자원 단위 스텝 + 버튼 트리거 카운트(피터공)**: 스텝=선택지×자원. 한 박스에 자원 1칸 정적(시킬까!+카드+`[비용] 시간 할인 [-0]`)+버튼. 버튼 누르면 큰 숫자(.counting 42px)로 할인 -1..-N↑·비용↓ 카운트(펄스)→cut2 확정→다음 자원/선택지. `_fxBuildSectionBox`·`_fxRunCount`
- [x] 헤드리스 v7 검증: 자원 단위 스텝 + 버튼 누르면 카운트, OK
- [x] **v7.1(피터공)**: 박스엔 할인 수치(-N)만 / 실제 비용은 선택 버튼서 큰 글씨(cost-zoom 32px) / 버튼 `적용확인`→`적용하기` / 클릭 시 할인 -N 줄어 사라지고 비용 raw→final 감소 / 다 적용되면 할인 수치 사라지고 비용 final 초록 + 2번 깜빡(fxBlink2) + 원래 크기 복귀
- [x] 헤드리스 v7.1 검증: box disc=-3·비용박스없음·버튼 적용하기·cut2 10 zoom → 클릭 cut2 7 초록·zoom해제·box energy -1 → 끝 cut3 비움·잠금 해제, ERR=[]
- [x] 빌드 971,020B. 상세 SPEC-ui-hud §4q v7.1·§4r
- [x] **선문후코 정합 점검(피터공)**: 코드↔SPEC↔TASKS 교차 — 옛 애니 함수 잔재 0, CSS 클래스 전부 사용, 현행 함수 전부 문서화, 빌드 기록=실제 크기 일치. 죽은 코드 `_costHasDiscount`(v3 예약 폐기 잔재, 호출 0) 제거. 재빌드 970,748B
- [x] 커밋·푸시 → 라이브 반영 (4e3c5f2, main)
- [ ] 피터공 라이브 확인 (효과 박스 읽힘·타이밍 / 제목·전체점수 모양) → 조정 후 커밋·푸시

---

### ✓ 세션486 — 버그 수정: 할인이 시나리오 도중 즉시 적용됨 (완료)

피터공 발견(세션485 끝). **증상**: 카드 획득하면 그 시나리오 안에서 바로 레벨/할인이 오름. **정상**: 시나리오 끝(철컥 확보) 후 갱신 → 다음 시나리오부터 적용.

- [x] `_abilityCardCount`/`_delegationCardCount`(16-card-rail.js)가 **완료 시나리오 카드만** 카운트 — `_lockedCardCount()` 헬퍼 신설(`clearedScenarios.indexOf(card.scenario)>=0` 필터). 진행 중(currentScenarioId·미clear) pending 카드 제외
- [x] 검증: 카운트 함수 두 곳이 유일 출처 — 디스플레이(`updateDockLevels`)와 실제 비용 할인(`04-resources.js _applyDiscount`)이 같은 함수를 씀. 카드 entry는 전부 `.scenario` 보유(03-engine·15-card-per-choice push 확인). 완료 push는 `goNextScenario`(10-event-handlers) → 락 애니(`_dockLockNow`)는 완료 전이라 그 시점엔 미반영, 다음 시나리오 render부터 반영. 보관함 pending 칩 깜빡임 유지(_dockIsPending 별개). 엣지(null gs·회복력) 통과
- [x] 헤드리스(node) 검증: 시나리오1 도중 0/0 → 완료 후 1/1 → 시나리오2 도중 1/1(새카드 미반영) → 완료 후 2/2 → null gs 0/0 전부 기대값 일치. `node --check` 구문 OK
- [x] 빌드 964,398B. 상세 SPEC-ui-hud §4p v4 블록 참조
- [x] 커밋·푸시 → 라이브 반영 (4f63ec3, main)
- [ ] 피터공 라이브 클릭 확인 (시나리오 도중 할인 0 → 완료 후 다음 시나리오 할인 적용)

---

### r41 — 컷 스크롤: HUD 인지 시작 + 선택 후 이미지 복귀 (6/15 피터공)

cut1·cut3 상단이 sticky HUD 밑으로 가려진 채 시작하던 문제 수정. SPEC-ui-hud §4m.

- [x] `09-render-scenario.js`: `_hudOffset()`+`_scrollPanelTop()` 헬퍼 신설. `activatePanel`의 `scrollIntoView({block:'center'})` → `_scrollPanelTop`(패널 top을 HUD 바로 아래로) — 모든 컷 시작이 이미지·제목부터, 선택 후 다음 컷 이미지 자동 복귀
- [x] `_scrollChoicesIntoView` HUD 인지 보강 — 질문+선택지 3개가 한 화면에 들어가면 영역 top을 HUD 아래로(다 보이게), 넘치면 마지막 선택지 nearest
- [x] 빌드 948,140B + node 구문 OK (`09-render-scenario.js`)
- [x] 피터공 라이브 클릭 확인 (cut1 시작 상단 노출 / [어떻게 할까?] 3개 노출 / 선택 후 이미지 복귀)
- [x] 커밋·푸시 → 라이브 반영 (r41+r42 ad9a86d)

---

### r42 — 시나리오 화면 전면 레이아웃 개편 (6/15 피터공 스케치, SPEC-ui-hud §4n)

스케치 `Assets/incoming/AI리터러시/UIUX/UI레이아웃 260615.png`. 요청 노트 [[요청.26.0615.1637-시나리오UI개편]]. 이번 라운드 = 레이아웃만(레벨 의미·할인·카드 밸런스는 다음).

- [x] HUD 재편: 시나리오 제목(`#hud-scenario-title`) 중앙 신설 + 점수 알약=시나리오 점수 / SCORE=누적(`totalScore`, `score-total-block` 우측 독립 구역으로) / 미터(`.stats-bar`)는 `display:none`(DOM·로직 유지)
- [x] 레벨 숫자화: 능력=knowledge / 위임=delegationChoice raw 값(0부터, 보정 없음 — 피터공 A). `updateDockLevels()` + `animateStat` 펄스
- [x] 우측 레일 두 칸(`#card-dock` flex-row): 좌 내가할까?(능력→domainCards) / 우 시킬까?(위임→humanCentric+growth). 헤더+민트 레벨 박스+카드 박스, 카드 쌓이면 스크롤. growth→hc 칸(피터공 B)
- [x] 페이지 레이아웃 = **그룹 중앙정렬**(피터공 2차 정정: "좌우정렬 아니라 HUD+카드바가 화면 중앙쯤"). CSS var `--bw`(그룹폭 min(1412,100vw-24)) + `--gx`(좌측여백). 그리드/HUD 폭=`--bw-312`, 좌표 `--gx`. 레일 `left:calc(--gx+--bw-300)`=그리드 우측 옆(gap12). HUD는 그리드 폭에 맞춤(약간만 넓게). **함정**: paperlogy가 `.panel-row`를 fixed+중앙(left:50% translateX)으로 둬서 flex 정렬 무시 → fixed의 left/width 직접 덮어씀. 레일 헤더(`.dock-col-top`)=HUD 박스 스타일(둥근 카드+그림자)+카드 자리(`.dock-cards-box` 점선). ≤900px 레일 하단 스택·HUD 중앙 원복
- [x] 빌드 953,448B + node 구문 OK + 헤드리스(vw1500: HUD 44~1144 = 그리드 44~1144 정렬, 레일 1156~1456, 그룹 44~1456 중앙[양쪽 44]; cut1→tier1→cut2 무에러, 카드 팝업·점수·레벨 정상). showFinalReport/showStartScreen은 hideStats로 scenario-active 해제
- [x] **반복 정정(6/15 피터공)**: HUD 시간/에너지 좌·점수 중앙(박스 제거+얇은 라인, 제목20px 위/알약 아래 여백)·SCORE 우·LV 삭제. 컷 꼭대기 HUD 아래 노출(`--hud-h`116 + 컨테이너 padding-top). 레일 박스=HUD형식(상단부착 top:0·라운딩0·border-top:0·같은높이). 레벨 1부터(value+1). 초록 할인 블럭(에너지/시간 할인 -N=raw값=레벨-1). 점선 카드자리 3개크기 grow. 빌드 955,144B
- [x] 피터공 육안 검토 (브라우저 반복 확인 — "지금 좋은데")
- [x] 커밋·푸시 → 라이브 반영 (r41+r42 ad9a86d)

---

### r43 — 우측 두 컬럼을 HUD로 결합 (6/15 세션485 피터공 스케치, SPEC-ui-hud §4o)

스케치 `Assets/incoming/AI리터러시/UIUX/우측상단UI변경.JPG`(전체 4등분 중 우측 상단). 요청 [[요청.26.0615.1933-HUD우측결합]]. 피터공 "내가할까/시킬까도 기본 HUD 일부로 합치자, 지금 너무 복잡". §4n 별도 박스 → HUD 한 줄로 흡수.

- [x] HTML(`index.shell.html`): `.hud-dock`(두 칸 `.hud-dock-col` = 헤더+레벨 텍스트+할인 박스)을 `.score-total-block` 다음에 추가. dock-level/disc id 이관
- [x] CSS: `body.scenario-active .panel-row` 폭 `--bw-312` → `--bw`(풀폭). `.hud-dock` flex 0 0 300 + 점선 세로 구획(`.hud-dock-col` border-left dashed, score-display 좌우도 dashed). 할인=초록 테두리 박스. 레벨 민트 박스 폐지(플랫)
- [x] CSS: `#card-dock` 헤더 제거 → 카드 박스 2칸만, `top:--hud-h+16`(HUD 아래)·우단 `gx+13` 정렬
- [x] JS(`16-card-rail.js`): `_dockEl()` dock-col-top/discount 제거. `updateDockLevels()` 할인 0이면 "-0" 아닌 "0"
- [x] 빌드 956,250B + 헤드리스 렌더 PASS(selfintro 진입 — HUD 한 줄 5구역 점선 구획, 내가할까/시킬까 결합, 할인 박스 0 표시, 카드 보관함 정렬 확인)
- [x] **v2 미세조정(피터공 5건)**: ①시간/에너지 좌정렬(나가기 버튼 그룹 좌단 `gx+8`, resource-bar padding 76→52) ②SCORE→"SCORE : 0" 중앙정렬 넉넉히(row, 라벨17/숫자27) ③점선 OK ④할인 초록박스 흰글씨 크게(초록 채움+흰글씨+하드섀도) ⑤"능력 레벨 : 1"/"위임 레벨 : 1" 컬러(능력=cyan-deep/위임=pink-deep), 내가할까/시킬까 25px+컬러+검정 하드섀도(카툰). 빌드 957,341B + 헤드리스 PASS
- [x] **v3 조정(피터공)**: ①나가기 버튼 HUD 밖 화면 우하단(bottom:16 right:16)으로, resource-bar 좌측 padding 제거 ②시간/에너지 폭 확보 — resource-bar flex 1→2.4, score-display(중앙) 44%→26%, score-total-block 내용폭만(flex 0 1 auto). 빌드 957,271B + 헤드리스 PASS(자원 바 좌단부터 길게)
- [x] **v4 균형(피터공)**: 자원 영역 = 시나리오 점수바 영역 **동일 폭** — resource-bar flex 2.4→1, score-display 26%→`flex 1 1 0`. 남는 폭(SCORE 내용폭·hud-dock 300 제외)을 둘이 절반씩. 빌드 957,200B + 헤드리스 PASS
- [x] **v5 누적+레벨(피터공)**: ①같은 카드 ×N 누적(identity 그룹핑 `_dockRenderGroup`+`.dc-count` 배지, 비행도 기존 칩으로 합류) ②레벨 0부터 표시 = 할인 값과 숫자 동일 매칭(레벨4↔할인-4). 헤드리스 검증(표현 능력 ×3·분석 능력 ×2, 레벨4/3 ↔ 할인 -4/-3)
- [x] **v6 할인 이동(피터공)**: HUD에서 할인 빼고 카드 박스 **아래**로(`.dock-disc` "내가 할까? / 에너지 할인 -N"), 칸 색(cyan/pink)+검정 하드섀도 카툰 강조. 빌드 960,582B + 헤드리스 PASS
- [x] **v7 할인 강조(피터공)**: 할인 3줄("내가 할까?" / "에너지 할인" / 큰 숫자 -N 40px+강한 하드섀도) + **0이면 블럭 숨김**(`_setDockDisc`). 빌드 960,963B + 헤드리스 PASS(능력4→에너지 할인 -4 큰숫자 / 위임0→시간 할인 블럭 숨김)
- [ ] 피터공 라이브 클릭 확인 → 미세조정
- [x] 커밋·푸시 → 라이브 반영 (세션485 일괄 f3b9b1e)

---

### r45 — 비용 단순화 + 할인 효과 캐스케이드 애니메이션 (6/15 세션485 피터공, SPEC-ui-hud §4p)

할인이 "능력/위임 쌓음 → 비용 깎임" 인과를 눈으로 보게. 요청 [[요청.26.0615.1933-HUD우측결합]].

- [x] 할인 모델 통일: **카드 매칭 보너스·쿠폰 모달 폐지**, 할인=레벨 총점만(`_applyDiscount` energyDisc=knl, selectedCard 무시). `getCardDiscountMark`→'', onTier2/onReview 쿠폰 분기 제거(`getTier2Cost`/`getReviewCost` 단순 경로)
- [x] 비용 한 줄 큰 글씨(`buildCostHTML`→`.cost-simple` "시간 비용 : N", data-raw/final, 초기 raw)
- [x] 캐스케이드(`runDiscountCascade`/`_animateChoiceDiscount`): 선택지 위→아래, 할인 있는 것만, 4스텝(비용 펄스→적용카드 펄스→할인 -N 펄스→취소선+화살표+새 가격 ×2). `_cascadeBusy` 클릭 잠금(onTier1/2/Review 가드+`.cascade-locked` pointer-events). `pulseFx` 키프레임(scale)
- [x] 빌드 964,019B + 헤드리스 PASS(selfintro tier2: 시간 20→17·에너지 18→14 등, 할인 -3/-4 = 위임3/능력4 일치, 취소선+초록 새가격 확인)
- [ ] 피터공 라이브 모션 확인(펄스 순서·속도) → 미세조정
- [x] 커밋·푸시 → 라이브 반영 (세션485 일괄 f3b9b1e)

### r40 — 인트로 CRT 모니터 연출 (6/15 피터공, 시안 승인 후 통합)

기존 `rt-` 레트로 타이틀 → 모니터 프레임 + 부팅/타이핑 연출로 업그레이드. 시안 `mockups/title-crt-sian.html` 5회 반복 후 승인. SPEC-intro-crt.md.

- [x] 시안: 모니터 프레임(레퍼런스 `Assets/incoming/AI리터러시/UIUX/모니터프레임/` 크림 본체+초콜릿 경사 베젤+통풍구+LED), 부팅 좌→우 타이핑, 타이틀 스윕+글자 타이핑+글리치(배지 제거·대형), 위임 정의 3줄 타이핑+깜빡, 게임 방법 번호 5단계 깜빡+타이핑
- [x] Galmuri11 픽셀폰트(OFL) 추가 — `fonts/Galmuri11.woff2` + `--font-crt`(00-base.css)
- [x] texts.yaml 신규 문안 — delegation_intro 3줄(위임 정의)·tutorial 5줄(상황/선택·시간에너지자원/직접비싸지만능력/능력쌓이면싸짐/검토로점수)·btn_more 신설·heading "게임 방법"·btn_continue "게임 시작 ▶". ui_texts.csv 309 동기
- [x] 09-render-scenario.js: showTitleScreen/showTutorialScreen 교체 + CRT 모듈(`_crtMarkup`·타이핑 헬퍼·부팅/타이틀/위임/방법 시퀀스). 흐름 showTitle(부팅→타이틀)→enterFromTitle→crtShowDeleg→crtShowMethod→enterFromTutorial→본게임. 재방문 튜토리얼 생략 로직 유지
- [x] 06-scenario-select.css: `.crt-*` 신규(기존 `rt-`와 분리, 미사용 rt- 잔존 무해). CRT 화면 안 `.hl` 배경칠→색 텍스트 오버라이드
- [x] 빌드 946,843B + node 구문 OK + 헤드리스 부팅·타이틀 렌더 PASS + 인코딩 클린(BS 0·NFD 0)
- [ ] 피터공 라이브 클릭 확인 (시작하기→위임→게임방법→게임 시작 진입) + 속도·크기 미세조정
- [x] 커밋·푸시 → 라이브 반영 (세션485 일괄 f3b9b1e)

> [!info] 이 빌드(v1.3-mid)는 1차 교사 검토(5명) 피드백 반영 작업 빌드. 중등 수리 완료 후 v13-elem로 초등 분기(기존 v12-elem 6/1 시나리오 정본 이전).
> 요청 노트: [[요청.26.0608.0851-AI리터러시교사반영]] · [[요청.26.0615.1010-CRT타이틀연출]] / 신규 명세는 SPEC §14·SPEC-intro-crt.md.

---

**이전 업데이트**: 2026-06-11 세션468 (획득 팝업 v3 확보 버튼 + 자원토큰 보상 상향, SPEC-card-per-choice §2e·SPEC §18)

### §2e+§18 — 획득 팝업 확보 버튼 + 토큰 보상 두 자리 상향 (6/11 피터공, 세션468)

- [x] 획득 팝업 v3 — 자동 닫힘(4초)·×·아무데나 클릭 폐지 → **확보 버튼**(노랑) 단일 동선. railFlyToInventory 강제 닫힘은 `_forceClose` 핸들로 유지 — `16-card-rail.js`
- [x] 팝업 레이아웃 — 카드명 최상단 22px(over-image 24px) 굵게 + 아래 작은 설명 줄("「선택」 선택으로 획득!") — `08-inventory-and-rewards.css`
- [x] texts.yaml 키 2개(popup_desc_format·popup_btn_acquire) + ui_texts.csv 재추출(287항목)
- [x] rpRewardByGrade {S:30,A:20,B:15,C:10,D:5} / rpLevelUpBonusByLevel {2:10,3:15,4:20,5:25} — `00-config.js` (D:5는 2차 피터공 결정 "D도 한자리라도 주자")
- [x] 빌드(917,495B) + 린터 0 + 구문·인코딩 클린
- [x] (2차) 회복력 모달 §4k — 창 라운딩 20px·버튼 10px, 다시 도전=하늘색+↺, 다음 시나리오=노랑+→ — `13-inventory.js`·`08-inventory-and-rewards.css`
- [x] (2차) 획득 팝업 §4l — 타이틀 "{카드명} 확보!"(popup_title_format) + 인간중심 미리보기 한 줄("중심잡기 주체성") — `16-card-rail.js`
- [ ] 브라우저 확인 (피터공): 확보 버튼 닫힘→회전 비행 / "주체성 확보!" 타이틀·한 줄 카드 / 회복력 모달 라운딩·색 버튼 / 시나리오 완료 토큰 두 자리

### §17 — 시나리오 나가기 + 디버그 복구 (6/11 피터공, 세션467)

- [x] §17.1 디버그 버튼 클릭 복구 — 테마 z-index:1 강등 제거 + z-index:1300 (카드 독이 우측 하단 클릭 가로채던 것)
- [x] §17.2 나가기 버튼 — 확인 모달 → 롤백(자원 스냅샷·이번 판 카드·pending) → 시나리오 선택 화면. node 시뮬 6건 PASS
- [x] texts.yaml 키 추가(exit_scenario·exit_confirm) + ui_texts.csv 재추출(277항목)
- [x] 피터공 정정 2차 — 디버그=**좌측 하단**(패널도 좌측, version 라벨은 우측 하단으로 스왑) / 나가기=**전체 윈도우 좌측 상단 코너, 검정**(HUD 밖 fixed, `~` 셀렉터 연동, 자원 바 padding-left 76px)
- [x] 빌드 산출물(index.html) 커밋 — 세션468 창 라운드(b74b90c~5a5fc90)에 포함되어 커밋·라이브 반영 확인
- [ ] 브라우저 확인 (피터공): 좌측 하단 디버그 클릭·초기화 / 좌측 상단 나가기 → 선택 화면·자원 원복

> [!info] 이 빌드(v1.3-mid)는 1차 교사 검토(5명) 피드백 반영 작업 빌드. 중등 수리 완료 후 v13-elem로 초등 분기(기존 v12-elem 6/1 시나리오 정본 이전).
> 요청 노트: [[요청.26.0608.0851-AI리터러시교사반영]] / 신규 명세는 SPEC §14.
>
> **v12-mid 빌드 결과(이전)**: 867,921 bytes / Git `97387fe` / 라이브 .../ai-literacy-delegation-boundary/v12-mid/

---

### v1.3 — 진행 상태 복원 + 재도전 노출 (SPEC §14, 1차 교사 피드백)

- [x] v12-mid → v13-mid 폴더 분기 + storageKey/version/eventLogKey/sessionIdKey v13 교체
- [x] §14.1 (최서연샘) 새로고침 시 현재 위치 자동 복원 — `14-init.js` initEntry에 `continueGame()` 분기
- [x] §14.2 (사성진샘) 완료 카드 재도전 버튼 + 기존 등급/점수 — `09-render-scenario.js` showStartScreen + `06-scenario-select.css`
- [x] §14.3 (피터공) 인벤토리 패널 하단 "처음부터 다시"(전체 초기화) — `13-inventory.js` + `confirmReset`
- [x] §14.4 (피터공) 시나리오 카드 라벨 정리 — next 카드만 하늘색 PLAY 배지, '자유 선택' 제거 — `09` + `06-scenario-select.css`
- [x] 빌드 + 마커 검증
- [ ] 브라우저 3건 동작 확인 (피터공): 새로고침 복원 / 완료 카드 재도전 / 인벤토리 처음부터
- [ ] 재도전 확인 모달 필요 여부 판단 (우발 클릭 관찰 후)
- [ ] 나머지 교사 피드백 항목 작업 순서 정리 (항목별 대응표 기반: S5 다른 버그·S4·S3·S2·S6)
- [ ] (배포 전) 라이브 배포 경로 + 커밋

---

## TASKS — v1.0 (역사 본문, v1.1 시점에서 계승)

**현재 Phase**: Phase 8 완료, 다음 — 5시나리오 플테 + QA
**v0.9 마지막 커밋**: 928c740
**v1.0 커밋**: a0915f8 (Phase 0 + Phase 1~4 통합)
**빌드**: 832,048 bytes (v1.0 시점, 현 v12-mid = 867,921)
**스타일 가이드**: [[AI 리터러시 게임 — 스타일 가이드]]

---

### Phase 0 — 빌드 준비 ✅

- [x] v10 폴더 생성 + v09 코드/데이터 복사
- [x] storageKey 교체 (v09→v10)
- [x] eventLogKey + sessionIdKey 교체 (v08→v10)
- [x] title / vtag 교체 (v0.9→v1.0)
- [x] template 재생성 (v09 desync 해결)
- [x] build.py 빌드 검증 (829,037 bytes)
- [x] SPEC / PLAN / TASKS 작성

---

### Phase 1~4 통합 — Neo-Brutalism 전면 적용 ✅

피터공 피드백("색 없이 테두리만 두꺼워졌다")으로 Phase 1~4를 합쳐서 한 번에 적용.

**Phase 1 — CSS 토큰 + 전역 리셋 ✅**
- [x] `:root` CSS custom properties 선언 (surface, ink, accent 4색+변형, geometry, font)
- [x] body background: `#f5f5f5` → `var(--bg-page)` (#d0d0d0)
- [x] 나눔손글씨 펜 @import 추가
- [x] font-family 변수 적용 (`--font-main`, `--font-hand`)
- [x] border-radius 전역 0 리셋 (30건, 원형 50% 7건 유지)
- [x] border 통일: 옅은 회색 → `var(--border-w) solid var(--ink)` (12건)
- [x] box-shadow 통일: 블러 → `var(--shadow)` 4px offset 단색 (10건+)
- [x] JS 인라인 스타일 border-radius/shadow/border (12건)

**Phase 2 — 버튼 체계 통일 ✅**
- [x] `.start-btn` — bg:#111,color:#fff → yellow bg, black text, 4px shadow
- [x] `.advance-btn` — 동일
- [x] `.next-btn` — 동일
- [x] `.action-main` — 동일 (Display 크기 유지)
- [x] `.action-secondary` — ghost 스타일 (white bg, black text)
- [x] `.lvup-confirm` — yellow
- [x] `.rp-confirm` — yellow, disabled=bg-page
- [x] `.rp-btn` — white bg + 4px shadow, charging=yellow
- [x] `.recovery-card-btn.primary` — yellow
- [x] `.recovery-card-btn.secondary` — ghost
- [x] `.confirm-cancel` — ghost
- [x] `.confirm-destructive` — pink bg, black text
- [x] `.gameover-report` — yellow
- [x] `.gameover-restart` — ghost
- [x] JS 인라인 버튼 (replay-btn-grade, replay-btn-cut6) — yellow/ghost
- [x] 누름 피드백 통일: translate(2px,2px) + shadow-press

**Phase 3 — 카드·패널·모달 컴포넌트 ✅**
- [x] `.choice-card` — 3px border + 4px shadow + hover 리프트(-2px) + active 누름
- [x] `.choice-num` — yellow bg + black text + 2px border
- [x] `.panel` inactive — dashed ink-soft, bg-soft
- [x] `.panel.active/.done` — solid ink, bg-card, 4px shadow
- [x] `.modal-card` — 8px 8px 0 #000, radius 0
- [x] `.coupon-box` — border + 8px shadow
- [x] `.coupon-option` — 3px border
- [x] `.inv-tab` — radius 0, -4px 4px shadow
- [x] `.inv-card` — radius 0, 4px shadow
- [x] `.card-reward-card` — radius 0, 4px shadow
- [x] `.card-reward-card.growth-card` — dashed ink, bg-soft
- [x] `.recovery-card` — dashed ink, bg-soft, radius 0, 4px shadow
- [x] `.report-*` 섹션들 — border/shadow 교체
- [x] `.report-narrative` — bg-soft, 3px border, 4px shadow
- [x] `.report-narrative-cardtype` — bg:#111,color:#fff → yellow bg, black text
- [x] `.scenario-progress-strip` — 3px border, bg-soft, 4px shadow
- [x] `.scenario-card` — 3px border, 4px shadow
- [x] `.score-display` — 3px border, 4px shadow
- [x] `.gameover-card` — 8px shadow
- [x] `.card-inner` (시작화면) — white bg, 3px border, 8px shadow, h1 28px/800
- [x] `.binder-divider` — yellow 배경, 3px border

**Phase 4 — 색상 재매핑 ✅**
- [x] `.bipolar-fill.positive` — `#1a8c1a` → `var(--acc-mint-deep)`
- [x] `.bipolar-fill.negative` — `#c44` → `var(--acc-pink-deep)`
- [x] `.stat-num.positive/.negative` — mint-deep / pink-deep
- [x] `.pending-dot.positive/.negative` — mint / pink
- [x] `.cost-box-main` — pink-deep border, pink-soft bg
- [x] `.cost-box-effect` — mint-deep border, mint-soft bg
- [x] `.cost-formula-discount` — mint-deep
- [x] `.cost-formula-final` — pink-deep
- [x] `.card-chip` — mint-soft bg, ink text
- [x] `.insufficient-tag` — pink bg, black text
- [x] `.final-grade` — S/A mint-deep, C yellow-deep, D pink-deep
- [x] `.score-step-pts` — mint-deep
- [x] `.score-stat` — cyan bg, black text
- [x] `.inv-tab-badge` — pink
- [x] `.rp-bal-num.zero` — mint-deep
- [x] `.rp-bucket-num .waste` — pink-deep
- [x] `.gameover-resource-num` — pink-deep
- [x] JS `gaugeColorByPct` — mint/yellow/yellow-deep/pink
- [x] JS `gradeColor` — mint/black/yellow-deep/pink-deep
- [x] 브라우저 검증
- [x] 커밋 + 푸시 (a0915f8)

### 세션332 수정 (Phase 1~4 이후) ✅

- [x] 역량카드 배지: 텍스트 "역량카드 할인가능 – 할인 적용하기" + 블록 배치 + 1개도 선택 모달 필수
- [x] 적용 후 "{카드명} 역량카드 효과: -{N} 할인" + 비용 UI 실시간 갱신 + 할인+최종 동시 깜빡임
- [x] pending-dots 0점 정렬 (gauge-with-pending 래퍼)
- [x] choice-cost margin-top 1px
- [x] 할인 바닥값(DISCOUNT_FLOOR) 전면 폐지 — 전부 0
- [x] review 비용 계산 버그 픽스 (bid에서 전체 leaf 추출)
- [x] 어린왕자 시나리오 situation 텍스트 보강 (1문장→3문장)
- [x] 커밋 3건 push (f5b4c81, 166fa50, 6c685c0)

### Phase 4.5 — 이미지 프레임 효과 (SPEC §7.3) ✅

- [x] `.panel-image::after, .img-frame::after` — inset 5px 흰색 + 7px 검정 inner border
- [x] 리포트 카툰 이미지 — `class="img-frame"` 추가 (CSS ::after 공유)
- [x] 이미지 `width:100%; height:100%; object-fit:cover` 확인
- [x] 브라우저 검증

### Phase 5 — 인라인 하이라이트 + 손글씨 ✅

- [x] `.hl` 클래스 4종 CSS 정의 (hl--y, hl--c, hl--m, hl--p)
- [x] 튜토리얼 텍스트에 하이라이트 적용 (kw-time→hl--c, kw-energy→hl--p, kw-* CSS 삭제)
- [x] 피드백 한마디(awareness) — Cut6 + 리포트에 `--font-hand` 적용
- [x] 브라우저 검증

### 세션333 UX 수정 ✅

- [x] 다음 시나리오 버튼: 화면 하단 → Cut 6 패널 body 안으로 이동 (full-width yellow)
- [x] CUT 라벨: "CUT 3" → "3"만 표시 (숫자만)
- [x] 리플레이 버튼: A 등급에서도 제거 (S/A 없음, B ghost, C/D yellow)

### Phase 6 — 모션 통일 + 최종 검증

**모션 통일 ✅** (e363c50)
- [x] `transition: all` 전부 제거 → 구체 속성으로 (panel, resource-num, stat-num)
- [x] start-btn-large: bg:#111/color:#fff → yellow + press 0.05s
- [x] card-reward-confirm: bg:#111/color:#fff → yellow + press 0.05s
- [x] recovery-card-btn: all 0.15s → transform 0.05s, box-shadow 0.05s

**스타일 가이드 체크리스트** (미완)
- [ ] 5시나리오 여러 경로 완주 검증
- [ ] 전항목 최종 QA

---

### Phase 7 — UI 텍스트 분리 (texts.yaml 확장) ✅

**texts.yaml 확장** (258개 항목, 새 섹션 12개)
- [x] title_screen — 타이틀 화면 텍스트
- [x] start_screen — 시나리오 선택 화면
- [x] game_flow — 게임 진행 UI (질문, 버튼, 패널 라벨)
- [x] cost_labels — 비용 라벨 (시간/에너지/할인/최종)
- [x] hud — HUD (자원/역량 패널)
- [x] modals — 레벨업, RP 분배 모달
- [x] coupon — 할인 카드 선택
- [x] recovery — 회복력 특별 UI
- [x] config_texts — resultTextsByType, resultMoods
- [x] inventory_labels — 인벤토리 섹션 라벨
- [x] scenario_report — 시나리오 활동 리포트
- [x] final_report — 최종 리포트 확장

**JS 코드 수정** (하드코딩 → TEXTS 참조, fallback 유지)
- [x] _t() 텍스트 헬퍼 함수 추가 (00-config.js)
- [x] 09-render-scenario.js — 타이틀/시작/게임흐름/비용/쿠폰 배지
- [x] 11-report.js — 활동 리포트/최종 리포트/성장 리포트
- [x] 13-inventory.js — 인벤토리 섹션/카드 리워드/회복력 모달
- [x] 04-resources.js — 쿠폰 선택 UI
- [x] 05-modals.js — RP 분배 모달 미리보기/손실 텍스트
- [x] 03-engine.js — 회복력 카드 노트 텍스트
- [x] 10-event-handlers.js — 아는것의 힘 라벨
- [x] 14-init.js — applyUITexts 확장 (HUD, 레벨업, RP, 리셋 모달)

**CSV 변환 워크플로우**
- [x] texts_to_csv.py — YAML → CSV (258개 항목)
- [x] csv_to_texts.py — CSV → YAML (round-trip 검증 통과)

**빌드**: 861,582 bytes (이전 847,291 → +14,291)

---

### Phase 8 — 시나리오 데이터 CSV 편집 워크플로우 ✅

**scenarios.yaml 구조 분석** (세션340)
- [x] scenarios.yaml 전체 구조 분석 (9,604행, 5 시나리오, 20개 섹션)
- [x] tier2 포맷 차이 발견: delta 중첩(selfintro/groupwork/eorinwangja) vs 직접 del/know(career/studyplan)
- [x] reportData = finals 중복 확인 → rebuild 시 자동 재생성
- [x] 선택적 필드 목록화: earnedCards(100/135), item null(9건), basePoint(3시나리오), hiddenIssues(산발), domainLabel(career 누락), cuts/semesterClosing(시나리오별)

**CSV 스키마 설계 + 스크립트**
- [x] 3 CSV 분리: scenario_meta(5행×15컬럼) + scenario_choices(75행×32컬럼) + scenario_leaves(135행×45컬럼)
- [x] scenarios_to_csv.py 작성 — YAML → 3 CSV
- [x] csv_to_scenarios.py 작성 — 3 CSV → YAML (tier2 두 포맷 자동 판별)
- [x] round-trip 검증 통과 (deep_compare, 원본과 데이터 동일)
- [x] 빌드 검증: 861,610 bytes (YAML 포매팅 차이 +28, 데이터 동일)

**통합 빌드 스크립트**
- [x] update.py 작성 — csv_to_texts + csv_to_scenarios + build.py 한 줄 실행
- [x] --verify, --skip-texts, --skip-scenarios, -i 옵션
- [x] 동작 검증 (시나리오 verify 통과, 빌드 성공)

**문서 갱신**
- [x] SPEC §12 시나리오 CSV 워크플로우 + update.py 워크플로우 추가
- [x] PLAN Phase 8 + 데이터 소스 목록 추가
- [x] TASKS Phase 8 체크리스트 추가

---

### 볼트 노트 갱신

- [x] 세션 체크리스트 갱신
- [x] DN 오늘의 요청 등록

---

### S3 기획 수정 1차 — delegation 부호 (6/10, SPEC §15)

- [x] SPEC §15 작성 (선문후코)
- [x] scenarios.yaml 백업(`scenarios.yaml.before-s3-delegation-fix`) + 11건 수정 (tier1 B→0·C→− ×5, 어린왕자 C3 →−)
- [x] diff 검증 (의도 변경 외 ruamel 정규화뿐) + 백스페이스 0
- [x] build.py 재빌드 (870,941 bytes) + 산출물 부호 3건 확인
- [x] scenarios_to_csv.py 재생성 — CSV 레이어 동기화 검증
- [ ] 피터공 브라우저 확인 → 커밋
- [ ] (제안 대기) 진로·시험2주전 afterX 분화 보강
- [ ] (보류, S1 재밸런싱과 묶음) `++`/`--` ±2 활성화 — 갈래 2

---

### 논리정합 Phase 1~2 — SPEC §16 + 정합성 린터 (6/10, 세션457)

- [x] SPEC §16 작성 (선문후코) — 규칙 R1·R2·R3a/b/c·R4·R5·R8 기계 검사 형태 명세, R6/R7 보류
- [x] `scripts/check_consistency.py` 제작 — yaml 전수 검사, md+CSV 리포트, allowlist(`data/consistency_exceptions.yaml`) 지원, exit code
- [x] 명세 보정 2건 (코드 현실 반영): ① cardEarned는 성장카드 포함 지급 게이트(`03-engine.js:89`)라 D도 true가 정상 ② R1 카드 수는 실지급 기준(cardEarned=false→0)
- [x] update.py 끝에 린터 연결 (경고 전용, 빌드 차단 안 함)
- [x] 1차 실행 — **위반 33건** (R1 2·R2 1·R3a 2·R3b 5·R3c 22·R4 1, R5·R8 클린). 세션456 수기 발견(D카드 2곳·C없음 5곳·빈자리발견)과 정확히 일치 + 신규 발견(R3c 경로 밖 카드 22)
- [x] 아리공 1차 가설표 — 위반 33건을 수정 단위 18행으로 (`data/exports/검토_260610/정합위반_가설표_18행.csv` + Downloads 사본). 핵심 발견: 분석력 10건의 뿌리는 검토 선택지 태그의 시나리오 간 비일관 / 시험2주전 A계열 8결말 '문제해결적 사고' 복붙
- [x] 피터공 1차 결정 (6/10 저녁): ① 카드 지급선 — B 이상 검토 무관 카드 / C는 검토가 가른다(R1 무·R2/R3 유) / D 회복력만 ② 어린왕자 C1R3 = D 유지·카드 제거가 아니라 **C(60) 상향 + 카드 유지** ③ 텍스트-경로 정합(R9) 검사 필수 → SPEC §16 R3b 정교화 + R9 등록, 린터 갱신(위반 33→34건: C+R1 무카드 3곳 위반 해제, 카드 있는 4곳 위반 전환)
- [x] 가설표 v2 (16행, 34건 덮음) — `검토_260610/정합위반_가설표_v2_16행.csv` + Downloads 사본 (v1 폐기)
- [x] R9 텍스트-경로 정합 백도 5개 가동 (시나리오별 27결말 전수, `텍스트정합_{sid}.md` 산출 예정)
- [x] 백도 텍스트정합 5종 취합 — 확실 29 / 애매 22. 공통 패턴: 검토 단계 공유 문구(컷5·검토보충·리포트회고)가 B계열(AI) 기준으로 쓰여 경로 무관 일괄 배정 + 어린왕자 B3 경로 정의 혼동
- [x] **v22 일괄 정비 실행** (`data/migrate_v22.py`, 피터공 "가설대로 + 텍스트 모순까지 합쳐서 진행" 6/10 저녁) — 구조 16행 + 텍스트 확실 건, 변경 86경로. 백업 `scenarios.yaml.before-v22-migration`
- [x] 검증: **린터 8규칙 클린(위반 0)** / diff 86경로 전수 의도 일치 / 백스페이스 0·NFC / 빌드 870,918 bytes 새 문구 반영 / scenario CSV 3종 + 검토 매트릭스 재생성
- [x] 대조표 2종: `검토_260610/정비결과_v22_대조표.csv`(기계 추출 86행, Downloads 사본) + `.md`(읽기용)
- [ ] 피터공 대조표 재검토 (특히 텍스트 "수정 후" 문구 — 아리공 작성) → 이의 행만 재정비
- [ ] 피터공 브라우저 확인 → 커밋 (부호 11건 + v22 정비 묶어서)
- 보류: 텍스트 애매 22건 / 죽은 미러 필드 불일치(죽은 데이터 일괄 정리 때)
- [ ] Phase 3 일괄 정비 (백업+마이그레이션+diff+재빌드+CSV 동기화)

**발견 (별건)**: `update.py --verify`가 텍스트 라운드트립에서 실패 — ui_texts.csv `<br>` vs texts.yaml ` - ` 드리프트 (기존 문제, 이번 작업과 무관). 다음 텍스트 CSV 작업 때 정리 필요.

---

### UI 업데이트 트랙 + 카드 선택별 획득 트랙 (6/11, 세션460 신설)

> 별도 트랙 문서로 관리 (피터공 지시: 콘텐츠 작업과 다른 트랙). 상세 진행은 각 PLAN이 단일 소스.

- **HUD 개편**: [PLAN-ui-update.md](PLAN-ui-update.md) + [SPEC-ui-hud.md](SPEC-ui-hud.md) — 자원 바(아이콘·두툼·수치 좌정렬)·역량 원 7개 미터(주황3+초록·오버플로 링)·레이블 선택/능력·pending 세모 제거·중간 박스 제거·카드 토스트 라운딩+능력형 표시명(display 매핑, scenarios.yaml 무수정). 피터공 v3 확인 중.
- **카드 선택별 획득**: [PLAN-card-per-choice.md](PLAN-card-per-choice.md) + [SPEC-card-per-choice.md](SPEC-card-per-choice.md) — selfintro 파일럿 가동(지급 규칙 v0 데이터 도출, 결말 일괄 지급 대체, perChoice 카드는 다음 시나리오부터 쿠폰 가능). 파일럿 통과 시 Phase 2 전체 개편, KT(6/19) 전 완료 목표.
- 두 트랙 모두 커밋은 v22 검토 게이트와 묶어서 한 번에.

### 카드 UI/UX 수정 4건 (6/11, 세션462 — 피터공 요청)

> SPEC-ui-hud §4d + SPEC-card-per-choice §2b. 빌드 886,606 bytes (린터 클린, 헤드리스 로드 OK).

- [x] (1) 카드 획득 연출 교체 (파일럿) — 우측 획득 팝업(「선택」→○○ 획득!, X·클릭·4초 자동 닫힘) → 우측 레일에 팝 등장(위→아래 스택) → 컷6 체인 끝에 역량카드 버튼으로 순차 비행. 신설 `src/js/16-card-rail.js`. 검토 카드 지급을 컷6 일괄 → onReview 직후로 이동. 레일 정리 훅(시작·리플레이·리셋·시작화면). 모달 없는 경로(S/A) 팝업-비행 레이스 방어.
- [x] (2) 폰트 — `00-base.css`에 `button,input,select,textarea{font-family:inherit}` 전역 추가 (폼 요소 시스템 폰트 누수 차단). 손글씨 4곳·debug monospace 유지.
- [x] (3) 결말 재시도 모달 — primary/secondary 차등 제거, [다시 도전] [다음 시나리오] 동일 스타일 가로 배치. texts.yaml·ui_texts.csv 동기(btn_use_sub 제거).
- [x] (4) 검토 선택지 표기 R1~R3 → 1·2·3 (컷4 choice-num·컷5 chosen-title, 표시만).
- [ ] 피터공 브라우저 확인 (확인 포인트: 팝업 리듬·레일 위치와 역량카드 버튼 겹침·비행 연출·재시도 모달 톤)

### 논리정합 텍스트 보류 22건 정비 (6/11, 세션463)

> 피터공 결정: "어긋나게 읽힐 수 있으면 전부 경로 맞춤 수정". `data/migrate_hold22.py`, 백업 `scenarios.yaml.before-hold22`. 빌드 887,570 bytes (린터 클린, 드리프트 0, 인코딩 클린).

- [x] 공통 문구 돌려쓰기 회색지대 24곳 경로 맞춤 문구로 교체 (자기소개 6·모둠 3·진로 6·공부계획 9)
- [x] 등급-톤 모순 2곳 — 어린왕자 A3R1·B1R3 cut6Feedback을 B등급 톤으로
- [x] 카드 표기 불일치 — 어린왕자 A2R2 reportCardSummary를 domainCards와 일치 + 같은 결 A2R1·A2R3 덤 2건
- [x] 내부 메모 — studyplan matchGroups C1R3 note의 C2 설명 정정
- [x] 유지 판단 1건 — 어린왕자 C1R1 reportReflection (경로와 정합, 수정 안 함)
- [x] yaml→CSV 재추출(scenarios_to_csv.py)→빌드→린터 3층 동기화
- [x] 대조표 29행 `exports/검토_260611/정비결과_보류22_대조표.csv` + 구글 시트 + ~/Downloads 사본
- [x] 피터공 1차 확인 — 자기소개 1~5행 돌아보기 문장을 조건문 충고투 → 과거 서술로 재작성 지시·반영. v22 텍스트 40건도 같은 눈으로 전수 스캔(돌아보기 자리 클린, 컷6 격려체는 필드 양식이라 유지)
- [x] 커밋·푸시 8b865f4 (6/11)
- [ ] 피터공 CSV 전체 검토 (다운로드 `AI리터러시_정비_검토용_전체_대조표_260611.csv` 115행) — 이의 행 나오면 후속 수정

#### 6/11 세션465 — 컷6 폰트 + HUD 중앙 실시간 점수 그래프 (SPEC-ui-hud §4d-2 v5 보강 + §4e)

- [x] 컷6 awareness(결과 설명) 손글씨(나눔펜 22px) → Paperlogy 상속 16px (09-render-scenario.js)
- [x] HUD 3:5:3 분할 — 자원(3) : 점수 그래프(5) : 역량(3)
- [x] 중앙 0~100 시나리오 점수 그래프 + getLiveScore() (확정 전 tier1+tier2 points 합산, 검토 확정 시 CSV score 스냅)
- [x] icon-schoolhead.svg 머리/기어 패스 분리 인라인 — 기어 SMIL 회전(중심 11,10, 4s), 머리가 채움 끝 따라 이동, 점수 숫자 머리 좌측
- [x] 누적 SCORE(totalScore+score) 그래프 우측 + LV·XP 컴팩트 행 이동
- [x] 헤드리스 크롬 검증(0→25→47→92 스냅, 에러 0) + 스크린샷 확인, 빌드 893,384B 린터 0
- [ ] 피터공 라이브 확인 (그래프 리듬·머리 아이콘 위치·기어 속도)

#### 6/11 세션465 v6.1 — 피터공 라이브 확인 후 4건 (SPEC §4e-6)

- [x] XP 바 HUD 표시 제거 (exp/레벨업 시스템 무변, updateExpUI null-safe 재배열)
- [x] 중앙 배경 하늘색 → 흰색 (10-paperlogy 테마)
- [x] LV을 SCORE 숫자 아래 작은 한 줄로
- [x] 머리 아이콘 26px → 40px (XP 행 제거 공간 사용)
- [ ] 피터공 라이브 재확인

#### 6/11 세션465 — 카드 선택별 획득 Phase 2 전체 적용 (SPEC-card-per-choice §5)

- [x] 축→태그 맵 5종 추가 (15-card-per-choice.js) — selfintro 파일럿 맵 유지, 나머지 finals 최빈 태그
- [x] 대조표 135행 생성 (exports/검토_260611 + 다운로드) — 동일 26/차이 109/중복 8
- [x] SPEC-card-per-choice §5 명문화 + SPEC.md §16 주석 + PLAN Phase 2 체크
- [x] 빌드 893,934B + 린터 0 + 헤드리스 검증 (좋은 경로/D경로/일괄 지급 차단)
- [ ] 피터공: 대조표 검토 + 축→태그 맵 4종 확인 + "D도 검토하면 검토 카드" 판단 + 초등 반영 여부

#### 6/11 세션465 v6.2 — 미터 안 머리(스케치 IMG_4762) + 중복 획득 차단

- [x] 중앙 박스 drop shadow 제거 + 라운딩 16px + 밝은 하늘색 #e5f6fc
- [x] 트랙 알약형 44px — 머리(34px)가 안에, 0/100점 모두 안쪽 클램프, 낮은 점수 숫자 우측 플립
- [x] 중복 획득 차단 (피터공 "이미 받은 것을 또 받지는 않음") — 같은 시나리오 내, _ownedThisScenario
- [x] 초등 결정 기록: 중등 수정 완료 후 진행
- [x] 빌드 895,447B + 린터 0 + 헤드리스 검증(중복 차단·클램프·num-right)

#### 6/11 세션465 v6.3 — 머리 노랑 원 + 그림자 진짜 제거

- [x] rider = 노랑 원 36px + ink 테두리, 머리 24px 중앙 (채움 경계 비침 차단, 양끝 2px 클램프)
- [x] 테마 CSS의 score-display 그림자 그룹(5px 5px 0) 분리 — v6.2 box-shadow:none이 덮였던 원인

#### 6/11 세션465 v6.4 — 노랑 원 정합

- [x] 노랑 원 = 바 내부 높이(40px) / 초록 채움 우측 끝 = 원 우측 끝 (max(0px) 클램프) / 점수 숫자 흰색(플립 시 ink)

#### 6/11 세션465 — 중심잡기 태그 시나리오별 분산 (커밋 a15c99a, 기록 보충)

- [x] 피터공 "5번 모두 주체성은 좀" → groupwork 적응성·eorinwangja 호기심·career 호기심 (SPEC-card-per-choice §5 표)
- [x] 대조표 재생성 (중복 차단 반영, 동일 24/차이 111, 다운로드 사본 갱신)

#### 6/11 세션466 — 시나리오 화면 수정 5건 (SPEC-ui-hud §4f v7)

- [x] (1) 컷1 상황 텍스트 .situation-text 15px (03-overlays CSS)
- [x] (2) 비용 표기 — 시간 비용 − 선택 할인 = 비용 / 에너지 비용 − 능력 할인 = 비용 (texts.yaml cost_labels 키 개편 + ui_texts.csv 재생성)
- [x] (3) 할인 가능 선택지 텍스트 끝 초록 표식 .card-discount-mark (버튼 아님, coupon.choice_mark)
- [x] (4) 쿠폰 모달 확정 = 즉시 선택 진행 — onTier2/onReview 콜백 자기 재호출 (재클릭 단계 제거)
- [x] (5) 하단 cost-coupon-badge 제거 + _updateCouponBadge·blink CSS·badge 텍스트 키 삭제
- [x] 빌드 893,260B + 린터 0 + 인코딩 클린 + 헤드리스 검증(라벨 공식·표식 2개·모달 즉시 진행·에너지 소비)
- [ ] 피터공 브라우저 확인 — 컷1 폰트 크기, 표식 톤, 모달 확정 직행 리듬

#### 6/11 세션466 v8 — HUD 색·미터 0기준 + 컷3 위임 깊이 제거 (SPEC-ui-hud §4g)

- [x] (1) 자원 게이지 색 핑크 고정 (gaugeColorByPct 상수화 — 잔량별 변화 폐지)
- [x] (2) 원 미터 0개 시작·마이너스 폐지 — filled=clamp(raw,0,7), absorbPending 0 바닥, 채움 전부 초록 단일(주황 시작분 폐지)
- [x] (3) 점수 그래프 채움 #15803d (쨍한 초록, 구 할인 배지 색)
- [x] (4) 컷3 "위임 깊이: ±N" 제거 + texts delegation_depth 키 삭제·csv 재생성
- [x] 빌드 + 린터 0 + 인코딩 클린 + 헤드리스 8체크 (미터0·핑크·채움색·바닥0·dot1·깊이제거)
- [ ] 피터공 브라우저 확인

#### 6/11 세션466 v9 — 자원 미터 라운딩·흰 숫자·테두리 +1px (SPEC-ui-hud §4h)

- [x] 시간·에너지 게이지 알약형(radius 999px) + 채움도 라운딩
- [x] 게이지 숫자 흰색 (left 6→8px)
- [x] 알약 미터 테두리 2→3px (resource-gauge·score-graph-track, 테마 exp-bar 그룹 분리)
- [x] 빌드 + 헤드리스 5체크 (radius·border3·흰숫자·트랙3px·채움radius)
- [ ] 피터공 확인 — 원 미터 dot(토큰)도 3px로 갈지 (이번엔 알약형 둘만 해석)

#### 6/11 세션466 v9 보강 — 토큰 원 3px + 게이지 높이 26px (SPEC-ui-hud §4h v9 보강)

- [x] cm-dot·cm-overflow 테두리 2→3px (01-hud + 테마)
- [x] 자원 게이지 높이 22→26px (숫자 14px가 테두리에 닿던 문제)
- [x] 빌드 + 헤드리스 3체크

#### 6/11 세션466 v9 보강2 — 점수 머리 노랑 원 테두리 4px

- [x] score-graph-rider 테두리 2→4px + 빌드

#### 6/11 세션466 — 획득 팝업 컷 이미지 위 + 레일 비행 (SPEC-card-per-choice §2c) / 노랑 원 출렁임 동기 (SPEC-ui-hud §4e-10)

- [x] 팝업 앵커 = 선택 요약 컷 이미지(tier1→컷2·tier2→컷3·review→컷5), absolute 문서 좌표, scale 등장, 앵커 실패 시 우측 고정 폴백
- [x] 팝업 닫힘 시 미리보기 카드 고스트가 레일 슬롯으로 비행(0.5s) → 도착 시 레일 팝
- [x] rider left를 max/calc 문자열 → px 계산 (트랜지션 보간 복구, 채움 바와 같은 바운스)
- [x] 빌드 + 헤드리스 (over-image·컷2 겹침·비행 후 레일 1장·rider px)
- [ ] 피터공 확인 — 팝업이 이미지를 가리는 정도, 비행 톤

#### 6/11 세션466 — 획득 팝업 v2.1: 띠용 팝 + 이미지 하단 중앙 + 크게 (SPEC-card-per-choice §2c v2.1)

- [x] 등장 scale 0.3→1 오버슈트 바운스 0.45s / 이미지 가로 중앙·바닥 14px 위 / width 300px(≤1320 260)·padding 20/24·획득 글자 18px
- [x] 빌드 + 헤드리스 (하단 정렬·폭 300·패딩 24 — 중앙은 헤드리스 좁은 패널에서 화면 경계 클램프, 실폭 OK)

#### 6/11 세션466 v10 — 타이틀 화면 레트로 재작업 + 3화면 분리 (SPEC-ui-hud §4i)

- [x] 물마루 도입 — ../fonts/Mulmaru.woff2(99KB, OFL+LICENSE), @font-face, --font-pixel
- [x] 타이틀 → 튜토리얼(신설 showTutorialScreen) → 시나리오 선택 분리
- [x] 레트로 타이틀: 다크+스캔라인, 2줄 메인(흰/노랑+핑크 하드섀도, 띠용 등장), 서브 2줄, host_text, ▶ 시작하기 깜빡임
- [x] texts.yaml title_screen 개편 + tutorial_screen 신설 + csv 재생성(270항목)
- [x] 빌드 + 스크린샷 확인 + 3화면 흐름 헤드리스 + 린터 0
- [ ] 피터공 확인 — 타이틀 임팩트·배지(경기도 하이러닝) 유지 여부·재방문 스킵 필요성

#### 6/11 세션466 — 카드 독 + 팝업 중앙 보정 + UI 전체 물마루 (SPEC-card-per-choice §2d, SPEC-ui-hud §4i-6)

- [x] (1) 팝업 우측 밀림 수정 — 앵커를 rect → offsetLeft 체인(패널 slide-in transform 중 측정 문제)
- [x] (2) 카드 독 #card-dock — 우측 끝 상시, 인간중심 역량/능력 카드 2섹션, 획득 순서 스택, 클릭=상세 패널
- [x] 획득 = 팝업에서 회전(540°) 비행 → pending(점선) 칩 / 시나리오 완료 = 철컥(dockClunk) locked 고정
- [x] inv-tab 버튼 숨김(독 대체), 레일·종료 비행 폐기 (railClear/railFlyToInventory 이름 유지 호환)
- [x] UI 전체 물마루 — --font-main 1순위 교체 (Paperlogy 폴백)
- [x] 빌드 + 린터 0 + 헤드리스(독 표시·pending 1·철컥 후 locked) + 스크린샷 확인
- [ ] 피터공 확인 — 본문 픽셀체 가독성, 성장카드(회복력·도전력) 능력 섹션 배치, 빈 섹션 표시

#### 6/11 세션466 — 카드 독 v2 다듬기 5건 (SPEC-card-per-choice §2d v2 보강)

- [x] inv-tab·inv-panel 폐지 (독 클릭 동작 제거, 리셋=디버그 초기화만)
- [x] 섹션 레이블 13px / 칩 글씨 14px / 한 줄 표기(nowrap) + 독 폭 200px(≤1320 170)
- [x] pending = 진한 회색·컬러 없음·점선·깜빡임(dockBlink) → 철컥 때 컬러 입힘(_dockChipApplyLocked)
- [x] 빌드 + 린터 0 + 스크린샷 (locked 컬러 칩·pending 회색 점선 공존 확인)

#### 6/11 세션466 — 공통 타이틀 헤더 (SPEC-ui-hud §4i-7)

- [x] buildGameTitleHead() — 튜토리얼·시나리오 선택 상단에 "내가 할까? 시킬까? 그것이 문제로다!" + "AI 리터러시, 위임의 경계!"
- [x] 시나리오 선택 기존 h1 대체, "튜토리얼 다시 보기"를 분리된 안내 화면으로 연결
- [x] 빌드 + 두 화면 스크린샷 확인

#### 6/11 세션466 v10.1 — 타이틀 배지 문구·여백 + 타이틀 확대

- [x] 배지 "경기도 하이러닝 - AI 리터러시" + padding 7px 20px
- [x] 메인 타이틀 확대 — 줄1 최대 72px·줄2 최대 94px, 섀도 +1px씩
- [x] 빌드 + 스크린샷 확인

#### 6/11 세션466 — 튜토리얼 화면 레트로 전환 (SPEC-ui-hud §4i-8)

- [x] .retro-title 프레임 재사용 — 다크+스캔라인, 타이틀 헤더 다크 변형(흰+핑크 섀도·시안 서브)
- [x] "게임 안내" 노랑 픽셀 헤딩 + 안내 4문장 흰 테두리 박스+노랑 번호 칩(.rt-tutorial) + rt-start 계속 버튼
- [x] 빌드 + 스크린샷 확인

#### 6/11 세션466 — 시나리오 순차 진행 잠금 (SPEC.md §14.5)

- [x] 미완료 중 다음 카드만 진입, 그 뒤는 잠김(점선·흐림·잠김 칩) / 완료 재도전은 순서 무관 유지
- [x] startScenario 가드(미완료 && !next → return) — UI 우회 방어
- [x] texts mark_locked + csv 재생성, 빌드 + 헤드리스(잠김3·PLAY1·재도전1·가드) + 스크린샷
