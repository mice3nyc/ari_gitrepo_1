// =====================================================
// 16. 카드 레일 — 획득 팝업 + 우측 스택 + 종료 비행 (SPEC-card-per-choice §2b)
// 선택 직후: 우측 팝업("「선택」 → ○○ 획득!") → 닫으면 레일에 팝 등장 →
// 시나리오 종료(컷6 체인 끝)에 역량카드 버튼으로 순차 비행.
// =====================================================
function _railEl(){
  var rail=document.getElementById('card-rail');
  if(!rail){
    rail=document.createElement('div');
    rail.id='card-rail';
    document.body.appendChild(rail);
  }
  return rail;
}
function railClear(){
  var rail=document.getElementById('card-rail');
  if(rail)rail.innerHTML='';
  var pop=document.getElementById('card-earn-popup');
  if(pop&&pop.parentNode)pop.parentNode.removeChild(pop);
}
// 미니 카드 DOM — 레일·팝업 미리보기 공용. c: {kind:'hc',axis,tag} | {kind:'domain',name}
function _railCardVisual(c){
  var el=document.createElement('div');
  el.className='rail-card';
  if(c.kind==='hc'){
    var am=_axisMeta(c.axis);
    el.style.background=am.color;
    el.innerHTML='<div class="rail-card-sub" style="color:rgba(255,255,255,0.8);">'+_invEscapeHTML(c.axis)+'</div>'+
      '<div class="rail-card-name" style="color:#fff;">'+_invEscapeHTML(c.tag)+'</div>';
  }else{
    el.style.borderLeft='6px solid '+_cardColor(c.name);
    el.innerHTML='<div class="rail-card-name">'+_invEscapeHTML(_cardDisplayName(c.name))+'</div>';
  }
  return el;
}
function railAddCard(c){
  var rail=_railEl();
  var el=_railCardVisual(c);
  rail.appendChild(el);
  void el.offsetWidth;
  el.classList.add('pop-in');
}
// 획득 팝업 — 닫기(X·클릭) 또는 4초 자동 닫힘 → 카드가 레일로 팝 (여러 장이면 0.15s 시간차)
function showCardEarnPopup(choiceLabel,cards){
  return new Promise(function(resolve){
    if(!cards||!cards.length){resolve();return;}
    var old=document.getElementById('card-earn-popup');
    if(old&&old.parentNode)old.parentNode.removeChild(old);
    var names=cards.map(function(c){return c.kind==='hc'?c.tag:_cardDisplayName(c.name);});
    var pop=document.createElement('div');
    pop.id='card-earn-popup';
    pop.className='card-earn-popup';
    var h='<button class="cep-close" aria-label="닫기">×</button>';
    if(choiceLabel){
      h+='<div class="cep-choice">'+_t('ui_messages.card_reward.popup_choice_format','「{label}」 선택').replace('{label}',_invEscapeHTML(choiceLabel))+'</div>';
    }
    h+='<div class="cep-earn">'+_t('ui_messages.card_reward.popup_earn_format','{cards} 획득!').replace('{cards}','<b>'+_invEscapeHTML(names.join(' · '))+'</b>')+'</div>';
    h+='<div class="cep-cards"></div>';
    pop.innerHTML=h;
    var holder=pop.querySelector('.cep-cards');
    cards.forEach(function(c){holder.appendChild(_railCardVisual(c));});
    document.body.appendChild(pop);
    requestAnimationFrame(function(){pop.classList.add('show');});
    var closed=false;
    function close(){
      if(closed)return;closed=true;
      pop.classList.remove('show');
      setTimeout(function(){if(pop.parentNode)pop.parentNode.removeChild(pop);},250);
      cards.forEach(function(c,i){setTimeout(function(){railAddCard(c);},250+i*150);});
      resolve();
    }
    pop.onclick=close;
    setTimeout(close,4000);
  });
}
// 종료 비행 — 레일 카드들이 역량카드 버튼(#inv-tab)으로 순차 비행 + 탭 펄스. 레일 비면 no-op.
// 획득 팝업이 아직 열려 있으면(모달 없는 S/A 경로) 먼저 닫아 카드를 레일에 안착시킨 뒤 난다.
function railFlyToInventory(){
  var pop=document.getElementById('card-earn-popup');
  if(pop&&pop.onclick){
    pop.onclick();
    return new Promise(function(resolve){
      setTimeout(function(){_railFlyNow().then(resolve);},900);
    });
  }
  return _railFlyNow();
}
function _railFlyNow(){
  return new Promise(function(resolve){
    var rail=document.getElementById('card-rail');
    var items=rail?Array.prototype.slice.call(rail.children):[];
    if(!items.length){resolve();return;}
    var tab=document.getElementById('inv-tab');
    if(!tab){railClear();resolve();return;}
    var r=tab.getBoundingClientRect();
    var remaining=items.length;
    function finishOne(){
      remaining--;
      if(remaining<=0){
        railClear();
        var panel=document.getElementById('inv-panel');
        var badge=document.getElementById('inv-tab-badge');
        if(badge&&panel&&!panel.classList.contains('open'))badge.classList.remove('hidden');
        renderInventory();
        resolve();
      }
    }
    items.forEach(function(el,i){
      setTimeout(function(){
        var cr=el.getBoundingClientRect();
        // 레일 레이아웃을 유지한 채 fixed 고스트만 비행
        var ghost=el.cloneNode(true);
        ghost.classList.remove('pop-in');
        ghost.style.cssText+=';position:fixed;left:'+cr.left+'px;top:'+cr.top+'px;width:'+cr.width+'px;margin:0;opacity:1;transform:none;z-index:500;transition:transform 0.5s cubic-bezier(0.55,0,0.85,0.3),opacity 0.35s ease-in 0.15s;';
        document.body.appendChild(ghost);
        el.style.visibility='hidden';
        var tx=r.left+r.width/2-(cr.left+cr.width/2);
        var ty=r.top+r.height/2-(cr.top+cr.height/2);
        requestAnimationFrame(function(){
          ghost.style.transform='translate('+tx+'px,'+ty+'px) scale(0.08) rotate(540deg)';
          ghost.style.opacity='0';
        });
        setTimeout(function(){
          if(ghost.parentNode)ghost.parentNode.removeChild(ghost);
          tab.style.transition='transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease';
          tab.style.transform='translateY(-50%) scale(1.15)';
          tab.style.boxShadow='-3px 3px 0 #111, 0 0 20px rgba(255,220,80,0.6)';
          setTimeout(function(){
            tab.style.transform='translateY(-50%) scale(1)';
            tab.style.boxShadow='-3px 3px 0 #111';
          },300);
          finishOne();
        },550);
      },i*180);
    });
  });
}
