## PLAN — AI 리터러시: 위임의 경계 v0.6

**최종 업데이트**: 2026-05-03 세션275 — 코드 framework 완료 + selfintro yaml 채움 + raw 재조정 + multiplier 폐지 + score-display 정책. 나머지 4 시나리오 yaml 채움 다음 세션
**진입점**: [[26.0501 v0.6 기획 결정 요약]]
**v0.5 PLAN**: [[v05/PLAN|PLAN.md]] (freeze, 5/4 경기도 송부본)

> Live document — 항상 "지금 상태". 방향 전환 시 즉시 갱신.

---

#### 0. v0.6 핵심

v0.5 카드 시스템 분석에서 발견한 두 시스템 단절(final_item 88종 vs boostCard 22종, 공통 3개)이 **점수 framework 전면 재설계**로 확장.

- **모든 선택 단계**(tier1/tier2/review)에 위·도 두 축 ±N 점수 distribute
- **점수 UI는 항상 노출** — 5/3 §2.3 진행 중 숨김 정책 폐기. 점수 게임 변질 방지는 UI 토글이 아니라 점수 업데이트 시점·표현 방식으로 (별도 결정)
- **학기 끝 4유형(pp/pn/np/nn)** = 누적 위·도 점수의 자연스러운 요약
- **카드는 역량 카드 시스템**으로 결정 (5/3) — boostCard 라벨 22종 폐기, 시나리오 끝 도 축 양수면 일반 역량 라벨(자기지식·문해력·협업능력 등) 카드 획득. 인벤토리 슬라이드 패널 + reward 팝업. 자세한 사항 SPEC §7.

#### 1. 결정 (5/1 세션267)

| # | 결정 | 근거 |
|---|---|---|
| 이름 | `boostCard` → **`axisDelta`** | 두 축(위/도) 분리가 framework 뼈대 |
| 비용 | **A) raw 비용 재조정** (multiplier 0.6 폐지) | raw에 의도 박는 게 본도 |
| 폴더 | **새 폴더 `v06/`** | v0.5 freeze 보호 (5/4 송부) |

#### 2. 미루는 결정 — 닿을 때

- **카드 4안** (final_item): 차후 작업, SPEC에 안 박힘
- **career boostCard 4종 재명명**: 다음 톤 정정 사이클에서
- **다음 시나리오 핸드오프 순서**: selfintro부터 자연스러우면 그걸로

---

#### 3. 인수 자산 (v0.5 → v0.6)

| 자산 | 처리 |
|---|---|
| `data/scenarios.yaml` | 텍스트 보존, **delta 필드 추가** (스키마 확장) |
| `data/cuts.yaml` | 그대로 |
| `index.html.template` | 그대로 (build.py 출력 키 변경 시 sync) |
| `build.py` | `axisDelta` 키로 갱신, delta 필드 처리 추가 |
| `balance/extract_balance.js` | 새 스키마에 맞춰 컬럼 갱신 |

---

#### 4. 단계별 구현

##### Phase 1 — 자산 인수 + 폴더 세팅
v0.5 `data/`, `balance/`, `build.py`, `index.html.template` 복사. localStorage key v05→v06. vtag 갱신.

##### Phase 2 — 점수 framework SPEC + 스키마 확장
SPEC.md 본문 작성. yaml에 tier1/tier2/reviews delta 필드 추가. build.py가 axisDelta 키로 출력.

##### Phase 3 — career 시나리오 첫 마이그레이션
**3a 코드 framework** ✅ (5/3 세션275): tier1 점수 기여 자리 추가(`applyTier1` 함수에 `getAxisDelta` 호출), 음수 매핑 압축(`DELTA_NEG`). yaml tier1 데이터 채움은 외부 LLM 분석 사이클.
**3b 시나리오 데이터 마이그**: 검수 시트 외부 LLM 분석 결과로 yaml의 위·도 두 축 데이터 검증·정정. career 27 leaf delta. raw 비용 재조정.

##### Phase 4 — 나머지 4 시나리오 마이그레이션 + 4유형 종합 화면
**4a 학기 끝 4유형 화면**: 이미 v0.5 Phase 8에서 구현됨 ✅ (line 1998 `showFinalReport`, line 1991 4유형 분류, line 2021 4유형 의미 박스).
**4b 시나리오 데이터 마이그**: selfintro / groupwork / eorinwangja / studyplan 시트 분석 결과 반영.
**4c 시나리오 끝 화면 노출 정책** [폐기 — 5/3]: SPEC §2.3 정책 자체 폐기. 점수 UI는 항상 보이는 상태가 기본. 시나리오 끝 표시는 score-display가 이미 항상 노출이라 추가 작업 불필요. 점수 게임 변질 방지가 필요하면 별도 결정 자리.

##### Phase 5 — 역량 카드 시스템 ✅ (5/3 selfintro 1차 빌드)
**5a 시스템 신설** ✅: SPEC §7 신설(라벨 풀 + leaf 매핑 스키마 + 인벤토리 슬라이드 + reward 팝업). UI 3건 적용(XP 위치/자원·역량 타이틀). yaml 스키마 확장(`domainPool`/`domainLabel`/`competencyCards`). 인벤토리 + reward 코드 통합.
**5b selfintro 9 leaf 카드 매핑** ✅: 27 review 매핑 — 16건 카드 보유, 11건 미보유 (knowledge ≤ 0).
**5c 나머지 4 시나리오 카드 매핑**: groupwork / eorinwangja / career / studyplan — 백도 4개 병렬 (selfintro 플테 OK 후).
**5d 위 축 표현 결정**: 위임 판단력 측정·객관 기준 전달 방법 (SPEC §7.7, 1차 플테 후 결정).

---

#### 5. 참조

- [[26.0501 v0.6 기획 결정 요약]] — 이 빌드의 출발점
- [[26.0501 v0.5 카드 인벤토리 — 기능 없는 라벨 vs 점수 부스트]] — 카드 분석
- [[26.0501 v0.5 시나리오 검수 결과]] — 검수 누적
- [[26.0501 NN-g AI Literacy — 4 user types와 v0.5 4유형 정렬]] — 4유형 정합
- [[v05/TASKS|v0.5 TASKS]] — v0.5 freeze 시점 진행 상태
- [[SPEC|v0.6 SPEC.md]] — 점수 framework 기술 상세
- [[TASKS|v0.6 TASKS.md]] — 진행 작업
