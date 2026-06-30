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
7. **공통 타이틀 헤더 (피터공)**: 튜토리얼·시나리오 선택 화면 상단에 게임 타이틀 표시 — `buildGameTitleHead()`: 메인 한 줄("내가 할까? 시킬까? 그것이 문제로다!", 핑크 하드 섀도) + 서브("AI 리터러시, 위임의 경계!"). 시나리오 선택의 기존 h1(start_screen.heading)을 이 헤더로 대체("이건 AI한테 맡겨도 돼?" 서브타이틀 유지), 튜토리얼은 헤더 아래 "게임 안내" 유지. texts는 title_screen 키 재사용(start_screen.heading은 미사용화).
8. **튜토리얼 화면 레트로 전환 (피터공)**: 타이틀과 같은 다크(#0a0a0a)+스캔라인 프레임(.retro-title 재사용). 타이틀 헤더 다크 변형(흰 글씨+핑크 섀도, 서브 시안), "게임 안내" 노랑 픽셀 헤딩, 안내 4문장 = 흰 테두리+반투명 박스+노랑 번호 칩(.rt-tutorial — hl 하이라이트는 그대로 작동), [계속 →] = rt-start 재사용(.rt-now로 등장 딜레이 단축). v10.1의 배지·타이틀 확대와 동일 톤.
9. **튜토리얼 문안 v2 — 위임 정의 먼저 (피터공, 6/11)**: 자문 선생님 4학년 실전 검증("위임 단어 뜻 설명하고 시작했더니 다른 질문이 없었어요") 반영. 레슨은 도덕 아닌 게임 공략 문법으로(피터공: "AI 금지도 효율 찬양도 아니라 내가 갖춰야 한다는 것, 가르치는 톤이 아니게").
   - **위임 정의 블록**(`.rt-delegation` 신설, "게임 안내" 헤딩 바로 아래): 3줄 — "**위임**? 내 일을 다른 누군가에게 맡기는 것!" / "이 게임에서는, **내 일을 AI에게 시키는 것**이 위임이다." / "'위임할까, 말까?' = 'AI에게 시킬까, 내가 직접 할까?'" 강조 박스(노랑 테두리+반투명, 볼드는 노랑 하이라이트). texts `tutorial_screen.delegation_intro`(리스트 3행, HTML 볼드 허용).
   - **v2.1 보강 (피터공 11차)**: "위임을 아주 큰 글씨로 빵하고 보여주고 설명. 박스도 튜토리얼 설명과 다르게." → ① `delegation_word` 키 신설("위임") — 물마루 대형(클램프 46~78px), 노랑+핑크 하드 섀도(타이틀 줄2와 같은 족보), rtPop 띠용 등장. 정의 1행에서 "위임?" 제거(큰 글자가 대신함) → "내 일을 다른 누군가에게 맡기는 것!" ② 박스 차별화: 노랑 3px 테두리 + 노랑 틴트 배경(rgba 255,222,89,0.10) + **핑크 하드 섀도 8px**(튜토리얼 항목은 흰 테두리·무섀도) + 중앙 정렬.
   - **게임 안내 6줄**(기존 4줄 교체, texts `tutorial_screen.tutorial`): ①핵심 질문+비용 ②직접 하면 비싸지만 능력이 쌓이고 위임이 싸진다(능력 할인의 서사화) ③시간·에너지 배분=진짜 승부 ④검토가 점수를 가른다 ⑤등급→토큰→직접 충전 ⑥역량 카드=할인. 시간/에너지 hl--c/hl--p 하이라이트 유지.
   - **마무리 한 줄**(`.rt-tutorial-kicker` 신설, 리스트 아래·버튼 위): "이 게임의 비밀: 잘 시키는 사람은, 직접 해 본 사람이다." texts `tutorial_screen.kicker`.
   - 확정 문안 노트: [[26.0611 AI리터러시 튜토리얼 문안 — 위임이란!]]. ui_texts.csv 동기 필수.
   - **v2.2 (피터공 12차)**: ① 안내 5번 두 문장을 줄 분리(`<br>`) — "점수에 따라 등급과 자원토큰을 받는다." / "시간과 에너지는 토큰으로 직접 충전해야 한다." ② **튜토리얼 가로 배치**: 태블릿에서 세로로 너무 길어짐 → `.rt-tutorial`을 3열 그리드(좌→우 읽기, row-major)로. 920px 미만 2열, 600px 미만 1열 폴백. 위임 박스·키커 max-width도 그리드 폭(960px)에 맞춤.

10. **타이틀 상시 부팅 (피터공 13차: "타이틀부터 보는 방법이 없네")**: 기존 부팅은 tutorialSeen/진행 기록이 있으면 타이틀·튜토리얼을 건너뛰고 시나리오 선택으로 직행 → 타이틀을 다시 볼 입구가 없었음. 변경:
   - **부팅은 항상 타이틀부터** (레트로 PRESS START 관례). 단 시나리오 진행 중 새로고침 복원(§14.1 최서연샘)은 유지 — 그 경우만 타이틀 생략.
   - **[시작하기] 라우팅**: 처음(미시청) = 타이틀 → 튜토리얼 → 선택. 재방문(tutorialSeen) = 타이틀 → **부팅 플래시** → 선택(튜토리얼 생략, 다시 보기는 선택 화면 링크로).
   - 부팅 플래시는 `bootFlashTo(fn)` 헬퍼로 추출(§4j-1과 공용).
   - 선택 화면 하단에 **"타이틀 화면" 링크** 추가(tutorial-link 문법 재사용, 튜토리얼 다시 보기 옆). texts `start_screen.btn_title_again`.

## 4j. 6/11 — 레트로 ↔ 본게임 트랜지션 (피터공: "A + B 소량으로 가보자")

> 배경: [[26.0611 AI리터러시 레트로 타이틀과 본게임 디자인 연결 — 트랜지션 제안]]. 갈래 A(경계 연출) + B(레트로 토큰 소량 역수입) 채택.

1. **A — CRT 부팅 플래시**: 튜토리얼 [계속] 클릭 시 `.boot-flash` 오버레이(z-index 200) — CRT 켜짐 연출: 흰 가로선(scaleY 0.01)이 0.35s에 번쩍 → 세로로 펼쳐짐(scaleY 1) → 페이드아웃. 총 0.75s. 중간(0.38s)에 showStartScreen() 스왑, 0.75s에 오버레이 제거. enterFromTutorial()에서 처리.
2. **B-① — CTA 버튼**: 점검 결과 **이미 정렬됨** — advance-btn·action-main·next-btn 등이 노랑 배경+ink 3px 테두리+하드 섀도(--shadow 4px ink)로 rt-start와 같은 문법(차이는 섀도 색 ink vs 핑크뿐). 추가 작업 없음(기록만).
3. **B-② — 시나리오 카드 노랑 칩**: `.sc-num` 기본(테마 시안)과 **cleared(#555)를 노랑 사각 칩으로**(rt-tutorial 번호 칩과 같은 문법: acc-yellow+ink 테두리+ink 숫자). 순차 잠금 흐름에서 기본 상태가 거의 안 나타나 cleared가 노랑의 실제 자리(완료 의미는 §14.2 등급 뱃지가 전달). next는 핑크 유지(행동 유도), locked는 회색(잠김 구분). 카드 하드 섀도는 이미 있음(--shadow).

## 4k. 세션468 — 회복력 모달 라운딩 + 버튼 색/아이콘 (피터공)

> "회복력 팝업 창은 라운딩 코너 윈도우로 하자. 버튼은 다시도전에 되돌아가기 아이콘 추가하고 하늘색 버튼, 다음시나리오는 우측화살표 아이콘 추가하고 노랑색 버튼으로."

1. **창 라운딩**: `.recovery-card` border-radius 0 → **20px**(버튼도 10px로 동반 라운딩 — 직각 버튼이 라운딩 창 안에서 겉돌지 않게).
2. **다시 도전 = 하늘색 + ↺**: `#recovery-use-btn`에 `.use` 클래스 — `--acc-cyan` 배경 + 앞에 되돌아가기 아이콘(`↺`, growth-symbol과 같은 글리프).
3. **다음 시나리오 = 노랑 + →**: `#recovery-skip-btn`에 `.skip` 클래스 — `--acc-yellow` 배경 + 뒤에 우측 화살표(`→`).
4. **§4d-3과의 관계**: "두 버튼 동일 위계"는 유지(같은 크기·같은 행) — 색과 아이콘으로 방향성만 구분. 아이콘은 마크업 span(`.rcb-ico`)이라 texts.yaml 무변.

## 4l. 세션468 — 획득 팝업 인간중심 카드 한 줄 + 타이틀 "확보!" (피터공)

> "역량카드 획득 팝업에서 [인간중심역량]카드 명을 한줄로 표시해줘. 그리고 타이틀을 '주체성'에서 '주체성 확보!'로 하자."

1. **미리보기 카드 한 줄**: `_railCardVisual`의 hc 두 줄(axis 위 작은 줄 + tag 아래)을 **독 칩(§2d v2 ③)과 같은 한 줄 인라인**으로 — "중심잡기 주체성"(axis는 `.rail-card-axis` opacity 0.85, nowrap). 비행 고스트도 같은 비주얼 공유.
2. **타이틀 = "{카드명} 확보!"**: `.cep-title`을 `popup_title_format`("{cards} 확보!") 키로 — "주체성 확보!". 여러 장이면 "주체성 · 통합적 사고 확보!". ui_texts.csv 재추출 동기.

## 4m. 세션484 (6/15) — 컷 스크롤: HUD 인지 + 이미지 복귀 (피터공)

> "cut1,3 상단 박스가 항상 HUD 아래로 들어간 상태로 시작한다. 처음엔 무조건 상단부까지 다 보이고, [어떻게 할까?] 누르면 선택지 3개가 다 보이도록, 선택 후엔 다시 이미지가 보이도록."

문제: `activatePanel()`이 `scrollIntoView({block:'center'})`로 패널을 세로 중앙 정렬 → 이미지(정사각 ~360px)+본문으로 키 큰 패널의 상단이 sticky HUD(`.panel-row`, top:0) 밑에 가려짐.

1. **HUD 인지 스크롤 헬퍼**(`09-render-scenario.js`): `_hudOffset()` = `.panel-row`가 보이고 sticky/fixed일 때 그 높이. `_scrollPanelTop(panel)` = 패널 top을 `HUD높이 + 12px gap` 아래로 `window.scrollTo`.
2. **컷 시작 = 상단부터**: `activatePanel`의 center 스크롤 → `_scrollPanelTop`. 모든 컷(cut1~6)이 이미지·제목부터 보이게 시작.
3. **선택 후 이미지 복귀**: 다음 컷 활성화가 곧 `_scrollPanelTop` → 그 컷 이미지를 HUD 바로 아래로 올림(별도 로직 불필요). 데스크톱 3열 그리드에선 같은 행 컷이라 행 top으로 복귀 = 이미지 노출.
4. **선택지 펼침 = 3개 다 보이게**: `_scrollChoicesIntoView` 보강 — 질문+선택지 전체가 `뷰포트−HUD`에 들어가면 영역 top을 HUD 아래로(질문+3개 동시 노출), 넘치면 마지막 선택지를 `block:'nearest'`로.

## 4n. 세션484 (6/15 r42) — 시나리오 화면 전면 레이아웃 개편 (피터공 스케치)

> 스케치: `Assets/incoming/AI리터러시/UIUX/UI레이아웃 260615.png`. 요청: [[요청.26.0615.1637-시나리오UI개편]].
> 이번 라운드 = **레이아웃만**. 레벨 의미·비용 할인 단순화·카드 칸 밸런스는 다음 단계.

**HUD 재편 3구역 (좌:1fr / 중앙:44% / 우:1fr)** — `.panel-row` (피터공 6/15)
- **좌(`.resource-bar` flex:1)**: 시간/에너지 게이지, 좌정렬.
- **중앙(`.score-display` flex:0 1 44%)**: 폭을 기존의 ~2/3로 줄이고 좌우 1fr 사이에서 중앙. 맨 위 **`상황: {시나리오 제목}`**(`.hud-title`, `#hud-scenario-title`, updateStats에서 `'상황: '+title`) + 그 아래 점수 알약(rider). rider 숫자 = `getLiveScore()` = **해당 시나리오 점수**.
- **우(`.score-total-block` flex:1, align-items:flex-end)**: 우정렬. `#score-num` = **전체 누적**(`totalScore`만). **LV 줄 제거**(`score-lv-line` 마크업 삭제 — updateExpUI는 null-safe).
- **미터 제거**: `.stats-bar`(선택·능력 원형 7점)는 `display:none`으로 숨김 — **DOM·로직은 유지**(setCircleMeter/pending 무파손), 표시만 우측 레일 숫자로 이관.
- **컷 상단 가림 해결**: `.panel-row`가 fixed(약 116px)라 컨테이너가 그 아래 깔림 → `body.scenario-active #main-container { padding-top:132px }`로 상단 여백 확보(컷 꼭대기가 HUD 아래로 보이고 스크롤 정상). paperlogy의 `.panel-row + .container` 규칙은 사이의 `나가기` 버튼 때문에 안 먹음.

**레벨 숫자화 (A)**
- 능력·위임 = `competencies.knowledge.value` / `delegationChoice.value`. 내부 값은 0부터(raw, "3개가 기존 0" 보정 없음). **표시는 레벨 1부터**(피터공): `updateDockLevels()`가 `value+1`로 표시 — 시작 시 능력 레벨 1 / 위임 레벨 1, 역량 쌓이면 2·3. 레일 헤더 민트 박스(`.dock-level`)에 표시, `animateStat` 펄스.
- 글씨 크기(피터공): 헤더(내가할까?/시킬까?) 22px, 레벨 라벨+숫자 **같은 크기 18px**("능력 레벨 1"로 한 호흡에 읽힘).

**우측 레일 두 칸 (`#card-dock`)**
- `flex-direction:row`, width 300, `top:8px right:12px bottom:12px` — HUD와 같은 높이에서 시작, 상시 노출(showStats에서 on).
- **좌 칸 = 내가할까?(능력 레벨) → 능력카드**(domainCards, `dock-list-ab`). **우 칸 = 시킬까?(위임 레벨) → 인간중심 역량**(humanCentricCards) + **성장·회복력**(growthCards, (B)에 따라 hc 칸으로 이동). 각 칸: 헤더 + 민트 레벨 박스 + 카드 박스. 카드 쌓이면 칸 안에서 스크롤.
- 매핑 근거: 능력↑(knowledge) 선택 → 능력카드 / 위임↑(delegation) 선택 → 인간중심. 현재 획득 로직과 일치(§15 pilotCardsForChoice).

**페이지 레이아웃 — 그룹 중앙정렬**
- HUD + 그리드 + 레일을 한 그룹으로 묶어 **화면 중앙**에 둠(피터공: "좌우 정렬 아니라 중앙쯤"). `body.scenario-active`에 CSS 변수 `--bw`(그룹 폭 = min(1412px, 100vw-24px)) + `--gx`(좌측 여백 = (100vw-bw)/2). 그리드·HUD 폭 = `calc(--bw - 312)`(레일 300 + gap 12), 좌표 `--gx`. 레일 `left: calc(--gx + --bw - 300)` = 그리드 우측 끝 옆(gap 12). HUD는 그리드 폭에 맞춤(레일 미포함, 피터공: "HUD는 cut 폭보다 약간 넓은 정도").
- **함정**: 10-paperlogy가 `.panel-row`를 `position:fixed; left:50% translateX`(중앙)로 둠 → flex align-self/margin 다 무시. fixed의 `left`/`width`를 직접 덮어써야 함.
- 레일 헤더+레벨(`.dock-col-top`) = HUD 박스와 같은 스타일(둥근 카드+그림자), 그 아래 카드 자리(`.dock-cards-box`, 점선 둥근 박스).
- showStats/hideStats에서 scenario-active 토글(리포트·시작화면은 hideStats로 해제). ≤900px: 레일 static 하단 스택 + HUD 중앙 원복.

**컷 본문 무변 (6)**: 제목 중앙 표시는 반복일 뿐, 컷 본문 내용·구조는 그대로.

**반복 정정 (6/15 세션484, 피터공 스케치 재확인)**
- HUD `--hud-h`(116px)로 높이 고정 → 레일 박스(`.dock-col-top`)와 동일 높이. 컨테이너 `padding-top:calc(--hud-h+16)`로 컷 꼭대기가 HUD 아래 보임.
- **중앙(점수)**: 별도 카드 테두리 제거, 좌우 얇은 라인(`border-left/right 1.5px ink-soft`)으로만 구분. 제목(`.hud-title` 20px, 상단 여백) 위 + 점수 알약 아래(하단 여백). `space-between`.
- **SCORE**: 우정렬, LV 줄 삭제. **시간/에너지**: 좌정렬(flex:1).
- **레일 박스 = HUD 형식**: 화면 상단 부착(`#card-dock top:0`), 라운딩 없음(`border-radius:0; border-top:0`), HUD와 같은 높이. 헤더(내가할까?/시킬까? 22px) + 민트 레벨 띠(아래) = HUD 제목+알약 구조와 평행.
- **레벨 표시 1부터**: `value+1`(레벨 1 시작). **할인 = 레벨−1 = raw 값**(피터공 "n−1") — 이미 `_applyDiscount`가 그렇게 동작(시간할인=위임 raw, 에너지할인=능력 raw + 선택 카드). tier1은 비용·할인 0(설계).
- **할인 정보 블럭**(`.dock-discount`, 초록 #15803d): 레벨 박스 아래·카드 자리 위에 "에너지 할인 -N"(능력 칸=knowledge.value) / "시간 할인 -N"(위임 칸=delegationChoice.value). `updateDockLevels()`가 갱신.
- **카드 자리**(`.dock-cards-box`, 점선): `min-height:140px`(약 3개) + 콘텐츠로 성장.

## 4o. 세션485 (6/15) — 우측 두 컬럼을 HUD로 결합 (피터공 스케치)

> 스케치: `Assets/incoming/AI리터러시/UIUX/우측상단UI변경.JPG` (전체화면 4등분 중 우측 상단만). 요청: [[요청.26.0615.1933-HUD우측결합]].
> 피터공: "내가할까/시킬까 부분도 기본 HUD 디자인의 일부로 합치려고 해. 지금 디자인이 넘 복잡하거든." §4n에서 별도 박스(테두리+그림자)로 떠 있던 두 레일 컬럼 헤더를 **HUD 띠 하나**로 흡수.

**HUD 풀폭 + 우측 결합 (`.panel-row`)**
- `body.scenario-active .panel-row` 폭 `calc(--bw - 312px)` → **`var(--bw)`** (그룹 전체 폭). 좌(시간에너지)·중앙(제목+점수)·우(SCORE)는 그대로 그리드 위(`--bw - 312`)를 덮고, 새 우측 그룹이 그 옆 312 구역(카드 보관함 위)을 덮는다.
- **새 우측 그룹 `.hud-dock`**(panel-row 안, `.score-total-block` 다음): `flex:0 0 300px`, 두 칸 `.hud-dock-col`(좌=내가할까 / 우=시킬까). 각 칸 세로 = `.hdc-head`(헤더 18px) + `.hdc-level`(레벨 텍스트, **플랫** — §4n 민트 박스 폐지) + `.hdc-disc`(할인 박스).
- **점선 세로 구획**: HUD 각 섹션 경계를 `border-left: var(--border-w) dashed var(--ink-soft)`. score-display의 기존 좌우 solid 라인(§4n)도 점선으로. 두 hud-dock-col 사이도 점선.
- **할인 = 작은 박스** `.hdc-disc`: 초록 테두리(#15803d) 박스 + 라벨/숫자. **값 0이면 "에너지 할인 0"**("-0" 아님, 피터공). 값>0이면 "에너지 할인 -N". §4n `.dock-discount` 초록 텍스트 폐지.
- **단순화**: dock-col-top의 별도 border+box-shadow+민트 띠 제거. HUD 한 줄 안에서 점선으로만 구분 → 플랫.

**카드 보관함 (`#card-dock`)**
- _dockEl()에서 `.dock-col-top`·`.dock-discount` 마크업 제거 → **카드 박스 2개만**(`.dock-cards-box` × 2, id dock-list-ab/hc 유지).
- 위치: `top: var(--hud-h)`(HUD 아래 시작), 우측 정렬해 hud-dock 두 칸 아래로 정렬. height/scroll 로직 유지.

**로직**
- `updateDockLevels()`: 타깃 id(dock-level-ab/hc, dock-disc-ab/hc) HUD 안 새 위치로 유지(이동만, 로직 동일). 레벨=`value+1`(1부터, §4n 유지). 할인=raw 값(`n−1`, §4n 유지) — 표시만 0→"0".
- 카드 획득 비행(showCardEarnPopup): 타깃 list = dock-list-ab/hc 그대로라 무파손.
- ≤900px 폴백: hud-dock도 세로 스택으로 원복(HUD 중앙 복귀 규칙과 함께).

**v2 카툰화 (피터공 5건, 6/15)**
- 내가할까/시킬까 = `.hdc-head` 25px + 컬러 + 검정 하드섀도(`text-shadow:2.5px 2.5px 0 var(--ink)`). 두 칸 색 구분: **내가 할까(직접)=cyan-deep #17a2c2 / 시킬까(AI 위임)=pink-deep #d93a75**(게임 타이틀 핑크 하드섀도 족보).
- 레벨 = "능력 레벨 : 1" / "위임 레벨 : 1"(콜론 `.dl-sep`), 칸 색과 동일(cyan/pink). 민트 박스 폐지(§4n) 확정.
- 할인 박스 `.hdc-disc` = 초록 채움(#15803d) + 흰 글씨 + 검정 하드섀도, 크게(15px, padding 5/13).
- SCORE = `.score-total-block` "SCORE : 0" 한 줄 중앙정렬(라벨 17px + `::after` 콜론 + 숫자 27px).

**v3 레이아웃 균형 (피터공, 6/15)**
- **나가기 버튼 HUD 밖으로**: `.scenario-exit` 화면 우하단 고정(`bottom:16 right:16`). resource-bar 좌측 padding 제거(§4o v1의 52px·나가기 회피용 폐지) → 시간/에너지가 HUD 좌단부터.
- **시간/에너지 폭 확보(피터공 "!!!")**: 중앙 점수 그래프를 줄이더라도 자원 바 폭 우선. `.score-total-block` `0 1 auto`(내용폭만).
- **v4 동일 폭(피터공)**: 자원 영역 = 시나리오 점수바 영역 같은 폭. `.resource-bar`·`.score-display` 둘 다 `flex:1 1 0` → SCORE 내용폭·hud-dock 300 제외한 남는 폭을 절반씩.

**v5 카드 누적 + 레벨 0부터 (피터공, 6/15)**
- **같은 카드 ×N**: dockRender가 identity(`_dockChipKey`: hc=tag / growth·domain=label)로 묶어 한 칩에 `×N` 배지(`.dc-count`, count>1만). `_dockRenderGroup` 그룹핑. 칩 = flex(이름 좌·배지 우). 카드 비행(close)도 같은 카드면 기존 칩으로 날아가 count 갱신(`_dockCountFor`=인벤토리 총개수), 없으면 새 pending 칩. `_dockLockNow`도 ×N 유지.
- **레벨 0부터 = 할인 매칭**: `updateDockLevels` 레벨 표시 `value`(0부터, 기존 `value+1` 폐지) → 레벨 N ↔ 할인 N 숫자 동일. §4n "레벨 1부터" 폐지.

**v6 할인을 카드 박스 아래로 (피터공, 6/15)**
- HUD `.hud-dock`에서 할인(`.hdc-disc`) 제거 → 헤더+레벨만. 할인은 `#card-dock` 각 칸 카드 박스 **아래** `.dock-disc`로 이동.

**v7 할인 3줄 + 큰 숫자 강조 + 0 숨김 (피터공, 6/15)**
- `.dock-disc` = 3줄: `.dd-head`(내가 할까?/시킬까?) / `.dd-label`(에너지 할인/시간 할인) / `.dd-num`(**큰 숫자 -N**, 40px + 검정 하드섀도 3px, 칸 색). 잘 안 읽히던 한 줄(`.dd-val`) 폐지.
- **할인 0이면 블럭 전체 숨김**(`_setDockDisc`: `box.style.display=v>0?'':'none'`, id가 `.dd-val`→컨테이너 `.dock-disc`로 이동, 초기 `display:none`). >0이면 `.dd-num`에 `-N`. v2의 "0 표시"는 숨김으로 대체.

## 4p. 세션485 (6/15) — 비용 단순화 + 할인 효과 캐스케이드 애니메이션 (피터공)

> 요청: [[요청.26.0615.1933-HUD우측결합]] 연장. 할인이 "능력/위임을 쌓으면 비용이 깎인다"는 인과를 눈으로 보게 한다.

**할인 모델 통일 (피터공 확정)**
- **카드 매칭 보너스(-2/-3)·쿠폰 모달(`showCouponSelect`) 폐지.** 할인 = **레벨 총점만**: 에너지 할인 = `knowledge.value`, 시간 할인 = `delegationChoice.value`. `_applyDiscount`에서 `selectedCard`/`cardDiscount` 제거(energyDisc=knl). `getCardDiscountMark`→`''`(역량카드 할인 가능 표식 제거). onTier2/onReview의 쿠폰 분기·`_couponSelections`·`getTier2CostWithCard`/`getReviewCostWithCard` 경로 제거(단순 `getTier2Cost`/`getReviewCost`).
- 카드는 이제 **주목용**(할인을 만들어준 출처라는 표시), 기능적 선택 아님.

**비용 표시 단순화 (`buildCostHTML`)**
- 기존 공식형(`비용 N − 할인 N = 비용 N`) 폐지 → **한 줄 큰 글씨**: `시간 비용 : N` / `에너지 비용 : N`(`.cost-simple`>`.cost-line`). 초기엔 **raw(할인 전)** 표시, `data-raw`/`data-final` 보유.
- 할인 0(레벨 0)이면 정적 표시·애니 없음·즉시 클릭. 할인>0이면 캐스케이드.

**할인 캐스케이드 (`runDiscountCascade`)** — 선택지 렌더 후 호출(tier2·review). 애니 끝까지 **클릭 잠금**(`_cascadeBusy`, onTier1/2/Review 가드 + 카드 dim).
- 선택지 **위→아래 순서**로 1개씩. 할인 있는 선택지만(raw≠final). "펄스" = 커졌다 원복(scale, opacity 아님).
- 선택지 1개당 4스텝(시간·에너지 두 줄은 병렬로 함께):
  1. **비용 숫자** 펄스
  2. **적용 카드 1~2개** 펄스(해당 칸 최근 카드, 없으면 생략)
  3. **할인 -N 숫자**(dock `.dd-num`) 펄스
  4. 비용 **취소선+회색 → 화살표 → 새 가격** 두 번 펄스 후 멈춤
- 끝나면 다음 할인 선택지로. 전부 끝나면 `_cascadeBusy=false`.
- 적용 범위: 시간·에너지 모두. tier1(비용·할인 0)은 제외.

**v3 비용 한 줄 통합 (피터공, 6/15)**: 시간·에너지를 **한 줄에** — "시간 비용 : N | 에너지 비용 : N"(`.cost-simple` flex-row, `.cost-sep`="|"). 두 줄 wrap 방지(nowrap+13px — QA1 6/30: 태블릿 폭 비용 잘림 완화 위해 15→13px, `.choice-text`도 동반 15→13, `.choices-area`/`.choice-header` 마진 축소). **취소선·화살표 폐지** → 캐스케이드 스텝4가 비용 숫자(`.cost-num`)를 final로 교체 + 초록(`.discounted`) + 펄스×2(자리 절약).

**v4 레벨·할인 = 카드 장수 (피터공 A, 6/15)**: "카드 2장인데 레벨 3" 어긋남 해결. 기존엔 레벨=`competencies.value`(선택 누적 점수), 카드=시나리오 보상이라 트리거·속도가 달라 안 맞았다. → **레벨·할인을 보유 카드 장수로 통일**: 능력=내가할까칸 `domainCards.length`, 위임=시킬까칸 `humanCentricCards+growthCards` 수. `_abilityCardCount`/`_delegationCardCount`(16-card-rail) — `updateDockLevels`(표시)·`_applyDiscount`(비용 할인) 둘 다 이 출처. **보이는 카드 = 레벨 = 할인 = 비용 감소** 완전 일치. **리포트 학습자 유형은 `competencies.value` 그대로**(성향 측정, 카드 수와 별개 — 건드리지 않음).

**v4 카운트 락 기준 (세션486 수정 완료)** — 이전엔 카운트가 **현재 시나리오에서 막 획득한 pending 카드까지 즉시 포함**해서 레벨/할인이 시나리오 도중에 바로 올랐다. 수정: `_lockedCardCount(arr)` 헬퍼 신설 — `gameState.clearedScenarios.indexOf(card.scenario)>=0`인 카드만 센다(진행 중 시나리오 카드는 아직 미clear라 제외). `_abilityCardCount`/`_delegationCardCount`가 이 헬퍼를 통과. **결과**: 시나리오 도중 레벨/할인 0 유지 → 철컥 확보 후 `goNextScenario`가 `clearedScenarios.push` → **다음 시나리오부터 적용.** 모든 카드 entry는 `.scenario` 보유(03-engine·15-card-per-choice push). 비주얼(보관함 pending 칩 깜빡임 `_dockIsPending`)은 별개로 그대로, 카운트만 락 기준. 헤드리스 검증 통과(0/0→1/1→1/1→2/2).

## 4q. 세션486 (6/15) — 할인 효과 박스 (피터공: 펄스가 안 읽힌다)

> 문제: §4p 캐스케이드는 할인 -N 펄스가 화면 맨 오른쪽 dock 레일에서 일어나, 보고 있는 선택지와 동떨어져 **전혀 안 읽혔다.** → 효과를 **선택지 박스 바로 우측**으로 가져와 인과("이 카드들 때문에 이만큼 깎인다")를 눈앞에서 잇는다.

**레이아웃 (v3, 피터공 정정)**: 컷은 6칸 2줄 그리드(1·2·3 / 4·5·6). 선택지 옆 칸이 정보창: tier2(cut2)→**cut3**, review(cut4)→**cut5**. 옆 칸 패널에 `dfx-host`(active 전환), **타이틀 없음**. 각 효과 박스(`.choice-fx`)는 **대응 선택 버튼과 같은 크기·같은 줄**: 패널 본문에 상단 정렬 스페이서(cut2 `.choices-q` 높이)를 깔고, 선택지 순서대로 슬롯을 만든다 — 할인 있는 선택지는 `.choice-fx`, 없는 선택지는 같은 높이 `.fx-spacer`(빈칸). 모든 슬롯 `minHeight=대응 카드 offsetHeight`라 박스가 버튼 바로 우측 같은 높이에 온다. 선택지 옆 칸이라 **선택지 텍스트 반복 안 함**. 선택 확정 시 `showCut3Summary`/`showCut5Summary`가 `dfx-host` 제거+본문 교체. 선택지(cut2/cut4)는 full-width 유지.

> ⚠️ **아래 v2~v5 연출(타이핑·카운트다운·빵빵·자동 순차)은 v6에서 전면 폐기.** 피터공: "자동으로 나오니 넘 정신없다." 구현 히스토리로만 남김. 현행은 맨 끝 **v6** 참조.

**(구) 연출(`runDiscountCascade`)** — 할인 선택지만 위→아래 자동 순차. 한 박스 안 시간→에너지, 머리 팝→카드 빵빵→라벨 타이핑→-N+비용 카운트다운(2배 줌). *(v6에서 폐기)*

**카드 색(피터공 §4 정정)**: 카드 컬러코딩에서 **빨강 계열 제거** → 파랑·초록·보라로 재매핑(`data/texts.yaml` 16곳). 노랑은 칩이 흰 글자라 가독성 문제로 제외(원하면 도메인 카드[테두리형·검정 글자]에만 추가 가능). hc `중심잡기` 축 빨강→초록 등.

**v4 다듬기(피터공)**: ① 효과 카드 **항상 같은 크기 고정**(`.fx-clone` 88×30, 이름 wrap+clip). ② 시킬까→내가 할까를 **순서대로 교체**(쌓지 않음): `_animateFxSection`이 새 칸 추가 전 기존 `.fx-sec` 제거 → 박스가 선택지 크기 유지(끝엔 마지막=에너지 칸만 남음). ③ **위임(시킬까/hc) 카드 이름에 "역량" 추가**(`_hcName`: 주체성→주체성 역량) — dock·rail·획득팝업·fx 복제 일괄(도메인은 기존 `_cardDisplayName`이 "능력"형). ④ 효과 박스 **drop shadow 제거**.

**v5 다듬기(피터공)**: ① **줄 맞춤(절대배치)** — 문제: 박스가 cut3 칸 꼭대기부터 떠서 선택지와 어긋났다(cut2엔 1차요약+질문이 선택지를 아래로 밀어서, 미러로는 정확히 못 맞춤). 해결: cut3 host를 `position:relative`로 두고, 각 선택지 카드의 `getBoundingClientRect().top`을 측정해 박스를 `position:absolute; top=(card.top − host.top − host.clientTop)`에 배치 → 요약·질문·이미지 높이와 무관하게 **대응 선택지와 같은 줄·같은 높이**(minHeight=card height). 헤드리스 검증: card top [700,804] vs box top [699,804], 오차 ≤1px. ② **선택지에 더 가깝게** — `dfx-host` padding-left 2px. 컷 그리드 gutter 12px는 만화 레이아웃이라 유지(추가로 좁히려면 그리드 변경 필요). ③ **계산 끝나면 박스 사라짐**(`_fxFadeRemove`: 페이드 후 제거 — 절대배치라 제거해도 다른 박스 안 흔들림) + 전부 끝나면 cut3 본문 비우고 `position`·`dfx-host` 원복. 카드 cost 초록값은 cut2에 남음. ④ `show`/`burst`를 rAF→`setTimeout`(가시성 보장).

**v6 — 자동 애니 폐기, 정적 표시 + [적용확인] 버튼 (피터공: "자동으로 나오니 넘 정신없다")**: 타이핑·카운트다운·빵빵·자동 순차 전부 제거. *(v7에서 자원 단위 스텝 + 버튼 트리거 카운트로 진화 — 아래 v7 참조)*

**v7 — 자원 1개씩 스텝 + 버튼 누르면 큰 숫자 카운트 (피터공)**: 스텝 단위 = **(선택지 × 할인 자원)**. 한 박스에 자원 한 칸만 정적 표시: `시킬까!` + 카드(목록 디자인 복제, 정적) + 큰 숫자 줄 `[비용 raw] 시간 할인 [-0]`(`.fx-bignum`) + `적용확인` 버튼. **버튼 클릭 → 그때** 비용·할인 숫자가 `.counting`으로 더 커지고(42px), 할인 `-1..-N` 오르고 비용 `raw→final` 내림(각 스텝 펄스 `fxNumPulse`, 360ms) → 끝나면 cut2 해당 비용 final+초록 확정 → 박스 제거 → **다음 자원 칸**(시간→에너지) 또는 다음 선택지 박스. 즉 시간 할인 보고 → 누르면 카운트+에너지 할인으로 → 다시 누르면 카운트+다음 선택지. 마지막 스텝까지 끝나면 cut3 비우고 `dfx-host`·`position` 원복 + `_cascadeBusy` 해제(선택지 클릭 가능). 함수: `_fxBuildSectionBox`(자원 1칸 박스)·`_fxRunCount`(버튼 클릭 시 큰 숫자 카운트)·`_fxFillCards`·`runDiscountCascade`(스텝=선택지×자원 컨트롤러).

**v7.1 — 비용은 선택 버튼, 박스엔 할인 수치만 (피터공)**: ① 박스엔 **할인 수치(-N)만**(`.fx-disc-row`: 라벨 + `-N`). 실제 비용은 **선택 버튼(cut2)에서 큰 글씨**(`.cost-num.cost-zoom` 32px) — 스텝 박스가 뜨면 해당 라인 비용에 `cost-zoom` 부여. ② 버튼 `적용확인`→**`적용하기`**. ③ 클릭 시 `_fxRunCount`: 할인 `-N`에서 **줄어 사라지고**(−(N−k), 0이면 element 제거), cut2 비용 `raw→final`로 한 칸씩 감소(10→9→8→7). ④ 할인 다 적용되면 **할인 수치 사라지고**(disc 제거), 최종 비용 = final+초록 + **2번 깜빡**(`fxBlink2` opacity, 2회) **→ `cost-zoom` 제거(원래 크기 복귀)** → 다음 자원/선택지. 헤드리스 검증: 박스 disc=-3·비용박스없음·버튼 적용하기·cut2 10 zoom / 클릭 시 cut2 7 초록·zoom 해제·다음 박스 disc=-1 / 끝 cut3 비움·잠금 해제, ERR=[].

**v8 — 박스 레이아웃 재구성 (6/16 피터공, 레이아웃 먼저·기능은 다음 회기)**: 한 칸 박스를 3줄로 정리. ① **1줄 `.fx-head-row`**: `시킬까!`(헤드 볼드 강, 17px) 좌 + `위임레벨 N`(다른 색 — time=`--acc-yellow-deep`, energy=`능력레벨`·`--acc-mint-deep`) 우, space-between. 레벨 N = 해당 칸 카드 장수(`_fxLevelFor`: time→`_delegationCardCount`, energy→`_abilityCardCount`). ② **2줄 `.fx-cards`**: 카드 복제(`.fx-clone`)를 **넉넉한 동일 폭**(`flex:1 1 0`, min-width 72px, 높이 34px)으로 균등 분배. ③ **3줄 `.fx-apply-row`**: `←`(`.fx-arrow`, 선택지 가리킴) + `-N`(`.fx-disc` 32px 큰 글씨) + 라벨(`시간 할인`) + `[적용하기]`(`margin-left:auto` 우측 끝, 드롭쉐도우 `3px 3px 0`). 버튼·할인수치 id 유지 → `_fxRunCount`/클릭 핸들러 무변(레이아웃만). **다음 회기**: 기능 조정(카운트 연출·자원 스텝 흐름). 함수 `_fxBuildSectionBox` HTML 교체 + `FX_META.levelLabel` 추가.

**v8.1 — 카드 정리 (6/16 피터공)**: ① **카드 표시 최대 3장**(`_fxFillCards` `slice(0,3)`) — 여러 장이어도 딱 맞는 3장까지만. **할인 가격은 동일**(표시만 캡, -N 무변). ② **[적용하기] 버튼과 구별** — `.dock-card.locked`의 `box-shadow:2px 2px 0`가 클론에 상속돼 노란 버튼처럼 보이던 문제. `.fx-clone` `box-shadow:none` + `border-radius:8px`(박스 라운딩) + `.dc-name white-space:nowrap`+ellipsis(싱글라인). 버튼은 드롭쉐도우 유지 → 카드(라운딩·플랫)와 버튼(각짐·그림자)이 시각적으로 갈림.

**v9 — 자동 캐스케이드 폐기, 선택→선택할인→다음 (6/16 피터공)**: 기존 v7~v8은 선택지 펼치면 **모든 할인 선택지를 자동 순차**로 보여주고(전부 적용해야 선택 가능) → 바꿈: **선택지는 즉시 클릭 가능**, 플레이어가 한 선택지를 누르면 **그 선택지의 할인만**(시간→에너지) 박스로 띄우고 적용 후 진행. ① `showTier2Choices`/`showReviewChoices`의 `_scheduleCascade` 호출 폐기(함수는 호환 유지·미사용) — 펼침 즉시 클릭 가능. ② 클릭 핸들러 `onTier2`/`onReview` → **`selectChoiceWithDiscount(id,card,proceedFn,targetCut)`**: 그 카드의 할인 라인 있으면 `runChoiceDiscount`(클릭 카드 한정 스텝, 시간 먼저) 돌린 뒤 proceedFn 호출, 없으면 즉시 proceedFn. 박스 표시 중 `cascade-locked`(pointer-events:none)로 다른 선택지 잠금. ③ **박스 작동(적용하기·카운트)은 v8.1과 동일** — `_fxBuildSectionBox`/`_fxRunCount` 재사용. ④ **disable = 할인 후 비용 기준**(기존부터 `getTier2Cost`가 final 반환 → `canAffordCost(final)`): 할인 적용해도 자원 부족하면 선택지 disabled+자원부족 태그. **CDP 검증(headless)**: 카드 dlg2/knl2, tier2 3선택지 전부 할인(예 time 20→18) 클릭→박스(위임레벨 2·-2·적용하기) 등장→적용→cut3 요약 진행, 예외 0. 자원 time=17 → 할인후 18 선택지만 disabled, 17·13은 활성.

**v9.1 — 마이크로 연출 (6/16 피터공)**: ① **펄스 팝+살짝 빠르게** — `fxNumPulse` `.3s ease`→`.24s` back-ease 오버슈트(scale 1.55→1.7), 카운트 스텝 360→300ms. ② **마지막 숫자도 효과** — 기존엔 할인이 0 되며 효과 없이 사라짐 → `_fxRunCount` 재구성: 첫 숫자(-N)도 팝, 각 스텝 팝, **마지막 비트에 `finalpop`**(크게 팝 후 페이드아웃 `fxFinalPop`) 후 제거 → 그다음 비용 settle(blink2). ③ **카드 회전 비행 채움** — `_fxFillCards`가 정적 복제 대신 **빈 점선 슬롯**(`.fx-clone.fx-empty`) 먼저 깔고, 독 목록 카드가 하나씩(180ms 간격) **회전(540°) 비행**해 슬롯에 도착·`reveal`(railPopIn) 강조(획득팝업 모티프 역방향). 독 안 보이면 즉시 채움(degrade). `_fxFillSlot` 신설. **CDP 검증**: 클릭 직후 빈 슬롯 2 → 비행 후 채움(이름 "주체성 역량"·"경청 역량") → finalpop 확인 → cut3 진행, 예외 0.

**v9.2 — 경계 걸침 + 헤드 가독성 (6/16 피터공)**: ① **박스 20px 좌측 이동** → cut3/cut2 경계에 걸치게(더 잘 보임). `box.style.left` 0→-20px. `.panel`이 `overflow:hidden`이라 잘려서 → **`.panel.dfx-host`+`.panel-body` `overflow:visible`** + 박스 `z-index:30`(cut2 위로). 검증: boxLeft 808 < cut3left 825(걸침). ② **`시킬까!` 헤드 가독성** — 픽셀폰트+그림자라 안 읽힘 → `text-shadow` 제거 + 17→21px. (그림자는 박스 자체엔 그대로 없음 — 세션486 결정 유지)

**v9.3 — 채운 카드 solid 테두리 (6/16 피터공)**: 빈 슬롯(`.fx-empty` 점선)이 카드 도착 후 테두리가 통째로 날아가던 버그 — base `.fx-clone`에 테두리 미정의(점선은 `.fx-empty`에만)였음. `.fx-clone`에 `border:2px solid var(--ink)` 추가 → 빈칸=점선, 채워지면=solid. 검증: 채운 카드 computed borderStyle=solid 2px.

**v9.4 — 비선택 선택지 회색 처리 (6/16 피터공)**: 선택지 하나를 누르면 할인 박스가 뜨고 나머지 선택지는 이미 못 누르는 상태(`cascade-locked` pointer-events:none) → 시각으로도 명확히. `runChoiceDiscount`에서 클릭 카드에 `.fx-selected` 부여(`done()`에서 제거). CSS: `.cascade-locked .choice-card:not(.fx-selected)`는 `opacity:.4` + `grayscale(.85)`(0.2s 트랜지션), `.fx-selected`만 또렷(opacity 1·filter none). 기존 `:not(.disabled){opacity:.92}` 미세 dim 대체.

**잠금/안전**: 애니 끝까지 `_cascadeBusy`(onTier2/Review 가드 + `cascade-locked` dim). seq `.catch`로 실패해도 잠금 해제(게임 락 방지). 할인 0(시나리오1 등 락 카드 없음)이면 정보창 없음 — §4p v4 락 기준과 자동 일치. dock-disc(레일 -N)는 정적 유지. 헤드리스 검증(cut3): 박스2·복제카드5·타이틀X·정렬 스페이서·라벨 `시간 할인`/`에너지 할인`·disc -3/-1/-1·cut2 비용 final 초록(비할인 plain)·줌 해제·busy 해제·ERR 0 통과.

## 4r. 세션486 (6/15) — HUD 중앙 제목 + 전체점수 (피터공)

- **중앙 제목 형식**: `상황: 자기소개 글` → **`'자기소개 글' 시나리오 점수`** 한 줄(아래 점수 그래프의 라벨 역할). `hud-scenario-title` textContent.
- **제목 크롭 해소**: `.hud-title` 받침/획이 아래에서 잘리던 문제 → `line-height` 1.2→1.5 + `padding-bottom:3px`. 한 줄이 길어져 `font-size` 20→18px.
- **전체점수 두 줄**: 우측 `SCORE : 22` 한 줄 → **두 줄**(작은 `전체점수` 위 + 큰 숫자 아래). `.score-total-block` flex row→column, 라벨 12px 회색·콜론(`::after`) 제거, 숫자 32px. 마크업 라벨 `SCORE`→`전체점수`.

## 4s. 세션488 (6/16) — 회복력 카드: 모달 타이밍 + 역량 표기 (피터공)

- **회복력 특별 UI 모달 타이밍**: 시나리오 끝 chain(`09-render-scenario.js`)에서 `[1.5]`(카드 보상 직후)에 있던 `showRecoveryCardModal`을 **`[4]`(철컥 `railFlyToInventory` 뒤)로 이동**. 카드 획득 팝업과 연속으로 뜨던 문제 → 카드 획득·철컥(시나리오 완료)이 모두 끝난 뒤에 회복 모달이 뜬다. chain 순서: `[0] pending 흡수 → [1] 카드 → [2] 레벨업 → [3] RP → [3.5] 철컥 → [4] 회복력 모달 → 다음 버튼`.
- **회복/도전 카드 "역량" 표기 통일**: 시킬까(hc) 칸에 들어가는 성장 카드(회복력·도전력)를 인간중심 "X 역량"과 통일해 **"회복 역량"·"도전 역량"**으로 표기. `data/texts.yaml` growthCards에 `display` 필드 추가, `_cardDisplayName`(00-config)이 domainCards에 더해 growthCards.display도 읽도록 확장 → dock·획득팝업·리포트·§4q 카드 복제 일괄 적용. 내부 키·세이브·scenarios.yaml은 기존 라벨(회복력/도전력) 유지, 렌더 시점에만 교체.

## 4t. 세션492 (6/16) — UI 마무리 5건 (피터공)

> 세션491 라이브 빌드 위 핀포인트 수정. 모두 `src/js/09-render-scenario.js`. 빌드 993,855B. CDP 헤드리스 검증 통과.

- **① 할인박스 카드 비행 회전 교정**: `_fxFillCards`의 비행 고스트 회전을 `rotate(540deg)` → **`rotate(720deg)`**. 540°=360+180이라 카드가 180° 뒤집혀 착지(텍스트 상하 반전)하던 것을 2바퀴(=순회전 0°)로 **똑바로 스냅**. (레일→인벤토리 `16-card-rail.js`·카드보상 `13-inventory.js`의 540deg는 끝에서 축소·페이드로 소멸 → 미수정, 슬롯에 남는 건 할인박스뿐.)
- **② 할인박스 능력카드 흰 배경**: `_fxFillSlot`에서 슬롯 배경을 `chip.style.background||''` → **`||'#fff'`**. 능력(domain)카드는 흰 배경이 CSS 클래스(`.dock-card`)라 인라인 background가 비어 슬롯이 투명했음. 인라인 배경 없으면 흰색 폴백 → **흰 카드 + 좌측 6px 컬러코드 테두리**(borderLeft 복사). 인간중심(hc)카드는 인라인 색 유지. CDP: 에너지 박스 배경 `rgb(255,255,255)`·좌테두리 6px 컬러 확인.
- **③ 레벨업 팝업·연출 중단**: XP 획득→Level Up 기능 폐기(레벨=카드 장수, §4p A). cut6 chain의 `[2] showLevelUpModal` 호출과 `flashLevelUpUI()/pulseExpLevel()` 연출을 주석 처리. exp 계산(`calculateExpGain`·`checkLevelUp`·`applyLevelUpMeterIncrease`·`awardRP`)은 **자원 max·RP 밸런스 보존을 위해 그대로 두되 사용자에게 보이는 연출만 끈다.** CDP: cut6에서 `levelup-modal` hidden 유지 확인.
- **④ cut1 선택지 스크롤 조건화**: 신규 `_scrollCut1ChoicesIfBelowFold(area,count)` — 선택지 하단(`getBoundingClientRect().bottom`)이 화면 하단(`innerHeight-12`)보다 **아래일 때만** 그 초과분만큼 스크롤. 다 보이면 그대로 둠(화면 안 흔듦). `showTier1Choices`만 교체, cut2(`showTier2Choices`)는 기존 `_scrollChoicesIntoView` 유지.
- **⑤ 회복력 일반 카드 통일 + Replay 유지**: 회복력 특별 중앙 모달(`showRecoveryCardModal`) 호출 폐지(함수 정의는 보존). 회복력을 도전력처럼 `_v8CardLabels`에 push해 **일반 카드 획득 팝업**(`playCardRewardSequential`)으로 통일(B 이하, engine 자동지급 조건과 동일). 리플레이 진입은 등급 화면 버튼(C/D `replay-btn-grade` 다시 도전하기 / B `replay-btn-cut6` 이 시나리오 다시 해보기)으로 유지 — Replay 창 자체는 그대로. CDP: cut6에서 `recovery-overlay` hidden·empty 유지 확인.
- **⑥ 비용 숫자 처음부터 핑크**: 선택 버튼 시간·에너지 비용 숫자(`.cost-simple .cost-num`) 기본색을 `var(--acc-pink-deep)`(#d63f7a 자주색)로. 기존엔 기본 어두운 텍스트 → 할인 적용 시에만 초록(`.discounted`). 이제 **처음부터 핑크**, 할인 settle 후 초록은 유지(02-choice-costs.css). CDP: 적용 전 cost-num 색 `rgb(217,58,117)` 확인.
- **⑦ 할인 카운터 끝 −1 중복 교정**: `_fxRunCount`에서 disc가 마지막에 −1로 멈춘 뒤 `finish()`가 그 −1을 다시 finalpop해 **−1이 두 번** 보이던 것(특히 N=1) 교정. 마지막 비트(dv=0)에서 disc를 **`0`으로 내리고** finalpop 한 번만 → 사라짐. "0으로 되고 끝." 휴식(클릭 전) 표시는 `-N` 그대로. CDP: N=1 시퀀스 `['0']`(rest −1→0 종료), N=3 `[-2,-1,0]` 중복 없음 확인.

## 4u. 세션510 (6/21) — 자원토큰 분배 모달 디자인 정리 (피터공: "디자인 없는 느낌")

> 분배 모달(§8.10a) UI 폴리시 5건. 기능·rpCost·메터 클램프 무변. 텍스트는 i18n 소스(`data/texts.yaml` + `data/ui_texts.csv`)가 진실, `14-init.js`가 모달 초기화 때 HTML을 덮어쓰므로 HTML 폴백과 i18n 동시 수정. CDP 검증·런타임 예외 0건.

- **① 타이틀 중앙 + 구분선**: `#rp-modal .modal-title` `text-align:center` + `border-bottom:2px solid var(--ink)`(+padding·margin) — 타이틀과 아래 기능 영역 분리(`07-modals.css`). 공유 `.modal-title`는 무변, `#rp-modal` 스코프만 적용.
- **② 부제 문구 교체**: "받은 토큰을 시간과 에너지에 나눠 담으세요" → **"추가 자원 토큰을 시간과 에너지에 필요한 만큼 나누어 담으세요"**. `texts.yaml`/`ui_texts.csv` `modals.rp_distribution.subtitle` + HTML 폴백.
- **③ 회색 보조 문구 제거**: `subtitle_hint` 빈 문자열로(yaml+csv). `14-init.js`가 hint를 `<br><span style=...#888>`로 재조립하던 경로 무효화(빈 문자열 falsy → span 미생성).
- **④ 남은 자원토큰 레이블+숫자 한 줄**: `.rp-bal` `display:flex; align-items:baseline; justify-content:center; gap:10px`. 레이블 12px·숫자 34px·weight 800(강조). 텍스트는 `mr.remaining_label` 유지.
- **⑤ 충전 미리보기 박스 제거**: `#rp-preview` HTML 삭제 + `05-modals.js` Preview 블록(`preview.innerHTML`/`preview_format`) 제거 + `14-init.js` rpPrev 참조 제거 + `.rp-preview`·`.rp-overflow-warn` CSS 삭제. i18n `preview_empty`/`preview_format` 키는 무해 잔재로 보존(읽는 코드 없음). `[분배 완료]` 버튼이 버킷 바로 아래로.
- **검증**: CDP로 모달 강제 표시(`dbgShowRPModal`) → title center·border 2px / 부제 신문구 / 회색 hint 없음 / `.rp-bal` flex·label 12px·num 34px / preview 미존재 / 예외 0건 + 스크린샷.

## 5. 미해결 / 다음 단계

- [ ] 원 7개의 **숫자 로직 정식 설계** — 획득·증감 단위를 7단계 기준으로 재설계 (피터공: "일단은 3개가 기존 0"). 콘텐츠 트랙 밸런스와 엮임.
- [ ] "선택/능력" 명칭을 리포트·결말 텍스트까지 통일할지 (현재 화면마다 명칭 다른 문제는 S3 점검 노트 참조).
- [ ] raw가 표시 범위(−3~+4) 밖으로 나갈 때 추가 신호(만땅 반짝임 등) 필요한지.
