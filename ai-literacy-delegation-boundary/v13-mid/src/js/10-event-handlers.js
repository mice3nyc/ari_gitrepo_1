// =====================================================
// 10. Event Handlers
// =====================================================
function startNewGame(){
  // v0.5: 시작 화면(시나리오 선택)으로. 첫 진입 시 신규 학기 상태 생성
  if(!gameState||!gameState.clearedScenarios){
    gameState=createInitialState();
    resetSid();
    saveGame();
    trackEvent('session_started',{version:CONFIG.version});
  }
  showStartScreen();
}

function startScenario(scid){
  if(btnGuard('startScenario'))return;
  if(!SCENARIOS[scid])return;
  _couponSelections={};
  if(typeof railClear==='function')railClear(); // §2b — 이전 시나리오 레일 잔여물 정리
  if(!gameState||!gameState.clearedScenarios){gameState=createInitialState();}
  if(gameState.clearedScenarios.indexOf(scid)>=0)return; // 1회 제한 (리플레이는 replayScenario 사용)
  // §14.5 — 순차 진행: 미완료 중 다음 시나리오만 진입 가능 (UI 우회 방어)
  var _order=CONFIG.scenarios,_next=null;
  for(var _i=0;_i<_order.length;_i++){if(gameState.clearedScenarios.indexOf(_order[_i])<0){_next=_order[_i];break;}}
  if(_next&&scid!==_next)return;
  // v0.8 — 리플레이용 자원 스냅샷 저장
  if(!gameState.replay)gameState.replay={};
  if(!gameState.replay[scid]){
    gameState.replay[scid]={
      played:false,improved:false,bestScore:0,bestGrade:'',
      resourceSnapshot:{time:gameState.resources.time.current,energy:gameState.resources.energy.current}
    };
  }
  gameState.currentScenarioId=scid;
  gameState.currentTier=1;
  gameState.selectedTier1=null;
  gameState.selectedTier2=null;
  gameState.selectedReview=null;
  gameState.score=0;
  gameState.completed=false;
  gameState._gameOverShown=false;
  gameState._scDiscounts=[]; // §3a R2 — 영수증 기록 리셋
  if(!gameState.pending)gameState.pending={delegation:0,knowledge:0};
  gameState.pending.delegation=0;
  gameState.pending.knowledge=0;
  _prevPending.delegation=0;
  _prevPending.knowledge=0;
  if(typeof gameState.scenarioRepeatCount[scid]!=='number')gameState.scenarioRepeatCount[scid]=0;
  saveGame();
  currentRow=null;
  trackEvent('scenario_selected',{scenarioId:scid,clearedCount:gameState.clearedScenarios.length});
  container.innerHTML='';
  updateStats();
  updateDomainLabel();
  showStats();
  renderCut1();
}

