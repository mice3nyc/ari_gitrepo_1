## CARD-SPEC — AI 리터러시 v0.5 역량 카드 시스템

**최종 업데이트**: 2026-04-29 세션254 — 신설 (피터공 결정 §7.3 기반)
**참조**: [[v05/DECISIONS|DECISIONS.md]] §7.3, [[v05/PLAN|PLAN.md]] Phase 7, [[요청.26.0429.1925-v05회복없는학기]]

> 카드 = 레벨업 마일스톤의 가시화. 다음 시나리오부터 비용/점수 효과 발동. "내가 어떤 학습자가 됐는가."

---

#### 1. 디자인 원칙

- **레벨업 = 카드 획득**. Lv1 → Lv2 진입 시 Lv2 카드 자동 부여.
- **카드 효과 = 다음 시나리오부터** 발동 (현 시나리오는 영향 없음).
- **효과 가시화**: 선택 버튼의 cost meter에 카드 효과 반영(-% 표시 포함). 시작 화면 + 컷6에 보유 카드 + 효과 명시.
- **AI 리터러시 메타포**: 카드 이름·설명이 학습자 성장의 구체 단계를 가리킴 — "프롬프트 정교화", "교차 검증 습관" 등.
- **학맞통 카드와 별도 트랙** (DECISIONS §7.5). 두 시스템 공존.

---

#### 2. 카드 명세 (Lv 마일스톤)

##### 2.1 Lv2 카드 — "프롬프트 정교화"

- **획득 조건**: Lv1 → Lv2 진입 (누적 exp ≥ 20)
- **효과**: B 분기(AI 위임) 시간 비용 **-10%**
- **메타포**: 막연히 "AI에 맡긴다"에서 "구체적으로 묻는다"로의 전환. 같은 위임이라도 시간 소요 줄어듦.
- **대상 leaf**: B1·B2·B3 시작 leaf (`getTier1Cost('B')` 출력 시 ×0.9)
- **JS 효과**:
  ```js
  // consumeStage 진입 직전 — getTier1Cost / getTier2Cost / getReviewCost 출력에 적용
  if(hasCard('LV2_PROMPT') && t1==='B'){
    cost.time = Math.round(cost.time * 0.90);
  }
  ```

##### 2.2 Lv3 카드 — "교차 검증 습관"

- **획득 조건**: Lv2 → Lv3 진입 (누적 exp ≥ 40)
- **효과**: R3(크로스체크) 검토 비용 **-3** + R3 결과 점수 **+3**
- **메타포**: 검증을 자주 하면 비용이 덜 든다 (습관화) + 결과 정확도 ↑
- **대상**: 모든 leaf의 R3
- **JS 효과**:
  ```js
  // getReviewCost — R3일 때
  if(hasCard('LV3_CROSSCHECK') && leaf.endsWith('R3')){
    cost.time = Math.max(0, cost.time - 3);
  }
  // calculateFinalScore — leaf.endsWith('R3') 시 +3
  if(hasCard('LV3_CROSSCHECK') && leaf.endsWith('R3')) bonus += 3;
  ```

##### 2.3 Lv4 카드 — "맥락 파악력"

- **획득 조건**: Lv3 → Lv4 진입 (누적 exp ≥ 65)
- **효과**: A 분기(직접) 결과 점수 **+5**
- **메타포**: 직접 작업 시 맥락 더 잘 잡음. 같은 노력으로 더 좋은 결과.
- **대상 leaf**: A1·A2·A3 시작 leaf
- **JS 효과**:
  ```js
  if(hasCard('LV4_CONTEXT') && leaf.charAt(0)==='A') bonus += 5;
  ```

##### 2.4 Lv5 카드 — "AI 능숙"

