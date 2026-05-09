// =====================================================
// 6. Game Engine (v0.3 — 트리 진행)
// =====================================================
function getScenario(){return SCENARIOS[gameState.currentScenarioId];}

function getLeafPath(){
  if(!gameState.selectedTier2||!gameState.selectedReview)return null;
  return gameState.selectedTier2+gameState.selectedReview;
}

// v0.6 옵션 1 — leaf 점수가 tier1 누적에 따라 달라짐. leaf.delta.afterX 우선, 없으면 단일 필드 fallback (다른 시나리오 호환)
function getLeafDelta(leaf,t1Id){
  if(leaf&&leaf.delta&&t1Id&&leaf.delta['after'+t1Id])return leaf.delta['after'+t1Id];
  return {delegation:(leaf&&leaf.delegation)||'0',knowledge:(leaf&&leaf.knowledge)||'0'};
}

function getTier2Delegation(t2id,t1IdArg){
  var sc=getScenario(),firstChar=t2id.charAt(0);
  var arr=sc.tier2[firstChar];
  var t1Id=t1IdArg||gameState.selectedTier1;
  for(var i=0;i<arr.length;i++)if(arr[i].id===t2id)return getLeafDelta(arr[i],t1Id).delegation;
  return '0';
}

function applyTier1(t1id){
  var snap=stateSnap();
  gameState.selectedTier1=t1id;
  gameState.currentTier=2;
  // v0.6 §12 — pending에 박음 (시나리오 끝에 누적 흡수)
  var sc=getScenario(),t1Obj=null;
  for(var i=0;i<sc.tier1.length;i++){if(sc.tier1[i].id===t1id){t1Obj=sc.tier1[i];break;}}
  if(t1Obj){
    var dlgT1=getAxisDelta(t1Obj.delegation);
    var knlT1=getAxisDelta(t1Obj.knowledge);
    if(dlgT1!==0){
      gameState.pending.delegation+=dlgT1;
      gameState.competencies.delegationChoice.history.push({tier1:t1id,delegation:t1Obj.delegation,delta:dlgT1,pending:true});
    }
    if(knlT1!==0){
      gameState.pending.knowledge+=knlT1;
      gameState.competencies.knowledge.history.push({tier1:t1id,knowledge:t1Obj.knowledge,delta:knlT1,pending:true});
    }
  }
  trackEvent('tier1_selected',{scenarioId:gameState.currentScenarioId,tier1:t1id,before:snap,after:stateSnap()});
  saveGame();
}

function applyTier2(t2id){
  var snap=stateSnap();
  gameState.selectedTier2=t2id;
  gameState.currentTier='result';
  // v0.6 옵션 1 — leaf 점수가 tier1 누적에 따라 결정 (getLeafDelta lookup)
  var sc=getScenario(),t2Obj=null,firstChar=t2id.charAt(0);
  var arr=sc.tier2[firstChar]||[];
  for(var i=0;i<arr.length;i++){if(arr[i].id===t2id){t2Obj=arr[i];break;}}
  var leafDelta=getLeafDelta(t2Obj,gameState.selectedTier1);
  var dlg=leafDelta.delegation,knl=leafDelta.knowledge;
  // v0.6 §12 — pending에 박음
  var delta=getAxisDelta(dlg);
  gameState.pending.delegation+=delta;
  var knlDelta=getAxisDelta(knl);
  if(knlDelta!==0){
    gameState.pending.knowledge+=knlDelta;
    gameState.competencies.knowledge.history.push({tier2:t2id,knowledge:knl,delta:knlDelta,pending:true,afterTier1:gameState.selectedTier1});
  }
  gameState.competencies.delegationChoice.history.push({tier2:t2id,delegation:dlg,delta:delta,pending:true,afterTier1:gameState.selectedTier1});
  trackEvent('tier2_selected',{scenarioId:gameState.currentScenarioId,tier2:t2id,delegation:dlg,delta:delta,afterTier1:gameState.selectedTier1,before:snap,after:stateSnap()});
  saveGame();
}

