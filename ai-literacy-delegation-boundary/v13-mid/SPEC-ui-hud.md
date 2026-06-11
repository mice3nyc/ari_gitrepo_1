# SPEC — HUD 자원·역량 미터 개편 (UI 업데이트 트랙)

> 2026-06-11 신설. 피터공 스케치 기반 HUD 상단 패널 개편 명세.
> 트랙 문서: [PLAN-ui-update.md](PLAN-ui-update.md) / 콘텐츠 트랙(SPEC.md §16 정합 규칙 등)과 별개 트랙.
> 근거 스케치·아이콘: `Assets/incoming/AI리터러시/UIUX/` — `260611_UI_시간에너지.jpg`, `260611_UI_선택능력.jpg`, `icon-time.svg`, `icon-battery.svg`

## 0. 설계 원칙

**작동 방식이 다른 두 수치를 시각 형태로도 가른다.**
- 소모성 자원(시간·에너지): **바 그래프** — 줄어드는 연속량.
- 상태인 역량(선택·능력): **원 채움 미터**(옛 비디오게임 하트미터) — 단계로 늘고 주는 상태.
- 둘 다 지금보다 큰 글씨·두꺼운 형태로 눈에 잘 보이게.

## 1. 좌측 자원 패널 (resource-bar)

- **[자원] panel-title 제거.** (`#resource-bar .panel-title` 요소 삭제, `hud.resource_title` 키 제거)
- 행 레이아웃: `[아이콘 24px] [레이블 17px bold] [——— 바 ———]` 한 줄.
  - 시간 아이콘: `icon-time.svg` (모래시계) 인라인 SVG.
  - 에너지 아이콘: `icon-battery.svg` 인라인 SVG를 **시계방향 90도 회전해 세워서** 사용 (`transform:rotate(90deg)`).
- 바: 높이 22px, 테두리 2px ink, 두툼하게. fill 색상 단계는 기존 `gaugeColorByPct` 유지(70%↑ 초록 / 50 노랑 / 30 주황 / 미만 핑크).
- **현재 수치를 바 위에 표시**: 트랙 우측 끝 안쪽에 absolute, 14px bold ink. (스케치의 "100" 자리)
- 변화 표시(±N float)·flash 애니메이션은 유지.

## 2. 우측 역량 패널 (stats-bar)

- **[역량] panel-title 제거.** (`hud.competency_title` 키 제거 — 스케치에 타이틀 없음, 좌측과 대칭)
- **레이블 변경**: 판단하는 힘 → **선택**, 아는것의 힘 → **능력**. 18px bold.
  - `texts.yaml` `hud.delegation`/`hud.knowledge` + `ui_texts.csv` 202~203행 동기 수정.
  - HUD 한정. 리포트·결말 텍스트의 "판단하는 힘/아는것의 힘"은 이번 범위 밖(§5).
