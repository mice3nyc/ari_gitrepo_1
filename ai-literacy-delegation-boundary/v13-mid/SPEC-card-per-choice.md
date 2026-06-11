# SPEC — 카드 선택별 획득 (Phase 2 — 전체 적용)

> 2026-06-11. 계획: [PLAN-card-per-choice.md](PLAN-card-per-choice.md). ~~파일럿 대상: **selfintro만**.~~ → **6/11 피터공 "전체 시나리오에 적용하자" — 5종 전체 적용** (§5).

## 1. 지급 규칙 v0 (데이터 기반 도출)

선택지 노드에 카드 필드를 신설하지 않고, 기존 discountTags + delta 부호에서 도출한다.

| 단계 | 조건 | 지급 카드 |
|---|---|---|
| tier1 | `getAxisDelta(delegation) > 0` | 인간중심 — 축=`discountTags.humanCentric`, 태그=축→태그 맵 |
| tier2 | `getLeafDelta(t2, t1).knowledge`가 `+`/`++` | 도메인 — `discountTags.strongDomain[0]` |
| tier2 | 위와 별도로 `delta.delegation === '++'` | 인간중심 추가 (이번 시나리오에 같은 축 없을 때만) |
| review | `discountTags.strongDomain` 비어있지 않음 (R2/R3) | 도메인 — `strongDomain[0]` |
| 결말 | 등급 B/C/D → 회복력, 리플레이 완료 → 도전력 | **기존 유지** (등급 기반은 끝이 맞음) |

**쿠폰 사용 제한 (6/11 피터공 결정)**: 선택별로 획득한 카드(`perChoice:true`)는 **획득한 그 시나리오 안에서는 할인 쿠폰으로 쓸 수 없다**. 시나리오를 마치면 다음 시나리오부터 작동. 구현: 쿠폰 가용 카드 계산(04-resources `_calculateCardEnergyDiscount`)에서 `perChoice && scenario === currentScenarioId` 항목 제외. (같은 시나리오 리플레이에서도 제외됨 — "다음 시나리오부터"의 보수적 해석.)

축→태그 맵 (selfintro): 중심잡기→주체성, 융합하기→통합적 사고, 성찰하기→성찰적 사고.

## 2. 구현 (파일럿)

- **신설** `src/js/15-card-per-choice.js`: `PILOT_PER_CHOICE`(대상 시나리오 + 축→태그 맵), `pilotPerChoiceActive(scid)`, `pilotCardsForChoice(stage,id)`, `pilotAwardCards(cards)` (인벤토리 적립 `perChoice:true` 마킹 + saveGame).
- **훅 3곳** (`10-event-handlers.js`): onTier1·onTier2의 fadeOut 콜백에서 적립 + `playCardRewardSequential`(기존 토스트 재사용). 검토 카드는 goCut6 chain의 카드 자리에서 표시(타이밍 동일, 내용만 선택 기반).
- **결말 지급 억제** (`03-engine.js` applyReview + `09-render-scenario.js` goCut6): 파일럿 시나리오면 `fin.cardEarned` 블록 스킵, 대신 검토 선택 카드 적립·표시. 회복력·도전력 블록은 그대로.
- **scenarios.yaml·texts.yaml 무수정.** v22 커밋 게이트와 충돌 없음.

## 2b. 획득 연출 v1 — 우측 팝업 + 카드 레일 (6/11 2차, 피터공)

> "선택 버튼을 눌러서 획득이 되면 우측에 팝업으로 '○○○ 선택 → ○○ 능력 획득!' 안내가 뜨고, 창을 닫으면 우측 빈 공간에 카드가 팝! 하며 등장. 쌓인 카드들은 시나리오 전체가 종료되면 역량카드 버튼으로 날아들어가 사라진다."

기존 전면 오버레이 토스트(`playCardRewardSequential`)를 파일럿 시나리오에서 **우측 팝업 + 카드 레일**로 교체한다.

