## PLAN — AI 리터러시: 위임의 경계 v0.6

**최종 업데이트**: 2026-05-01 세션267 — v0.6 빌드 진입, 점수 framework 전면 재설계
**진입점**: [[26.0501 v0.6 기획 결정 요약]]
**v0.5 PLAN**: [[v05/PLAN|PLAN.md]] (freeze, 5/4 경기도 송부본)

> Live document — 항상 "지금 상태". 방향 전환 시 즉시 갱신.

---

#### 0. v0.6 핵심

v0.5 카드 시스템 분석에서 발견한 두 시스템 단절(final_item 88종 vs boostCard 22종, 공통 3개)이 **점수 framework 전면 재설계**로 확장.

- **모든 선택 단계**(tier1/tier2/review)에 위·도 두 축 ±N 점수 distribute
- **학생 노출은 시나리오 끝 종합만** — 매 단계 점수 노출 X (점수 게임 변질 방지)
- **학기 끝 4유형(pp/pn/np/nn)** = 누적 위·도 점수의 자연스러운 요약
- **카드는 메시지 메카닉**으로 차후 재설계 — 점수 framework 위에 얹힘

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
5 시나리오 중 가장 진행된 career에 새 framework 적용. raw 비용 재조정. 플테로 검증.

##### Phase 4 — 나머지 4 시나리오 마이그레이션 + 4유형 종합 화면
selfintro / groupwork / eorinwangja / studyplan에 framework 확장. 학기 끝 누적 점수 → 4유형 라벨 화면 신설.

##### Phase 5 — 카드 메시지 메카닉 (final_item 재설계)
점수 framework 안정화 후 카드 4안 결정 → 어린왕자 컬렉션 패턴 확장 검토.

---

#### 5. 참조

- [[26.0501 v0.6 기획 결정 요약]] — 이 빌드의 출발점
- [[26.0501 v0.5 카드 인벤토리 — 기능 없는 라벨 vs 점수 부스트]] — 카드 분석
- [[26.0501 v0.5 시나리오 검수 결과]] — 검수 누적
- [[26.0501 NN-g AI Literacy — 4 user types와 v0.5 4유형 정렬]] — 4유형 정합
- [[v05/TASKS|v0.5 TASKS]] — v0.5 freeze 시점 진행 상태
- [[SPEC|v0.6 SPEC.md]] — 점수 framework 기술 상세
- [[TASKS|v0.6 TASKS.md]] — 진행 작업