// v0.8 — 리플레이: 같은 시나리오 다시 플레이 (해당 시나리오 변화분만 롤백)
function replayScenario(scid){
  if(!SCENARIOS[scid])return;
  if(!gameState||!gameState.clearedScenarios){return;}
  if(typeof railClear==='function')railClear(); // §2b — 컷6에서 리플레이 진입 시 레일 정리 (비행 생략 경로)

  // [1] 해당 시나리오 역량/점수/EXP 롤백 (scenarioHistory에서 찾아서 역산)
  var hist=gameState.scenarioHistory||[];
  for(var i=hist.length-1;i>=0;i--){
    if(hist[i].scenarioId===scid){
      var r=hist[i];
      // 역량 누적에서 해당 delta 빼기
      if(typeof r.dlgDelta==='number')gameState.competencies.delegationChoice.value-=r.dlgDelta;
      if(typeof r.knlDelta==='number')gameState.competencies.knowledge.value-=r.knlDelta;
      // totalScore에서 빼기
      if(typeof r.finalScore==='number')gameState.totalScore-=r.finalScore;
      // EXP 롤백 — 해당 시나리오에서 얻은 EXP 빼기 + 레벨 재계산
      var sc2r=SCENARIOS[scid];
      var leafScore=(sc2r&&sc2r.finals&&sc2r.finals[r.leaf])?sc2r.finals[r.leaf].score:0;
      var expForLeaf=Math.floor(leafScore*(CONFIG.expScoreMultiplier||0.3));
      if(expForLeaf&&gameState.exp){
        gameState.exp.current=Math.max(0,gameState.exp.current-expForLeaf);
        // 레벨 재계산
        var thr=CONFIG.expThresholds||[0,20,50,100,200];
        var newLv=1;
        for(var li=thr.length-1;li>=0;li--){if(gameState.exp.current>=thr[li]){newLv=li+1;break;}}
        if(newLv<gameState.exp.level){
          gameState.exp.level=newLv;
          var mbl=CONFIG.meterMaxByLevel[newLv]||{time:100,energy:100};
          gameState.resources.time.max=mbl.time;
          gameState.resources.energy.max=mbl.energy;
        }
      }
      // §3b R2 — 첫 판 보존 (최초 재도전 때만) + 시도 횟수
      if(!gameState.replay)gameState.replay={};
      if(!gameState.replay[scid])gameState.replay[scid]={played:true,improved:false,bestScore:r.finalScore||0,bestGrade:r.grade||''};
      if(!gameState.replay[scid].firstAttempt)gameState.replay[scid].firstAttempt={score:r.finalScore||0,grade:r.grade||''};
      gameState.replay[scid].attempts=(gameState.replay[scid].attempts||1)+1;
      // history에서 제거
      hist.splice(i,1);
      break;
    }
  }

  // [1b] clearedScenarios에서 해당 시나리오 제거 — 재도전 완료 후 goNextScenario가
  //      totalScore를 다시 가산하고, scenarioHistory를 재기록하고, _lockedCardCount 할인 가드가
  //      정상 작동하도록 한다. (백공 QA #1·#6·#7 + 리포트/학습자유형 누락. 두 진입로·5종 시나리오 공통)
  gameState.clearedScenarios=gameState.clearedScenarios.filter(function(s){return s!==scid;});

  // [2] 해당 시나리오에서 받은 카드 제거 (도전력 제외 — 리플레이 보상이므로 유지)
  function removeCardsForScenario(arr){
    if(!arr)return[];
    return arr.filter(function(c){return c.scenario!==scid||c.label==='도전력';});
  }
  if(gameState.inventory){
    gameState.inventory.humanCentricCards=removeCardsForScenario(gameState.inventory.humanCentricCards);
    gameState.inventory.domainCards=removeCardsForScenario(gameState.inventory.domainCards);
    gameState.inventory.growthCards=removeCardsForScenario(gameState.inventory.growthCards);
    gameState.inventory.competencyCards=removeCardsForScenario(gameState.inventory.competencyCards);
  }

  // [3] 자원 원복 (시나리오 시작 전 스냅샷)
  var rp=gameState.replay&&gameState.replay[scid];
  if(rp&&rp.resourceSnapshot){
    gameState.resources.time.current=rp.resourceSnapshot.time;
    gameState.resources.energy.current=rp.resourceSnapshot.energy;
  }
  // 새 스냅샷 저장 (§3b 가드 — stale 세이브에서 replay[scid] 부재 시 TypeError 방지)
  if(!gameState.replay)gameState.replay={};
  if(!gameState.replay[scid])gameState.replay[scid]={played:true,improved:false,bestScore:0,bestGrade:''};
  gameState.replay[scid].resourceSnapshot={time:gameState.resources.time.current,energy:gameState.resources.energy.current};

  // [4] 시나리오 상태 초기화 (1회 제한 우회)
  _couponSelections={}; // §3b R2 곁가지 — 이전 판 쿠폰 선택이 재도전에 자동 적용되던 것 교정
  gameState.currentScenarioId=scid;
  gameState.currentTier=1;
  gameState.selectedTier1=null;
  gameState.selectedTier2=null;
  gameState.selectedReview=null;
  gameState.score=0;
  gameState.completed=false;
  gameState._gameOverShown=false;
  gameState._scDiscounts=[]; // §3a R2 — 영수증 기록 리셋
  if(!gameState.pending)gameState.pending={delegation:0,knowledge:0};
  gameState.pending.delegation=0;
  gameState.pending.knowledge=0;
  _prevPending.delegation=0;
  _prevPending.knowledge=0;
  saveGame();
  currentRow=null;
  trackEvent('replay_started',{scenarioId:scid});
  container.innerHTML='';
  updateStats();
  updateDomainLabel();
  showStats();
  renderCut1();
}

