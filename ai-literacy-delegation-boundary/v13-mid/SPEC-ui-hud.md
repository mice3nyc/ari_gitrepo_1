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
3. **결말 재시도 모달 버튼 동일 위계**: `showRecoveryCardModal`의 primary(노랑 강조)/secondary 차등을 없애고 **같은 스타일 두 버튼을 가로 나란히** — [다시 도전] [다음 시나리오]. 흰 배경+ink 테두리+같은 그림자. `texts.yaml` `recovery.btn_use: "다시 도전"`, `btn_skip: "다음 시나리오"`, `btn_use_sub` 제거 + `ui_texts.csv` 232~234행 동기.
4. **검토 선택지 번호 표기**: R1~R3 → **1·2·3** (표시만, 내부 id·세이브·린터 무변). 적용 2곳 — 컷4 choice-num(09-render §23), 컷5 chosen-title. 데이터(texts.yaml)에는 R 표기 없음 확인.

## 5. 미해결 / 다음 단계

- [ ] 원 7개의 **숫자 로직 정식 설계** — 획득·증감 단위를 7단계 기준으로 재설계 (피터공: "일단은 3개가 기존 0"). 콘텐츠 트랙 밸런스와 엮임.
- [ ] "선택/능력" 명칭을 리포트·결말 텍스트까지 통일할지 (현재 화면마다 명칭 다른 문제는 S3 점검 노트 참조).
- [ ] raw가 표시 범위(−3~+4) 밖으로 나갈 때 추가 신호(만땅 반짝임 등) 필요한지.
