// =====================================================
// 12. Debug Panel
// =====================================================
var dbgOn=false;
function toggleDebug(){dbgOn=!dbgOn;document.getElementById('debug-panel').classList.toggle('active',dbgOn);if(dbgOn)renderDebug();}
document.addEventListener('click',function(e){if(!dbgOn)return;var p=document.getElementById('debug-panel'),t=document.querySelector('.debug-toggle');if(!p.contains(e.target)&&e.target!==t){dbgOn=false;p.classList.remove('active');}});
function renderDebug(){
  if(!dbgOn)return;
  var p=document.getElementById('debug-panel'),logs=getEvents(),last=logs.length?logs[logs.length-1]:null;
  var h='<div class="debug-section"><div class="debug-label">State</div>';
  if(gameState){
    h+='<div>scenario:'+gameState.currentScenarioId+'</div>';
    h+='<div>tier:'+gameState.currentTier+' | t1:'+gameState.selectedTier1+' t2:'+gameState.selectedTier2+' rv:'+gameState.selectedReview+'</div>';
    h+='<div>leaf:'+(getLeafPath()||'-')+'</div>';
    h+='<div>delegation:'+gameState.competencies.delegationChoice.value+' (h:'+gameState.competencies.delegationChoice.history.length+')</div>';
    h+='<div>knowledge:'+gameState.competencies.knowledge.value+' (h:'+gameState.competencies.knowledge.history.length+')</div>';
    h+='<div>score:'+gameState.score+' / total:'+gameState.totalScore+'</div>';
    h+='<div>items:'+gameState.itemsCollected.length+' '+(gameState.itemsCollected.join(', ')||'-')+'</div>';
    h+='<div>cards:'+(((gameState.inventory&&gameState.inventory.competencyCards)||[]).length)+' (inventory)</div>';
    if(gameState.resources){
      var rt=gameState.resources.time,re=gameState.resources.energy;
      h+='<div>time:'+rt.current+'/'+rt.max+' | energy:'+re.current+'/'+re.max+'</div>';
    }
    if(gameState.exp){
      h+='<div>exp:'+gameState.exp.current+' | level:'+gameState.exp.level+'</div>';
    }
    if(gameState.rp){
      h+='<div>rp balance:'+gameState.rp.balance+' (h:'+(gameState.rp.history?gameState.rp.history.length:0)+')</div>';
    }
    var _t=getCompetencyType(gameState.competencies.delegationChoice.value,gameState.competencies.knowledge.value);
    h+='<div>compType:'+_t+' | history:'+(gameState.scenarioHistory?gameState.scenarioHistory.length:0)+'</div>';
    h+='<div>hint:'+(gameState.hintEnabled?'ON':'OFF')+'</div>';
  }else{
    h+='<div>no game</div>';
  }
  h+='</div>';
  h+='<div class="debug-section"><div class="debug-label">Events: '+logs.length+'</div>';
  if(last)h+='<div>last: '+last.type+'</div>';
  h+='</div>';
  h+='<div class="debug-section"><div class="debug-label">Jump (시나리오 점프 / 컷)</div>';
  h+='<div class="debug-buttons">';
  h+='<button class="debug-btn" onclick="dbgJumpCut(1)">Cut1</button>';
  h+='<button class="debug-btn" onclick="dbgJumpCut(2)">Cut2 (1차)</button>';
  h+='<button class="debug-btn" onclick="dbgJumpCut(5)">Cut5 (검토)</button>';
  h+='<button class="debug-btn" onclick="dbgJumpCut(6)">Cut6 (최종)</button>';
  h+='</div></div>';
  h+='<div class="debug-section"><div class="debug-label">Hint (토글)</div>';
  h+='<div class="debug-buttons">';
  h+='<button class="debug-btn" onclick="toggleHint()">'+(gameState && gameState.hintEnabled?'ON → OFF':'OFF → ON')+'</button>';
  h+='</div></div>';
  h+='<div class="debug-section"><div class="debug-label">Cards (강제 추가)</div>';
  h+='<div class="debug-buttons">';
  h+='<button class="debug-btn" onclick="dbgAddCard(\'AI 환각 식별\')">+환각</button>';
  h+='<button class="debug-btn" onclick="dbgAddCard(\'검증 방법\')">+검증</button>';
  h+='<button class="debug-btn" onclick="dbgAddCard(\'AI 한계\')">+한계</button>';
  h+='<button class="debug-btn" onclick="dbgAddCard(\'비판적 사고\')">+비판</button>';
  h+='</div></div>';
  h+='<div class="debug-section"><div class="debug-label">Level (강제 점프)</div>';
  h+='<div class="debug-buttons">';
  h+='<button class="debug-btn" onclick="dbgSetLevel(1)">L1</button>';
  h+='<button class="debug-btn" onclick="dbgSetLevel(3)">L3</button>';
  h+='<button class="debug-btn" onclick="dbgSetLevel(5)">L5</button>';
  h+='</div></div>';
  h+='<div class="debug-section"><div class="debug-label">Resources (강제 설정)</div>';
  h+='<div class="debug-buttons">';
  h+='<button class="debug-btn" onclick="dbgSetResources(100,100)">Full</button>';
  h+='<button class="debug-btn" onclick="dbgSetResources(0,0)">Zero</button>';
  h+='<button class="debug-btn" onclick="dbgSetResources(-20,-20)">Neg</button>';
  h+='</div></div>';
  // 8.11 — 위/도 4유형 강제
  h+='<div class="debug-section"><div class="debug-label">위/도 4유형 (강제)</div>';
  h+='<div class="debug-buttons">';
  h+='<button class="debug-btn" onclick="dbgSetType(\'pp\')">위+ 도+ (pp)</button>';
  h+='<button class="debug-btn" onclick="dbgSetType(\'pn\')">위+ 도- (pn)</button>';
  h+='<button class="debug-btn" onclick="dbgSetType(\'np\')">위- 도+ (np)</button>';
  h+='<button class="debug-btn" onclick="dbgSetType(\'nn\')">위- 도- (nn)</button>';
  h+='<button class="debug-btn" onclick="dbgSetType(\'mid\')">mid (0,0)</button>';
  h+='</div>';
  h+='<div class="debug-buttons" style="margin-top:4px">';
  h+='<button class="debug-btn" onclick="dbgAdjComp(\'d\',1)">위 +1</button>';
  h+='<button class="debug-btn" onclick="dbgAdjComp(\'d\',-1)">위 -1</button>';
  h+='<button class="debug-btn" onclick="dbgAdjComp(\'k\',1)">도 +1</button>';
  h+='<button class="debug-btn" onclick="dbgAdjComp(\'k\',-1)">도 -1</button>';
  h+='</div></div>';
  // 8.11 — 자원토큰 RP 강제
  h+='<div class="debug-section"><div class="debug-label">RP 자원토큰 (강제)</div>';
  h+='<div class="debug-buttons">';
  h+='<button class="debug-btn" onclick="dbgSetRP(0)">RP=0</button>';
  h+='<button class="debug-btn" onclick="dbgSetRP(20)">RP=20</button>';
  h+='<button class="debug-btn" onclick="dbgSetRP(50)">RP=50</button>';
  h+='<button class="debug-btn" onclick="dbgAddRP(5)">+5</button>';
  h+='<button class="debug-btn" onclick="dbgAddRP(-5)">-5</button>';
  h+='</div></div>';
  // 8.11 — 학기 종합 리포트 강제 호출 (4유형 × 5등급 빠른 점검)
  h+='<div class="debug-section"><div class="debug-label">Final Report (5 시나리오 모두 등급 X)</div>';
  h+='<div class="debug-buttons">';
  h+='<button class="debug-btn" onclick="dbgShowReport(\'S\')">S</button>';
  h+='<button class="debug-btn" onclick="dbgShowReport(\'A\')">A</button>';
  h+='<button class="debug-btn" onclick="dbgShowReport(\'B\')">B</button>';
  h+='<button class="debug-btn" onclick="dbgShowReport(\'C\')">C</button>';
  h+='<button class="debug-btn" onclick="dbgShowReport(\'D\')">D</button>';
  h+='</div>';
  h+='<div style="font-size:9px;color:#888;margin-top:3px">위/도 먼저 세팅 후 등급 클릭</div>';
  h+='</div>';
  // 8.11 — 모달 강제 호출
  h+='<div class="debug-section"><div class="debug-label">Modals (강제 호출)</div>';
  h+='<div class="debug-buttons">';
  h+='<button class="debug-btn" onclick="dbgShowLevelUpModal()">LV Up 모달</button>';
  h+='<button class="debug-btn" onclick="dbgShowRPModal()">RP 분배 모달</button>';
  h+='</div></div>';
  h+='<div class="debug-section"><div class="debug-buttons">';
  h+='<button class="debug-btn" onclick="resetGame();renderDebug()">Reset</button>';
  h+='<button class="debug-btn" onclick="clearGame();clearEvents();renderDebug()">Clear All</button>';
  h+='<button class="debug-btn" onclick="downloadLog()">Log DL</button>';
  h+='</div></div>';
  p.innerHTML=h;
}

