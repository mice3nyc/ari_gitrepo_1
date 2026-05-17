// =====================================================
// 9. Render Functions (v0.3 — 6컷 흐름)
// =====================================================
var container=document.getElementById('main-container');

function showStats(){
  document.getElementById('panel-row').classList.add('visible');
  var invTab=document.getElementById('inv-tab');if(invTab)invTab.style.display='block';
}
function hideStats(){
  document.getElementById('panel-row').classList.remove('visible');
  var invTab=document.getElementById('inv-tab');if(invTab)invTab.style.display='none';
}

// 자원 게이지 업데이트 (작업 2)
// 색상 단계: 70%↑ 초록 / 50~70% 노랑 / 30~50% 주황 / <30% 빨강
function gaugeColorByPct(pct){
  if(pct>=70)return '#5fbf95';
  if(pct>=50)return '#ffd93d';
  if(pct>=30)return '#d9b620';
  return '#ff6b9d';
}
function updateResourceUI(){
  if(!gameState)return;
  var res=gameState.resources;
  ['time','energy'].forEach(function(key){
    var r=res[key];
    var pct=r.max>0?Math.max(0,Math.min(100,r.current/r.max*100)):0;
    document.getElementById('rnum-'+key).textContent=r.current;
    document.getElementById('rgauge-'+key).style.width=pct+'%';
    document.getElementById('rgauge-'+key).style.background=gaugeColorByPct(pct);
  });
}

// 자원 게이지 ±pop 애니메이션 (작업 5 — v0.3 animateStat 패턴 재사용)
function animateResource(key,oldVal,newVal){
  var diff=newVal-oldVal;if(diff===0)return;
  var el=document.getElementById('res-'+key);
  var nm=document.getElementById('rnum-'+key);
  var dl=document.getElementById('rdelta-'+key);
  el.classList.add(diff>0?'flash-up':'flash-down');
  nm.textContent=newVal;
  nm.classList.add('pulsing');
  dl.textContent=(diff>0?'+':'')+diff;
  dl.className='resource-change-indicator show '+(diff>0?'up':'down');
  setTimeout(function(){el.classList.remove('flash-up','flash-down');nm.classList.remove('pulsing');dl.className='resource-change-indicator';},2000);
}

// v0.6 §12 — pending 점수를 원 마커로 렌더 (양수=초록, 음수=빨강)
// 좌우 분할: value 부호에 따라 -neg(좌측 33%, 중앙 쪽 정렬) 또는 -pos(우측 67%) 컨테이너에만 렌더
// prevValue 비교로 양수↔음수 전환 시 깨짐 연출
function renderPendingDots(containerId,value,prevValue){
  var negBox=document.getElementById(containerId+'-neg');
  var posBox=document.getElementById(containerId+'-pos');
  if(!negBox||!posBox)return;
  var activeBox=value>0?posBox:(value<0?negBox:null);
  var inactiveBox=value>0?negBox:(value<0?posBox:null);
  // 비활성 컨테이너에 잔존 dot이 있으면 정리 (안전망)
  if(inactiveBox){
    var stray=inactiveBox.querySelectorAll('.pending-dot:not(.breaking)');
    stray.forEach(function(d){d.classList.add('breaking');(function(node){setTimeout(function(){if(node.parentNode)node.parentNode.removeChild(node);},350);})(d);});
  }
  // 0이면 활성 박스 없음 — 양쪽 모두 비움(깨짐 연출)
  if(value===0){
    [negBox,posBox].forEach(function(box){
      var dots=box.querySelectorAll('.pending-dot:not(.breaking)');
      dots.forEach(function(d){d.classList.add('breaking');(function(node){setTimeout(function(){if(node.parentNode)node.parentNode.removeChild(node);},350);})(d);});
    });
    return;
  }
  // 양수↔음수 전환 — 이전 활성 박스의 dot은 위 inactive 정리에서 이미 처리됨. 새 박스에 처음부터 그림
  var crossing=(typeof prevValue==='number')&&((prevValue>0&&value<0)||(prevValue<0&&value>0));
  if(crossing){
    var existing=activeBox.querySelectorAll('.pending-dot:not(.breaking)');
    existing.forEach(function(d){d.classList.add('breaking');});
    setTimeout(function(){activeBox.innerHTML='';drawDots(activeBox,value,true);},350);
    return;
  }
  // 추가/감소 — 동일 부호 내에서 활성 박스만 조작
  var prevAbs=Math.abs(prevValue||0), curAbs=Math.abs(value);
  if(curAbs>prevAbs){
    // 추가 — 새 dot N개 등장
    for(var i=prevAbs;i<curAbs;i++){
      var d=document.createElement('div');
      d.className='pending-dot '+(value>0?'positive':'negative')+' appearing';
      activeBox.appendChild(d);
    }
  }else if(curAbs<prevAbs){
    // 감소 — 끝(중앙에서 가장 먼 쪽)에서 깨짐
    var dots=activeBox.querySelectorAll('.pending-dot:not(.breaking)');
    for(var j=dots.length-1;j>=curAbs;j--){
      dots[j].classList.add('breaking');
      (function(node){setTimeout(function(){if(node.parentNode)node.parentNode.removeChild(node);},350);})(dots[j]);
    }
  }
  // 부호는 같지만 dot 색이 안 맞으면 강제 재그림 (edge case)
  if(prevValue!==undefined){
    var firstDot=activeBox.querySelector('.pending-dot');
    if(firstDot&&((value>0&&!firstDot.classList.contains('positive'))||(value<0&&!firstDot.classList.contains('negative')))){
      activeBox.innerHTML='';drawDots(activeBox,value,true);
    }
  }
}
function drawDots(box,value,animate){
  var n=Math.abs(value);
  for(var i=0;i<n;i++){
    var d=document.createElement('div');
    d.className='pending-dot '+(value>0?'positive':'negative')+(animate?' appearing':'');
    box.appendChild(d);
  }
}
// pending 흡수 애니메이션 — 모든 dot이 게이지로 흘러내림. Promise 반환
function absorbPending(){
  return new Promise(function(resolve){
    if(!gameState||!gameState.pending){resolve();return;}
    var dlgPending=gameState.pending.delegation||0;
    var knlPending=gameState.pending.knowledge||0;
    if(dlgPending===0&&knlPending===0){resolve();return;}
    var boxes=[document.getElementById('pending-dots-delegation'),document.getElementById('pending-dots-knowledge')];
    boxes.forEach(function(box){
      if(!box)return;
      var dots=box.querySelectorAll('.pending-dot');
      dots.forEach(function(d){d.classList.add('absorbing');});
    });
    setTimeout(function(){
      // 누적에 박고 pending 0
      gameState.competencies.delegationChoice.value+=dlgPending;
      gameState.competencies.knowledge.value+=knlPending;
      gameState.pending.delegation=0;
      gameState.pending.knowledge=0;
      // dot 클리어 + 게이지 갱신 — sub container(.pending-dots-neg/.pending-dots-pos) 구조는 보존
      boxes.forEach(function(box){if(!box)return;var subs=box.querySelectorAll('.pending-dots-neg, .pending-dots-pos');subs.forEach(function(s){s.innerHTML='';});});
      updateStats();
      saveGame();
      resolve();
    },650);  // 0.6s 흡수 + 0.05s buffer
  });
}

