// =====================================================
// 15. 카드 선택별 획득 — 파일럿 (6/11, SPEC-card-per-choice.md)
// 끝(결말) 몰아주기 → 선택 직후 획득. 대상: PILOT_PER_CHOICE.scenarios만.
// 지급 규칙은 데이터 도출(discountTags + delta 부호) — scenarios.yaml 무수정.
// =====================================================
var PILOT_PER_CHOICE={
  scenarios:['selfintro'],
  axisTagMap:{
    selfintro:{'중심잡기':'주체성','융합하기':'통합적 사고','성찰하기':'성찰적 사고'}
  }
};
function pilotPerChoiceActive(scid){
  return !!scid && PILOT_PER_CHOICE.scenarios.indexOf(scid)>=0;
}

// 규칙 v0 — tier1: delegation +면 인간중심 / tier2: knowledge +면 strongDomain, delegation ++면 인간중심(축 중복 제외) / review: strongDomain 있으면(R2/R3) 그 카드
function pilotCardsForChoice(stage,id){
  if(!gameState||!pilotPerChoiceActive(gameState.currentScenarioId))return [];
  var sc=getScenario();if(!sc)return [];
  var amap=PILOT_PER_CHOICE.axisTagMap[gameState.currentScenarioId]||{};
  var out=[];
  function hcCard(axis){
    var tag=axis?amap[axis]:null;
    if(!axis||!tag)return null;
    return {kind:'hc',axis:axis,tag:tag,label:'['+axis+'] '+tag};
  }
  function domCard(name){return name?{kind:'domain',name:name,label:name}:null;}
  if(stage==='tier1'){
    var t1=null;
    for(var i=0;i<sc.tier1.length;i++)if(sc.tier1[i].id===id){t1=sc.tier1[i];break;}
    if(t1&&getAxisDelta(t1.delegation)>0){
      var c=hcCard(t1.discountTags&&t1.discountTags.humanCentric);
      if(c)out.push(c);
    }
  }else if(stage==='tier2'){
    var arr=sc.tier2[id.charAt(0)]||[],t2=null;
    for(var j=0;j<arr.length;j++)if(arr[j].id===id){t2=arr[j];break;}
    if(t2){
      var d=getLeafDelta(t2,gameState.selectedTier1);
      if(getAxisDelta(d.knowledge)>0){
        var sd=t2.discountTags&&t2.discountTags.strongDomain&&t2.discountTags.strongDomain[0];
        var dc=domCard(sd);if(dc)out.push(dc);
      }
      if(d.delegation==='++'){
        var ax=t2.discountTags&&t2.discountTags.humanCentric;
        var dupe=false;
        var hcs=(gameState.inventory&&gameState.inventory.humanCentricCards)||[];
        for(var k=0;k<hcs.length;k++){
          if(hcs[k].scenario===gameState.currentScenarioId&&hcs[k].axis===ax){dupe=true;break;}
        }
        if(!dupe){var c2=hcCard(ax);if(c2)out.push(c2);}
      }
    }
  }else if(stage==='review'){
    var rv=null;
    for(var m=0;m<sc.reviews.length;m++)if(sc.reviews[m].id===id){rv=sc.reviews[m];break;}
    var sd2=rv&&rv.discountTags&&rv.discountTags.strongDomain&&rv.discountTags.strongDomain[0];
    var dc2=domCard(sd2);if(dc2)out.push(dc2);
  }
  return out;
}

// 인벤토리 적립 (perChoice:true 마킹) — 시각 토스트는 호출부에서 playCardRewardSequential 재사용
function pilotAwardCards(cards){
  if(!cards||!cards.length)return;
  ensureInventory();
  var scid=gameState.currentScenarioId;
  var leaf=getLeafPath()||null;
  for(var i=0;i<cards.length;i++){
    var c=cards[i];
    if(c.kind==='hc'){
      if(!gameState.inventory.humanCentricCards)gameState.inventory.humanCentricCards=[];
      gameState.inventory.humanCentricCards.push({axis:c.axis,tag:c.tag,scenario:scid,leaf:leaf,perChoice:true});
    }else{
      if(!gameState.inventory.domainCards)gameState.inventory.domainCards=[];
      gameState.inventory.domainCards.push({label:c.name,scenario:scid,leaf:leaf,perChoice:true});
    }
  }
  saveGame();
}

// 팝업에 띄울 선택지 라벨 회수
function _pilotChoiceLabel(stage,id){
  var sc=getScenario();if(!sc)return '';
  if(stage==='tier1'){
    for(var i=0;i<sc.tier1.length;i++)if(sc.tier1[i].id===id)return sc.tier1[i].label||'';
  }else if(stage==='tier2'){
    var arr=sc.tier2[id.charAt(0)]||[];
    for(var j=0;j<arr.length;j++)if(arr[j].id===id)return arr[j].label||'';
  }else if(stage==='review'){
    var leafKey=(gameState.selectedTier2||'')+id;
    if(sc.reviewLabels&&sc.reviewLabels[leafKey])return sc.reviewLabels[leafKey];
    for(var m=0;m<sc.reviews.length;m++)if(sc.reviews[m].id===id)return sc.reviews[m].label||'';
  }
  return '';
}

// 적립 + 우측 획득 팝업 한 호흡 (tier1/tier2/review 훅용) — §2b 레일 흐름
function pilotAwardAndShow(stage,id){
  var cards=pilotCardsForChoice(stage,id);
  if(!cards.length)return Promise.resolve();
  pilotAwardCards(cards);
  return showCardEarnPopup(_pilotChoiceLabel(stage,id),cards);
}