- **획득 팝업** (`showCardEarnPopup(choiceLabel, cards)`): 화면 우측 고정(레일 위쪽). 1줄 "「선택 라벨」 선택" + 큰 글씨 "○○ 획득!" + 카드 미리보기(축 색/표시명). 닫기 = X 버튼·팝업 클릭, **4초 후 자동 닫힘 병행**. 닫히면 카드가 레일로 팝 등장(여러 장이면 0.15s 시간차).
- **카드 레일** (`#card-rail`): position:fixed 우측 가장자리, HUD 아래에서 시작, 획득 순서대로 위→아래 스택. 미니 카드(라벨+축/도메인 색 스트라이프). 시나리오 시작·리플레이 시작 시 비움(`railClear()`).
- **종료 비행** (`railFlyToInventory()`): 컷6 체인 끝(모달들 이후, 다음 버튼 노출 직전)에 레일 카드들이 역량카드 버튼(`#inv-tab`)으로 순차 비행(기존 `travelCard` 곡선 재사용) + 탭 펄스. 레일 비면 no-op — 비파일럿 시나리오에 영향 없음.
- **검토 카드 시점 이동**: 컷6 체인의 검토 카드 적립·표시를 `onReview` fadeOut 콜백으로 이동 — tier1·tier2와 동일하게 "선택 직후" 한 흐름. 컷6 체인의 파일럿 분기는 제거(도전력·회복력은 기존 위치 유지).
- **신설 파일** `src/js/16-card-rail.js` + `08-inventory-and-rewards.css`에 레일/팝업 스타일. 비파일럿 시나리오의 결말 일괄 토스트는 그대로(Phase 2 전체 개편 때 통일).

## 3. 전체 개편 시 (Phase 2 예고)

- 규칙을 yaml 정식 필드로 명문화할지(선택지 노드 `cardAward`), 규칙 엔진 유지할지 파일럿 후 결정. → **6/11: 규칙 엔진 유지** (새 데이터 필드 없이 §1 규칙 + §5 맵으로 전체 작동. yaml 필드화는 규칙이 흔들리면 재논의)
- 규칙 도출 결과 vs 기존 finals 배정(v22) 대조표로 예외 검출 — 경로 의존 태그(예: selfintro B3R2 직관적 통찰/B3R3 적응성처럼 검토까지 봐야 갈리던 태그)는 선택 기반에서 단순화됨을 피터공 확인. → **6/11 대조표 생성**: `data/exports/검토_260611/카드_선택별획득_대조표.csv`
- 린터 R3 계열 개정 필요. → **6/11: 보류** — finals 카드 필드는 데이터 기준치로 유지(런타임 미지급)하므로 린터의 데이터 검사는 계속 유효. finals 필드 제거를 결정하는 시점에 함께 개정.

## 5. Phase 2 — 전체 적용 (6/11)

- **대상**: 5종 전체 (`selfintro, groupwork, eorinwangja, career, studyplan`). 지급 규칙은 §1 그대로, 시나리오별 축→태그 맵만 추가.
- **축→태그 맵 선정 원칙**: selfintro = 파일럿 승인 맵 유지. 나머지 4종 = finals(v22 정비분) 분포에서 **최빈 태그, 동률이면 최고 등급(S) 경로의 태그**. 시나리오 정체성과 부합(모둠→사회·관계, 진로→창의, 시험→문제해결).

| 시나리오 | 중심잡기 | 융합하기 | 성찰하기 |
|---|---|---|---|
| selfintro | 주체성 | 통합적 사고 | 성찰적 사고 |
| groupwork | 주체성 | 통합적 사고 | 사회·관계적 사고 |
| eorinwangja | 주체성 | 맥락적 사고 | 윤리적 사고 |
| career | 주체성 | 창의적 사고 | 비판적 사고 |
| studyplan | 주체성 | 문제해결적 사고 | 성찰적 사고 |

- **finals 카드 필드(humanCentric*/domainCards) 처리**: **데이터에 유지, 런타임 미지급.** 린터 §16 R3·R4 검사 기준치 + 대조표 비교 기준으로 계속 사용. 제거 여부는 피터공 후속 결정.
- **회복력(B/C/D)·도전력(리플레이)**: 기존대로 결말에서 (등급 기반은 끝이 맞음 — §1).
- **리포트·인벤토리**: 인벤토리 적립 기반이라 코드 무변. perChoice:true 마킹만 추가돼 들어감.
- **초등(v12-elem)**: 미적용 — 중등 확정 후 분기 원칙(세션453). 피터공 결정 대기.

## 4. 미해결

- [ ] 전면 토스트 3회 리듬 (미니 토스트 전환 여부)
- [x] ~~시나리오 내 즉시 쿠폰 사용~~ → 6/11 피터공 결정: 차단, 다음 시나리오부터 (§1 쿠폰 사용 제한, `_cardUsableForDiscount`)
- [ ] 중복 카드(같은 시나리오에서 같은 도메인 2회 — 예: B3 검토력+R3 검토력) 허용 여부 — 전체 적용에서도 파일럿과 동일하게 **허용** 유지, 대조표에 중복 표시. 피터공 확인 대기
- [ ] 축→태그 맵 4종(§5) 피터공 확인 — 대조표와 함께
