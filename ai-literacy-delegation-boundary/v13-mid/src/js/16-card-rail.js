// =====================================================
// 16. 카드 독 — 우측 상시 컬렉션 (SPEC-card-per-choice §2d)
// 획득 팝업(컷 이미지 위, §2c) → 회전 비행 → 독 pending → 시나리오 완료 시 철컥 고정.
// 호환: railClear = 팝업 정리 + 독 재렌더 / railFlyToInventory = 철컥 (§2b 호출처 유지)
// =====================================================
function _dockEl(){
  var dock=document.getElementById('card-dock');
  if(!dock){
    dock=document.createElement('div');
    dock.id='card-dock';
    dock.innerHTML='<div class="dock-sec"><div class="dock-sec-title">'+_t('inventory_labels.section_human_centric','인간중심 역량')+'</div><div class="dock-list" id="dock-list-hc"></div></div>'
      +'<div class="dock-sec"><div class="dock-sec-title">'+_t('inventory_labels.section_ability','능력 카드')+'</div><div class="dock-list" id="dock-list-ab"></div></div>';
    // §2d v2 — inv-panel 폐지: 독은 표시 전용. 리셋은 디버그 패널 초기화로.
    document.body.appendChild(dock);
  }
  return dock;
}
function dockShow(on){_dockEl().classList.toggle('on',!!on);}
// 임시(pending) 판정 — 현재 시나리오에서 선택으로 획득, 아직 미클리어
function _dockIsPending(entry){
  if(!entry||!entry.perChoice||!gameState)return false;
  if(entry.scenario!==gameState.currentScenarioId)return false;
  return (gameState.clearedScenarios||[]).indexOf(entry.scenario)<0;
}
// 독 칩 DOM — c: {kind:'hc',axis,tag} | {kind:'domain'|'growth',name}
// §2d v2 — 한 줄 표기. pending = 진한 회색·컬러 없음·점선·깜빡임 / 컬러는 철컥(locked) 때 입힘.
function _dockChipLabel(c){
  return (c.kind==='hc')?(_invEscapeHTML(c.axis)+' '+_invEscapeHTML(c.tag)):_invEscapeHTML(_cardDisplayName(c.name));
}
function _dockChipApplyLocked(el,c){
  if(c.kind==='hc'){
    var am=_axisMeta(c.axis);
    el.style.background=am.color;
    el.innerHTML='<div class="dc-name" style="color:#fff;"><span class="dc-axis">'+_invEscapeHTML(c.axis)+'</span> '+_invEscapeHTML(c.tag)+'</div>';
  }else{
    el.style.borderLeft='6px solid '+_cardColor(c.name);
    el.innerHTML='<div class="dc-name">'+_invEscapeHTML(_cardDisplayName(c.name))+'</div>';
  }
}
function _dockChip(c,pending){
  var el=document.createElement('div');
  el._cardData=c;
  el.className='dock-card '+(pending?'pending':'locked');
  if(pending){
    el.innerHTML='<div class="dc-name">'+_dockChipLabel(c)+'</div>';
  }else{
    _dockChipApplyLocked(el,c);
  }
  return el;
}
function _dockListFor(c){return document.getElementById(c.kind==='hc'?'dock-list-hc':'dock-list-ab');}
// 인벤토리 → 독 전체 재렌더 (읽기 전용 미러, 획득 순서 = 배열 순서)
function dockRender(){
  _dockEl();
  var hcL=document.getElementById('dock-list-hc');
  var abL=document.getElementById('dock-list-ab');
  if(!hcL||!abL)return;
  hcL.innerHTML='';abL.innerHTML='';
  if(!gameState||!gameState.inventory)return;
  var inv=gameState.inventory;
  (inv.humanCentricCards||[]).forEach(function(e){hcL.appendChild(_dockChip({kind:'hc',axis:e.axis,tag:e.tag},_dockIsPending(e)));});
  (inv.domainCards||[]).forEach(function(e){abL.appendChild(_dockChip({kind:'domain',name:e.label},_dockIsPending(e)));});
  (inv.growthCards||[]).forEach(function(e){abL.appendChild(_dockChip({kind:'growth',name:e.label},_dockIsPending(e)));});
}
function railClear(){
  var pop=document.getElementById('card-earn-popup');
  if(pop&&pop.parentNode)pop.parentNode.removeChild(pop);
  dockRender();
}
// 미니 카드 DOM — 팝업 미리보기·비행 고스트용 (§2b 시각 유지)
// §4l — 인간중심은 독 칩과 같은 한 줄 인라인 ("중심잡기 주체성")
function _railCardVisual(c){
  var el=document.createElement('div');
  el.className='rail-card';
  if(c.kind==='hc'){
    var am=_axisMeta(c.axis);
    el.style.background=am.color;
    el.innerHTML='<div class="rail-card-name" style="color:#fff;"><span class="rail-card-axis">'+_invEscapeHTML(c.axis)+'</span> '+_invEscapeHTML(c.tag)+'</div>';
  }else{
    el.style.borderLeft='6px solid '+_cardColor(c.name);
    el.innerHTML='<div class="rail-card-name">'+_invEscapeHTML(_cardDisplayName(c.name))+'</div>';
  }
  return el;
}
// §2c v2.2 — 팝업 앵커: offsetLeft 체인(문서 좌표). getBoundingClientRect는 패널 slide-in
// (translateX 30px→0) 도중 측정되면 우측으로 밀림 — offset 체인은 transform 무관.
function _docOffset(el){
  var x=0,y=0;
  while(el){x+=el.offsetLeft;y+=el.offsetTop;el=el.offsetParent;}
  return {x:x,y:y};
}
function _popupAnchorBox(anchorCut){
  if(!anchorCut||typeof currentRow==='undefined'||!currentRow)return null;
  var img=currentRow.querySelector('[data-cut="'+anchorCut+'"] .panel-image');
  if(!img||img.offsetWidth<40||img.offsetHeight<40)return null;
  var o=_docOffset(img);
  return {left:o.x,top:o.y,width:img.offsetWidth,height:img.offsetHeight};
}
// 획득 팝업 v3 (§2e) — 컷 이미지 하단 중앙(§2c v2.1). 카드명 상단 큰 글씨 + 작은 설명 줄.
// 자동 닫힘 없음 — 확보 버튼을 눌러야 닫히고, 미리보기 카드 고스트가
// 회전(540°)하며 독 pending 칩 자리로 비행(§2d).
function showCardEarnPopup(choiceLabel,cards,anchorCut){
  return new Promise(function(resolve){
    if(!cards||!cards.length){resolve();return;}
    var old=document.getElementById('card-earn-popup');
    if(old&&old.parentNode)old.parentNode.removeChild(old);
    var names=cards.map(function(c){return c.kind==='hc'?c.tag:_cardDisplayName(c.name);});
    var pop=document.createElement('div');
    pop.id='card-earn-popup';
    pop.className='card-earn-popup';
    var h='<div class="cep-title">'+_t('ui_messages.card_reward.popup_title_format','{cards} 확보!').replace('{cards}',_invEscapeHTML(names.join(' · ')))+'</div>';
    if(choiceLabel){
      h+='<div class="cep-desc">'+_t('ui_messages.card_reward.popup_desc_format','「{label}」 선택으로 획득!').replace('{label}',_invEscapeHTML(choiceLabel))+'</div>';
    }else{
      h+='<div class="cep-desc">'+_t('ui_messages.card_reward.popup_earn_format','{cards} 획득!').replace('{cards}','').trim()+'</div>';
    }
    h+='<div class="cep-cards"></div>';
    h+='<button class="cep-acquire">'+_t('ui_messages.card_reward.popup_btn_acquire','확보!')+'</button>';
    pop.innerHTML=h;
    var holder=pop.querySelector('.cep-cards');
    cards.forEach(function(c){holder.appendChild(_railCardVisual(c));});
    document.body.appendChild(pop);
    var ab=_popupAnchorBox(anchorCut);
    if(ab){
      pop.classList.add('over-image');
      var w=pop.offsetWidth||300;
      var ph=pop.offsetHeight||140;
      pop.style.left=Math.max(8,Math.round(ab.left+ab.width/2-w/2))+'px';
      pop.style.top=Math.max(window.scrollY+8,Math.round(ab.top+ab.height-ph-14))+'px';
    }
    requestAnimationFrame(function(){pop.classList.add('show');});
    var closed=false;
    function close(){
      if(closed)return;closed=true;
      var minis=Array.prototype.slice.call(pop.querySelectorAll('.cep-cards .rail-card'));
      dockShow(true);
      cards.forEach(function(c,i){
        var list=_dockListFor(c);
        if(!list){return;}
        var chip=_dockChip(c,true);
        chip.style.visibility='hidden';
        list.appendChild(chip);
        var src=minis[i];
        var sr=src?src.getBoundingClientRect():null;
        var tr=chip.getBoundingClientRect();
        if(sr&&sr.width>0&&tr.width>0){
          var ghost=src.cloneNode(true);
          ghost.style.cssText+=';position:fixed;left:'+sr.left+'px;top:'+sr.top+'px;width:'+sr.width+'px;margin:0;opacity:1;transform:none;background:var(--bg-card);border:2px solid var(--ink);border-radius:12px;box-shadow:3px 3px 0 var(--ink);z-index:500;transition:transform 0.55s cubic-bezier(0.45,0,0.55,1),opacity 0.18s ease 0.45s;';
          if(c.kind==='hc'){var am=_axisMeta(c.axis);ghost.style.background=am.color;}
          document.body.appendChild(ghost);
          var tx=tr.left+tr.width/2-(sr.left+sr.width/2);
          var ty=tr.top+tr.height/2-(sr.top+sr.height/2);
          var sc=Math.max(0.3,tr.width/sr.width);
          (function(g,ch,dx,dy,s,idx){
            setTimeout(function(){
              requestAnimationFrame(function(){
                g.style.transform='translate('+dx+'px,'+dy+'px) rotate(540deg) scale('+s.toFixed(2)+')';
                g.style.opacity='0.2';
              });
              setTimeout(function(){
                if(g.parentNode)g.parentNode.removeChild(g);
                ch.style.visibility='';
                ch.classList.add('reveal');
              },560);
            },idx*150);
          })(ghost,chip,tx,ty,sc,i);
        }else{
          chip.style.visibility='';
        }
      });
      pop.classList.remove('show');
      setTimeout(function(){if(pop.parentNode)pop.parentNode.removeChild(pop);},250);
      resolve();
    }
    // §2e — 확보 버튼 단일 동선. 자동 닫힘·아무데나 클릭 닫기 폐지.
    pop._forceClose=close;
    var btn=pop.querySelector('.cep-acquire');
    if(btn)btn.onclick=close;
  });
}
// 철컥 — 시나리오 완료(컷6 체인 끝): pending 칩들이 120ms 시간차로 고정(locked).
// 팝업이 아직 열려 있으면(모달 없는 경로) 먼저 닫아 비행을 마치게 한 뒤 잠근다.
function railFlyToInventory(){
  var pop=document.getElementById('card-earn-popup');
  if(pop&&pop._forceClose){
    pop._forceClose();
    return new Promise(function(resolve){
      setTimeout(function(){_dockLockNow().then(resolve);},1000);
    });
  }
  return _dockLockNow();
}
function _dockLockNow(){
  return new Promise(function(resolve){
    var dock=_dockEl();
    var pend=Array.prototype.slice.call(dock.querySelectorAll('.dock-card.pending'));
    if(!pend.length){resolve();return;}
    pend.forEach(function(el,i){
      setTimeout(function(){
        el.classList.remove('pending');
        el.classList.add('locked','locking');
        if(el._cardData)_dockChipApplyLocked(el,el._cardData); // 철컥과 함께 컬러 입힘 (§2d v2)
        (function(node){setTimeout(function(){node.classList.remove('locking');},450);})(el);
      },i*120);
    });
    setTimeout(function(){
      if(typeof renderInventory==='function')renderInventory();
      resolve();
    },pend.length*120+500);
  });
}