// v2 6/11 — 도메인 괄호 표기 제거 (피터공: 특정 능력 표시는 카드가 담당). 순수 레이블만.
function updateDomainLabel(){
  var el=document.getElementById('stat-name-knowledge');
  if(!el)return;
  el.textContent=_t('hud.knowledge','능력');
}

function goNextScenario(){
  if(btnGuard('goNext'))return;
  if(!gameState)return;
  if(gameState.currentScenarioId&&gameState.clearedScenarios.indexOf(gameState.currentScenarioId)<0){
    gameState.clearedScenarios.push(gameState.currentScenarioId);
    gameState.totalScore=(gameState.totalScore||0)+gameState.score;
  }
  gameState.completed=false;
  gameState.currentScenarioId=null;
  gameState.selectedTier1=null;gameState.selectedTier2=null;gameState.selectedReview=null;gameState.score=0;
  saveGame();
  trackEvent('scenario_completed',{clearedCount:gameState.clearedScenarios.length});
  // 학기 마지막이면 종합 리포트
  if(gameState.clearedScenarios.length>=CONFIG.scenarios.length){
    showFinalReport();
  }else{
    showStartScreen();
  }
}

function continueGame(){
  gameState=loadGame();
  if(!gameState){startNewGame();return;}
  // v0.4 guard: 구버전 save에 resources 없으면 초기값 부여
  if(!gameState.resources){
    var rms=CONFIG.resourceMaxStart;
    gameState.resources={time:{current:rms.time,max:rms.time,history:[]},energy:{current:rms.energy,max:rms.energy,history:[]}};
  }
  // v0.9 세션322 guard: 자원 max 값을 현재 CONFIG에 맞춤 (120/70 → 100/100 전환)
  var _rms=CONFIG.resourceMaxStart;
  if(gameState.resources.time.max!==_rms.time||gameState.resources.energy.max!==_rms.energy){
    gameState.resources.time.max=_rms.time;
    gameState.resources.energy.max=_rms.energy;
    gameState.resources.time.current=Math.min(gameState.resources.time.current,_rms.time);
    gameState.resources.energy.current=Math.min(gameState.resources.energy.current,_rms.energy);
  }
  if(!gameState.exp){gameState.exp={current:0,level:1,thresholds:CONFIG.expThresholds};}
  if(gameState.hintEnabled===undefined){gameState.hintEnabled=CONFIG.hintEnabledDefault;}
  // v0.5 guard: 학기 누적 필드
  if(!gameState.clearedScenarios)gameState.clearedScenarios=[];
  if(!gameState.scenarioRepeatCount||typeof gameState.scenarioRepeatCount!=='object'){
    var rc={};CONFIG.scenarios.forEach(function(s){rc[s]=0;});gameState.scenarioRepeatCount=rc;
  }
  // v0.5 Phase 8.8 guard: 자원토큰(RP) — 구버전 save 호환
  if(!gameState.rp||typeof gameState.rp!=='object')gameState.rp={balance:0,history:[]};
  if(typeof gameState.rp.balance!=='number')gameState.rp.balance=0;
  if(!Array.isArray(gameState.rp.history))gameState.rp.history=[];
  // v0.6 Phase 6 guard: 진행 중인 학기는 튜토리얼 다시 안 보여줌
  if(gameState.tutorialSeen===undefined)gameState.tutorialSeen=true;
  // v0.6 §12 guard: pending 필드 호환
  if(!gameState.pending||typeof gameState.pending!=='object')gameState.pending={delegation:0,knowledge:0};
  if(typeof gameState.pending.delegation!=='number')gameState.pending.delegation=0;
  if(typeof gameState.pending.knowledge!=='number')gameState.pending.knowledge=0;
  // v0.8 guard: 역량 카드 인벤토리
  if(!gameState.inventory||!Array.isArray(gameState.inventory.competencyCards))gameState.inventory={competencyCards:(gameState.inventory&&gameState.inventory.competencyCards)||[]};
  // 시나리오 미선택 상태면 시작 화면
  if(!gameState.currentScenarioId){showStartScreen();return;}
  trackEvent('session_continued',{version:CONFIG.version});
  container.innerHTML='';
  currentRow=null;
  updateStats();
  showStats();
  if(gameState.completed){showReport();return;}
  // 진행 단계에 따라 복원
  renderCut1();
  if(gameState.selectedTier1){
    setTimeout(function(){
      showCut2Summary();
      if(gameState.selectedTier2){
        setTimeout(function(){
          showCut3Summary();
          setTimeout(function(){
            goCut4();
            if(gameState.selectedReview){
              setTimeout(function(){
                showCut5Summary();
                goCut6();
              },200);
            }
          },200);
        },200);
      }
    },200);
  }
}

