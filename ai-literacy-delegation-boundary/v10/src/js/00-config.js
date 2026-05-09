
// =====================================================
// 3. Config
// =====================================================
var CONFIG={
  storageKey:'ai-literacy-delegation-boundary-v10',
  eventLogKey:'ai-literacy-delegation-boundary-v10-events',
  sessionIdKey:'ai-literacy-v10-session-id',
  version:'v1.0',
  scenarios:['selfintro','groupwork','eorinwangja','career','studyplan'],
  pointThresholds:{S:95,A:85,B:75,C:60,D:0},
  minResourceCost:1,
  cardBoost:20,
  detectedIssueBoost:10,
  // v0.4 신규 (SPEC §12) — Phase 3 이후 사용
  resourceMaxStart:{time:100,energy:100},
  // v0.5 — 비용 multiplier (데이터 보존 + 튜닝 조정용). 0.6 = 적정 선택 시 1.7~3 시나리오 버팀
  resourceCostMultiplier:1.0,  // v0.6 5/3: 폐지 (raw에 0.6 곱한 값으로 재조정 완료, MIGRATION-VALUES.md §4)
  // v0.5 — 시나리오 종료 시 자원 자동 회복 OFF ([[요청.26.0429.1925-v05회복없는학기]])
  autoRecoverOnEnd:false,
  recoverBase:0, // v0.9: 등급별 차등 폐기, 에너지 고정 +18
  gradeBonus:{S:0,A:0,B:0,C:0,D:0},
  energyRecoverFlat:0, // v0.9 세션322: 자동 회복 전면 폐기. RP 직접 배분으로 전환
  // v0.5 Phase 8.7 — 부분 회복 hook 폐기 (DECISIONS §10.1). RP 시스템으로 전환
  // v0.5 Phase 8.8 — 자원토큰(RP) 시스템 (DECISIONS §10.2~10.4)
  // 명칭: 코드는 RP 유지(식별자 길이/i18n), UI 텍스트는 "자원토큰"
  rpRewardByGrade:{S:10,A:7,B:5,C:3,D:1},
  rpLevelUpBonusByLevel:{2:10,3:15,4:20,5:20},
  rpCost:{time:1,energy:1}, // 2축 전용 (DECISIONS §10.4 — 위/도 분배 폐기)
  // v0.8 5/4 세션289 — 비대칭 효과 (mNeg=1 되돌림)
  // 양수 ×2 (잘하면 두 배 보상), 음수 ×1 (잘못해도 한 배만 페널티). 메모리 5/3 세션278 정합.
  // 미터 표시는 effective 값(양수 x2 적용)이지만, 비용 할인 계산 단계에서 또 곱하지 않음 — _applyDiscount의 raw → effective는 한 번만.
  competencyDiscountMultPos:1, // v0.9 세션322: ×2 증폭 폐기. 역량 점수 = 할인액
  competencyDiscountMultNeg:1,
  // v0.5 Phase 8.13 — 결과 리포트 (DECISIONS §10.13)
  // 위/도 4유형 텍스트. AI 리터러시 메시지: 비판적 위임 + 도메인 지식 둘 다 키워서 AI를 잘 쓰자.
  // "AI 안 쓰는 게 좋은 것"으로 읽히지 않도록. (피터공 4/30 시정)
  resultTextsByType:{
    'pp':'AI를 동료로 쓰면서 자기 지식도 같이 키웠다. AI 리터러시의 본 모습.',     // 위+/도+
    'pn':'AI를 잘 골라 썼지만, 검증할 자기 토대가 얇다. AI의 답을 비판할 힘이 모자란다.', // 위+/도−
    'np':'자기 힘으로 풀어냈다. 다만 AI에 맡겨야 할 자리에서도 혼자 갔다 — 효율이 떨어졌다.', // 위−/도+
    'nn':'AI 리터러시의 출발선. 무엇을 위임하고 무엇을 익힐지, 다시 한 번.',          // 위−/도−
    'mid':'흔들리며 길을 찾는 중.'                                              // 0±2 zone
  },
  // 0±2 zone: |위| ≤ 2 AND |도| ≤ 2 (둘 다 약한 신호일 때 mid)
  resultMidZone:2,
  // 시상 무드 대사 (등급별, 초등 고학년~중등 톤)
  resultMoods:{
    'S':'와, 이번 학기 진짜 멋졌어. AI랑 베프가 됐네.',
    'A':'꽤 잘 골라 썼어. 다음엔 더 멀리 갈 수 있겠다.',
    'B':'맞췄다 놓쳤다 한 학기. 다음엔 어떻게 갈까?',
    'C':'좀 헷갈렸지? 뭐가 내 일이고 뭐가 AI 일인지.',
    'D':'이번 학기는 그냥 흘려보냈어. 한 번 더 도전!'
  },
  expScoreMultiplier:0.3,
  expThresholds:[0,20,40,65,100],
  meterMaxByLevel:{
    1:{time:100,energy:100},
    2:{time:100,energy:100},
    3:{time:100,energy:100},
    4:{time:100,energy:100},
    5:{time:100,energy:100}
  },
  // v0.8 — 폐기 (합산 모델 §6.6.5): useReviewLevelBoost / levelStep / levelExtraBonus / levelDetectBonus.
  // detectIssues / 검토 격상 메카닉은 합산 모델로 흡수. review.points (R1=10·R2=20·R3=30) 단순 분배.
  hintEnabledDefault:false,
  // v0.8 §6.6.6 — 카드 매칭 보너스 상한 + 자원 잔여 보너스 가중치
  cardMatchBonusCap:10,                    // bonus 항 (cardMatch + resourceLeftover) 최대 10
  resourceLeftoverWeight:0.05              // 잔여 (시간+에너지) × 0.05 → 보너스 점수
};
// 위·도 두 축 점수 매핑 (5/3 세션278 단순화 — 선택당 ±1만, 한 시나리오 max ±3)
// ++/+/-/--/0 → 부호만 보고 +1/0/-1로 매핑. 학생이 원 1·2·3개로 직관적으로 잡힘.
function getAxisDelta(sign){
  if(!sign||sign==='0')return 0;
  if(sign==='+'||sign==='++')return 1;
  if(sign==='-'||sign==='--')return -1;
  return 0;
}
var GRADE_LABEL={S:'S',A:'A',B:'B',C:'C',D:'D'};