// renderPendingDots용 prev 추적
var _prevPending={delegation:0,knowledge:0};

// v0.8 5/4 세션289 — 미터/숫자 표시는 effective 값(양수 ×mPos, 음수 ×mNeg).
// 비용 박스 -N과 같은 단위로 도착하게. 내부 점수(raw)는 그대로 두고 표시만 변환.
function effectiveCompetency(rawV){
  if(rawV>=0){
    var mPos=(typeof CONFIG.competencyDiscountMultPos==='number')?CONFIG.competencyDiscountMultPos:2;
    return rawV*mPos;
  }else{
    var mNeg=(typeof CONFIG.competencyDiscountMultNeg==='number')?CONFIG.competencyDiscountMultNeg:1;
    return rawV*mNeg;
  }
}
function updateStats(){
  if(!gameState)return;
  var dlg=gameState.competencies.delegationChoice.value;
  var knl=gameState.competencies.knowledge.value;
  var dlgE=effectiveCompetency(dlg);
  var knlE=effectiveCompetency(knl);
  document.getElementById('num-delegation').textContent=(dlgE>0?'+':'')+dlgE;
  document.getElementById('num-knowledge').textContent=(knlE>0?'+':'')+knlE;
  // 양방향 바 — raw 기준 대칭 (raw -10/+10 → ±50%). 라벨은 effective(-10/+20).
  setBipolar('gauge-delegation','num-delegation',dlg);
  setBipolar('gauge-knowledge','num-knowledge',knl);
  // §12 pending 원 마커
  if(gameState.pending){
    renderPendingDots('pending-dots-delegation',gameState.pending.delegation||0,_prevPending.delegation);
    renderPendingDots('pending-dots-knowledge',gameState.pending.knowledge||0,_prevPending.knowledge);
    _prevPending.delegation=gameState.pending.delegation||0;
    _prevPending.knowledge=gameState.pending.knowledge||0;
  }
  // 중앙 SCORE 표시 (LV은 updateExpUI가 담당)
  var scoreNumEl=document.getElementById('score-num');
  if(scoreNumEl)scoreNumEl.textContent=gameState.score;
  updateResourceUI();
  updateExpUI();
}

function setBipolar(fillId,numId,value){
  var fill=document.getElementById(fillId);
  var num=document.getElementById(numId);
  if(!fill||!num)return;
  // raw 기준 대칭 게이지: raw ±10 → ±50%. 단위당 5%. 라벨은 effective(-10/+20).
  var pct=Math.min(50,Math.abs(value)*5);
  fill.style.width=pct+'%';
  fill.classList.remove('positive','negative');
  num.classList.remove('positive','negative');
  if(value>0){fill.classList.add('positive');num.classList.add('positive');}
  else if(value<0){fill.classList.add('negative');num.classList.add('negative');}
}

function getCurrentCutNum(){
  if(!gameState)return 1;
  if(gameState.completed)return 6;
  if(gameState.selectedReview)return 6;
  if(gameState.selectedTier2)return gameState.currentTier==='final'?6:(gameState.currentTier==='result'?4:5);
  if(gameState.selectedTier1)return 3;
  return gameState.currentTier===1?1:2;
}

function animateStat(which,oldVal,newVal){
  var diff=newVal-oldVal;if(diff===0)return;
  var st=document.getElementById('stat-'+which),nm=document.getElementById('num-'+which),dl=document.getElementById('delta-'+which);
  st.classList.add(diff>0?'flash-up':'flash-down');
  // 표시는 effective. delta도 effective(newE-oldE)로 — 학생 일관 직관.
  var newE=effectiveCompetency(newVal);
  var oldE=effectiveCompetency(oldVal);
  var diffE=newE-oldE;
  nm.textContent=(newE>0?'+':'')+newE;
  nm.classList.add('pulsing');
  dl.textContent=(diffE>0?'+':'')+diffE;
  dl.className='stat-change-indicator show '+(diff>0?'up':'down');
  setTimeout(function(){st.classList.remove('flash-up','flash-down');nm.classList.remove('pulsing');dl.className='stat-change-indicator';},2000);
}

// 타이틀+튜토리얼 화면 (§11, v0.8 §11.5 5/4 세션287 정정)
// 진행자 톤 폐기 + 캐논 도입 별도 자리로. 직접 명제 + 한 줄 도입 + 학생 톤 튜토리얼 4문장.
function showTitleScreen(){
  hideStats();
  if(!gameState){
    var saved=loadGame();
    if(saved&&saved.clearedScenarios){gameState=saved;}
    else{gameState=createInitialState();saveGame();}
  }
  var _ts=_t('title_screen',{});
  var h='<div class="title-frame">';
  h+='<h1>'+(_ts.heading||'AI 리터러시, 위임의 경계!')+'</h1>';
  h+='<div class="intro-text">'+(_ts.intro||'AI 시대, 무엇을 맡기고 무엇을 직접 할 것인가')+'</div>';
  h+='<div class="host-text">'+(_ts.host_text||'딸깍하면 누구나 할 수 있는 AI 시대라고 한다.<br>누구나 할 수 있다면, 누구인가가 중요하다.<br>무엇을 AI가 해야 하고 무엇은 내가 직접 해야 하는지. 당신은 구별할 수 있을까?')+'</div>';
  var _tut=_ts.tutorial||[];
  h+='<ol class="tutorial-list">';
  if(_tut.length){for(var ti=0;ti<_tut.length;ti++)h+='<li>'+_tut[ti]+'</li>';}
  else{
    h+='<li>시나리오마다 선택지를 고른다. 각 선택은 <span class="hl hl--c">시간</span>과 <span class="hl hl--p">에너지</span>를 쓴다.</li>';
    h+='<li>어떤 선택을 하느냐에 따라 결과물의 점수가 달라지고, 내가 어떤 힘을 썼는지 역량 카드로 확인할 수 있다.</li>';
    h+='<li>결과물 점수에 따라 등급이 매겨지고, 받은 토큰을 <span class="hl hl--c">시간</span>이나 <span class="hl hl--p">에너지</span>에 직접 넣는다.</li>';
    h+='<li>경험이 쌓이면 다음 선택의 <span class="hl hl--c">시간</span>·<span class="hl hl--p">에너지</span> 비용이 줄어든다.</li>';
  }
  h+='</ol>';
  h+='<div class="title-actions">';
  h+='<button class="start-btn-large" onclick="enterFromTitle()">'+(_ts.btn_start||'게임 시작')+'</button>';
  h+='</div>';
  // 캐논 도입·진행자 톤은 별도 자리로 이동 (README 또는 ending). v0.8.x 결정 자리.
  // 폐기 카피 (참고용 주석):
  //   "딸깍하면 누구나 할 수 있는 AI 시대라고 한다. 누구나 할 수 있다면, 누구인가가 중요하다."
  //   "무엇을 AI가 해야 하고 무엇은 내가 직접 해야 하는지. 당신은 구별할 수 있을까?"
  //   "AI 리터러시, 위임의 경계! 상황에 따른 당신의 선택이 결과물의 점수를 바꾼다. 높은 점수, 역량 레벨업!"
  h+='</div>';
  container.innerHTML=h;
  trackEvent('title_viewed',{tutorialSeenBefore:!!gameState.tutorialSeen});
}