- **획득 조건**: Lv4 → Lv5 진입 (누적 exp ≥ 100)
- **효과**: 모든 비용 **-15%** + 모든 결과 점수 **+10**
- **메타포**: 학기 끝의 능숙. 자원도 결과도 모두 향상.
- **대상**: 모든 leaf
- **JS 효과**:
  ```js
  if(hasCard('LV5_FLUENCY')){
    cost.time = Math.round(cost.time * 0.85);
    cost.energy = Math.round(cost.energy * 0.85);
  }
  // calculateFinalScore
  if(hasCard('LV5_FLUENCY')) bonus += 10;
  ```

---

#### 3. 데이터 구조

##### 3.1 CONFIG

```js
const CONFIG = {
  // ... (기존)
  competencyCardsEnabled: true,
  competencyCards: {
    LV2_PROMPT:   {level:2, name:'프롬프트 정교화', desc:'B 분기 시간 비용 -10%'},
    LV3_CROSSCHECK:{level:3, name:'교차 검증 습관', desc:'R3 검토 비용 -3, 결과 점수 +3'},
    LV4_CONTEXT:  {level:4, name:'맥락 파악력',     desc:'A 분기 결과 점수 +5'},
    LV5_FLUENCY:  {level:5, name:'AI 능숙',         desc:'모든 비용 -15%, 결과 점수 +10'}
  },
  useReviewLevelBoost: false  // 검토 격상 메커닉 폐기 (카드 시스템으로 대체)
};
```

##### 3.2 gameState

```js
gameState.competencyCards = []; // 보유 카드 ID 배열, 예: ['LV2_PROMPT', 'LV3_CROSSCHECK']
```

- localStorage에 보존 (학기 누적).
- `resetGame` 시 빈 배열로 초기화.
- 디버그 패널: 강제 카드 부여/제거 버튼.

---

#### 4. 통합 위치

##### 4.1 카드 획득 — `goCut6` 안 (레벨업 직후)

```js
// 레벨업 검출 후 (line 2329 부근, didLevelUp 분기)
if(didLevelUp){
  var cardId = Object.keys(CONFIG.competencyCards).find(function(id){
    return CONFIG.competencyCards[id].level === newLevel;
  });
  if(cardId && gameState.competencyCards.indexOf(cardId) < 0){
    gameState.competencyCards.push(cardId);
    trackEvent('competency_card_acquired', {cardId:cardId, level:newLevel});
  }
}
```

##### 4.2 cost meter 효과 — 단계 비용 헬퍼 출력에 적용

`_applyMult` 함수 직후 카드 효과 hook 추가:

```js
function _applyCardModifiers(cost, context){
  // context = { stage:'tier1'|'tier2'|'review', t1, t2, leaf }
  if(!gameState || !gameState.competencyCards) return cost;
  var cards = gameState.competencyCards;
  // Lv2 — B 분기 시간 -10%
  if(cards.indexOf('LV2_PROMPT')>=0 && context.t1==='B'){
    cost = {time:Math.round(cost.time*0.90), energy:cost.energy};
  }
  // Lv3 — R3 검토 비용 -3
  if(cards.indexOf('LV3_CROSSCHECK')>=0 && context.stage==='review' && context.leaf && context.leaf.endsWith('R3')){
    cost = {time:Math.max(0,cost.time-3), energy:cost.energy};
  }
  // Lv5 — 모든 비용 -15%
  if(cards.indexOf('LV5_FLUENCY')>=0){
    cost = {time:Math.round(cost.time*0.85), energy:Math.round(cost.energy*0.85)};
  }
  return cost;
}

function getTier1Cost(t1){
  return _applyCardModifiers(_applyMult(_rawTier1Cost(t1)), {stage:'tier1', t1:t1});
}
// 같은 패턴으로 getTier2Cost / getReviewCost 갱신
```

##### 4.3 결과 점수 보너스 — `calculateFinalScore` 안