function applyReview(rid){
  var snap=stateSnap();
  gameState.selectedReview=rid;
  gameState.currentTier='final';
  // v0.6 §12 — pending에 박음 (도 축, 시나리오 끝 흡수)
  var leaf=getLeafPath();
  var fin=getScenario().finals[leaf];
  var knl=fin?fin.knowledge:'0';
  var delta=getAxisDelta(knl);
  gameState.pending.knowledge+=delta;
  gameState.competencies.knowledge.history.push({leaf:leaf,knowledge:knl,delta:delta,pending:true});
  // v0.8 — CSV 최종점수 lookup
  var sc2=getScenario();
  var reviewObj=null;
  for(var ri=0;ri<sc2.reviews.length;ri++){if(sc2.reviews[ri].id===rid){reviewObj=sc2.reviews[ri];break;}}
  gameState.score=calculateFinalScore(leaf,rid);
  if(fin&&fin.item)gameState.itemsCollected.push(fin.item);
  // v0.8 — 3트랙 카드 지급 (finals에서 직접 읽음)
  if(fin&&fin.cardEarned){
    if(fin.humanCentricAxis&&fin.humanCentricTag){
      if(!gameState.inventory.humanCentricCards)gameState.inventory.humanCentricCards=[];
      gameState.inventory.humanCentricCards.push({axis:fin.humanCentricAxis,tag:fin.humanCentricTag,scenario:gameState.currentScenarioId,leaf:leaf});
    }
    if(fin.domainCards&&fin.domainCards.length){
      if(!gameState.inventory.domainCards)gameState.inventory.domainCards=[];
      for(var di=0;di<fin.domainCards.length;di++){
        gameState.inventory.domainCards.push({label:fin.domainCards[di],scenario:gameState.currentScenarioId,leaf:leaf});
      }
    }
    if(fin.growthCard){
      if(!gameState.inventory.growthCards)gameState.inventory.growthCards=[];
      gameState.inventory.growthCards.push({label:fin.growthCard,scenario:gameState.currentScenarioId,leaf:leaf});
    }
  }
  // v0.8 세션310 — B 이하 결과 시 회복력 자동 지급 (yaml에 없어도)
  var _grade=fin?fin.grade:'';
  if(_grade==='B'||_grade==='C'||_grade==='D'){
    var hasRecovery=false;
    var gc=gameState.inventory.growthCards||[];
    for(var gi=0;gi<gc.length;gi++){if(gc[gi].scenario===gameState.currentScenarioId&&gc[gi].label==='회복력'){hasRecovery=true;break;}}
    if(!hasRecovery){
      if(!gameState.inventory.growthCards)gameState.inventory.growthCards=[];
      gameState.inventory.growthCards.push({label:'회복력',scenario:gameState.currentScenarioId,leaf:leaf,note:'이번 결과를 바탕으로 다시 시도할 수 있는 회복력 카드가 생겼어요.'});
    }
  }
  var resourcePenalty=calcResourcePenalty(gameState.resources);
  var ownedCards=(gameState.inventory&&gameState.inventory.competencyCards)||[];
  var cardMatchBonus=getCardMatchBonus(sc2,leaf,ownedCards);
  trackEvent('review_selected',{scenarioId:gameState.currentScenarioId,review:rid,leaf:leaf,knowledge:knl,delta:delta,score:gameState.score,cardMatchBonus:cardMatchBonus,resourcePenalty:resourcePenalty,before:snap,after:stateSnap()});
  saveGame();
}