var _btnLock={};
function btnGuard(key){if(_btnLock[key])return true;_btnLock[key]=true;setTimeout(function(){_btnLock[key]=false;},600);return false;}

function enterFromTitle(){
  if(btnGuard('enterTitle'))return;
  if(!gameState)return;
  gameState.tutorialSeen=true;
  saveGame();
  showStartScreen();
}

function showStartScreen(){
  hideStats();
  if(!gameState){
    var saved=loadGame();
    if(saved&&saved.clearedScenarios){gameState=saved;}
    else{gameState=createInitialState();saveGame();}
  }
  var hintOn=getHintPref();
  var order=CONFIG.scenarios; // 학기 시간 순
  var cleared=gameState.clearedScenarios||[];
  var nextId=null;
  for(var i=0;i<order.length;i++){if(cleared.indexOf(order[i])<0){nextId=order[i];break;}}
  var allDone=(nextId===null);
  var _ss=_t('start_screen',{});
  var h='<div class="semester-frame">';
  h+='<h1>'+(_ss.heading||'AI 리터러시: 위임의 경계')+'</h1>';
  h+='<div class="subtitle">'+(_ss.subtitle||'이건 AI한테 맡겨도 돼?')+'</div>';
  if(allDone){
    h+='<div style="max-width:420px;margin:8px auto 24px;padding:14px 24px;background:var(--acc-yellow);border:var(--border-w) solid var(--ink);box-shadow:var(--shadow);text-align:center;font-family:var(--font-hand);font-size:26px;font-weight:400;color:var(--ink);transform:rotate(-1.5deg);letter-spacing:1px;">'+(_ss.all_done_banner||'AI 리터러시 시나리오를 모두 완료했습니다!')+'</div>';
  }
  h+='<div class="scenario-list">';
  order.forEach(function(sid,idx){
    var s=SCENARIOS[sid];
    var isCleared=cleared.indexOf(sid)>=0;
    var isNext=(sid===nextId);
    var cls='scenario-card';
    if(isCleared)cls+=' cleared';
    if(isNext)cls+=' next';
    var mark=isCleared?(_ss.mark_cleared||'클리어'):(isNext?(_ss.mark_next||'다음 추천 →'):(_ss.mark_free||'자유 선택'));
    var clickAttr=isCleared?'':' onclick="startScenario(\''+sid+'\')"';
    h+='<button class="'+cls+'" type="button"'+clickAttr+'>';
    h+='<span class="sc-num">'+(idx+1)+'</span>';
    h+='<div class="sc-body"><div class="sc-title">'+s.title+'</div><div class="sc-meta">'+s.categoryName+'</div></div>';
    h+='<span class="sc-mark">'+mark+'</span>';
    h+='</button>';
  });
  h+='</div>';
  h+='<div class="semester-actions">';
  if(allDone){
    h+='<button class="action-main" onclick="showFinalReport()">'+(_ss.btn_report||'AI 리터러시 성장 리포트')+'</button>';
  }else if(hasSave()&&gameState.currentScenarioId&&!gameState.completed){
    h+='<button class="action-main" onclick="continueGame()">'+(_ss.btn_continue||'이어서 진행')+'</button>';
  }else if(nextId){
    h+='<button class="action-main" onclick="startScenario(\''+nextId+'\')">'+(_ss.btn_next_scenario||'다음 시나리오')+'</button>';
  }
  h+='</div>';
  h+='<button class="tutorial-link" onclick="showTitleScreen()">'+(_ss.btn_tutorial_again||'튜토리얼 다시 보기')+'</button>';
  h+='</div>';
  container.innerHTML=h;
}

function ensureRow(){
  if(currentRow)return currentRow;
  var sc=getScenario();
  var row=document.createElement('div');row.className='scenario-row';row.id='scenario-row';
  // 6 panels in 2 rows of 3
  var panels='';
  for(var i=1;i<=6;i++){
    panels+='<div class="panel" data-cut="'+i+'"><div class="panel-image"><span class="cut-num">'+i+'</span><span class="cut-label">'+i+'</span></div><div class="panel-body"></div></div>';
    if(i===3)panels='<div class="panels-grid panels-row1">'+panels+'</div><div class="panels-grid panels-row2">';
  }
  panels+='</div>';
  row.innerHTML=panels+'<div class="next-btn-wrap" id="next-wrap"><button class="next-btn" id="next-btn" onclick="onNext()">'+_t('game_flow.buttons.next','다음 →')+'</button></div>';
  container.appendChild(row);
  currentRow=row;
  return row;
}

function setPanelImage(cutNum,labelText){
  var panel=currentRow.querySelector('[data-cut="'+cutNum+'"]');
  if(!panel)return;
  var imgEl=panel.querySelector('.panel-image');
  var src=gameState&&gameState.currentScenarioId?getCutImage(gameState.currentScenarioId,cutNum):CUT_IMAGES[cutNum];
  if(src){
    var img=new Image();img.src=src;
    img.onload=function(){imgEl.innerHTML='<img src="'+src+'" alt="컷 '+cutNum+'"><span class="cut-num">'+cutNum+'</span>'+(labelText?'<span class="panel-place">'+labelText+'</span>':'');};
    img.onerror=function(){imgEl.innerHTML='<span class="cut-num">'+cutNum+'</span><span class="cut-label">'+cutNum+'</span>'+(labelText?'<span class="panel-place">'+labelText+'</span>':'');};
  }
}

function activatePanel(cutNum){
  var panel=currentRow.querySelector('[data-cut="'+cutNum+'"]');
  if(!panel)return null;
  panel.classList.add('active','slide-in');
  setTimeout(function(){panel.scrollIntoView({behavior:'smooth',block:'center'});},80);
  return panel;
}

