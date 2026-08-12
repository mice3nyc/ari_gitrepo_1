// =====================================================
// 8c. 게임 시작 참여 로깅 (동현공 Lambda /log 연동)
// 외부 인프라에 "게임 시작했다"만 fire-and-forget으로 전달. 참여 집계용.
// 우리 플레이로그(08b outbox)와는 별개 시스템. 실패는 무시(게임 흐름 방해 금지).
// 레퍼런스: Assets/incoming/AI리터러시/20260617-lambda-api-reference.md §3.1
// ⚠️ 동현공이 Lambda ALLOWED_ORIGINS(배포 도메인)·ALLOWED_GAME_IDS(ai_literacy_md/el) 등록해야 실제 기록됨.
// =====================================================
function _gslClientId(){
  var k=CONFIG.clientIdKey,id=null;
  try{id=localStorage.getItem(k);}catch(e){}
  if(!id){
    try{id=(window.crypto&&crypto.randomUUID)?crypto.randomUUID():null;}catch(e){}
    if(!id)id='c_'+Date.now().toString(36)+Math.random().toString(36).slice(2,10);
    try{localStorage.setItem(k,id);}catch(e){}
  }
  return id;
}
function sendGameStartLog(){
  if(!CONFIG.logEndpoint||!CONFIG.gameId)return;
  if(gameState&&gameState._startLogged)return; // 한 판에 1회만
  if(gameState)gameState._startLogged=true;
  var payload={eventType:'game_start',gameId:CONFIG.gameId,clientId:_gslClientId(),ts:new Date().toISOString()};
  try{
    fetch(CONFIG.logEndpoint,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload),
      credentials:'omit',
      keepalive:true // 화면 전환 중에도 전송 보장
    }).catch(function(){});
  }catch(e){}
}