- **양방향 바(bipolar) → 원 7개 미터로 교체**:
  - `filled = clamp(3 + raw, 0, 7)` — 원 7개 중 기본 3개 채움. **3개 = 기존 raw 0의 기준점.** raw +4면 만땅, raw −3이면 빈 미터(범위 밖은 표시만 클램프, 내부 점수는 그대로).
  - 원 지름 18px, 간격 6px. 채움 = ink(#111), 빈 원 = 2px ink 테두리.
  - 채움 수가 변하면 새로 채워진/비워진 원에 pop 애니메이션.
- **제거**: `stat-num`(+N effective 숫자), `bipolar-labels`(-10/+10), `.bipolar-gauge` 마크업. 원 개수가 곧 숫자다.
  - 비용 박스의 "할인 -N" 표시는 state 기반이라 영향 없음 (`effectiveCompetency`는 09-render의 비용 계산 표시에서 계속 사용).
- **pending dots 유지**: 미터 위 pending 원 마커(`renderPendingDots`)와 흡수(`absorbPending`) 흐름 그대로. 흡수 후 `updateStats()`가 원 미터를 갱신.

## 3. 변경 파일

| 파일 | 변경 |
|---|---|
| `src/index.shell.html` | panel-title 2개 삭제, 자원 행 마크업(아이콘+레이블+바+바 위 수치), bipolar → circle-meter 마크업 |
| `src/styles/01-hud.css` | 자원 행·두꺼운 바·바 위 수치, circle-meter, 기존 bipolar 클래스 정리 |
| `src/js/09-render-scenario.js` | `updateResourceUI` 그대로(타깃 id 유지), `setBipolar` → `setCircleMeter`, `updateStats`에서 stat-num 갱신 제거 |
| `src/js/14-init.js` | panel-title 주입 2줄 제거(요소 없어도 안전하지만 죽은 코드 정리) |
| `data/texts.yaml` | `hud.resource_title`·`hud.competency_title` 제거, `delegation: "선택"`, `knowledge: "능력"` |
| `data/ui_texts.csv` | hud 행 동기(198·201 제거, 202~203 값 교체) |

## 4. 바뀌지 않는 것

- 내부 점수(raw)·`effectiveCompetency`·비용 식·점수/등급 로직 전부 그대로. **이번 작업은 표시 계층만.**
- 중앙 score-display(LV/SCORE/XP), 인벤토리 탭, progress-strip 그대로.
- 자원 게이지 데이터 흐름(`gameState.resources`) 그대로.

## 4b. v2 — 6/11 피터공 브라우저 확인 후 수정 (같은 날 2차)

피터공 피드백 6건 반영.

1. **배터리 아이콘 방향**: rotate(90deg) → **rotate(270deg)** (1차가 거꾸로 섰음).
2. **원 미터 색**: 채움 1~3번째 = **주황(#f08c2e)**, 4번째부터 = **초록(var(--acc-mint-deep))**. 기본 3개(시작 상태)가 주황, 게임으로 얻은 칸이 초록.
3. **오버플로(raw > +4)**: 8번째 원을 추가하지 않는다. 7개 뒤에 **초록 테두리 빈 원이 깜빡이는** 오버플로 마커(`.cm-overflow`) 표시.
4. **"능력" 도메인 괄호 제거**: `updateDomainLabel()`이 "능력 (자기소개서)" 식으로 붙이던 것을 순수 레이블만으로. 특정 능력 표기는 카드가 담당.
5. **선택/능력 ±변화 화살표 제거**: `.stat-change-indicator`(초록/빨강 ±N float) 마크업·로직 삭제. 자원 쪽 인디케이터는 유지.
6. **획득 카드 토스트 디자인**:
   - 카드 박스 라운딩(border-radius 16px). 확보 버튼 드롭쉐도우 제거.
   - **도메인 카드**: "도메인 역량" 트랙 라벨 삭제. 카드명을 **능력형 표시명**으로 — 표현력→"표현 능력" 등 10종.
   - **인간중심 카드**: 1줄 "인간중심 역량-<b>축</b>"(앞 보통, 축 볼드) + 아래 **큰 글씨(24px)로 태그**(주체성·적응성 등).
7. **도메인 카드 능력형 표시명 — display 매핑 방식**: scenarios.yaml(카드명 476곳 참조, v22 콘텐츠 트랙 파일)은 **건드리지 않는다**. `texts.yaml` domainCards에 `display:` 필드 추가, 전역 헬퍼 `_cardDisplayName(label)`(00-config.js)이 렌더 시점에 교체. 적용 지점: 획득 토스트 / 인벤토리 패널 / 리포트 도메인 격자 / 쿠폰 팝업·적용 배지(04-resources display 필드). 내부 키·세이브 데이터는 기존 이름 유지.
   - 표시명 10종: 자기이해 능력 / 표현 능력 / 문해 능력 / 분석 능력 / 검토 능력 / 자료판단 능력 / 소통 능력 / 협업 능력 / 학습 능력 / 탐색 능력

## 4c. v3 — 6/11 피터공 2차 확인 후 수정

1. **자원 수치 좌정렬**: 바 위 숫자를 우측 끝 → **좌측 끝**(left:6px)으로.
2. **오버플로 링**: 7번째 원 옆의 별도 원 → **7번째 원을 둘러싸는 링**(26px, 초록 테두리, 깜빡임). circle-meter position:relative + 절대배치로 7번째 원 위에 겹침.
3. **좌우 박스 행 높이 정렬**: 시간↔선택, 에너지↔능력이 같은 높이로 보이게. `.resource-item`·`.stat` 모두 `flex:1` + 세로 중앙정렬 — panel-row의 stretch로 두 박스 총높이가 같아지고, 행이 균등 분할되어 좌우 줄이 맞는다.
5. **pending 세모 마커 제거**: 미터 위에 뜨던 초록/빨강 삼각형(pending-dots, 이번 시나리오 변동 예고)을 HUD에서 제거. pending 점수 로직 자체는 유지(시나리오 끝 흡수 시 원 미터가 갱신됨) — 표시만 제거. JS는 null-safe라 마크업만 삭제.
6. **자원/역량 박스 테두리 제거**: 시간·에너지, 선택·능력을 둘러싼 중간 박스(.resource-bar/.stats-bar의 border+드롭쉐도우+배경)를 투명화. 바깥 panel-row 박스가 이미 테를 두르고 있어 중복. 중앙 score-display·progress-strip 박스는 유지.
4. (결정됨 → 별도 트랙) **카드 지급 시점**: 매 선택마다 획득으로 전환, selfintro 파일럿 가동. [SPEC-card-per-choice.md](SPEC-card-per-choice.md) 참조.

## 4d. v4 — 6/11 카드 UI/UX 수정 4건 (피터공 3차)

1. **카드 획득 연출 — 우측 팝업 + 레일 + 종료 비행**: [SPEC-card-per-choice.md §2b](SPEC-card-per-choice.md) 참조 (별도 트랙).
2. **폰트 — 손글씨 빼고 전부 Paperlogy**: `--font-main`은 이미 Paperlogy 1순위. 구멍은 폼 요소(button·input·select·textarea)가 폰트를 상속하지 않는 것 — `00-base.css`에 전역 `button,input,select,textarea{font-family:inherit;}` 추가로 일괄 차단. `--font-hand`(나눔펜) 4곳(완료 배너·awareness·리포트 캡션·피드백)은 유지. debug 패널 monospace는 내부 도구라 유지.
   - **v5 보강 (6/11 피터공 4차)**: 컷6 awareness(결과 설명, shortFeedback)도 Paperlogy로 전환 — 손글씨 22px → 본문 상속 16px (`09-render-scenario.js` result-awareness에서 font-family 오버라이드 제거). 손글씨 잔존: 완료 배너·리포트 캡션·리포트 피드백 3곳.
3. **결말 재시도 모달 버튼 동일 위계**: `showRecoveryCardModal`의 primary(노랑 강조)/secondary 차등을 없애고 **같은 스타일 두 버튼을 가로 나란히** — [다시 도전] [다음 시나리오]. 흰 배경+ink 테두리+같은 그림자. `texts.yaml` `recovery.btn_use: "다시 도전"`, `btn_skip: "다음 시나리오"`, `btn_use_sub` 제거 + `ui_texts.csv` 232~234행 동기.
4. **검토 선택지 번호 표기**: R1~R3 → **1·2·3** (표시만, 내부 id·세이브·린터 무변). 적용 2곳 — 컷4 choice-num(09-render §23), 컷5 chosen-title. 데이터(texts.yaml)에는 R 표기 없음 확인.

## 4e. v6 — 6/11 중앙 실시간 점수 그래프 (피터공 5차)

> 의도: 시나리오 진행 상황을 실시간 점수로 보여줘 이해와 몰입을 높인다.

1. **HUD 3:5:3 분할**: panel-row를 좌(자원 3) : 중앙(그래프 5) : 우(역량 3) flex 비율로. `.resource-bar{flex:3}` `.score-display{flex:5;min-width:0}` `.stats-bar{flex:3}` — 기존 `flex:1`/`flex:0 0 auto;min-width:180px` 대체. 반응형(≤800px) 미디어쿼리의 `.score-display-row`도 `.score-graph-row`로 동기(05-report-and-debug.css).
2. **중앙 메인 = 시나리오 점수 그래프 (0~100)**: 가로 바. 채움 폭 = 현재 시나리오 실시간 점수(%). 선택 결과마다 0.6s 트랜지션으로 늘어남.
   - **실시간 점수 정의** (`getLiveScore()`, 03-engine.js): 검토 확정 전 = tier1.points + tier2.points 누적(합산 모델 단계값, basePoint+varPoint). 검토 확정 후 = `gameState.score`(CSV fin.score, 단일 진실 — §6.6.1과 일치, 합산치와 다르면 확정 시점에 스냅). 0~100 클램프. 데이터 무변.
3. **머리 아이콘 + 기어 회전**: 채움 바 우측 상단(트랙 위)에 `icon-schoolhead.svg` (출처: `Assets/incoming/AI리터러시/UIUX/`). 점수가 오르면 채움 끝을 따라 이동(left % + 같은 트랜지션). 원본 SVG는 단일 path(서브패스 4개) — 머리(0·1)/기어 톱니(2)+구멍(3)을 두 path로 분리해 인라인 임베드, 기어만 `<g>`로 감싸 SMIL `animateTransform rotate` 중심 `(11,10)` 4s 무한 회전.
4. **점수 숫자**: 머리 아이콘 좌측에 현재 시나리오 점수 숫자(실시간). 변동 시 numPulse.
5. **누적 SCORE**: 그래프 우측 옆 블록에 `SCORE` 라벨 + 전체 누적 점수 = `totalScore + score`(시나리오 총점 확정[applyReview] 시점에 합산돼 보임, goNextScenario에서 totalScore로 흡수 — 표시값 연속). 기존 `#score-num` 재사용(09-render 갱신식만 변경, 컷5 pulse 사이트 유지).
6. ~~**LV·XP 유지**: 그래프 아래 컴팩트 행(LV 라벨+숫자 + XP 바)으로 이동.~~ → **v6.1 (피터공 라이브 확인 후 4건)**:
   - **XP 바 HUD 표시 제거** — 산만. exp/레벨업 시스템·로직은 무변, HUD 마크업만 제거 (`updateExpUI`는 lv 갱신을 fill 가드 앞으로 옮겨 null-safe).
   - **LV은 SCORE 숫자 아래** 작은 한 줄(`LV n`)로.
   - **중앙 배경 하늘색(--acc-cyan) → 흰색(--bg-card)** — 칙칙함 제거 (10-paperlogy 테마 오버라이드 수정).
   - **머리 아이콘 26px → 40px** — XP 행 제거로 생긴 공간을 헤드존(40px)에 사용.
7. **v6.2 (6/11 피터공 스케치 `IMG_4762.jpg`)** — 머리가 미터 **안**으로:
   - **중앙 박스**: drop shadow 제거 + 라운딩(16px). 배경 = 밝은 하늘색 `#e5f6fc`(노랑 전환은 한 줄). ink 테두리는 유지.
   - **트랙**: 알약형(pill, radius 999px) + 높이 44px — 머리 아이콘(34px)이 트랙 안에 들어감. 헤드존(트랙 위 레인) 제거.
   - **머리 위치**: 채움 끝, 항상 트랙 안쪽 — `left:calc(s% − s/100×머리폭)`로 0점=좌측 끝 안쪽, 100점=우측 끝 안쪽 클램프.
   - **점수 숫자**: 바 안에서 머리 좌측. 점수가 낮아 좌측 공간이 없으면(<18) 머리 우측으로 플립(`.num-right`).
8. **v6.3 (6/11 피터공)** — 머리 정리:
   - **머리를 노랑 원 위에**: rider = 노랑(--acc-yellow) 원 36px + ink 테두리 2px, 머리 아이콘은 그 위 중앙(26px). 머리 뒤로 그래프 채움 경계가 비치는 문제와 라운딩 바 안 위치 애매함 해결.
   - **중앙 박스 drop shadow 진짜 제거**: 10-paperlogy 테마의 `.score-display, .scenario-progress-strip` 그룹 그림자(5px 5px 0)가 v6.2의 `box-shadow:none`을 덮고 있었음 — 그룹에서 score-display 분리.
9. **v6.4 (6/11 피터공)** — 노랑 원 정합:
   - **노랑 원 = 바 높이** (트랙 내부 40px 꽉 채움).
   - **초록 채움의 우측 끝 = 노랑 원 우측 끝** 일치 — rider left = `max(0px, s% − 40px)`. 0점 부근에선 좌측 0에 클램프(원이 채움보다 클 때).
   - **점수 숫자 흰색** (초록 채움 위). 낮은 점수로 우측 플립(.num-right) 시엔 흰 트랙 위라 ink 유지.
10. **v6.5 (6/11 세션466, 피터공)** — 노랑 원 이동을 초록 바 출렁임과 동기: rider left를 `max(0px, calc(s% − 40px))` 문자열 대신 **px로 계산**(트랙 clientWidth × s/100 − 40, 0 클램프). CSS math 함수 문자열은 트랜지션 보간이 안 걸려 원이 점프하던 것 — px면 채움 바와 같은 0.6s 바운스 베지어로 함께 출렁인다. 리사이즈 시 다음 갱신까지 px 고정(허용 한계).

## 4f. v7 — 6/11 시나리오 화면 수정 5건 (피터공 6차)

1. **컷1 상황 텍스트 폰트 확대**: situation.text `<p>`에 `.situation-text` 클래스 — 본문 상속 13px → 15px (제목 .highlight 18px과 위계 유지). `03-overlays-and-board.css`.
2. **비용 표기 정리**: 라벨 변경 — 시간 줄 `시간 비용 [N] − 선택 할인 [N] = 비용 [N]` / 에너지 줄 `에너지 비용 [N] − 능력 할인 [N] = 비용 [N]`. 할인이 하나도 없으면 기존 기본형(`시간 비용 N / 에너지 비용 N`) 유지. `texts.yaml` cost_labels: `discount` → `time_discount: "선택 할인"`·`energy_discount: "능력 할인"`, `final_time`/`final_energy` → `cost_final: "비용"`. 에너지 할인 숫자는 능력(지식)+역량카드 합산(기존 clampedEnergy 그대로).
3. **역량카드 할인 표식**: 할인 가능 선택지의 메인 선택 텍스트 끝에 초록 박스+흰 글씨 `역량카드 할인 가능` 표식. 버튼 아님 — 클릭 대상은 선택지 카드 전체. `.card-discount-mark`(04-choice-cards.css), 문구 `texts.yaml` `coupon.choice_mark`.
4. **모달 확정 = 즉시 선택**: 할인 가능 선택지 클릭 → 쿠폰 모달(기존 역량카드 적용 화면) → 확정 버튼 클릭 시 **바로 그 선택지로 진행**. 기존엔 모달 닫힌 뒤 같은 선택지를 다시 클릭해야 했음. `onTier2`/`onReview`의 showCouponSelect 콜백에서 선택 저장 후 자기 재호출.
5. **하단 초록 배지 제거**: 비용 박스 아래 `cost-coupon-badge`("역량카드 할인가능 – 할인 적용하기") 렌더 제거. 적용 후 비용 갱신·blink를 담당하던 `_updateCouponBadge`는 즉시 진행으로 불필요 — 삭제. `texts.yaml` `coupon.badge_available`/`badge_applied_format` 제거.

## 4g. v8 — 6/11 HUD 색·미터 0기준 + 컷3 위임 깊이 제거 (피터공 7차)

1. **자원 게이지 색 핑크 고정**: 시간·에너지 바의 잔량별 색 변화(70%↑초록/50%↑노랑/30%↑짙은노랑/핑크)를 폐지하고 **비용 색(--acc-pink-deep)으로 고정**. `gaugeColorByPct()`가 상수 반환 (updateResourceUI·자원토큰 분배 모달 충전 애니메이션 공용).
2. **선택/능력 원 미터 0 기준**: filled = `clamp(raw, 0, 7)` — **0개부터 시작해 채워나감. 마이너스 개념 폐지.**
   - 기존 `clamp(3+raw, 0, 7)`(3개=raw 0 기준점, 1~3 주황 시작분/4~7 초록 획득분) 폐기 — §5 열린 항목 "원 7개 숫자 로직"의 피터공 결정.
   - **엔진도 0 바닥**: absorbPending에서 `value = max(0, value+pending)` — raw가 음수로 내려가지 않음. 비용 공식의 페널티(+) 분기는 자연 사장(코드는 안전망으로 유지).
   - 채움 색은 전부 초록(--acc-mint-deep) 단일 — 주황 "시작 상태" 구분 소멸. 오버플로 마커는 raw>7로 이동.
   - 음수 pending(손실 예고 빨강 dot)은 유지 — 손실 자체는 있되, 누적이 0 밑으로 안 내려갈 뿐.
3. **점수 그래프 초록 = 쨍한 초록 #15803d**: 채움색 --acc-mint-deep(#219b6c) → `#15803d`(구 역량카드 할인 배지 초록).
4. **컷3 "위임 깊이: ±N" 표기 제거**: 2차 선택 요약(chosen-summary)의 chosen-way 줄 삭제. `texts.yaml` `game_flow.delegation_depth` 키 제거 + ui_texts.csv 재생성. 컷2(1차 선택 desc)·컷5(검토 supplement)의 chosen-way는 유지.

## 4h. v9 — 6/11 자원 미터 라운딩·흰 숫자·테두리 +1px (피터공 8차)

1. **시간·에너지 게이지 양끝 원-라운딩**: `.resource-gauge`·`.resource-gauge-fill` border-radius:999px (점수 그래프 트랙과 같은 알약형).
2. **게이지 숫자 흰색**: `.resource-num` ink → #fff (핑크 채움 위). 알려진 한계: 잔량이 아주 낮으면 숫자 좌측(6px)이 흰 트랙 위에 걸칠 수 있음 — 발생 시 점수 그래프의 num-right 플립 패턴 이식.
3. **라운딩(알약) 미터 테두리 +1px**: `.resource-gauge`·`.score-graph-track` 2px → 3px. 테마(10-paperlogy)의 `.resource-gauge,.exp-bar` 그룹에서 resource-gauge 분리(exp-bar는 2px 유지). ~~원 미터 dot(선택/능력 토큰)·노랑 원 rider는 2px 유지~~ → **v9 보강(피터공 9차)**: 토큰 원(cm-dot)·오버플로 링도 3px로 통일. rider(노랑 원)만 2px 유지.
4. **v9 보강 — 게이지 높이**: `.resource-gauge` 22px → 26px. 숫자(14px)가 3px 테두리에 닿아 보이는 문제 — 안쪽 여유 16→20px.
5. **v9 보강2 — 점수 머리 노랑 원(rider) 테두리 +2px**: 2px → 4px (피터공 10차).

## 4i. v10 — 6/11 타이틀 화면 재작업: 레트로 + 물마루 + 3화면 분리 (피터공)

> "타이틀 → 튜토리얼/안내 → 시나리오 선택으로 이어지면 좋겠다. 타이틀 화면을 레트로 게임스럽게. 타이틀이 빵! 하고 임팩트 있게."

1. **화면 분리**: 기존 타이틀+튜토리얼 한 화면 → ① `showTitleScreen`(레트로 타이틀) → ② `showTutorialScreen`(신설, 게임 안내 4문장) → ③ `showStartScreen`(시나리오 선택, 무변). 흐름은 항상 3단계(스킵 없음 — 재방문 스킵은 추후 판단).
2. **물마루(Mulmaru) 도입**: `ai-literacy-delegation-boundary/fonts/Mulmaru.woff2`(99KB, OFL 1.1, LICENSE 동봉) — `@font-face` `../fonts/` 상대 경로(images와 같은 패턴). `--font-pixel:"Mulmaru"`. 타이틀 화면 전용(본문 Paperlogy 무변).
3. **타이틀 카피** (texts.yaml title_screen 개편):
   - badge: "경기도 하이러닝" (구 heading의 발주처 표기를 상단 칩으로 보존 — 피터공 확인 포인트)
   - main_title 2줄: "내가 할까? 시킬까?" / "그것이 문제로다!"
   - sub_title 2줄: "AI 시대, 무엇을 맡기고 무엇을 직접 할 것인가!" / "AI 리터러시, 위임의 경계!"
   - host_text: 기존 3문장 유지 (딸깍하면…)
   - btn_start: "시작하기"
4. **레트로 디자인**: 풀스크린 ink 다크(#0a0a0a) + 스캔라인 오버레이(8% 미만) + 픽셀 그리드 잔광. 메인 타이틀 = 물마루 대형(클램프 34~64px), 줄1 흰색·줄2 노랑, 하드 픽셀 섀도(핑크+시안 2겹), **띠용 등장**(줄1 → 0.15s 뒤 줄2, scale 0.3→1 오버슈트). 서브 = 물마루 시안/흰. host_text = Paperlogy 흰 70%. 버튼 = "▶ 시작하기" 노랑 박스+하드 섀도+깜빡임(PRESS START 리듬).
5. **튜토리얼 화면**: 기존 튜토리얼 리스트 스타일 재사용(흰 배경), 헤딩 "게임 안내" + 4문장 + [계속 →]. texts `tutorial_screen` 섹션 신설(heading·btn_continue, items는 title_screen.tutorial에서 이동).
6. **UI 전체 물마루 전환 시도 (피터공)**: `--font-main` 1순위를 Paperlogy → **Mulmaru**로 (Paperlogy는 폴백 유지). Paperlogy 명시 지정 2곳(05-report 캡션류)·손글씨(--font-hand)는 무변. 확인 포인트: 본문 긴 텍스트(결과·돌아보기)의 픽셀체 가독성, 단일 웨이트라 bold가 합성 굵기로 뭉개지는지.

## 5. 미해결 / 다음 단계

- [ ] 원 7개의 **숫자 로직 정식 설계** — 획득·증감 단위를 7단계 기준으로 재설계 (피터공: "일단은 3개가 기존 0"). 콘텐츠 트랙 밸런스와 엮임.
- [ ] "선택/능력" 명칭을 리포트·결말 텍스트까지 통일할지 (현재 화면마다 명칭 다른 문제는 S3 점검 노트 참조).
- [ ] raw가 표시 범위(−3~+4) 밖으로 나갈 때 추가 신호(만땅 반짝임 등) 필요한지.