```js
// base + detected + cardBonus(학맞통) - resourcePenalty + competencyCardBonus
function competencyCardScoreBonus(leaf){
  if(!gameState || !gameState.competencyCards) return 0;
  var cards = gameState.competencyCards;
  var bonus = 0;
  if(cards.indexOf('LV3_CROSSCHECK')>=0 && leaf.endsWith('R3')) bonus += 3;
  if(cards.indexOf('LV4_CONTEXT')>=0 && leaf.charAt(0)==='A') bonus += 5;
  if(cards.indexOf('LV5_FLUENCY')>=0) bonus += 10;
  return bonus;
}

function calculateFinalScore(result, review, level, leaf){
  var base = result.basePoint;
  var detected = (CONFIG.useReviewLevelBoost ? detectIssues(result, review, level) : 0);
  var cardBonus = getCardBonus(leaf);  // 학맞통 카드 (기존)
  var resourcePenalty = calcResourcePenalty(gameState.resources);
  var competencyBonus = competencyCardScoreBonus(leaf);  // 신규
  return Math.max(0, base + detected + cardBonus - resourcePenalty + competencyBonus);
}
```

##### 4.4 UI — 보유 카드 표시

- **시작 화면 (`showStartScreen`)**: 학기 진행 박스 아래, 보유 카드 리스트 (없으면 생략).
- **컷6 (`goCut6`)**: 카드 획득 알림 — 레벨업 메시지와 함께 "카드 획득 → '프롬프트 정교화'" 강조 박스.
- **선택 버튼 cost meter**: 카드 효과 적용된 값이 자동으로 미터에 반영 (헬퍼가 이미 처리).

##### 4.5 검토 격상 메커닉 OFF

- `CONFIG.useReviewLevelBoost = false`.
- `detectIssues` 호출을 `calculateFinalScore`에서 분기 (위 §4.3 코드).
- v0.5 한정으로 폐기. SPEC.md(v0.4) §3.4 C안은 v0.6 이후 재평가 가능.

---

#### 5. 이벤트 로그 (신규)

```
competency_card_acquired   ← Lv2~5 진입 시
```

페이로드: `{cardId, level, allCards: gameState.competencyCards}`

---

#### 6. DebugPanel 확장

- 표시: `boards: [LV2_PROMPT, LV3_CROSSCHECK]` 같이 ID 목록
- 버튼:
  - 카드 모두 부여 (Lv2~5 4장)
  - 카드 모두 제거
  - 개별 카드 토글 (4 버튼)

---

#### 7. 학기 종합 리포트 통합

`showFinalReport` 신규 박스: "획득한 역량 카드" — 보유 카드 목록 + 효과 + Lv 도달 시점(시나리오 인덱스).

→ "한 학기를 거쳐 어떤 학습자가 되었는가"의 핵심 자산.

---

#### 8. 미해결 / 차후

- 카드 효과 multiplier가 multiplier(0.6)와 곱해질 때 round 누적 오차 (예: 100 × 0.6 × 0.85 = 51 vs 100 × 0.85 × 0.6 = 51). 일관 처리 — 적용 순서: `_rawXxx → _applyMult → _applyCardModifiers`. 한 번씩만 round.
- 학맞통 카드(cardBoost)와 역량 카드 점수 보너스 누적 시 점수 인플레이션 가능 (DECISIONS §1.1: 상한 없음 결정 — 그대로 진행).
- Lv2 시나리오 완료 후 Lv3 즉시 진입 시 카드 2장 동시 획득 가능 (현재 한 시나리오에서 한 단계만 — DECISIONS §5.1). 단계별 진입 보장 → 한 시나리오 = 한 카드 max.
- B/A 분기 모두 효과 받는 leaf는 없음 (B 시작 leaf vs A 시작 leaf 분기). 충돌 없음.
- 검토 격상 메커닉의 `levelStep` / `levelExtraBonus` CONFIG는 보존 (deprecated 표시만). v0.6 재평가 시 부활 가능.

---

작성: 아리공 (Air, 세션254)
