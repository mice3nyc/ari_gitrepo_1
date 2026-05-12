// =====================================================
// 12. 역량 카드 인벤토리 + reward 팝업 (§7.4 ~ §7.6)
// =====================================================
// 5/3 — 카드 색상 매핑 (TEXTS.cards[label].color) — texts.yaml 분리. 코드 하드코딩 폐기.
// fallback: hue circle 분산 (매핑에 없는 라벨)
var _CARD_PALETTE_FALLBACK=['#d32f2f','#1976d2','#388e3c','#7b1fa2','#f57c00','#00897b','#c2185b','#5d4037'];
function _cardColor(label){
  if(!label)return _CARD_PALETTE_FALLBACK[0];
  if(typeof TEXTS!=='undefined'&&TEXTS){
    var axisMatch=label.match(/^\[(.+?)\]\s*(.+)/);
    if(axisMatch){
      var hcAxis=TEXTS.humanCentricCards&&TEXTS.humanCentricCards[axisMatch[1]];
      if(hcAxis&&hcAxis.tags&&hcAxis.tags[axisMatch[2]])return hcAxis.tags[axisMatch[2]].color;
      if(hcAxis)return hcAxis.color;
    }
    if(TEXTS.domainCards&&TEXTS.domainCards[label])return TEXTS.domainCards[label].color;
    if(TEXTS.growthCards&&TEXTS.growthCards[label])return TEXTS.growthCards[label].color;
    if(TEXTS.cards&&TEXTS.cards[label]&&TEXTS.cards[label].color)return TEXTS.cards[label].color;
  }
  var h=0;
  for(var i=0;i<label.length;i++)h=((h<<5)-h+label.charCodeAt(i))|0;
  return _CARD_PALETTE_FALLBACK[Math.abs(h)%_CARD_PALETTE_FALLBACK.length];
}
function _cardBg(label){
  if(!label||typeof TEXTS==='undefined'||!TEXTS)return null;
  var axisMatch=label.match(/^\[(.+?)\]/);
  if(axisMatch){
    var hcAxis=TEXTS.humanCentricCards&&TEXTS.humanCentricCards[axisMatch[1]];
    if(hcAxis&&hcAxis.bg)return hcAxis.bg;
  }
  return null;
}
function _axisMeta(axisName){
  if(typeof TEXTS==='undefined'||!TEXTS||!TEXTS.humanCentricCards)return {color:'#111',bg:'#f8f8f8'};
  var ax=TEXTS.humanCentricCards[axisName];
  return ax?{color:ax.color||'#111',bg:ax.bg||'#f8f8f8',short:ax.short||''}:{color:'#111',bg:'#f8f8f8'};
}
function ensureInventory(){
  if(!gameState)return;
  if(!gameState.inventory)gameState.inventory={competencyCards:[]};
  if(!gameState.inventory.competencyCards)gameState.inventory.competencyCards=[];
}
function toggleInventory(force){
  var panel=document.getElementById('inv-panel');
  var bd=document.getElementById('inv-panel-backdrop');
  if(!panel)return;
  var open=(typeof force==='boolean')?force:!panel.classList.contains('open');
  if(open){
    ensureInventory();renderInventory();
    panel.classList.add('open');panel.setAttribute('aria-hidden','false');
    if(bd)bd.classList.add('open');
    var badge=document.getElementById('inv-tab-badge');
    if(badge)badge.classList.add('hidden');
  }else{
    panel.classList.remove('open');panel.setAttribute('aria-hidden','true');
    if(bd)bd.classList.remove('open');
  }
}
function _invEscapeHTML(s){
  if(s==null)return '';
  return String(s).replace(/[&<>"']/g,function(c){return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];});
}
function renderInventory(){
  ensureInventory();
  var list=document.getElementById('inv-list');
  if(!list)return;
  var emptyMsg=(typeof TEXTS!=='undefined' && TEXTS && TEXTS.ui_messages && TEXTS.ui_messages.inventory && TEXTS.ui_messages.inventory.empty)
    ||'아직 획득한 카드가 없어요.<br>시나리오 끝에 카드를 받을 수 있습니다.';
  var hc=gameState.inventory.humanCentricCards||[];
  var dc=gameState.inventory.domainCards||[];
  var gc=gameState.inventory.growthCards||[];
  var oldCards=gameState.inventory.competencyCards||[];
  var totalCards=hc.length+dc.length+gc.length+oldCards.length;
  if(totalCards===0){
    list.innerHTML='<div class="inv-empty">'+emptyMsg+'</div>';
    return;
  }
  var html='';
  // 인간중심 역량
  if(hc.length){
    html+='<div style="font-size:11px;font-weight:700;color:#888;letter-spacing:1.2px;margin-bottom:10px;padding-bottom:4px;border-bottom:1.5px solid #ddd;">'+_t('inventory_labels.section_human_centric','인간중심 역량')+'</div>';
    var axisGroups={};
    for(var i=0;i<hc.length;i++){var a=hc[i].axis||'기타';if(!axisGroups[a])axisGroups[a]=[];axisGroups[a].push(hc[i]);}
    Object.keys(axisGroups).forEach(function(axis){
      var items=axisGroups[axis];
      var am=_axisMeta(axis);
      var tagCounts={};
      for(var j=0;j<items.length;j++){var t=items[j].tag;tagCounts[t]=(tagCounts[t]||0)+1;}
      html+='<div style="margin-bottom:12px;padding:14px 12px;background:'+am.color+';border:3px solid #000;border-radius:0;">';
      html+='<div style="font-size:16px;font-weight:800;color:#fff;margin-bottom:2px;letter-spacing:0.3px;">'+_invEscapeHTML(axis)+'</div>';
      if(am.short)html+='<div style="font-size:11px;color:rgba(255,255,255,0.75);margin-bottom:10px;line-height:1.4;">'+_invEscapeHTML(am.short)+'</div>';
      Object.keys(tagCounts).forEach(function(tag){
        var td=(TEXTS&&TEXTS.humanCentricCards&&TEXTS.humanCentricCards[axis]&&TEXTS.humanCentricCards[axis].tags&&TEXTS.humanCentricCards[axis].tags[tag])||{};
        html+='<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;margin-bottom:4px;background:rgba(255,255,255,0.15);border-radius:0;">';
        html+='<span style="font-size:14px;font-weight:600;color:#fff;">'+_invEscapeHTML(tag)+'</span>';
        if(tagCounts[tag]>1)html+='<span style="font-size:12px;color:rgba(255,255,255,0.7);font-weight:700;">×'+tagCounts[tag]+'</span>';
        html+='</div>';
      });
      html+='</div>';
    });
  }
  // 도메인 역량
  if(dc.length){
    html+='<div style="font-size:13px;font-weight:700;color:#333;margin:12px 0 8px;border-bottom:1px solid #ddd;padding-bottom:4px;">'+_t('inventory_labels.section_domain','도메인 역량')+'</div>';
    var domainCounts={};
    for(var i=0;i<dc.length;i++){var l=dc[i].label;domainCounts[l]=(domainCounts[l]||0)+1;}
    Object.keys(domainCounts).sort(function(a,b){return domainCounts[b]-domainCounts[a];}).forEach(function(label){
      var td=(typeof TEXTS!=='undefined'&&TEXTS&&TEXTS.domainCards&&TEXTS.domainCards[label])||{};
      var color=td.color||'#333';
      html+='<div style="margin-bottom:6px;padding:6px 8px;background:#f4f1ea;border:3px solid #000;border-radius:0;">';
      html+='<span style="font-weight:600;">'+_invEscapeHTML(label)+'</span>';
      if(domainCounts[label]>1)html+=' <span style="color:#888;">×'+domainCounts[label]+'</span>';
      if(td.short)html+='<div style="font-size:11px;color:#888;margin-top:2px;">'+_invEscapeHTML(td.short)+'</div>';
      html+='</div>';
    });
  }
  // 성장 역량
  if(gc.length){
    html+='<div style="font-size:13px;font-weight:700;color:#333;margin:12px 0 8px;border-bottom:1px solid #ddd;padding-bottom:4px;">'+_t('inventory_labels.section_growth','성장 역량')+'</div>';
    var growthCounts={};
    for(var i=0;i<gc.length;i++){var l=gc[i].label;growthCounts[l]=(growthCounts[l]||0)+1;}
    Object.keys(growthCounts).forEach(function(label){
      var tg=(typeof TEXTS!=='undefined'&&TEXTS&&TEXTS.growthCards&&TEXTS.growthCards[label])||{};
      var color=tg.color||'#546e7a';
      html+='<div style="margin-bottom:6px;padding:6px 8px;background:#f4f1ea;border:3px solid #000;border-radius:0;">';
      html+='<span style="font-weight:600;">'+_invEscapeHTML(label)+'</span>';
      if(growthCounts[label]>1)html+=' <span style="color:#888;">×'+growthCounts[label]+'</span>';
      if(tg.short)html+='<div style="font-size:11px;color:#888;margin-top:2px;">'+_invEscapeHTML(tg.short)+'</div>';
      html+='</div>';
    });
  }
  // 레거시 (v0.8 이전 카드, 있을 때만)
  if(oldCards.length){
    html+='<div style="font-size:11px;color:#aaa;margin-top:16px;">'+_t('inventory_labels.legacy_prefix','이전 버전 카드')+' '+oldCards.length+'장</div>';
  }
  list.innerHTML=html;
}
function awardCompetencyCards(scenarioId,scenarioTitle,leafId,cards,note){
  // 데이터 적립만. 시각 reward(playCardRewardSequential)는 cut6 chain에서 호출.
  if(!cards||!cards.length)return;
  ensureInventory();
  var ts=Date.now();
  for(var i=0;i<cards.length;i++){
    gameState.inventory.competencyCards.push({label:cards[i],scenario:scenarioId,scenarioTitle:scenarioTitle||scenarioId,leaf:leafId,note:note||'',ts:ts});
  }
  saveGame();
}
// 5/3 정정(2차) — 좌표 중앙 압축. 카드 폭 220px(↓280) 기준, 화면 중앙 ~520x320px 안에 모이게.
// 가로 spacing은 카드 폭+한 호흡, 세로 spacing은 카드 높이의 1/3~1/2 수준. 별/W 패턴은 유지.
// 시간차 등장 0.18s 간격(Pop In 유지). 학생이 어느 카드부터 획득해도 OK (순서 무관).
var _CARD_REWARD_POSITIONS={
  1:[{top:'50%',left:'50%'}],
  2:[{top:'50%',left:'37%'},{top:'50%',left:'63%'}],
  3:[{top:'35%',left:'38%'},{top:'35%',left:'62%'},{top:'65%',left:'50%'}],
  4:[{top:'38%',left:'35%'},{top:'38%',left:'65%'},{top:'65%',left:'35%'},{top:'65%',left:'65%'}],
  5:[{top:'30%',left:'30%'},{top:'30%',left:'70%'},{top:'45%',left:'50%'},{top:'70%',left:'35%'},{top:'70%',left:'65%'}]
};
function playCardRewardSequential(cards,note){
  return new Promise(function(resolve){
    var overlay=document.getElementById('card-reward-overlay');
    if(!overlay||!cards||!cards.length){resolve();return;}
    overlay.classList.remove('hidden');overlay.innerHTML='';
    var n=Math.min(cards.length,5);
    var positions=_CARD_REWARD_POSITIONS[n]||_CARD_REWARD_POSITIONS[5];
    var remaining=cards.length;
    function finishAll(){
      overlay.classList.add('hidden');overlay.innerHTML='';
      var panel=document.getElementById('inv-panel');
      var badge=document.getElementById('inv-tab-badge');
      if(badge&&panel&&!panel.classList.contains('open'))badge.classList.remove('hidden');
      renderInventory();
      resolve();
    }
    function travelCard(card){
      var tab=document.getElementById('inv-tab');
      if(!tab){
        if(card.parentNode)card.parentNode.removeChild(card);
        remaining--;if(remaining<=0)finishAll();return;
      }
      var r=tab.getBoundingClientRect();
      var cr=card.getBoundingClientRect();
      var cx=cr.left+cr.width/2;
      var cy=cr.top+cr.height/2;
      var tx=r.left+r.width/2-cx;
      var ty=r.top+r.height/2-cy;
      card.style.opacity='1';
      card.style.transform='translate(-50%,-50%) scale(1) rotate(0deg)';
      card.classList.remove('appear');
      card.style.animation='none';
      void card.offsetWidth;
      card.style.transition='opacity 0.35s ease-in 0.15s, transform 0.5s cubic-bezier(0.55,0,0.85,0.3)';
      requestAnimationFrame(function(){
        card.style.transform='translate(calc(-50% + '+tx+'px), calc(-50% + '+ty+'px)) scale(0.08) rotate(540deg)';
        card.style.opacity='0';
      });
      setTimeout(function(){
        tab.style.transition='transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease';
        tab.style.transform='translateY(-50%) scale(1.15)';
        tab.style.boxShadow='-3px 3px 0 #111, 0 0 20px rgba(255,220,80,0.6)';
        setTimeout(function(){
          tab.style.transform='translateY(-50%) scale(1)';
          tab.style.boxShadow='-3px 3px 0 #111';
        },300);
      },420);
      setTimeout(function(){
        if(card.parentNode)card.parentNode.removeChild(card);
        remaining--;
        if(remaining<=0)finishAll();
      },600);
    }
    function makeCard(idx){
      var label=cards[idx];
      var color=_cardColor(label);
      var card=document.createElement('div');
      var _isGrowth=(typeof TEXTS!=='undefined'&&TEXTS&&TEXTS.growthCards&&TEXTS.growthCards[label]);
      card.className='card-reward-card'+(_isGrowth?' growth-card':'');
      var pos=positions[idx%positions.length];
      card.style.top=pos.top;
      card.style.left=pos.left;
      var btnId='card-confirm-'+idx;
      var crM=(typeof TEXTS!=='undefined' && TEXTS && TEXTS.ui_messages && TEXTS.ui_messages.card_reward) || {};
      var btnLabel=crM.btn_acquire||'확보';
      var axisPrefix=label.match(/^\[(.+?)\]\s*(.+)/);
      var isHC=!!axisPrefix;
      var shortDesc='';
      if(isHC){
        var am=_axisMeta(axisPrefix[1]);
        card.style.background=am.color;
        card.style.borderColor=am.color;
        card.style.borderLeftColor=am.color;
        card.style.boxShadow='0 4px 0 '+am.color;
        var tagData=(TEXTS&&TEXTS.humanCentricCards&&TEXTS.humanCentricCards[axisPrefix[1]]&&TEXTS.humanCentricCards[axisPrefix[1]].tags&&TEXTS.humanCentricCards[axisPrefix[1]].tags[axisPrefix[2]])||{};
        shortDesc=tagData.short||'';
        card.innerHTML='<div class="card-reward-tag" style="color:rgba(255,255,255,0.7);">'+_t('inventory_labels.track_human_centric','인간중심 역량')+'</div>'+
          '<div class="card-reward-label" style="color:#fff;"><b>'+_invEscapeHTML(axisPrefix[1])+'</b> — '+_invEscapeHTML(axisPrefix[2])+'</div>'+
          (shortDesc?'<div style="font-size:11px;color:rgba(255,255,255,0.85);line-height:1.5;margin-bottom:12px;">'+_invEscapeHTML(shortDesc)+'</div>':'')+
          '<button class="card-reward-confirm" id="'+btnId+'" style="background:rgba(255,255,255,0.95);color:'+am.color+';border-color:rgba(255,255,255,0.5);">'+_invEscapeHTML(btnLabel)+'</button>';
      }else{
        card.style.borderLeftColor=color;
        var isGrowth=(typeof TEXTS!=='undefined'&&TEXTS&&TEXTS.growthCards&&TEXTS.growthCards[label]);
        var trackName=isGrowth?_t('inventory_labels.track_growth','성장 역량'):_t('inventory_labels.track_domain','도메인 역량');
        var td=isGrowth?(TEXTS.growthCards[label]||{}):(TEXTS&&TEXTS.domainCards&&TEXTS.domainCards[label]||{});
        shortDesc=td.short||'';
        var growthSymbol=(label==='도전력')?'↑':(label==='회복력')?'↺':'';
        card.innerHTML=(growthSymbol?'<div class="growth-symbol">'+growthSymbol+'</div>':'')+
          '<div class="card-reward-tag">'+_invEscapeHTML(trackName)+'</div>'+
          '<div class="card-reward-label" style="color:'+color+'">'+_invEscapeHTML(label)+'</div>'+
          (shortDesc?'<div class="card-reward-divider"></div><div class="card-reward-note">'+_invEscapeHTML(shortDesc)+'</div>':'')+
          '<button class="card-reward-confirm" id="'+btnId+'">'+_invEscapeHTML(btnLabel)+'</button>';
      }
      overlay.appendChild(card);
      // 시간차 등장 — 0.18s 간격
      setTimeout(function(){card.classList.add('appear');},idx*180);
      var btn=document.getElementById(btnId);
      btn.onclick=function(){
        btn.disabled=true;
        travelCard(card);
      };
    }
    for(var i=0;i<cards.length;i++)makeCard(i);
  });
}

// 회복력 특별 UI — 화면 중앙, 리플레이 진입점
function showRecoveryCardModal(scid){
  return new Promise(function(resolve){
    var overlay=document.getElementById('recovery-overlay');
    if(!overlay){resolve();return;}
    overlay.classList.remove('hidden');
    var td=(typeof TEXTS!=='undefined'&&TEXTS&&TEXTS.growthCards&&TEXTS.growthCards['회복력'])||{};
    overlay.innerHTML='<div class="recovery-card">'+
      '<div class="growth-symbol">↺</div>'+
      '<div class="recovery-card-title">'+_t('recovery.title','회복력')+'</div>'+
      '<div class="recovery-card-desc">'+(td.short||'낮은 결과에서 비어 있던 과정을 알아차리고 다시 세우는 힘')+'</div>'+
      '<button class="recovery-card-btn primary" id="recovery-use-btn">'+_t('recovery.btn_use','회복역량 사용해 시간 되돌리기')+'<br><span style="font-size:12px;font-weight:400;opacity:0.8;">'+_t('recovery.btn_use_sub','시나리오 다시 도전')+'</span></button>'+
      '<button class="recovery-card-btn secondary" id="recovery-skip-btn">'+_t('recovery.btn_skip','다음 시나리오로 →')+'</button>'+
    '</div>';
    document.getElementById('recovery-use-btn').onclick=function(){
      overlay.classList.add('hidden');overlay.innerHTML='';
      replayScenario(scid);
    };
    document.getElementById('recovery-skip-btn').onclick=function(){
      overlay.classList.add('hidden');overlay.innerHTML='';
      resolve();
    };
  });
}