// 컷 1: 상황 제시
function renderCut1(){
  var sc=getScenario();
  ensureRow();
  trackEvent('scenario_viewed',{scenarioId:sc.id,title:sc.title});
  setPanelImage(1,sc.categoryName);
  var panel=activatePanel(1);
  panel.querySelector('.panel-body').innerHTML=
    '<p class="highlight">'+sc.title+'</p>'+
    '<p>'+sc.situation.text+'</p>'+
    '<div class="advance-wrap"><button class="advance-btn" onclick="showTier1Choices()">'+_t('game_flow.buttons.tier1_advance','어떻게 할까? →')+'</button></div>';
  updateStats();
}

// 선택 버튼에 표시할 비용 미터 HTML — 시간/에너지 숫자+바
// v0.5 Phase 8 — 잔여자원 부족 판정 (DECISIONS §9.2)
function canAffordCost(cost){
  if(!gameState.resources)return true;
  return cost.time<=gameState.resources.time.current && cost.energy<=gameState.resources.energy.current;
}

// 5/3 정정 — 모든 선택지 비용 부족 시 GAME OVER. costs 배열 받아서 어느 것도 못 고르면 트리거.
// 학생이 disable된 선택지를 0.7초 인지한 후 모달 노출.
function _checkAllUnaffordable(costs){
  if(!costs||!costs.length)return false;
  for(var i=0;i<costs.length;i++){if(canAffordCost(costs[i]))return false;}
  return true;
}
function triggerGameOver(){
  // 중복 호출 방지
  if(gameState&&gameState._gameOverShown)return;
  if(!gameState)gameState={};
  gameState._gameOverShown=true;
  setTimeout(function(){
    var modal=document.getElementById('gameover-modal');
    if(!modal)return;
    var t=document.getElementById('gameover-time');
    var e=document.getElementById('gameover-energy');
    if(t&&gameState.resources)t.textContent=gameState.resources.time.current;
    if(e&&gameState.resources)e.textContent=gameState.resources.energy.current;
    modal.classList.remove('hidden');
    requestAnimationFrame(function(){modal.classList.add('visible');});
    trackEvent('game_over_triggered',{time:gameState.resources?gameState.resources.time.current:null,energy:gameState.resources?gameState.resources.energy.current:null,scenarioId:gameState.currentScenarioId});
  },700);
}
function _closeGameOverModal(){
  var modal=document.getElementById('gameover-modal');
  if(!modal)return;
  modal.classList.remove('visible');
  setTimeout(function(){modal.classList.add('hidden');},250);
}
function gameOverShowReport(){
  _closeGameOverModal();
  // 미완 시나리오 history 정리 — 자동으로 처리: scenarioHistory만 사용
  setTimeout(function(){
    if(gameState)gameState._gameOverShown=false;
    showFinalReport();
  },150);
}
function gameOverRestart(){
  _closeGameOverModal();
  setTimeout(function(){
    if(gameState)gameState._gameOverShown=false;
    resetGame();
  },150);
}
// v0.8 §3.4 / §6.6.2 — 공식형 박스 두 줄 라벨 분리.
// 시간 줄: 시간 비용 [N] − 위임 할인 [N] = 최종 시간 [N]  (위임 할인이 시간 자리)
// 에너지 줄: 에너지 비용 [N] − 지식 할인 [N] = 최종 에너지 [N]  (지식 할인이 에너지 자리)
// 두 역량의 독립 학습 메시지가 살아남. 최종 시간·최종 에너지 볼드. 학생 톤. 카드 매칭은 박스 X (점수 자리).
function buildEffectCell(label,value){
  // (legacy 호환 stub — 새 박스에서는 사용 X. 기존 호출자 안전 차원 보존)
  var cls='cost-box-effect',text;
  if(value===0){cls+=' zero';text='0';}
  else if(value>0){text='-'+value;}
  else {cls+=' penalty';text='+'+(-value);}
  return '<div class="cost-cell"><div class="cost-cell-label">'+label+'</div><div class="'+cls+'">'+text+'</div></div>';
}
// 한 줄: 비용 [N] − 할인 [N] = 최종 [N] (학생 톤, 최종 볼드)
function _buildCostLine(costLabel,rawVal,discountLabel,discountVal,finalLabel,actualFinal){
  var finalVal=(typeof actualFinal==='number')?actualFinal:Math.max(0,rawVal-discountVal);
  var opSym='−',discText=String(Math.abs(discountVal));
  var discCls='cost-formula-discount';
  if(discountVal===0){discCls+=' zero';}
  else if(discountVal<0){opSym='+';discCls+=' penalty';}
  return '<div class="cost-formula-line">'+
    '<div class="cost-formula-cell"><div class="cost-formula-label">'+costLabel+'</div>'+
      '<div class="cost-formula-val cost-formula-raw">'+rawVal+'</div></div>'+
    '<div class="cost-formula-op">'+opSym+'</div>'+
    '<div class="cost-formula-cell"><div class="cost-formula-label">'+discountLabel+'</div>'+
      '<div class="cost-formula-val '+discCls+'">'+discText+'</div></div>'+
    '<div class="cost-formula-op">=</div>'+
    '<div class="cost-formula-cell"><div class="cost-formula-label">'+finalLabel+'</div>'+
      '<div class="cost-formula-val cost-formula-final"><b>'+finalVal+'</b></div></div>'+
  '</div>';
}
function buildCostHTML(cost){
  var d=cost._discount||{dlgEffect:0,knlEffect:0,rawTime:cost.time,rawEnergy:cost.energy,cardDiscount:0,cardDetails:[],clampedEnergy:0};
  var totalEnergyDisc=d.clampedEnergy||0;
  var hasAxisDiscount=(d.dlgEffect>0||totalEnergyDisc>0);
  if(!hasAxisDiscount){
    var _cl=_t('cost_labels',{});
    return '<div class="choice-cost cost-formula-box">'+
      '<div class="cost-formula-line"><div class="cost-formula-cell"><div class="cost-formula-label">'+(_cl.time_cost||'시간 비용')+'</div><div class="cost-formula-val cost-formula-final"><b>'+cost.time+'</b></div></div></div>'+
      '<div class="cost-formula-line"><div class="cost-formula-cell"><div class="cost-formula-label">'+(_cl.energy_cost||'에너지 비용')+'</div><div class="cost-formula-val cost-formula-final"><b>'+cost.energy+'</b></div></div></div>'+
    '</div>';
  }
  var energyHtml='';
  var _cl2=_t('cost_labels',{});
  energyHtml+=_buildCostLine(_cl2.energy_cost||'에너지 비용',d.rawEnergy,_cl2.discount||'할인',totalEnergyDisc,_cl2.final_energy||'최종 에너지',cost.energy);
  return '<div class="choice-cost cost-formula-box">'+
    _buildCostLine(_cl2.time_cost||'시간 비용',d.rawTime,_cl2.discount||'할인',d.dlgEffect,_cl2.final_time||'최종 시간',cost.time)+
    '<div class="cost-energy-col">'+energyHtml+'</div>'+
  '</div>';
}
function getCouponBadge(stageType,choiceId){
  var avail=getAvailableCardDiscounts(stageType,choiceId);
  if(avail.length>0)return '<div class="cost-coupon-badge" data-coupon-id="'+stageType+':'+choiceId+'">'+_t('coupon.badge_available','역량카드 할인가능 – 할인 적용하기')+'</div>';
  return '';
}
function _updateCouponBadge(areaId,choiceId,selectedCard,stageType){
  var area=document.getElementById(areaId);if(!area)return;
  var badges=area.querySelectorAll('.cost-coupon-badge');
  for(var i=0;i<badges.length;i++){
    var bid=badges[i].getAttribute('data-coupon-id');
    if(bid&&bid.indexOf(choiceId)>=0){
      if(selectedCard){
        var _badgeTpl=_t('coupon.badge_applied_format','{card} 역량카드 효과: -{amount} 할인');
        badges[i].textContent=_badgeTpl.replace('{card}',selectedCard.display).replace('{amount}',selectedCard.amount);
        badges[i].classList.add('applied');
        var choiceCard=badges[i].closest('.choice-card');
        if(choiceCard&&stageType){
          var costEl=choiceCard.querySelector('.choice-cost');
          if(costEl){
            var newCost;
            var costId=bid?bid.split(':')[1]:choiceId;
            if(stageType==='tier2')newCost=getTier2CostWithCard(costId,selectedCard);
            else if(stageType==='review')newCost=getReviewCostWithCard(costId,selectedCard);
            if(newCost){
              var eCol=costEl.querySelector('.cost-energy-col');
              var oldDisc=eCol?eCol.querySelector('.cost-formula-discount'):null;
              var oldFinal=eCol?eCol.querySelector('.cost-formula-final b'):null;
              if(oldDisc||oldFinal){
                if(oldDisc)oldDisc.classList.add('cost-blink');
                if(oldFinal)oldFinal.classList.add('cost-blink');
                (function(ce,cc,nc){setTimeout(function(){
                  var tmp=document.createElement('div');tmp.innerHTML=buildCostHTML(nc);
                  ce.parentNode.replaceChild(tmp.firstChild,ce);
                  var ne=cc.querySelector('.choice-cost');
                  if(ne){
                    var nCol=ne.querySelector('.cost-energy-col');
                    var nDisc=nCol?nCol.querySelector('.cost-formula-discount'):null;
                    var nFinal=nCol?nCol.querySelector('.cost-formula-final b'):null;
                    if(nDisc)nDisc.classList.add('cost-blink');
                    if(nFinal)nFinal.classList.add('cost-blink');
                  }
                },800);})(costEl,choiceCard,newCost);
              } else {
                var tmp=document.createElement('div');tmp.innerHTML=buildCostHTML(newCost);
                costEl.parentNode.replaceChild(tmp.firstChild,costEl);
              }
            }
          }
        }
      } else {
        badges[i].textContent=_t('coupon.badge_available','역량카드 할인가능 – 할인 적용하기');
      }
    }
  }
}