function dbgEnsureGame(){
  if(!gameState||!gameState.clearedScenarios)gameState=createInitialState();
  if(!gameState.currentScenarioId){
    gameState.currentScenarioId='selfintro';
    gameState.currentTier=1;
    saveGame();
  }
}

function dbgJumpCut(n){
  dbgEnsureGame();
  if(n===1){renderCut1();}
  else if(n===2){renderCut1();setTimeout(function(){showTier1Choices();},200);}
  else if(n===5){
    gameState.selectedTier1='A';gameState.selectedTier2='A1';gameState.currentTier='result';
    container.innerHTML='';currentRow=null;
    renderCut1();
    setTimeout(function(){showCut2Summary();setTimeout(function(){showCut3Summary();setTimeout(function(){goCut4();setTimeout(showReviewChoices,300);},300);},300);},300);
  }
  else if(n===6){
    gameState.selectedTier1='A';gameState.selectedTier2='A1';
    gameState.competencies.delegationChoice.value=2;
    gameState.competencies.knowledge.value=2;
    gameState.selectedReview='R3';
    var sc6=getScenario(),fin6=sc6.finals['A1R3'];
    gameState.score=calculateFinalScore('A1R3','R3');
    gameState.totalScore+=gameState.score;if(fin6&&fin6.item)gameState.itemsCollected.push(fin6.item);
    container.innerHTML='';currentRow=null;
    renderCut1();
    setTimeout(function(){showCut2Summary();setTimeout(function(){showCut3Summary();setTimeout(function(){goCut4();setTimeout(function(){showCut5Summary();setTimeout(goCut6,300);},300);},300);},300);},300);
  }
  saveGame();updateStats();renderDebug();
}

