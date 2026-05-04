## PLAN — AI 리터러시: 위임의 경계 v0.7

**최종 업데이트**: 2026-05-04 세션287 — v0.7 분기 + §0~§6 결정 묶음 도착 (합산 모델 + 카드 매칭 활성화 + supplements 풍부화 + 공식형 박스 + 타이틀 정정 + csv 재구성)
**진입점**: [[26.0504 v0.7 논의 자리들]] / [[26.0504 v0.7 작업 계획]]
**v0.6 freeze**: `_dev/ai-literacy-delegation-boundary/v06/` (5/3 23:30 dbcb60f 커밋, GitHub Pages 배포)

> Live document — 항상 "지금 상태". 방향 전환 시 즉시 갱신.

---

#### 0. v0.7 핵심

v0.6 동현공 5/3 밤 플테에서 **결정적 발견** 도착 — UI 라벨이 학습 메시지를 정반대로 도착시키는 자리. ④ 할인 효과를 학생이 "선택지가 위·도를 깎는다"로 오해. ①②③ 학습 메카닉은 정확히 작동, 화면이 거짓말한다.

5/4 한 호흡으로 §0~§6 결정 묶음 도착. v0.6에서 v0.7로 분기.

- **§0 거버넌스**: csv ↔ yaml ↔ gameState 3층 분리. csv = 정적 init 검수, yaml = 코드 사용 데이터, gameState = 런타임. yaml이 단일 진실의 자리, 코드가 안 쓰는 값은 yaml에서 제거.
- **§1 카드 통합**: (a) 시나리오 아이템 + (b) 19종 역량 카드 두 풀 통합 (옵션 가, 메타 동봉). (c) 비활성 보너스 흡수. 보유·수량 영향 = 자원 비용 할인 + 점수 보너스(카드 매칭 활성화 메카닉) 두 결. 학생 톤 메타 룰 격상.
- **§2 점수 산출**: lookup 모델 폐기, 합산 모델 채택 (피터공 30+30+30+10). tier1 + tier2 + review + bonus = 최대 100점. reviewSupplements 135 자리 풍부화, 학생 화면 메인 텍스트로 격상.
- **§3 자원 충전**: 메터 Max 100 고정, 레벨업 RP +20 유지, 양쪽 만땅 시 자동 진행, 분배 화면 강조 룰(A 채택).
- **§4 UI 공식형 박스**: 피터공 안 채택 + 두 디테일. 두 줄 라벨 분리(시간 = 위임 할인, 에너지 = 지식 할인), 카드 매칭은 박스 X → 결과 패널 자리.
- **§5 튜토리얼 + 타이틀 정정**: 튜토리얼 4문장 학생 톤. 타이틀 = 피터공 캐논 직접 명제 + 한 줄 도입 + 버튼. 캐논 도입("딸깍하면…") 별도 자리 이동.
- **§6 csv 재구성**: 단계별 점수 컬럼 신설, axisDelta = 카드 매칭 룰로 재정의, 19종 카드 별도 csv 분리(`competency_cards.csv`).

#### 1. 결정 (5/4 세션286·287)

| # | 결정 | 근거 |
|---|---|---|
| 분기 | v0.6 → **v0.7 폴더 신설** | v0.6 freeze (동현공 플테 베이스), v0.7 새 사이클 |
| 점수 | lookup → **합산 모델** (30+30+30+10) | 거버넌스 정합 + 학생 학습 메시지 도착 |
| UI | **공식형 박스** + 두 줄 라벨 분리 | ④ 메카닉 학생 화면 도착 + 두 역량 결 분리 |
| 카드 | 두 풀 **통합** + 매칭 활성화 메카닉 | 정보+레슨 한 메카닉 |
| csv | 단계별 점수 컬럼 + 19종 카드 **별도 시트** | 거버넌스 정합 + 검수 인터페이스 |

#### 2. 자산 인수 (v0.6 → v0.7)

