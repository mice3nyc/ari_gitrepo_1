# MIGRATION-VALUES — v0.6 데이터 채움 작업 spec

> 5/3 세션275 신설. yaml의 위·도 두 축 데이터 + raw 비용 재조정 작업의 shared spec.
> 백도 위임 시 이 노트를 참조. 결과는 yaml diff 형태로 회수 후 직도가 yaml 직접 편집.

---

## 1. 두 축의 의미 (5/1 결정 + 5/3 정정)

### 위 (위임 판단력)
**무엇을 AI에 맡기고 무엇을 자기가 할지 판단하는 힘.** 자기 자리에서 자기 일은 +(위임 안 한 적절성), 위임이 부적절하거나 무비판적 위임은 -.

### 도 (도메인 지식)
**자기 안의 정보·지식·판단 기준 활용 정도.** 위임 판단을 가능하게 하는 자기 안의 토대(피터공 5/3: "이 판단의 기준이 객관적이어야 한다는 조건"). 도메인 활용·축적은 +, 도메인 우회·외면은 -.

## 2. 시나리오별 도메인 정의

| 시나리오 | 도메인 (도 축의 본체) |
|----------|----------------------|
| selfintro | 자기 자신에 대한 지식 — 자기 경험·관심사·기억 |
| groupwork | 협업 도메인 + 출력 검증 도메인 |
| eorinwangja | 책 텍스트 + 의미·해석 도메인 |
| career | 자기 진로 사고 + 사회적 압력에 대한 비판적 분석 |
| studyplan | 학습 메타인지 도메인 |

도메인이 시나리오마다 다르므로 같은 매핑 룰을 일괄 적용 X. 시나리오 텍스트(상황·tier1 lesson·tier2 lesson·결과 lesson)에서 가설 도출.

## 3. 매핑 가설 (정수 단위)

### 3.1 매핑 기호 → 정수
- `++` → +2
- `+` → +1
- `0` → 0
- `-` → -1
- `--` → -1 (5/3 압축, 음수 폭 줄임)

### 3.2 tier1 (큰 방향, 가벼움) — 현재 yaml에 없음, 추가 필요
- **`±1` 안에서**(SPEC §1.1 가벼움)
- delegation: 분기의 위임 결정 자체. "직접 쓴다" = `+`, "AI 부탁" = `-`, "모방" = `-`
- knowledge: 도메인 활용 의도. "직접" + 자기 도메인 = `+`, "AI 부탁" + 도메인 우회 = `-`, "모방" + 도메인 미활용 = `-` 또는 `0`

### 3.3 tier2 (행동, 깊이) — delegation 있음, knowledge 추가 필요
- delegation: yaml 그대로 (이미 채워져 있음)
- knowledge: tier1 방향에서 더 깊은 변화. ±0 ~ ±2

### 3.4 finals (review 결과) — 이미 두 축 박힘, 점검만
- delegation·knowledge 둘 다 채워져 있음
- score(0~100)·grade(S/A/B/C/D)·awareness 텍스트 보존
- 5/3 작업에서는 점검 + 명백한 어긋남만 정정

## 4. raw 비용 재조정

### 4.1 현재 (v0.5 잔존)
- yaml `resourceCosts[leafId] = {time, energy}` (raw 값)
- 코드 `_applyMult` 함수에서 0.6 곱셈 적용 → actual_cost = raw × 0.6

### 4.2 5/3 정정
- multiplier 폐지: `CONFIG.resourceCostMultiplier: 0.6` → `1.0`
- raw 재조정: yaml의 모든 leaf time/energy × 0.6 (정수 반올림)
- 결과: actual_cost = raw_new × 1.0 = raw_old × 0.6 (v0.5 발란스 동등)

### 4.3 자동화 스크립트
```python
import yaml
d = yaml.safe_load(open('data/scenarios.yaml'))
for sid, sc in d.items():
    rc = sc.get('resourceCosts', {})
    for leaf, costs in rc.items():
        costs['time'] = round(costs['time'] * 0.6)
        costs['energy'] = round(costs['energy'] * 0.6)
yaml.dump(d, open('data/scenarios.yaml', 'w'), allow_unicode=True, default_flow_style=False, sort_keys=False)
```

## 5. 백도 작업 단위

### 5.1 yaml tier1·tier2 knowledge 채움 (시나리오별)
- 입력: `data/scenarios.yaml` 시나리오 1건
- 출력: 마크다운 노트 (시나리오별 채움 가설 + 근거 + yaml block)
- 프롬프트 템플릿:
  > `_dev/ai-literacy-delegation-boundary/v06/data/scenarios.yaml`의 `{시나리오ID}` 시나리오를 읽고, `MIGRATION-VALUES.md`의 §1·§2·§3 가설에 따라 **tier1 3건의 delegation·knowledge** + **tier2 9건의 knowledge** 채움 값을 산출하라. tier2 delegation은 yaml에 이미 있으므로 그대로. finals 두 축은 점검만 하고 명백한 어긋남이 있으면 보고.
  > 결과 형식: 시나리오 도메인 정의 한 줄 → 시나리오 텍스트(상황·tier1·tier2·결과 lesson)에서 도출한 매핑 근거 → 채움 가설값 yaml block (복붙용) → 점검 결과(finals 어긋남 후보).
  > 결과 노트 위치: `_놀공노트/26.0503 yaml 채움 — {시나리오ID}.md`

### 5.2 raw 비용 재조정 (전체 자동)
- 입력: `data/scenarios.yaml` 전체
- 출력: 동일 yaml에 resourceCosts time/energy × 0.6 정수 반올림 적용 + diff 보고
- 작업: §4.3 스크립트 실행 + 결과 검증 (모든 leaf 조정됨, 0 발생 없음, 정수)
- 결과 형식: diff 통계(총 변경 수, time/energy 평균 변화, 0 발생 leaf 등)

## 6. 직도 회수·적용 절차

1. 백도 결과 노트 회수
2. 가설값 검토 (시나리오 텍스트와 매핑 정합)
3. yaml 직접 편집 또는 yaml block 복붙
4. build.py 실행 → index.html 갱신
5. 빌드 검증 (bytes 변화·구조 정상)
6. 디버그 패널로 4유형 강제 호출 + 시나리오 재생 (line 2155 기능)

## 7. 진행 상태

- [ ] 5.1 selfintro pilot (백도 1)
- [ ] 5.2 raw 재조정 전체 (백도 2)
- [ ] 5.1 groupwork
- [ ] 5.1 eorinwangja
- [ ] 5.1 career
- [ ] 5.1 studyplan
- [ ] 직도: multiplier CONFIG 1.0 변경
- [ ] 직도: score-display 진행 중 숨김 정책
- [ ] 빌드·검증
- [ ] 커밋·푸시

## 8. 참조

- [[26.0502 AI 리터러시 교육 기획서]] — 두 축 척추 명제
- [[요청.26.0503.0941-외부LLM시나리오안내]] — 외부 분석 컨텍스트 (5/3 정정본)
- [[26.0503 시나리오 리뷰 — 1 selfintro]] — selfintro 9 leaf 1차 점검 (백도 selfintro 작업의 출발 자료)
- `SPEC.md` §6 — 코드 영향 진행 상태
- `PLAN.md` Phase 3·4 분할