// v0.8 §6.6.6 — 카드 매칭 활성화 메카닉. axisDelta(직접 매칭) + matchGroups(친화 그룹) 두 결.
// 보너스 상한 CONFIG.cardMatchBonusCap (10).
function getCardMatchBonus(scenario,leaf,ownedCards){
  if(!scenario||!leaf)return 0;
  ownedCards=ownedCards||[];
  var bonus=0;
  // 직접 매칭 (axisDelta) — leaf의 핵심 카드 1장 강조
  var axis=scenario.axisDelta||[];
  for(var i=0;i<axis.length;i++){
    var rule=axis[i];
    if(!rule||rule.leafId!==leaf)continue;
    var matched=false;
    for(var j=0;j<ownedCards.length;j++){
      if(ownedCards[j].label===rule.requireCard){matched=true;break;}
    }
    if(matched)bonus+=rule.bonusPoint||5;
  }
  // 친화 그룹 매칭 (matchGroups) — leaf의 친화 그룹 1~2개. 그룹별 1회만 + (예시 그룹 데이터는 selfintro에만 있음)
  var groups=(scenario.matchGroups||{})[leaf];
  if(groups&&groups.length){
    var COMP_GROUP={
      // 자기성찰 그룹
      '자기지식':'자기성찰','자기성찰':'자기성찰','자기검증':'자기성찰',
      // 표현·소통 그룹
      '표현력':'표현·소통','정리력':'표현·소통','소통능력':'표현·소통','발표력':'표현·소통','협업능력':'표현·소통',
      // 인식·해석 그룹
      '검수능력':'인식·해석','비판적 사고':'인식·해석','문해력':'인식·해석','해석능력':'인식·해석','정보분석':'인식·해석','공감력':'인식·해석',
      // 실천·설계 그룹
      '학습설계':'실천·설계','시간관리':'실천·설계','학습전략':'실천·설계','진로탐색':'실천·설계','직업이해':'실천·설계'
    };
    var matchedGroups={};
    for(var k=0;k<ownedCards.length;k++){
      var g=COMP_GROUP[ownedCards[k].label];
      if(!g)continue;
      if(groups.indexOf(g)>=0)matchedGroups[g]=true;
    }
    var matchedKeys=Object.keys(matchedGroups);
    bonus+=matchedKeys.length*5;
  }
  // 상한
  var cap=(typeof CONFIG.cardMatchBonusCap==='number')?CONFIG.cardMatchBonusCap:10;
  return Math.min(bonus,cap);
}

// v0.8 §6.6.6 — 자원 잔여 보너스 (남은 시간·에너지의 일부). bonus 항의 한 자리.
function getResourceLeftoverBonus(){
  if(!gameState||!gameState.resources)return 0;
  var t=Math.max(0,gameState.resources.time.current);
  var e=Math.max(0,gameState.resources.energy.current);
  var w=(typeof CONFIG.resourceLeftoverWeight==='number')?CONFIG.resourceLeftoverWeight:0.05;
  return Math.round((t+e)*w);
}

// v0.8 합산 모델 — 단계별 점수 helper
// tier1.points = basePoint + varPoint
function getTier1Points(scenario,t1Id){
  if(!scenario||!t1Id)return {basePoint:0,varPoint:0,points:0,label:'',obj:null};
  var arr=scenario.tier1||[];
  for(var i=0;i<arr.length;i++){
    if(arr[i].id===t1Id){
      var bp=arr[i].basePoint||0,vp=arr[i].varPoint||0;
      return {basePoint:bp,varPoint:vp,points:bp+vp,label:arr[i].label||'',obj:arr[i]};
    }
  }
  return {basePoint:0,varPoint:0,points:0,label:'',obj:null};
}
// tier2.points = basePoint + varPoint
function getTier2Points(scenario,t2Id){
  if(!scenario||!t2Id)return {basePoint:0,varPoint:0,points:0,label:'',obj:null};
  var firstChar=t2Id.charAt(0);
  var arr=(scenario.tier2||{})[firstChar]||[];
  for(var i=0;i<arr.length;i++){
    if(arr[i].id===t2Id){
      var bp=arr[i].basePoint||0,vp=arr[i].varPoint||0;
      return {basePoint:bp,varPoint:vp,points:bp+vp,label:arr[i].label||'',obj:arr[i]};
    }
  }
  return {basePoint:0,varPoint:0,points:0,label:'',obj:null};
}
// review.points = R1=10·R2=20·R3=30 (yaml points 필드)
function getReviewPoints(scenario,rId){
  if(!scenario||!rId)return {points:0,label:'',obj:null};
  var arr=scenario.reviews||[];
  for(var i=0;i<arr.length;i++){
    if(arr[i].id===rId){
      return {points:arr[i].points||0,label:arr[i].label||'',obj:arr[i]};
    }
  }
  return {points:0,label:'',obj:null};
}

function getGrade(score){
  if(score>=CONFIG.pointThresholds.S)return 'S';
  if(score>=CONFIG.pointThresholds.A)return 'A';
  if(score>=CONFIG.pointThresholds.B)return 'B';
  if(score>=CONFIG.pointThresholds.C)return 'C';
  return 'D'; // pointThresholds.D 미만도 D로 통일 (별도 F 등급 없음)
}