function applyTier1ToView(){/* state already has selection — used by continueGame */}
function applyTier2ToView(){/* state already has selection */}
function applyReviewToView(){/* state already has selection */}

function fadeOutChoices(areaId,cb){
  var area=document.getElementById(areaId);
  if(!area){if(cb)cb();return;}
  var cards=area.querySelectorAll('.choice-card');
  cards.forEach(function(c,i){setTimeout(function(){c.classList.add('fade-out');},i*60);});
  setTimeout(function(){if(area.parentNode)area.parentNode.removeChild(area);if(cb)cb();},Math.max(300,cards.length*60+200));
}

function onTier1(t1id){
  var prevTime=gameState.resources.time.current;
  var prevEnergy=gameState.resources.energy.current;
  applyTier1(t1id);
  // 단계 1 자원 소비
  consumeStage('tier1',getTier1Cost(t1id),null);
  var nowTime=gameState.resources.time.current;
  var nowEnergy=gameState.resources.energy.current;
  fadeOutChoices('tier1-choices',function(){
    showCut2Summary();
    animateResource('time',prevTime,nowTime);
    animateResource('energy',prevEnergy,nowEnergy);
    updateStats();
    pilotAwardAndShow('tier1',t1id); // 6/11 파일럿 — 선택 직후 카드 획득 (SPEC-card-per-choice)
  });
}

var _couponSelections={}; // §4p — 쿠폰 모달 폐지 후 미사용(리셋 호출 호환용 유지)
function onTier2(t2id){
  if(_cascadeBusy)return; // §4p — 할인 캐스케이드 도는 동안 클릭 잠금
  var prev=gameState.competencies.delegationChoice.value;
  var prevTime=gameState.resources.time.current;
  var prevEnergy=gameState.resources.energy.current;
  applyTier2(t2id);
  var now=gameState.competencies.delegationChoice.value;
  var cost=getTier2Cost(t2id);
  consumeStage('tier2',cost,null);
  var nowTime=gameState.resources.time.current;
  var nowEnergy=gameState.resources.energy.current;
  fadeOutChoices('tier2-choices',function(){
    showCut3Summary();
    animateStat('delegation',prev,now);
    animateResource('time',prevTime,nowTime);
    animateResource('energy',prevEnergy,nowEnergy);
    updateStats();
    pilotAwardAndShow('tier2',t2id); // 6/11 파일럿 — 선택 직후 카드 획득
  });
}

function onReview(rid){
  if(_cascadeBusy)return; // §4p — 할인 캐스케이드 도는 동안 클릭 잠금
  var prevK=gameState.competencies.knowledge.value;
  var prevTime=gameState.resources.time.current;
  var prevEnergy=gameState.resources.energy.current;
  applyReview(rid);
  var nowK=gameState.competencies.knowledge.value;
  var lp=getLeafPath();
  if(lp){
    var cost=getReviewCost(lp);
    consumeStage('review',cost,lp);
  }
  var nowTime=gameState.resources.time.current;
  var nowEnergy=gameState.resources.energy.current;
  fadeOutChoices('review-choices',function(){
    showCut5Summary();
    goCut6();
    animateStat('knowledge',prevK,nowK);
    animateResource('time',prevTime,nowTime);
    animateResource('energy',prevEnergy,nowEnergy);
    updateStats();
    pilotAwardAndShow('review',rid); // 6/11 §2b — 검토 카드도 선택 직후 획득 (컷6 일괄에서 이동)
    var sn=document.getElementById('score-num');
    if(sn){sn.classList.add('pulsing');setTimeout(function(){sn.classList.remove('pulsing');},600);}
  });
}