| 자산 | 처리 |
|---|---|
| `data/scenarios.yaml` | **재설계** — 단계별 점수(tier1/tier2/review.points) + supplements 135 자리 |
| `data/texts.yaml` | 그대로 (5/3 분리됨) |
| `data/cuts.yaml` | 그대로 |
| `data/build_csv.py` | **재작성** — 단계별 점수 컬럼, axisDelta 카드 매칭 룰로 재정의 |
| `data/competency_cards.csv` | **신설** — 19종 카드 별도 시트 |
| `index.html` | 재작성 — calculateFinalScore 합산, buildEffectCell 공식형, Cut5 supplements 메인, Cut6 단계별 narrative, 타이틀·튜토리얼 정정 |
| `index.html.template` | 그대로 |
| `build.py` | 그대로 (yaml passthrough) |

---

#### 3. 단계별 구현 — Phase v0.7

상세 체크리스트는 [[26.0504 v0.7 작업 계획]]. 큰 흐름만 PLAN에 둔다.

##### 단계 1 — SPEC·PLAN·TASKS 갱신 (메인 + 백도)
PLAN·TASKS 메인 직도, SPEC 백도 1개 위임. §0 v0.7 변경 요약 신설 + §2 합산 모델 + §3 공식형 박스 + §7 카드 매칭 + §11 타이틀 정정.

##### 단계 2 — yaml 재설계 (백도 5개 병렬)
시나리오별 launch. tier1·tier2·review 단계별 점수(약 60 자리) + supplements 27 자리 학생 톤 narrative + 카드 매칭 룰. selfintro·groupwork·eorinwangja·career·studyplan 5 시나리오.

##### 단계 3 — 코드 재작성 (메인 직도)
calculateFinalScore 합산. buildEffectCell·buildCostHTML 공식형 박스 두 줄 라벨. Cut5 review 패널 supplements 메인. Cut6 결과 패널 단계별 점수 narrative. useReviewLevelBoost·detected·levelStep·levelExtraBonus 폐기. cardSlots·cardsHeld → getCardMatchBonus. §11 타이틀·튜토리얼 정정.

##### 단계 4 — csv 재구성 (백도 1개)
build_csv.py 재작성. 단계별 점수 컬럼 신설. axisDelta 카드 매칭 룰로 재정의. results.basePoint·finals.score 컬럼 폐기 또는 검수 보존. reviewSupplements 컬럼 풍부화.

##### 단계 5 — 19종 카드 시트 (메인)
`competency_cards.csv` 신설. 카드 그룹 정의(자기지식·정보문해·논증추론 등). 매칭 보너스 룰 데이터.

##### 단계 6 — § 심볼 자연어 풀이 (백도 1개)
[[26.0504 v0.7 논의 자리들]] §X.Y 참조를 자연어로 풀이. 헤딩 ##/###/#### 구조는 유지.

##### 단계 7 — 빌드 + 동현공 재플테 (메인)
build.py 빌드 → bytes 변화 → git 커밋·푸시 → GitHub Pages 배포 확인 → 동현공 텔레그램 안내.

---

#### 4. 미루는 결정 — 닿을 때

- **5d 위 축 표현**: 위임 판단력 측정·객관 기준 전달 방법 (1차 v0.7 플테 후 결정)
- **review.varPoint leaf별 변수**: 합산 모델 단순 분배(R1=10·R2=20·R3=30)로 v0.7 진입, 플테 후 변수 추가 여부 결정
- **캐논 도입 별도 자리**: README가 자연스럽지만 학생이 게임 안에서 못 봄. ending 자리 추가 결정

---

#### 5. 참조

- [[26.0504 v0.7 논의 자리들]] — §0~§6 결정 컨테이너
- [[26.0504 v0.7 작업 계획]] — 단계별 트래킹 노트
- [[요청.26.0504.0945-v07분기개시]] — 분기 의미
- [[요청.26.0504.0700-동현공v06플테피드백]] — 결정적 발견 진입점
- [[v06/PLAN|v0.6 PLAN]] — v0.6 freeze 시점
- [[SPEC|v0.7 SPEC.md]] — 점수 framework 기술 상세 (단계 1.3 갱신 후)
- [[TASKS|v0.7 TASKS.md]] — 진행 작업
