// =====================================================
// 6b. Resource System (v0.4 신규 — SPEC §2)
// =====================================================

// 단계별 비용 헬퍼 — 각 선택(t1/t2/review)이 leaf 총비용을 점진 소비
// 분배 원칙(min 기반 incremental + stage floor):
//   t1.X        = min(leaf cost) over all leaves under X
//   t2.X.Y      = max(STAGE_FLOOR, min(leaf cost) over leaves under X.Y - t1.X)
//   review leaf = max(STAGE_FLOOR, leafTotal - (t1 + t2))
// 5/4 세션289 — 가장 싼 leaf의 t2/review가 0으로 도착하던 자리에 floor 박음.
// "그대로 제출"·"가장 가벼운 접근"도 클릭+commit 비용이 있어야 한다.
// 결과: 가장 싼 leaf는 yaml 총비용보다 stage 합이 floor 만큼 큼 (overage 4t/2e 한도).
// floor 값: 시간 2분 / 에너지 1포인트 (R2=5/4·R3=15/11 위계 유지)
var STAGE_FLOOR={time:2,energy:1};
function _rawTier1Cost(t1){
  var sc=getScenario();
  if(sc.stageCosts&&sc.stageCosts.tier1&&sc.stageCosts.tier1[t1])return sc.stageCosts.tier1[t1];
  if(!sc.resourceCosts)return {time:0,energy:0};
  var minT=Infinity,minE=Infinity;
  Object.keys(sc.resourceCosts).forEach(function(k){
    if(k.charAt(0)===t1){var c=sc.resourceCosts[k];if(c.time<minT)minT=c.time;if(c.energy<minE)minE=c.energy;}
  });
  return {time:isFinite(minT)?minT:0, energy:isFinite(minE)?minE:0};
}
function _rawTier2Cost(t2){
  var sc=getScenario();
  if(sc.stageCosts&&sc.stageCosts.tier2&&sc.stageCosts.tier2[t2])return sc.stageCosts.tier2[t2];
  if(!sc.resourceCosts||!t2)return {time:0,energy:0};
  var minT=Infinity,minE=Infinity;
  Object.keys(sc.resourceCosts).forEach(function(k){
    if(k.substr(0,2)===t2){var c=sc.resourceCosts[k];if(c.time<minT)minT=c.time;if(c.energy<minE)minE=c.energy;}
  });
  var t1c=_rawTier1Cost(t2.charAt(0));
  return {time:Math.max(STAGE_FLOOR.time,(isFinite(minT)?minT:0)-t1c.time),energy:Math.max(STAGE_FLOOR.energy,(isFinite(minE)?minE:0)-t1c.energy)};
}
function _rawReviewCost(leaf){
  var sc=getScenario();
  var rIdx=leaf.lastIndexOf('R');
  var rId=rIdx>0?leaf.substr(rIdx):null;
  if(sc.stageCosts&&sc.stageCosts.review&&rId&&sc.stageCosts.review[rId])return sc.stageCosts.review[rId];
  if(!sc.resourceCosts||!sc.resourceCosts[leaf])return {time:0,energy:0};
  var t2=leaf.substr(0,2);var leafC=sc.resourceCosts[leaf];
  var t1c=_rawTier1Cost(leaf.charAt(0));var t2c=_rawTier2Cost(t2);
  return {time:Math.max(STAGE_FLOOR.time,leafC.time-t1c.time-t2c.time),energy:Math.max(STAGE_FLOOR.energy,leafC.energy-t1c.energy-t2c.energy)};
}
// multiplier 적용 (UI·소비 양쪽이 같은 값을 사용하도록 한 군데서 처리)
function _applyMult(c){
  var m=(typeof CONFIG.resourceCostMultiplier==='number')?CONFIG.resourceCostMultiplier:1;
  return {time:Math.round(c.time*m), energy:Math.round(c.energy*m)};
}
// v0.9 §20 — 이중 할인: 축 숙련도 + 카드 태그 매칭
// 축 숙련도: 위임→시간, 도메인→에너지 (기존, 폭 축소)
// 카드 할인: 인간중심/도메인 카드 태그 매칭 → 에너지만 할인
function _getChoiceDiscountTags(stageType,choiceId){
  var sc=getScenario();if(!sc)return null;
  if(stageType==='tier1'){
    var list=sc.tier1||[];
    for(var i=0;i<list.length;i++){if(list[i].id===choiceId)return list[i].discountTags||null;}
  }else if(stageType==='tier2'){
    var parent=choiceId.charAt(0);
    var t2list=(sc.tier2&&sc.tier2[parent])||[];
    for(var i=0;i<t2list.length;i++){if(t2list[i].id===choiceId)return t2list[i].discountTags||null;}
  }else if(stageType==='review'){
    var rIdx=choiceId.lastIndexOf('R');
    var rId=rIdx>=0?choiceId.substr(rIdx):choiceId;
    var revs=sc.reviews||[];
    for(var i=0;i<revs.length;i++){if(revs[i].id===rId)return revs[i].discountTags||null;}
  }
  return null;
}
function _calculateCardEnergyDiscount(discountTags){
  if(!discountTags||!gameState||!gameState.inventory)return {total:0,details:[]};
  var inv=gameState.inventory;
  var details=[],used={},total=0,MAX_CARD_DISCOUNT=6;
  var hcTag=discountTags.humanCentric||'';
  if(hcTag){
    var hcCards=inv.humanCentricCards||[];
    for(var i=0;i<hcCards.length;i++){
      if(hcCards[i].axis===hcTag&&!used['hc:'+hcTag]){
        used['hc:'+hcTag]=true;
        var amt=2;total+=amt;
        details.push({type:'humanCentric',tag:hcTag,display:hcCards[i].tag||hcTag,amount:amt});
        break;
      }
    }
  }
  var strongSet={};
  var strongDomain=discountTags.strongDomain||[];
  for(var i=0;i<strongDomain.length;i++)strongSet[strongDomain[i]]=true;
  var domainTags=discountTags.domain||[];
  var domCards=inv.domainCards||[];
  for(var i=0;i<domainTags.length;i++){
    var dt=domainTags[i];if(used['dom:'+dt])continue;
    for(var j=0;j<domCards.length;j++){
      if(domCards[j].label===dt){
        used['dom:'+dt]=true;
        var amt=strongSet[dt]?3:2;total+=amt;
        details.push({type:'domain',tag:dt,display:dt,amount:amt});
        break;
      }
    }
  }
  if(total>MAX_CARD_DISCOUNT)total=MAX_CARD_DISCOUNT;
  return {total:total,details:details};
}
// v0.9 세션322: 고정 할인 — 역량 점수 = 할인액. 비율 상한 폐기.
function _applyDiscount(c,stageType,choiceId,selectedCard){
  var dlg=(gameState&&gameState.competencies)?gameState.competencies.delegationChoice.value||0:0;
  var knl=(gameState&&gameState.competencies)?gameState.competencies.knowledge.value||0:0;
  var rawT=c.time,rawE=c.energy;
  var timeDisc=dlg;
  var cardDisc={total:0,details:[]};
  if(selectedCard){
    cardDisc={total:selectedCard.amount,details:[selectedCard]};
  }
  var energyDisc=knl+cardDisc.total;
  return {
    time:(rawT>0)?Math.max(1,rawT-timeDisc):0,
    energy:(rawE>0)?Math.max(1,rawE-energyDisc):0,
    _discount:{dlg:dlg,knl:knl,dlgEffect:timeDisc,knlEffect:knl,
      cardDiscount:cardDisc.total,cardDetails:cardDisc.details,
      mPos:1,mNeg:1,rawTime:rawT,rawEnergy:rawE,clampedEnergy:energyDisc}
  };
}
function getAvailableCardDiscounts(stageType,choiceId){
  var tags=_getChoiceDiscountTags(stageType,choiceId);
  var disc=_calculateCardEnergyDiscount(tags);
  return disc.details;
}
function getTier1Cost(t1){return _applyDiscount(_applyMult(_rawTier1Cost(t1)),'tier1',t1,null);}
function getTier2Cost(t2){return _applyDiscount(_applyMult(_rawTier2Cost(t2)),'tier2',t2,null);}
function getTier2CostWithCard(t2,card){return _applyDiscount(_applyMult(_rawTier2Cost(t2)),'tier2',t2,card);}
function getReviewCost(leaf){return _applyDiscount(_applyMult(_rawReviewCost(leaf)),'review',leaf,null);}
function getReviewCostWithCard(leaf,card){return _applyDiscount(_applyMult(_rawReviewCost(leaf)),'review',leaf,card);}