function onNext(){/* placeholder — overridden in goCut6 */}

function resetGame(){
  trackEvent('session_reset',{});
  if(typeof railClear==='function')railClear(); // §2b
  clearGame();
  resetSid();
  gameState=null;currentRow=null;
  showTitleScreen(); // 처음부터 새로 시작 → 타이틀 화면부터 (피터공 6/18). showTitleScreen이 fresh state 재생성
}

// 학기 처음부터 — 확인 모달 (5/3 세션278)
function confirmReset(){
  var modal=document.getElementById('reset-confirm-modal');
  if(!modal)return;
  modal.classList.remove('hidden');
  requestAnimationFrame(function(){modal.classList.add('visible');});
}
function closeResetConfirm(){
  var modal=document.getElementById('reset-confirm-modal');
  if(!modal)return;
  modal.classList.remove('visible');
  setTimeout(function(){modal.classList.add('hidden');},250);
}
function confirmResetDo(){
  closeResetConfirm();
  setTimeout(function(){resetGame();},150);
}

// §17.2 — 시나리오 나가기 (세션467, 6/11): 이번 판 롤백 후 시나리오 선택 화면으로
function exitScenario(){
  if(btnGuard('exitScenario'))return;
  if(!gameState||!gameState.currentScenarioId){showStartScreen();return;}
  var modal=document.getElementById('exit-confirm-modal');
  if(!modal){confirmExitDo();return;}
  modal.classList.remove('hidden');
  requestAnimationFrame(function(){modal.classList.add('visible');});
}
function closeExitConfirm(){
  var modal=document.getElementById('exit-confirm-modal');
  if(!modal)return;
  modal.classList.remove('visible');
  setTimeout(function(){modal.classList.add('hidden');},250);
}
function confirmExitDo(){
  closeExitConfirm();
  var scid=gameState&&gameState.currentScenarioId;
  if(!scid){showStartScreen();return;}
  // [1] 자원 원복 — 시나리오 시작 스냅샷 (startScenario/replayScenario가 저장)
  var rp=gameState.replay&&gameState.replay[scid];
  if(rp&&rp.resourceSnapshot){
    gameState.resources.time.current=rp.resourceSnapshot.time;
    gameState.resources.energy.current=rp.resourceSnapshot.energy;
  }
  // [2] 이번 시나리오에서 받은 카드 제거 (도전력 제외 — replayScenario와 동일 규칙)
  function _exitDropCards(arr){
    if(!arr)return[];
    return arr.filter(function(c){return c.scenario!==scid||c.label==='도전력';});
  }
  if(gameState.inventory){
    gameState.inventory.humanCentricCards=_exitDropCards(gameState.inventory.humanCentricCards);
    gameState.inventory.domainCards=_exitDropCards(gameState.inventory.domainCards);
    gameState.inventory.growthCards=_exitDropCards(gameState.inventory.growthCards);
    gameState.inventory.competencyCards=_exitDropCards(gameState.inventory.competencyCards);
  }
  // [3] 시나리오 상태 초기화 — 점수·완료 확정 전이라 pending/선택만 비우면 됨
  gameState.currentScenarioId=null;
  gameState.currentTier=1;
  gameState.selectedTier1=null;
  gameState.selectedTier2=null;
  gameState.selectedReview=null;
  gameState.score=0;
  gameState.completed=false;
  gameState._gameOverShown=false;
  if(!gameState.pending)gameState.pending={delegation:0,knowledge:0};
  gameState.pending.delegation=0;
  gameState.pending.knowledge=0;
  _prevPending.delegation=0;
  _prevPending.knowledge=0;
  if(typeof railClear==='function')railClear();
  saveGame();
  currentRow=null;
  trackEvent('scenario_exited',{scenarioId:scid});
  setTimeout(function(){showStartScreen();},150);
}

function backToStartScreen(){
  if(typeof railClear==='function')railClear(); // §2b→§2d 독 재렌더
  // §2d — inv-tab은 독으로 대체, 복원하지 않음
  var debugBtn=document.querySelector('.debug-toggle');if(debugBtn)debugBtn.style.display='';
  var verLabel=document.getElementById('version-label');if(verLabel)verLabel.style.display='';
  currentRow=null;
  showStartScreen();
}

