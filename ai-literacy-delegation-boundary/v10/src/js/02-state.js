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
    replay:{}
  };
}

// v0.5: 시나리오별 컷 이미지 동적 매핑
var _imgCacheBust='?v=20260509';
function getCutImage(scenarioId,cutNum){
  var n=({'selfintro':'01','groupwork':'02','eorinwangja':'03','career':'04','studyplan':'05'})[scenarioId]||'01';
  var base='../images/s'+n;
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

