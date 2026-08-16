// =====================================================
// 7. Storage (v0.2 보존, key만 v03)
// =====================================================
// SPEC-verbose-log §6-2 — 세이브는 어떤 경우에도 이벤트 로그보다 우선한다.
// try/catch가 없어서 쿼터가 차면 선택 핸들러 3곳(03-engine 45·68·109)에서 던졌고,
// 그때 화면은 정상으로 넘어가는데 scenarioHistory만 0으로 남았다(다시 해도 동일).
// 실패하면 이벤트 로그를 먼저 비우고 한 번 재시도한다.
function saveGame(){
  var payload=JSON.stringify({state:gameState,at:new Date().toISOString()});
  try{localStorage.setItem(CONFIG.storageKey,payload);}
  catch(e){
    try{localStorage.removeItem(CONFIG.eventLogKey);}catch(x){}
    try{localStorage.setItem(CONFIG.storageKey,payload);}
    catch(e2){try{console.error('[AI Literacy] saveGame 실패 — 저장 공간 부족',e2);}catch(x){}}
  }
}
function loadGame(){try{var d=JSON.parse(localStorage.getItem(CONFIG.storageKey));return d?d.state:null;}catch(e){return null;}}
function clearGame(){localStorage.removeItem(CONFIG.storageKey);}
function hasSave(){return!!localStorage.getItem(CONFIG.storageKey);}
function getSid(){var s=sessionStorage.getItem(CONFIG.sessionIdKey);if(!s){s='s_'+Date.now()+'_'+Math.random().toString(36).slice(2);sessionStorage.setItem(CONFIG.sessionIdKey,s);}return s;}
function resetSid(){sessionStorage.removeItem(CONFIG.sessionIdKey);}

