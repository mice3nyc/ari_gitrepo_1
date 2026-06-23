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
    // 6/15 §4o — 헤더+레벨은 HUD(.hud-dock)로. 독 = 카드 보관함 + 그 아래 할인 블럭(§4o v6, 피터공: 할인을 카드 박스 아래로·카툰 강조).
    dock.innerHTML=
      '<div class="dock-col" id="dock-col-ab">'
        +'<div class="dock-cards-box"><div class="dock-list" id="dock-list-ab"></div></div>'
        +'<div class="dock-disc" id="dock-disc-ab" style="display:none"><span class="dd-head">내가 할까?</span><span class="dd-label">에너지 할인</span><span class="dd-num">0</span></div>'
      +'</div>'
      +'<div class="dock-col" id="dock-col-hc">'
        +'<div class="dock-cards-box"><div class="dock-list" id="dock-list-hc"></div></div>'
        +'<div class="dock-disc" id="dock-disc-hc" style="display:none"><span class="dd-head">시킬까?</span><span class="dd-label">시간 할인</span><span class="dd-num">0</span></div>'
      +'</div>';
    // §2d v2 — inv-panel 폐지: 독은 표시 전용. 리셋은 디버그 패널 초기화로.
    document.body.appendChild(dock);
  }
  return dock;
}
function dockShow(on){_dockEl().classList.toggle('on',!!on);}
// §4p A (피터공) — 레벨·할인 = 보유 카드 장수(보이는 카드와 일치). 능력=내가할까칸(domainCards), 위임=시킬까칸(인간중심+성장).
// 리포트 학습자 유형은 competencies 점수 그대로(별개 성향 측정) — 건드리지 않음.
// §4p v4 (피터공, 세션486) — 버그수정: 완료 시나리오(clearedScenarios) 카드만 카운트.
// 진행 중 시나리오에서 막 획득한 pending 카드(currentScenarioId·미클리어)는 제외 →
// 레벨/할인은 시나리오 도중이 아니라 철컥 확보(완료) 후 다음 시나리오부터 적용.
function _lockedCardCount(arr){
  if(!arr||!gameState)return 0;
  var cleared=gameState.clearedScenarios||[],n=0;
  for(var i=0;i<arr.length;i++){if(arr[i]&&cleared.indexOf(arr[i].scenario)>=0)n++;}
  return n;
}
function _abilityCardCount(){var inv=gameState&&gameState.inventory;return inv?_lockedCardCount(inv.domainCards):0;}
function _delegationCardCount(){var inv=gameState&&gameState.inventory;if(!inv)return 0;return _lockedCardCount(inv.humanCentricCards)+_lockedCardCount(inv.growthCards);}
function updateDockLevels(){
  if(!gameState)return;
  var ab=document.getElementById('dock-level-ab');
  var hc=document.getElementById('dock-level-hc');
  var knl=_abilityCardCount();
  var dlg=_delegationCardCount();
  if(ab)ab.textContent=knl;
  if(hc)hc.textContent=dlg;
  // 할인 = 카드 장수 (능력→에너지 할인 / 위임→시간 할인). 0이면 블럭 숨김(§4o v7).
  _setDockDisc(document.getElementById('dock-disc-ab'),knl);
  _setDockDisc(document.getElementById('dock-disc-hc'),dlg);
}
function _setDockDisc(box,v){
  if(!box)return;
  box.style.display=(v>0)?'':'none';
  var num=box.querySelector('.dd-num');
  if(num)num.textContent='-'+v;
}
// §4q v4 (피터공) — 위임(시킬까/hc) 카드 이름에 "역량" 추가. 예: 주체성 → 주체성 역량.
// (도메인/내가할까 카드는 _cardDisplayName이 "능력"형으로 따로 처리)
function _hcName(tag){return tag?(tag+' 역량'):tag;}
// 임시(pending) 판정 — 현재 시나리오에서 선택으로 획득, 아직 미클리어
function _dockIsPending(entry){
  if(!entry||!entry.perChoice||!gameState)return false;
  if(entry.scenario!==gameState.currentScenarioId)return false;
  return (gameState.clearedScenarios||[]).indexOf(entry.scenario)<0;
}
// 독 칩 DOM — c: {kind:'hc',axis,tag} | {kind:'domain'|'growth',name}
// §2d v2 — 한 줄 표기. pending = 진한 회색·컬러 없음·점선·깜빡임 / 컬러는 철컥(locked) 때 입힘.
function _dockChipLabel(c){
  // §6 — 축 이름 미표시, 역량명만 (6/12)
  return (c.kind==='hc')?_invEscapeHTML(_hcName(c.tag)):_invEscapeHTML(_cardDisplayName(c.name));
}
// §4o v5 (피터공) — 같은 카드 누적: identity 키로 묶어 ×N 표시
function _dockChipKey(c){
  if(c.kind==='hc')return 'hc:'+c.tag;
  if(c.kind==='growth')return 'g:'+c.name;
  return 'd:'+c.name;
}
// 인벤토리 안 같은 identity 카드 총 개수 (locked+pending 모두)
function _dockCountFor(c){
  if(!gameState||!gameState.inventory)return 1;
  var inv=gameState.inventory,n=0,i;
  if(c.kind==='hc'){var a=inv.humanCentricCards||[];for(i=0;i<a.length;i++)if(a[i].tag===c.tag)n++;}
  else if(c.kind==='growth'){var g=inv.growthCards||[];for(i=0;i<g.length;i++)if(g[i].label===c.name)n++;}
  else{var d=inv.domainCards||[];for(i=0;i<d.length;i++)if(d[i].label===c.name)n++;}
  return n||1;
}
function _dockCountBadge(count,white){
  if(!(count>1))return '';
  return '<span class="dc-count"'+(white?' style="color:#fff;"':'')+'>×'+count+'</span>';
}
function _dockChipApplyLocked(el,c,count){
  if(c.kind==='hc'){
    var am=_axisMeta(c.axis);
    el.style.background=am.color;
    el.innerHTML='<div class="dc-name" style="color:#fff;">'+_invEscapeHTML(_hcName(c.tag))+'</div>'+_dockCountBadge(count,true);
  }else{
    el.style.borderLeft='6px solid '+_cardColor(c.name);
    el.innerHTML='<div class="dc-name">'+_invEscapeHTML(_cardDisplayName(c.name))+'</div>'+_dockCountBadge(count,false);
  }
}
function _dockChip(c,pending,count){
  var el=document.createElement('div');
  el._cardData=c;
  el.dataset.key=_dockChipKey(c);
  el.className='dock-card '+(pending?'pending':'locked');
  if(pending){
    el.innerHTML='<div class="dc-name">'+_dockChipLabel(c)+'</div>'+_dockCountBadge(count,false);
  }else{
    _dockChipApplyLocked(el,c,count);
  }
  return el;
}
function _dockListFor(c){return document.getElementById((c.kind==='hc'||c.kind==='growth')?'dock-list-hc':'dock-list-ab');}
// 인벤토리 → 독 전체 재렌더 (읽기 전용 미러, 획득 순서 = 배열 순서)
function dockRender(){
  _dockEl();
  var hcL=document.getElementById('dock-list-hc');
  var abL=document.getElementById('dock-list-ab');
  if(!hcL||!abL)return;
  hcL.innerHTML='';abL.innerHTML='';
  if(!gameState||!gameState.inventory)return;
  var inv=gameState.inventory;
  // 6/15 r42 (§4n) — 능력카드(domain)=내가할까 칸 / 인간중심(hc)+성장(growth, B)=시킬까 칸
  // §4o v5 (피터공) — 같은 카드는 ×N으로 묶어 표시 (획득 순서로 첫 등장 위치 유지)
  _dockRenderGroup(hcL,(inv.humanCentricCards||[]).map(function(e){return {e:e,c:{kind:'hc',axis:e.axis,tag:e.tag}};})
    .concat((inv.growthCards||[]).map(function(e){return {e:e,c:{kind:'growth',name:e.label}};})));
  _dockRenderGroup(abL,(inv.domainCards||[]).map(function(e){return {e:e,c:{kind:'domain',name:e.label}};}));
  updateDockLevels();
}
function _dockRenderGroup(listEl,items){
  var order=[],map={};
  items.forEach(function(it){
    var k=_dockChipKey(it.c);
    if(!map[k]){map[k]={c:it.c,count:0,pending:false};order.push(k);}
    map[k].count++;
    if(_dockIsPending(it.e))map[k].pending=true;
  });
  order.forEach(function(k){var g=map[k];listEl.appendChild(_dockChip(g.c,g.pending,g.count));});
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
    el.innerHTML='<div class="rail-card-name" style="color:#fff;">'+_invEscapeHTML(_hcName(c.tag))+'</div>';
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
  // 6/23 (피터공) — 앵커를 .panel-image(이미지만) → .panel 전체(이미지+선택지 영역)로.
  // 팝업 하단을 이미지 하단이 아니라 선택지 버튼 포함 전체 박스 하단에 맞춤.
  var panel=currentRow.querySelector('[data-cut="'+anchorCut+'"]');
  var img=panel&&panel.querySelector('.panel-image');
  if(!panel||!img||img.offsetWidth<40||img.offsetHeight<40)return null;
  var o=_docOffset(panel);
  return {left:o.x,top:o.y,width:panel.offsetWidth,height:panel.offsetHeight};
}
// 획득 팝업 v3 (§2e) — 컷 이미지 하단 중앙(§2c v2.1). 카드명 상단 큰 글씨 + 작은 설명 줄.
// 자동 닫힘 없음 — 확보 버튼을 눌러야 닫히고, 미리보기 카드 고스트가
// 회전(540°)하며 독 pending 칩 자리로 비행(§2d).
function showCardEarnPopup(choiceLabel,cards,anchorCut){
  return new Promise(function(resolve){
    if(!cards||!cards.length){resolve();return;}
    var old=document.getElementById('card-earn-popup');
    if(old&&old.parentNode)old.parentNode.removeChild(old);
    var names=cards.map(function(c){return c.kind==='hc'?_hcName(c.tag):_cardDisplayName(c.name);});
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
        // §4o v5 — 같은 카드 이미 있으면 그 칩으로 날아가 ×N 증가, 없으면 새 pending 칩
        var chip=list.querySelector('[data-key="'+_dockChipKey(c)+'"]');
        var isNew=!chip;
        function _bumpExisting(ch){
          ch.classList.remove('locked');ch.classList.add('pending');
          ch.style.background='';ch.style.borderLeft='';
          ch.innerHTML='<div class="dc-name">'+_dockChipLabel(c)+'</div>'+_dockCountBadge(_dockCountFor(c),false);
        }
        if(isNew){
          chip=_dockChip(c,true,_dockCountFor(c));
          chip.style.visibility='hidden';
          list.appendChild(chip);
        }
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
          (function(g,ch,dx,dy,s,idx,_new){
            setTimeout(function(){
              requestAnimationFrame(function(){
                g.style.transform='translate('+dx+'px,'+dy+'px) rotate(540deg) scale('+s.toFixed(2)+')';
                g.style.opacity='0.2';
              });
              setTimeout(function(){
                if(g.parentNode)g.parentNode.removeChild(g);
                if(_new){ch.style.visibility='';}
                else{_bumpExisting(ch);}
                ch.classList.add('reveal');
              },560);
            },idx*150);
          })(ghost,chip,tx,ty,sc,i,isNew);
        }else{
          if(isNew){chip.style.visibility='';}
          else{_bumpExisting(chip);}
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
        if(el._cardData)_dockChipApplyLocked(el,el._cardData,_dockCountFor(el._cardData)); // 철컥과 함께 컬러+×N 입힘 (§2d v2 / §4o v5)
        (function(node){setTimeout(function(){node.classList.remove('locking');},450);})(el);
      },i*120);
    });
    setTimeout(function(){
      if(typeof renderInventory==='function')renderInventory();
      resolve();
    },pend.length*120+500);
  });
}