function dbgAddCard(name){
  // v0.8 — cardsHeld 폐기. inventory.competencyCards에 직접 push (디버그 용).
  dbgEnsureGame();
  if(!gameState.inventory)gameState.inventory={competencyCards:[]};
  if(!gameState.inventory.competencyCards)gameState.inventory.competencyCards=[];
  gameState.inventory.competencyCards.push({label:name,scenario:'_dbg',scenarioTitle:'디버그',leaf:'_dbg',note:'',ts:Date.now()});
  saveGame();updateStats();renderDebug();
}

// Phase 5 신규: 레벨 강제 점프 (exp.current도 임계값에 맞게 갱신)
function dbgSetLevel(lv){
  dbgEnsureGame();
  gameState.exp.level=lv;
  gameState.exp.current=CONFIG.expThresholds[lv-1]||0;
  // 미터 max 레벨에 맞게 갱신
  var mx=CONFIG.meterMaxByLevel[lv];
  if(mx){gameState.resources.time.max=mx.time;gameState.resources.energy.max=mx.energy;}
  saveGame();updateStats();updateExpUI&&updateExpUI();renderDebug();
}

// Phase 5 신규: 자원 강제 설정
function dbgSetResources(t,e){
  dbgEnsureGame();
  gameState.resources.time.current=t;
  gameState.resources.energy.current=e;
  saveGame();updateStats();updateResourceUI&&updateResourceUI();renderDebug();
}

