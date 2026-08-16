// =====================================================
// 8. Event Logger (v0.2 보존)
// =====================================================
function stateSnap(){
  if(!gameState)return{};
  return{
    sid:gameState.currentScenarioId,
    tier:gameState.currentTier,
    t1:gameState.selectedTier1,
    t2:gameState.selectedTier2,
    rv:gameState.selectedReview,
    dlg:gameState.competencies.delegationChoice.value,
    knl:gameState.competencies.knowledge.value,
    score:gameState.score,
    total:gameState.totalScore,
    items:gameState.itemsCollected.length,
    // v0.8 — cardsHeld 폐기. inventory.competencyCards 누적 카운트로 대체.
    cards:_reportAllCards().length,
    // v0.4 자원 스냅
    res_time:gameState.resources?gameState.resources.time.current:null,
    res_energy:gameState.resources?gameState.resources.energy.current:null
  };
}

// SPEC-verbose-log §6-2 — 로컬 이벤트 로그 상한(링버퍼).
// 트리밍이 없어서 판당 58건·29.1KB가 영원히 쌓였다(clearEvents는 DebugPanel에서만 불린다).
// 약 172판에서 localStorage 5MB가 차고, 그때 증상은 «화면은 멀쩡한데 진행만 안 잡힌다»였다.
// 200이면 최근 3~4판이 남고 크기는 ~100KB에 묶인다.
var _EVENT_LOG_MAX = 200;

function trackEvent(t,p){
  var e={type:t,sid:getSid(),at:new Date().toISOString(),scenarioId:gameState?gameState.currentScenarioId:null,snap:stateSnap(),payload:p||{}};
  console.log('[AI Literacy v0.8]',e);
  // SPEC-verbose-log §3 — 전송 봉투는 08e가 따로 만든다(snap 제외). off면 즉시 no-op. 실패해도 여기 흐름은 안 막는다.
  try{verboseLogEvent(t,p);}catch(x){}
  try{
    var l=JSON.parse(localStorage.getItem(CONFIG.eventLogKey)||'[]');
    l.push(e);
    if(l.length>_EVENT_LOG_MAX)l=l.slice(l.length-_EVENT_LOG_MAX);
    localStorage.setItem(CONFIG.eventLogKey,JSON.stringify(l));
  }catch(x){}
}

function getEvents(){try{return JSON.parse(localStorage.getItem(CONFIG.eventLogKey)||'[]');}catch(e){return[];}}
function clearEvents(){localStorage.removeItem(CONFIG.eventLogKey);}
function downloadLog(){var l=localStorage.getItem(CONFIG.eventLogKey)||'[]';var b=new Blob([l],{type:'application/json'});var u=URL.createObjectURL(b);var a=document.createElement('a');a.href=u;a.download='ai-literacy-v05-log.json';a.click();URL.revokeObjectURL(u);}