function showCouponSelect(cards,onConfirm){
  var overlay=document.createElement('div');overlay.className='coupon-overlay';
  var box=document.createElement('div');box.className='coupon-box';
  var selected=null;
  var html='<div class="coupon-title">할인 적용</div>';
  html+='<div style="font-size:12px;color:#555;margin-bottom:12px;">이번 선택에 사용할 수 있는 역량:</div>';
  html+='<div class="coupon-options">';
  for(var i=0;i<cards.length;i++){
    var c=cards[i];
    var strongTag=c.amount>=3?'<span class="coupon-strong-tag">강한 매칭</span>':'';
    html+='<div class="coupon-option" data-idx="'+i+'"><div class="coupon-radio"></div><div class="coupon-card-name">'+c.display+strongTag+'</div><div class="coupon-discount-amount">에너지 -'+c.amount+'</div></div>';
  }
  html+='<div class="coupon-option selected" data-idx="-1"><div class="coupon-radio"></div><div class="coupon-card-name">적용 안 함</div><div class="coupon-discount-amount"></div></div>';
  html+='</div>';
  html+='<button class="coupon-confirm">확인</button>';
  box.innerHTML=html;
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  var opts=box.querySelectorAll('.coupon-option');
  for(var j=0;j<opts.length;j++){
    (function(opt){
      opt.onclick=function(){
        for(var k=0;k<opts.length;k++)opts[k].classList.remove('selected');
        opt.classList.add('selected');
        var idx=parseInt(opt.getAttribute('data-idx'));
        selected=idx>=0?cards[idx]:null;
      };
    })(opts[j]);
  }
  box.querySelector('.coupon-confirm').onclick=function(){
    document.body.removeChild(overlay);
    onConfirm(selected);
  };
}