// §23 — 1차 선택지를 Cut 1 body 아래에 펼침
function _scrollChoicesIntoView(area,count){
  setTimeout(function(){
    var last=area.lastElementChild;
    if(last)last.scrollIntoView({behavior:'smooth',block:'nearest'});
  },count*120+300);
}
function showTier1Choices(){
  if(btnGuard('showTier1Choices'))return;
  var sc=getScenario();
  var btn=currentRow.querySelector('[data-cut="1"] .advance-wrap');if(btn)btn.style.display='none';
  var body=currentRow.querySelector('[data-cut="1"] .panel-body');
  var area=document.createElement('div');area.className='choices-area';area.id='tier1-choices';
  area.innerHTML='<div class="choices-q">'+_t('game_flow.questions.tier1','어떻게 할까?')+'</div>';
  body.appendChild(area);
  var costs=sc.tier1.map(function(c){return getTier1Cost(c.id);});
  sc.tier1.forEach(function(c,i){
    var card=document.createElement('div');
    var afford=canAffordCost(costs[i]);
    card.className='choice-card choice-card-nocost'+(afford?'':' disabled');
    if(afford)card.onclick=function(){onTier1(c.id);};
    var tag=afford?'':'<span class="insufficient-tag">'+_t('game_flow.insufficient','자원 부족')+'</span>';
    card.innerHTML='<div class="choice-header"><span class="choice-num">'+c.id+'</span><span class="choice-text">'+c.label+tag+'</span></div>';
    area.appendChild(card);
    setTimeout(function(){card.classList.add('visible');},i*120+150);
  });
  _scrollChoicesIntoView(area,sc.tier1.length);
  updateStats();
  if(_checkAllUnaffordable(costs))triggerGameOver();
}

// §23 — Cut 2 활성화: 이미지 + 1차 선택 요약 + "더 자세히" 버튼
function showCut2Summary(){
  var sc=getScenario(),t1=gameState.selectedTier1;
  var t1obj=sc.tier1.find(function(x){return x.id===t1;});
  setPanelImage(2,_t('game_flow.panel_labels.tier1_choice','1차 선택'));
  var panel=activatePanel(2);
  panel.querySelector('.panel-body').innerHTML=
    '<div class="chosen-summary"><div class="chosen-label">'+_t('game_flow.chosen_labels.tier1','1차 선택')+'</div><div class="chosen-title">'+t1+'. '+t1obj.label+'</div><div class="chosen-way">'+t1obj.desc+'</div></div>'+
    '<div class="advance-wrap"><button class="advance-btn" onclick="showTier2Choices()">'+_t('game_flow.buttons.tier2_advance','더 자세히 — 어떻게 할까? →')+'</button></div>';
}

