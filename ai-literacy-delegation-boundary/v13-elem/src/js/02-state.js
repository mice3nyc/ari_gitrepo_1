// =====================================================
// 5. Game State (v0.4 — 두 역량 + 자원)
// =====================================================
var gameState=null,currentRow=null;

function createInitialState(){
  var rms=CONFIG.resourceMaxStart;
  var rc={};CONFIG.scenarios.forEach(function(s){rc[s]=0;});
  return {
    currentScenarioId:null,
    currentTier:1,
    selectedTier1:null,
    selectedTier2:null,
    selectedReview:null,
    competencies:{
      delegationChoice:{value:0,history:[]},
      knowledge:{value:0,history:[]}
    },
    score:0,
    totalScore:0,
    itemsCollected:[],
    // v0.8 §6.6.5 — cardsHeld 폐기 (axisDelta 카드 매칭 룰 + inventory.competencyCards로 대체)
    scenarioHistory:[],
    // v0.4 신규 — 자원 시스템 (SPEC §7)
    resources:{
      time:{current:rms.time,max:rms.time,history:[]},
      energy:{current:rms.energy,max:rms.energy,history:[]}
    },
    exp:{current:0,level:1,thresholds:CONFIG.expThresholds},
    hintEnabled:getHintPref(),
    scenarioRepeatCount:rc,
    // v0.5 신규 — 학기 Arc 누적
    clearedScenarios:[],
    // v0.5 Phase 8.8 — 자원토큰(RP) 시스템
    rp:{balance:0,history:[]},
    completed:false,
    // v0.6 Phase 6 (5/3 세션278) — 타이틀+튜토리얼 1회 노출 플래그
    tutorialSeen:false,
    // v0.6 §12 (5/3 세션278) — pending 점수 (시나리오 끝에 누적 흡수)
    pending:{delegation:0,knowledge:0},
    // v0.8 — 3트랙 카드 인벤토리
    inventory:{competencyCards:[],humanCentricCards:[],domainCards:[],growthCards:[]},
    // v0.8 — 리플레이 상태
    replay:{},
    // SPEC-play-log — 한 판 익명 id + 시작 시각 (makePlayRecord에서 첫 발급)
    playId:null,
    playStartedAt:null
  };
}

// QA9 (7/2) — 재도전 진입 시 replayScenario가 clearedScenarios에서 해당 시나리오를
// 먼저 빼는데(§14.2), 완료 전 나가면 그 구멍이 남아 "다음 하나만 열림" 순차 잠금(§14.5)과
// 부딪혀 이미 끝낸 시나리오가 잠긴 것처럼 보인다. replay[sid].played는 재도전으로도 되돌아가지
// 않는 영구 완료 기록이라, 순차 잠금 판정은 이걸 더한 "한 번이라도 끝낸" 목록을 기준으로 한다.
function getEverClearedScenarios(gs){
  var cleared=(gs&&gs.clearedScenarios)||[];
  var replay=(gs&&gs.replay)||{};
  return CONFIG.scenarios.filter(function(sid){
    return cleared.indexOf(sid)>=0||(replay[sid]&&replay[sid].played===true);
  });
}

// v0.5: 시나리오별 컷 이미지 동적 매핑
var _imgCacheBust='?v=20260623a';
function getCutImage(scenarioId,cutNum){
  var n=({'bookreport':'01','animaltalk':'02','jobcard':'03','classmascot':'04','historycheck':'05'})[scenarioId]||'01';
  var base='images/s'+n;
  var t1=gameState&&gameState.selectedTier1;
  var t2=gameState&&gameState.selectedTier2;
  var rv=gameState&&gameState.selectedReview;
  if(cutNum===1)return base+'_c1.webp'+_imgCacheBust;
  if(cutNum===2)return t1?base+'_c2_'+t1+'.webp'+_imgCacheBust:null;
  if(cutNum===3)return t2?base+'_c3_'+t2+'.webp'+_imgCacheBust:null;
  if(cutNum===4)return t2?base+'_c4_'+t2+'.webp'+_imgCacheBust:null;
  if(cutNum===5)return rv?base+'_c5_'+rv+'.webp'+_imgCacheBust:null;
  if(cutNum===6)return null;
  return null;
}

