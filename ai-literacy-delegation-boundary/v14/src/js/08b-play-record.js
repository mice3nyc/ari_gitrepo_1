// =====================================================
// 8b. Play Record + Outbox (SPEC-play-log, 세션498)
// 익명 플레이 데이터를 로컬 outbox 큐에 쌓는다. 전송 인프라는 별도 SPEC.
// 게임 로직·storageKey 불변, localStorage 키 1개(outboxKey)만 추가 (additive).
// =====================================================

// 학습자 유형 패턴 키 → 코드(0~5). 매칭표는 SPEC-play-log §9 / texts.yaml pattern_names.
var _PLAY_TYPE_CODE={selective:0,aiHeavy:1,selfStart:2,reviewStrong:3,reviewWeak:4,recoveryNeeded:5};
function _playTypeCode(pattern){
  var c=_PLAY_TYPE_CODE[pattern];
  return (typeof c==='number')?c:2; // 기본 selfStart
}
function _uniqList(arr){
  var seen={},out=[];
  for(var i=0;i<arr.length;i++){var v=arr[i];if(v!=null&&v!==''&&!seen[v]){seen[v]=true;out.push(v);}}
  return out;
}

// 한 판 레코드 생성 — scenarioHistory를 §1 스키마로 압축.
// opts.done: 학기 완주 시 true (end 블록 채움). 시나리오 중간 갱신은 false.
function makePlayRecord(gs,opts){
  opts=opts||{};
  if(!gs)return null;
  // pid·st 발급 (없으면 첫 호출 시점에). saveGame으로 영속 → 같은 판은 같은 pid.
  if(!gs.playId){
    gs.playId='p_'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);
    gs.playStartedAt=Date.now();
  }
  var hist=gs.scenarioHistory||[];
  // 시나리오별 최신 엔트리만(리플레이 시 마지막 결과), 플레이 순서 유지
  var order=[],byId={};
  for(var i=0;i<hist.length;i++){
    var hid=hist[i].scenarioId;
    if(byId[hid]===undefined)order.push(hid);
    byId[hid]=hist[i];
  }
  var sc=order.map(function(id){
    var h=byId[id];
    var disc=h.discounts||[];
    var ct=0,ce=0,cd=[];
    for(var k=0;k<disc.length;k++){
      var d=disc[k];
      ct+=(d.time||0);ce+=(d.energy||0);                 // 소비(할인 후 실비)
      var dt=(d.rawTime||0)-(d.time||0),de=(d.rawEnergy||0)-(d.energy||0); // 할인액
      if(dt>0||de>0)cd.push([d.stage,dt,de]);
    }
    var rec={id:id,t1:h.tier1,t2:h.tier2,rv:h.review,g:h.grade,s:h.finalScore,
      dl:h.dlgDelta,dk:h.knlDelta,ct:ct,ce:ce,
      rep:Math.max(0,((gs.scenarioRepeatCount&&gs.scenarioRepeatCount[id])||0)-1)}; // 총 완료수-1 = 리플레이 횟수
    if(cd.length)rec.cd=cd;
    return rec;
  });
  var rec={v:CONFIG.version,pid:gs.playId,st:gs.playStartedAt||Date.now(),en:Date.now(),done:!!opts.done,sc:sc};
  if(opts.done){
    var inv=gs.inventory||{};
    rec.end={
      total:gs.totalScore||0,
      lv:(gs.exp&&gs.exp.level)||1,
      type:_playTypeCode((typeof _judgePattern==='function')?_judgePattern(hist):'selfStart'),
      cards:{
        h:_uniqList((inv.humanCentricCards||[]).map(function(c){return c.tag;})),
        d:_uniqList((inv.domainCards||[]).map(function(c){return c.label;})),
        g:_uniqList((inv.growthCards||[]).map(function(c){return c.label;}))
      }
    };
  }
  return rec;
}

// outbox = play record 배열 (localStorage). append-only, 같은 pid는 교체.
function getOutbox(){try{return JSON.parse(localStorage.getItem(CONFIG.outboxKey)||'[]');}catch(e){return[];}}
function _saveOutbox(arr){try{localStorage.setItem(CONFIG.outboxKey,JSON.stringify(arr));}catch(e){}}
function upsertOutbox(rec){
  if(!rec||!rec.pid)return;
  var box=getOutbox(),found=false;
  for(var i=0;i<box.length;i++){if(box[i].pid===rec.pid){box[i]=rec;found=true;break;}}
  if(!found)box.push(rec);
  _saveOutbox(box);
}
function clearOutbox(){try{localStorage.removeItem(CONFIG.outboxKey);}catch(e){}}
function dequeueFromOutbox(pid){_saveOutbox(getOutbox().filter(function(r){return r.pid!==pid;}));}
// 시나리오 종료/완주 시 안전 호출 래퍼 (예외가 게임 흐름을 막지 않게)
function recordScenarioEnd(){try{upsertOutbox(makePlayRecord(gameState,{done:false}));}catch(e){}}
function recordSemesterDone(){try{upsertOutbox(makePlayRecord(gameState,{done:true}));}catch(e){}}