// §23 — 2차 선택지를 Cut 2 body 아래에 펼침
function showTier2Choices(){
  if(btnGuard('showTier2Choices'))return;
  var sc=getScenario(),t1=gameState.selectedTier1;
  var btn=currentRow.querySelector('[data-cut="2"] .advance-wrap');if(btn)btn.style.display='none';
  var body=currentRow.querySelector('[data-cut="2"] .panel-body');
  var area=document.createElement('div');area.className='choices-area';area.id='tier2-choices';
  area.innerHTML='<div class="choices-q">'+_t('game_flow.questions.tier2','더 자세히 — 어떻게 할까?')+'</div>';
  body.appendChild(area);
  var t2list=sc.tier2[t1];
  var costs=t2list.map(function(c){return getTier2Cost(c.id);});
  t2list.forEach(function(c,i){
    var card=document.createElement('div');
    var afford=canAffordCost(costs[i]);
    card.className='choice-card'+(afford?'':' disabled');
    if(afford)card.onclick=function(){onTier2(c.id);};
    var costHTML=buildCostHTML(costs[i]);
    var badge=afford?getCouponBadge('tier2',c.id):'';
    var tag=afford?'':'<span class="insufficient-tag">'+_t('game_flow.insufficient','자원 부족')+'</span>';
    card.innerHTML='<div class="choice-header"><span class="choice-num">'+(i+1)+'</span><span class="choice-text">'+c.label+tag+'</span></div>'+costHTML+badge;
    area.appendChild(card);
    setTimeout(function(){card.classList.add('visible');},i*120+150);
  });
  _scrollChoicesIntoView(area,t2list.length);
  updateStats();
  if(_checkAllUnaffordable(costs))triggerGameOver();
}

// §23 — Cut 3 활성화: 이미지 + 2차 선택 요약 + "결과 확인하기" 버튼
function showCut3Summary(){
  var sc=getScenario(),t2=gameState.selectedTier2;
  var t2obj=null;
  ['A','B','C'].forEach(function(g){if(!t2obj&&sc.tier2[g])t2obj=sc.tier2[g].find(function(x){return x.id===t2;});});
  var t2Delta=getLeafDelta(t2obj,gameState.selectedTier1);
  setPanelImage(3,_t('game_flow.panel_labels.tier2_choice','2차 선택'));
  var panel=activatePanel(3);
  panel.querySelector('.panel-body').innerHTML=
    '<div class="chosen-summary"><div class="chosen-label">'+_t('game_flow.chosen_labels.tier2','2차 선택')+'</div><div class="chosen-title">'+t2+'. '+t2obj.label+'</div><div class="chosen-way">'+_t('game_flow.delegation_depth','위임 깊이: ')+t2Delta.delegation+'</div></div>'+
    '<div class="advance-wrap"><button class="advance-btn" onclick="goCut4()">'+_t('game_flow.buttons.result_advance','결과 확인하기 →')+'</button></div>';
}

// 컷 4: 결과 (raw 결과물) — §23: "결과 확인하기" 클릭 시 호출
function goCut4(){
  if(btnGuard('goCut4'))return;
  var sc=getScenario(),t2=gameState.selectedTier2;
  var t2obj=null;
  ['A','B','C'].forEach(function(g){if(!t2obj&&sc.tier2[g])t2obj=sc.tier2[g].find(function(x){return x.id===t2;});});
  var c3btn=currentRow.querySelector('[data-cut="3"] .advance-wrap');if(c3btn)c3btn.style.display='none';
  setPanelImage(4,_t('game_flow.panel_labels.result','결과'));
  var panel=activatePanel(4);
  var result=sc.results[t2];
  var t2Pts=getTier2Points(sc,t2);
  var _metaTpl=_t('game_flow.result_meta','{summary} (이 행동의 점수 {points}점)');
  var _metaStr=_metaTpl.replace('{summary}',result.summary).replace('{points}',t2Pts.points);
  panel.querySelector('.panel-body').innerHTML=
    '<p class="highlight">'+_t('game_flow.result_prefix','결과 — ')+sc.title+'</p>'+
    '<div class="result-text">'+result.text+'</div>'+
    '<div class="result-meta">'+_metaStr+'</div>'+
    '<div class="advance-wrap"><button class="advance-btn" onclick="showReviewChoices()">'+_t('game_flow.buttons.review_advance','검토할까? →')+'</button></div>';
  trackEvent('result_viewed',{scenarioId:sc.id,tier2:t2,tier2Points:t2Pts.points});
  updateStats();
}

// §23 — 검토 선택지를 Cut 4 body 아래에 펼침
function showReviewChoices(){
  if(btnGuard('showReviewChoices'))return;
  var sc=getScenario();
  var btn=currentRow.querySelector('[data-cut="4"] .advance-wrap');if(btn)btn.style.display='none';
  var body=currentRow.querySelector('[data-cut="4"] .panel-body');
  var area=document.createElement('div');area.className='choices-area';area.id='review-choices';
  area.innerHTML='<div class="choices-q">'+_t('game_flow.questions.review','제출 전, 어떻게 검토할까?')+'</div>';
  body.appendChild(area);
  var t2cur=gameState.selectedTier2;
  var costs=sc.reviews.map(function(r){return getReviewCost(t2cur+r.id);});
  sc.reviews.forEach(function(r,i){
    var card=document.createElement('div');
    var afford=canAffordCost(costs[i]);
    card.className='choice-card'+(afford?'':' disabled');
    if(afford)card.onclick=function(){onReview(r.id);};
    var costHTML=buildCostHTML(costs[i]);
    var leafKey=t2cur+r.id;
    var badge=afford?getCouponBadge('review',leafKey):'';
    var tag=afford?'':'<span class="insufficient-tag">'+_t('game_flow.insufficient','자원 부족')+'</span>';
    var leafLabel=(sc.reviewLabels&&sc.reviewLabels[leafKey])||r.label;
    card.innerHTML='<div class="choice-header"><span class="choice-num">'+r.id+'</span><span class="choice-text">'+leafLabel+tag+'</span></div>'+costHTML+badge;
    area.appendChild(card);
    setTimeout(function(){card.classList.add('visible');},i*120+150);
  });
  _scrollChoicesIntoView(area,sc.reviews.length);
  updateStats();
  if(_checkAllUnaffordable(costs))triggerGameOver();
}

// §23 — Cut 5 활성화: 이미지 + 검토 선택 요약
function showCut5Summary(){
  var sc=getScenario(),leaf=getLeafPath();
  var rvObj=sc.reviews.find(function(x){return x.id===gameState.selectedReview;});
  var supplement=sc.reviewSupplements[leaf]||'';
  var rvLabelLeaf=(sc.reviewLabels&&sc.reviewLabels[leaf])||rvObj.label;
  setPanelImage(5,_t('game_flow.panel_labels.review','검토'));
  var panel=activatePanel(5);
  panel.querySelector('.panel-body').innerHTML='<div class="chosen-summary"><div class="chosen-label">'+_t('game_flow.chosen_labels.review','검토 선택')+'</div><div class="chosen-title">'+rvObj.id+'. '+rvLabelLeaf+'</div>'+(supplement?'<div class="chosen-way">'+supplement+'</div>':'')+'</div>';
}