// 단계별 소비 — onTier1/onTier2/onReview에서 호출
function consumeStage(stage,costObj,leafPath){
  if(!costObj||(costObj.time===0&&costObj.energy===0))return;
  var res=gameState.resources;
  var timeBefore=res.time.current;
  var energyBefore=res.energy.current;
  // v0.5 Phase 8 — 0 floor (DECISIONS §9.2)
  res.time.current=Math.max(0,res.time.current-costObj.time);
  res.energy.current=Math.max(0,res.energy.current-costObj.energy);
  res.time.history.push({stage:stage,leaf:leafPath||null,cost:costObj.time,before:timeBefore,after:res.time.current});
  res.energy.history.push({stage:stage,leaf:leafPath||null,cost:costObj.energy,before:energyBefore,after:res.energy.current});
  trackEvent('resource_consumed',{
    stage:stage,
    leafPath:leafPath||null,
    time_cost:costObj.time,
    energy_cost:costObj.energy,
    time_after:res.time.current,
    energy_after:res.energy.current
  });
}

// (legacy) leaf 단위 한 번에 소비 — Phase 5 이전 코드 호환용. 신규 호출은 consumeStage 사용
function consumeResources(leafPath){
  var sc=getScenario();
  var costs=sc.resourceCosts?sc.resourceCosts[leafPath]:null;
  if(!costs)return;
  consumeStage('leaf',costs,leafPath);
}