// 8.11 — 위/도 4유형 강제 세팅 (4박스 + 4유형 박스 빠른 점검용)
function dbgSetType(type){
  dbgEnsureGame();
  var map={pp:[5,5],pn:[5,-5],np:[-5,5],nn:[-5,-5],mid:[0,0]};
  var v=map[type]||[0,0];
  gameState.competencies.delegationChoice.value=v[0];
  gameState.competencies.knowledge.value=v[1];
  saveGame();updateStats();renderDebug();
}

// 8.11 — 위/도 미세 조정
function dbgAdjComp(which,delta){
  dbgEnsureGame();
  var key=(which==='d')?'delegationChoice':'knowledge';
  gameState.competencies[key].value+=delta;
  saveGame();updateStats();renderDebug();
}

// 8.11 — RP 강제 설정
function dbgSetRP(n){
  dbgEnsureGame();
  if(!gameState.rp)gameState.rp={balance:0,history:[]};
  gameState.rp.balance=n;
  saveGame();updateStats();renderDebug();
}

function dbgAddRP(n){
  dbgEnsureGame();
  if(!gameState.rp)gameState.rp={balance:0,history:[]};
  gameState.rp.balance=Math.max(0,gameState.rp.balance+n);
  saveGame();updateStats();renderDebug();
}

// 8.11 — 학기 종합 리포트 강제 호출. scenarioHistory를 5건 mock 채움 + 현재 위/도 유지.
function dbgShowReport(grade){
  dbgEnsureGame();
  var scoreByGrade={S:95,A:82,B:68,C:55,D:40};
  var score=scoreByGrade[grade]||50;
  var order=['selfintro','groupwork','eorinwangja','career','studyplan'];
  gameState.scenarioHistory=order.map(function(scid){
    var sc=SCENARIOS[scid]||{};
    var leafKeys=Object.keys(sc.finals||{});
    var leaf=(leafKeys.indexOf('A1R3')>=0)?'A1R3':(leafKeys[0]||'A1R3');
    var fin=(sc.finals||{})[leaf]||{};
    return {
      scenarioId:scid,
      tier1:leaf.charAt(0),
      tier2:leaf.substring(0,2),
      review:leaf.substring(2),
      leaf:leaf,
      finalScore:score,
      grade:grade,
      item:fin.item||''
    };
  });
  gameState.totalScore=score*5;
  gameState.clearedScenarios=order.slice();
  saveGame();
  showFinalReport();
}

// 8.11 — 레벨업 모달 강제 호출 (현재 레벨 → +1)
function dbgShowLevelUpModal(){
  dbgEnsureGame();
  var lv=gameState.exp.level||1;
  var rt=gameState.resources.time, re=gameState.resources.energy;
  var prevMax={time:rt.max,energy:re.max};
  var newMax=(CONFIG.meterMaxByLevel&&CONFIG.meterMaxByLevel[lv+1])||{time:rt.max+10,energy:re.max+10};
  var bonus=(CONFIG.rpLevelUpBonusByLevel&&CONFIG.rpLevelUpBonusByLevel[lv+1])||15;
  showLevelUpModal(lv,lv+1,prevMax,newMax,bonus);
}

// 8.11 — RP 분배 모달 강제 호출 (balance가 0이면 20 부여 후 호출)
function dbgShowRPModal(){
  dbgEnsureGame();
  if(!gameState.rp)gameState.rp={balance:0,history:[]};
  if(gameState.rp.balance<=0)gameState.rp.balance=20;
  saveGame();updateStats();
  showRPDistributionModal().then(function(){updateStats();renderDebug();});
}

setInterval(function(){if(dbgOn)renderDebug();},3000);