// 컷 6: 최종 점수 + 아이템 + 자각 + 경험치/레벨업 (Phase 4 통합)
function goCut6(){
  var sc=getScenario(),leaf=getLeafPath(),fin=sc.finals[leaf];
  setPanelImage(6,_t('game_flow.panel_labels.final','최종'));
  var panel=activatePanel(6);
  // v0.8 — CSV 최종등급 lookup
  var grade=getFinalGrade(leaf);
  var item=fin?fin.item:null;
  var awareness=fin?(fin.shortFeedback||fin.awareness||''):'';
  // cut6 panel-image에 등급+점수 큰 글자로 표시 (이미지 대신, final-grade 컬러 매칭)
  var c6img=currentRow.querySelector('[data-cut="6"] .panel-image');
  if(c6img){
    var gradeColor=({S:'#5fbf95',A:'#5fbf95',B:'#000',C:'#d9b620',D:'#d63f7a'})[grade]||'#000';
    var replayInGrade=(grade==='C'||grade==='D');
    var gradeHTML='<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;">';
    gradeHTML+='<div style="font-size:140px;font-weight:700;color:'+gradeColor+';letter-spacing:-4px;line-height:1;">'+grade+'</div>';
    gradeHTML+='<div style="font-size:28px;color:#444;font-weight:600;">'+gameState.score+'점</div>';
    if(replayInGrade){
      gradeHTML+='<button id="replay-btn-grade" style="margin-top:12px;padding:10px 28px;font-size:14px;font-weight:700;background:#ffd93d;color:#000;border:3px solid #000;border-radius:0;cursor:pointer;letter-spacing:0.5px;box-shadow:4px 4px 0 #000;transition:transform 0.05s,box-shadow 0.05s;" onmousedown="this.style.transform=\'translate(2px,2px)\';this.style.boxShadow=\'2px 2px 0 #000\'" onmouseup="this.style.transform=\'none\';this.style.boxShadow=\'4px 4px 0 #000\'" onmouseleave="this.style.transform=\'none\';this.style.boxShadow=\'4px 4px 0 #000\'">'+_t('game_flow.buttons.replay_grade','다시 도전하기')+'</button>';
    }
    gradeHTML+='</div><span class="cut-num">6</span><span class="panel-place">최종</span>';
    c6img.innerHTML=gradeHTML;
    if(replayInGrade){
      var gradeReplayBtn=document.getElementById('replay-btn-grade');
      if(gradeReplayBtn)gradeReplayBtn.onclick=function(){
        gradeReplayBtn.disabled=true;
        var replaySug=fin?fin.replaySuggestion:'';
        if(replaySug){
          var sugDiv=document.createElement('div');
          sugDiv.style.cssText='margin-top:10px;max-width:280px;padding:8px 12px;background:#fff;border:3px solid #000;border-radius:0;font-size:13px;line-height:1.5;color:#000;text-align:center;box-shadow:4px 4px 0 #000;';
          sugDiv.textContent=replaySug;
          gradeReplayBtn.parentNode.appendChild(sugDiv);
        }
        setTimeout(function(){replayScenario(scid);},replaySug?1500:0);
      };
    }
  }

  // === Phase 4 통합 흐름 ===
  var expGain=calculateExpGain(leaf);
  var prevExp=gameState.exp.current;
  var prevLevel=gameState.exp.level;
  gameState.exp.current+=expGain;
  var didLevelUp=checkLevelUp(prevExp,gameState.exp.current);
  var newLevel=gameState.exp.level;
  // v0.5 Phase 8.7 — 부분 회복 hook 제거 (DECISIONS §10.1). RP 시스템(8.8)에서 적립으로 대체
  if(didLevelUp)applyLevelUpMeterIncrease(newLevel);
  // v0.5 Phase 8.8 — 자원토큰(RP) 적립 (DECISIONS §10.2~10.3)
  var rpAwardInfo=awardRP(grade,didLevelUp,newLevel);
  // 9. scenarioRepeatCount 증가 (작업 8)
  var scid=gameState.currentScenarioId;
  gameState.scenarioRepeatCount[scid]=(gameState.scenarioRepeatCount[scid]||0)+1;

  // === v0.8 결과 화면 구성 — v12 간소화 (SPEC §15) ===
  // Cut6: 등급/점수 + awareness(결과 설명) + CUT6 보정 피드백(하단 메시지) + 버튼
  // 선택 경로 → 리포트로 이동, 획득 카드 → 팝업/인벤토리, 리플레이 제안 → 버튼 클릭 시만
  var h='';
  var dlgDelta=(gameState.pending&&typeof gameState.pending.delegation==='number')?gameState.pending.delegation:0;
  var knlDelta=(gameState.pending&&typeof gameState.pending.knowledge==='number')?gameState.pending.knowledge:0;
  var dlgTotal=gameState.competencies.delegationChoice.value+dlgDelta;
  var knlTotal=gameState.competencies.knowledge.value+knlDelta;

  // ① awareness — 결과 설명
  if(awareness){
    h+='<div class="result-awareness" style="margin-bottom:16px;font-family:var(--font-hand);font-size:22px;line-height:1.6;color:var(--ink-mute);">'+awareness+'</div>';
  }

  // ② CUT6 보정 피드백 — 하단 메시지
  var cut6Fb=fin?fin.cut6Feedback:'';
  if(cut6Fb){
    h+='<div class="result-feedback" style="margin-bottom:16px;padding:12px 14px;background:#f4f1ea;border:3px solid #000;border-radius:0;font-size:14px;line-height:1.6;color:#000;">'+cut6Fb+'</div>';
  }

  // ③ B — low key 리플레이 버튼 (C/D는 등급 박스에, S/A는 없음)
  if(grade==='B'){
    h+='<div style="text-align:center;margin-top:8px;"><button class="replay-btn" id="replay-btn-cut6" style="background:#fff;border:3px solid #000;padding:6px 16px;font-size:12px;color:#000;cursor:pointer;border-radius:0;box-shadow:4px 4px 0 #000;">'+_t('game_flow.buttons.replay','이 시나리오 다시 해보기')+'</button></div>';
  }

  panel.querySelector('.panel-body').innerHTML=h;
  var replayBtn=document.getElementById('replay-btn-cut6');
  if(replayBtn){
    replayBtn.onclick=function(){
      replayBtn.disabled=true;
      var replaySug=fin?fin.replaySuggestion:'';
      if(replaySug){
        var sugDiv=document.createElement('div');
        sugDiv.style.cssText='margin-top:8px;padding:10px;background:#f4f1ea;border:3px solid #000;border-radius:0;font-size:13px;line-height:1.5;color:#000;';
        sugDiv.textContent=replaySug;
        replayBtn.parentNode.insertBefore(sugDiv,replayBtn.nextSibling);
      }
      setTimeout(function(){replayScenario(scid);},replaySug?1500:0);
    };
  }
  trackEvent('final_viewed',{scenarioId:sc.id,leaf:leaf,score:gameState.score,grade:grade,item:item});

  // 시나리오 완료 처리
  // 5/3 세션278+ — 종합 리포트용 Δ/누적 스냅샷 동봉 (흡수 직전 시점, 위 dlgDelta·knlDelta·dlgTotal·knlTotal과 동일)
  gameState.scenarioHistory.push({
    scenarioId:sc.id,
    tier1:gameState.selectedTier1,
    tier2:gameState.selectedTier2,
    review:gameState.selectedReview,
    leaf:leaf,
    finalScore:gameState.score,
    grade:grade,
    item:item,
    dlgDelta:dlgDelta,
    knlDelta:knlDelta,
    dlgTotal:dlgTotal,
    knlTotal:knlTotal
  });
  gameState.completed=true;

  // 이벤트 로그 (작업 9)
  trackEvent('exp_gained',{leafPath:leaf,grade:grade,baseScore:(sc.finals&&sc.finals[leaf])?sc.finals[leaf].score:0,gainedExp:expGain,expBefore:prevExp,expAfter:gameState.exp.current,level:newLevel});
  if(didLevelUp){
    trackEvent('level_up',{prevLevel:prevLevel,newLevel:newLevel,expAtLevelUp:gameState.exp.current,newTimeMax:gameState.resources.time.max,newEnergyMax:gameState.resources.energy.max});
  }
  trackEvent('scenario_completed',{scenarioId:sc.id,leaf:leaf,score:gameState.score,grade:grade});

  saveGame();
  updateStats();

  // 레벨업 애니메이션 (작업 7)
  if(didLevelUp){
    setTimeout(function(){
      flashLevelUpUI();
      pulseExpLevel();
    },400);
  }

  // v0.9 — 리플레이 판정 (덱스 12-ari-challenge-card-bug.md 권장안 적용)
  // 완료 처리 전 상태를 먼저 저장 — played가 완료 전부터 true였는지로 판단
  if(!gameState.replay)gameState.replay={};
  var replayState=gameState.replay[scid];
  var wasReplay=replayState&&replayState.played===true;
  var challengeAwardedNow=false;
  if(!replayState){
    // 방어 코드 — startScenario에서 보통 이미 만들어져 있지만 없을 경우 대비
    replayState=gameState.replay[scid]={played:true,improved:false,bestScore:gameState.score,bestGrade:grade,resourceSnapshot:{time:gameState.resources.time.current,energy:gameState.resources.energy.current}};
  } else if(!wasReplay){
    // 첫 플레이 완료
    replayState.played=true;
    replayState.improved=false;
    replayState.bestScore=gameState.score;
    replayState.bestGrade=grade;
  } else {
    // 진짜 리플레이 완료
    if(gameState.score>replayState.bestScore){
      replayState.bestScore=gameState.score;
      replayState.bestGrade=grade;
      if(!replayState.improved){
        replayState.improved=true;
        challengeAwardedNow=true;
        if(!gameState.inventory.growthCards)gameState.inventory.growthCards=[];
        gameState.inventory.growthCards.push({label:'도전력',scenario:scid,leaf:leaf});
      }
    }
  }

  // v0.5: 컷6 결과로 충분 → 활동 리포트 거치지 않고 바로 다음 시나리오/종합 리포트
  var nw=document.getElementById('next-wrap');
  var nb=document.getElementById('next-btn');
  var clearedAfter=(gameState.clearedScenarios||[]).slice();
  if(clearedAfter.indexOf(scid)<0)clearedAfter.push(scid);
  var willBeAllDone=(clearedAfter.length>=CONFIG.scenarios.length);
  nb.textContent=willBeAllDone?_t('game_flow.buttons.report','AI 리터러시 성장 리포트'):_t('game_flow.buttons.next_scenario','다음 시나리오로 →');
  nb.onclick=goNextScenario;

  // 시나리오 끝 chain (SPEC §6.3, v0.9 — RP 분배 제거, 에너지 자동 회복)
  // 결과 패널 1.4초 보여주고 → [0] pending 흡수 → [1] 카드 → [1.5] 회복력 특별 UI(B 이하) → [2] 에너지 회복 애니메이션 → [3] 레벨업 → 다음 버튼
  var _v8CardLabels=[];
  var _hasRecoveryCard=false;
  if(fin&&fin.cardEarned){
    if(fin.humanCentricAxis&&fin.humanCentricTag)_v8CardLabels.push('['+fin.humanCentricAxis+'] '+fin.humanCentricTag);
    if(fin.domainCards)for(var _di=0;_di<fin.domainCards.length;_di++)_v8CardLabels.push(fin.domainCards[_di]);
  }
  // 회복력은 B 이하만 — 특별 UI로 표시
  if(grade==='B'||grade==='C'||grade==='D')_hasRecoveryCard=true;
  // 도전력은 리플레이 완료 시 — wasReplay 기반 (덱스 권장안)
  if(challengeAwardedNow){
    _v8CardLabels.push('도전력');
  }
  setTimeout(function(){
    var chain=Promise.resolve();
    // [0] §12 pending → 누적 흡수 (원 마커가 게이지로 흘러내림)
    chain=chain.then(function(){return absorbPending();});
    // [1] v0.9 카드 reward — 인간중심 + 도메인 + 도전력 (회복력 제외)
    if(_v8CardLabels.length){
      chain=chain.then(function(){return playCardRewardSequential(_v8CardLabels,'');});
    }
    // [1.5] 회복력 특별 UI — B 이하만, 화면 중앙, 리플레이 진입점
    if(_hasRecoveryCard){
      chain=chain.then(function(){return showRecoveryCardModal(scid);});
    }
    // [2] 레벨업 — 레벨 표시 + 보너스 RP 안내 (에너지 자동 충전 없음)
    if(didLevelUp){
      chain=chain.then(function(){return showLevelUpModal(prevLevel,newLevel);});
    }
    // [3] v0.9 세션322 — RP 직접 배분 (학기 끝 아닐 때만)
    if(!willBeAllDone){
      chain=chain.then(function(){return showRPDistributionModal();});
    }
    chain.then(function(){
      var c6body=currentRow.querySelector('[data-cut="6"] .panel-body');
      if(c6body){
        var d=document.createElement('div');
        d.style.cssText='text-align:center;margin-top:16px;padding-top:12px;border-top:2px dashed var(--ink-soft);';
        var btn=document.createElement('button');
        btn.className='next-btn';
        btn.style.cssText='width:100%;padding:14px;font-size:15px;';
        btn.textContent=nb.textContent;
        btn.onclick=goNextScenario;
        d.appendChild(btn);
        c6body.appendChild(d);
      }
    });
  },1400);
}