// v0.5 Phase 8.8 — 자원토큰(RP) 적립 (DECISIONS §10.2, §10.3)
// 컷6 결과 직후 호출. 등급별 + 레벨업 보너스 합산하여 balance에 추가.
function awardRP(grade,didLevelUp,newLevel){
  if(!gameState.rp)gameState.rp={balance:0,history:[]};
  var fromGrade=(CONFIG.rpRewardByGrade&&CONFIG.rpRewardByGrade[grade])||0;
  var fromLevelUp=0;
  if(didLevelUp&&CONFIG.rpLevelUpBonusByLevel){
    fromLevelUp=CONFIG.rpLevelUpBonusByLevel[newLevel]||0;
  }
  var total=fromGrade+fromLevelUp;
  gameState.rp.balance=total;
  gameState.rp.history.push({
    type:'awarded',
    scenarioId:gameState.currentScenarioId,
    grade:grade,
    fromGrade:fromGrade,
    fromLevelUp:fromLevelUp,
    total:total,
    balanceAfter:gameState.rp.balance,
    at:new Date().toISOString()
  });
  trackEvent('rp_awarded',{
    scenarioId:gameState.currentScenarioId,
    grade:grade,
    fromGrade:fromGrade,
    fromLevelUp:fromLevelUp,
    total:total,
    balanceAfter:gameState.rp.balance
  });
  return {fromGrade:fromGrade,fromLevelUp:fromLevelUp,total:total,balanceAfter:gameState.rp.balance};
}

// v0.5 Phase 8.8 — 자원토큰 분배 적용 (DECISIONS §10.4)
// 분배 팝업(8.10a) 완료 시 호출. distribution = {time:N, energy:M}.
// 메터 max 초과분은 자동 클램프(잉여 손실). 1토큰 = 시간/에너지 +1.
function applyRPDistribution(distribution){
  if(!gameState.rp)gameState.rp={balance:0,history:[]};
  var reqTime=Math.max(0,distribution.time||0);
  var reqEnergy=Math.max(0,distribution.energy||0);
  var spent=reqTime*CONFIG.rpCost.time+reqEnergy*CONFIG.rpCost.energy;
  if(spent>gameState.rp.balance){
    console.warn('[applyRPDistribution] 요청>잔액',spent,gameState.rp.balance);
    return false;
  }
  var res=gameState.resources;
  var timeBefore=res.time.current,energyBefore=res.energy.current;
  res.time.current=Math.min(res.time.max,res.time.current+reqTime);
  res.energy.current=Math.min(res.energy.max,res.energy.current+reqEnergy);
  var timeApplied=res.time.current-timeBefore;
  var energyApplied=res.energy.current-energyBefore;
  var timeWasted=reqTime-timeApplied;   // max 초과로 손실
  var energyWasted=reqEnergy-energyApplied;
  gameState.rp.balance-=spent;
  gameState.rp.history.push({
    type:'distributed',
    requested:{time:reqTime,energy:reqEnergy},
    applied:{time:timeApplied,energy:energyApplied},
    wasted:{time:timeWasted,energy:energyWasted},
    spent:spent,
    balanceAfter:gameState.rp.balance,
    at:new Date().toISOString()
  });
  trackEvent('rp_distributed',{
    requested:{time:reqTime,energy:reqEnergy},
    applied:{time:timeApplied,energy:energyApplied},
    wasted:{time:timeWasted,energy:energyWasted},
    spent:spent,
    balanceAfter:gameState.rp.balance
  });
  saveGame();
  return {applied:{time:timeApplied,energy:energyApplied},wasted:{time:timeWasted,energy:energyWasted},spent:spent,balanceAfter:gameState.rp.balance};
}

