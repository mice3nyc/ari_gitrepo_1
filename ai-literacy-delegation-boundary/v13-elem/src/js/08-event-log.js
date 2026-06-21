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

function trackEvent(t,p){
  var e={type:t,sid:getSid(),at:new Date().toISOString(),scenarioId:gameState?gameState.currentScenarioId:null,snap:stateSnap(),payload:p||{}};
  console.log('[AI Literacy v0.8]',e);
  try{
    var l=JSON.parse(localStorage.getItem(CONFIG.eventLogKey)||'[]');
    l.push(e);
    localStorage.setItem(CONFIG.eventLogKey,JSON.stringify(l));
  }catch(x){}
}

function getEvents(){try{return JSON.parse(localStorage.getItem(CONFIG.eventLogKey)||'[]');}catch(e){return[];}}
function clearEvents(){localStorage.removeItem(CONFIG.eventLogKey);}
function downloadLog(){var l=localStorage.getItem(CONFIG.eventLogKey)||'[]';var b=new Blob([l],{type:'application/json'});var u=URL.createObjectURL(b);var a=document.createElement('a');a.href=u;a.download='ai-literacy-v05-log.json';a.click();URL.revokeObjectURL(u);}

