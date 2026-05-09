// =====================================================
// 11. Report Generator (v0.3 — 두 역량 + 아이템)
// =====================================================
function showReport(){
  hideStats();
  trackEvent('final_report_viewed',{totalScore:gameState.totalScore,items:gameState.itemsCollected,history:gameState.scenarioHistory});
  var sc=getScenario();
  var last=gameState.scenarioHistory[gameState.scenarioHistory.length-1];
  var msg=sc.learningMessage;
  var h='<div class="report-overlay"><div class="report-inner"><h2>활동 리포트</h2>';
  h+='<div class="report-grid">';
  h+='<div class="report-stat-box"><div class="report-stat-num">'+gameState.score+'</div><div class="report-stat-label">최종 점수</div></div>';
  h+='<div class="report-stat-box"><div class="report-stat-num">'+(last?last.grade:'-')+'</div><div class="report-stat-label">등급</div></div>';
  h+='<div class="report-stat-box"><div class="report-stat-num">'+(effectiveCompetency(gameState.competencies.delegationChoice.value)>0?'+':'')+effectiveCompetency(gameState.competencies.delegationChoice.value)+'</div><div class="report-stat-label">위임 선택력</div></div>';
  h+='<div class="report-stat-box"><div class="report-stat-num">'+(effectiveCompetency(gameState.competencies.knowledge.value)>0?'+':'')+effectiveCompetency(gameState.competencies.knowledge.value)+'</div><div class="report-stat-label">지식</div></div>';
  h+='</div>';
  if(last){
    h+='<div class="report-comment"><b>너의 경로</b>: '+last.tier1+' → '+last.tier2+' → '+last.review+' ('+last.leaf+')<br><br>';
    if(last.item)h+='<b>획득 아이템</b>: '+last.item+'<br><br>';
    var fin=sc.finals[last.leaf];
    var rfb=fin?(fin.reportFeedback||fin.awareness||''):'';
    if(rfb)h+='<i>"'+rfb+'"</i><br><br>';
    h+='<b>이 시나리오의 메시지</b>: '+msg+'</div>';
  }
  // v0.5: 학기 진행 알림 + 두 버튼
  var clearedNow=(gameState.clearedScenarios||[]).slice();
  if(gameState.currentScenarioId&&clearedNow.indexOf(gameState.currentScenarioId)<0)clearedNow.push(gameState.currentScenarioId);
  var totalN=CONFIG.scenarios.length;
  var willBeAllDone=(clearedNow.length>=totalN);
  h+='<div class="report-progress" style="margin:18px 0 14px;font-size:13px;color:#444;text-align:center;">학기 진행 '+clearedNow.length+' / '+totalN+(willBeAllDone?' — 학기를 모두 통과했다':'')+'</div>';
  h+='<button class="start-btn" onclick="goNextScenario()">'+(willBeAllDone?'AI 리터러시 성장 리포트':'시나리오 선택으로')+'</button>';
  h+='</div></div>';
  container.innerHTML=h;
}

// v0.5: 학기 종합 리포트 (5 시나리오 다 끝났을 때)
// v0.5 Phase 8.13 — 결과 리포트 헬퍼

// hist 데이터(scenarioId, leaf)로 카툰 이미지 경로 산출. gameState 무관.
function getCutImageFor(scenarioId, leaf, cutNum){
  var n=({'selfintro':'01','groupwork':'02','eorinwangja':'03','career':'04','studyplan':'05'})[scenarioId]||'01';
  var base='../images/s'+n;
  var t1=leaf?leaf.charAt(0):null;
  var t2=leaf?leaf.substr(0,2):null;
  var rv=leaf?leaf.substr(2):null;
  var v=_imgCacheBust;
  if(cutNum===1)return base+'_c1.webp'+v;
  if(cutNum===2)return t1?base+'_c2_'+t1+'.webp'+v:null;
  if(cutNum===3)return t2?base+'_c3_'+t2+'.webp'+v:null;
  if(cutNum===4)return t2?base+'_c4_'+t2+'.webp'+v:null;
  if(cutNum===5)return rv?base+'_c5_'+rv+'.webp'+v:null;
  return null;
}

// 4/30 세션260 — 컷별 캡션 (코믹스트립용). hist의 r.leaf 기반, gameState 무관
// v14-slim — 컷별 캡션. finals.cartoonCaption1~5 우선, 없으면 레거시 fallback.
function getCutCaptionFor(scenarioId, leaf, cutNum){
  var sc=SCENARIOS[scenarioId]; if(!sc) return '';
  var fin=(sc.finals||{})[leaf];
  if(fin){
    var capField='cartoonCaption'+cutNum;
    if(fin[capField]) return fin[capField];
  }
  var t1=leaf?leaf.charAt(0):null;
  var t2=leaf?leaf.substr(0,2):null;
  var rv=leaf?leaf.substr(2):null;
  function _first(text){ if(!text) return ''; var m=text.match(/^[^.!?]+[.!?]/); return m?m[0].trim():text; }
  function _esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  if(cutNum===1){ return _esc(_first(sc.situation && sc.situation.text)); }
  if(cutNum===2 && t1){
    var t1arr=sc.tier1||[];
    for(var i=0;i<t1arr.length;i++){ if(t1arr[i].id===t1) return _esc(t1arr[i].label||''); }
  }
  if(cutNum===3 && t2){
    var t2arr=(sc.tier2||{})[t1]||[];
    for(var j=0;j<t2arr.length;j++){ if(t2arr[j].id===t2) return _esc(t2arr[j].label||''); }
  }
  if(cutNum===4 && t2){
    var rs=(sc.results||{})[t2];
    return rs?_esc(rs.summary||''):'';
  }
  if(cutNum===5 && rv){
    var supp=(sc.reviewSupplements||{})[leaf];
    return supp?_esc(_first(supp)):'';
  }
  return '';
}

// 위/도 4유형 분류 — 'pp'/'pn'/'np'/'nn'/'mid' (DECISIONS §10.13)
function getCompetencyType(d, k){
  var z=(typeof CONFIG.resultMidZone==='number')?CONFIG.resultMidZone:2;
  if(Math.abs(d)<=z && Math.abs(k)<=z)return 'mid';
  return (d>0?'p':'n')+(k>0?'p':'n');
}

// 5/3 — 종합 리포트용 헬퍼: scenarioHistory 한 회기에서 학생이 고른 leaf의 라벨/path 회수
function _reportLeafInfo(r){
  var sc=SCENARIOS[r.scenarioId]; if(!sc) return {path:r.leaf||'',label:''};
  var t1=r.leaf?r.leaf.charAt(0):null;
  var t2=r.leaf?r.leaf.substr(0,2):null;
  var rv=r.leaf?r.leaf.substr(2):null;
  var t1Label='',t2Label='',rvLabel='';
  if(t1&&sc.tier1){for(var i=0;i<sc.tier1.length;i++){if(sc.tier1[i].id===t1){t1Label=sc.tier1[i].label||'';break;}}}
  if(t2&&sc.tier2&&sc.tier2[t1]){var arr=sc.tier2[t1];for(var j=0;j<arr.length;j++){if(arr[j].id===t2){t2Label=arr[j].label||'';break;}}}
  if(rv&&sc.reviews){for(var k=0;k<sc.reviews.length;k++){if(sc.reviews[k].id===rv){rvLabel=sc.reviews[k].label||'';break;}}}
  // tier2 라벨이 학생이 실제 고른 행동 — 가장 의미 있는 한 줄
  return {path:r.leaf||'',t1:t1Label,t2:t2Label,rv:rvLabel,label:t2Label||t1Label||r.leaf||''};
}

// 5/3 — inventory를 시나리오ID로 그룹화 (회기별 받은 카드 리스트)
function _reportCardsByScenario(){
  var groups={};
  if(!gameState||!gameState.inventory)return groups;
  var inv=gameState.inventory;
  function add(arr,labelFn){if(!arr)return;for(var i=0;i<arr.length;i++){var c=arr[i],sid=c.scenario;if(!groups[sid])groups[sid]=[];groups[sid].push(labelFn(c));}}
  add(inv.humanCentricCards,function(c){return '['+c.axis+'] '+c.tag;});
  add(inv.domainCards,function(c){return c.label;});
  add(inv.growthCards,function(c){return c.label;});
  add(inv.competencyCards,function(c){return c.label;});
  return groups;
}

// 5/3 — 시상 panel mood 자리에 들어갈 학생 맥락 한두 줄 생성
// (CONFIG.resultMoods 등급 정형 메시지를 학생 선택+카드 관점으로 갈음)
function _reportSceneMood(r,cardsThisScene){
  var info=_reportLeafInfo(r);
  var sc=SCENARIOS[r.scenarioId];
  // leaf 보조 텍스트 — supplements > tier2 desc > review label 순으로 한 호흡
  var supp=(sc&&sc.reviewSupplements&&sc.reviewSupplements[r.leaf])||'';
  var hint=supp;
  if(!hint && sc && sc.tier2){
    var t1c=r.leaf?r.leaf.charAt(0):null;
    var t2c=r.leaf?r.leaf.substr(0,2):null;
    if(t1c&&sc.tier2[t1c]){var arr=sc.tier2[t1c];for(var i=0;i<arr.length;i++){if(arr[i].id===t2c){hint=arr[i].desc||'';break;}}}
  }
  function _esc(s){return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function _firstSent(t){if(!t)return '';var m=t.match(/^[^.!?。]+[.!?。]/);return m?m[0].trim():t;}
  var hintShort=_firstSent(hint);
  // texts.yaml — scene_mood 메시지
  var smM=(typeof TEXTS!=='undefined' && TEXTS && TEXTS.ui_messages && TEXTS.ui_messages.scene_mood) || {};
  if(cardsThisScene && cardsThisScene.length){
    // 중복 제거 + 최대 2장 노출
    var seen={},uniq=[];
    for(var k=0;k<cardsThisScene.length;k++){if(!seen[cardsThisScene[k]]){seen[cardsThisScene[k]]=1;uniq.push(cardsThisScene[k]);}}
    var labelsHTML=uniq.slice(0,2).map(function(l){return '<b>'+_esc(l)+'</b>';}).join(', ');
    var msg;
    if(uniq.length>2){
      var tplM=smM.received_more||'이번 회기에 {cards} 외 {extra}장 카드를 얻었다.';
      msg=tplM.replace(/\{cards\}/g,labelsHTML).replace(/\{extra\}/g,(uniq.length-2));
    }else{
      var tplO=smM.received_one_or_two||'이번 회기에 {cards} 카드를 얻었다.';
      msg=tplO.replace(/\{cards\}/g,labelsHTML);
    }
    return msg+(hintShort?'<br>'+_esc(hintShort):'');
  }
  var nrMsg=smM.not_received||'이번 회기는 카드를 받지 못했다.';
  return nrMsg+(hintShort?'<br>'+_esc(hintShort):'');
}

// 5/3 — 학기 종합 리포트 narrative (compType + 카드 누적 + tier1 분포)
// 학생이 자기 결과를 한 호흡에 읽고 패턴을 인식하도록.
// 텍스트는 texts.yaml로 분리 (TEXTS.cards[label].short / TEXTS.narrative.types / TEXTS.narrative.tier1_patterns).
function _reportAllCards(){
  if(!gameState||!gameState.inventory)return [];
  var inv=gameState.inventory,all=[];
  if(inv.humanCentricCards)for(var i=0;i<inv.humanCentricCards.length;i++){var c=inv.humanCentricCards[i];all.push({label:'['+c.axis+'] '+c.tag,scenario:c.scenario,track:'human'});}
  if(inv.domainCards)for(var j=0;j<inv.domainCards.length;j++){var d=inv.domainCards[j];all.push({label:d.label,scenario:d.scenario,track:'domain'});}
  if(inv.growthCards)for(var k=0;k<inv.growthCards.length;k++){var g=inv.growthCards[k];all.push({label:g.label,scenario:g.scenario,track:'growth'});}
  if(inv.competencyCards)for(var l=0;l<inv.competencyCards.length;l++){var o=inv.competencyCards[l];all.push({label:o.label,scenario:o.scenario,scenarioTitle:o.scenarioTitle,track:'legacy'});}
  return all;
}
var _COMMON_CARDS={'검수능력':1,'자기검증':1,'자기성찰':1,'비판적 사고':1};
function _cardShort(label){
  // texts.yaml의 cards[label].short — narrative 카드 인사이트 한 줄
  var c=(typeof TEXTS!=='undefined' && TEXTS && TEXTS.cards && TEXTS.cards[label]);
  return (c && c.short) || '';
}
function _typeLabel(t){
  var n=(typeof TEXTS!=='undefined' && TEXTS && TEXTS.narrative && TEXTS.narrative.types && TEXTS.narrative.types[t]);
  return (n && n.label) || (t==='mid'?'In-Between':t);
}
function _typeText(t){
  var n=(typeof TEXTS!=='undefined' && TEXTS && TEXTS.narrative && TEXTS.narrative.types && TEXTS.narrative.types[t]);
  if(n && n.text)return n.text;
  var mid=(typeof TEXTS!=='undefined' && TEXTS && TEXTS.narrative && TEXTS.narrative.types && TEXTS.narrative.types['mid']);
  return (mid && mid.text) || '';
}
function _reportNarrative(compType,inventory,history){
  function _esc(s){return (s==null?'':String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  // texts.yaml에서 narrative 텍스트 회수 (fallback 안전 가드 포함)
  var N=(typeof TEXTS!=='undefined' && TEXTS && TEXTS.narrative) || {};
  var titles=(N.section_titles)||{};
  var t1pat=(N.tier1_patterns)||{};
  var cdist=(N.card_distribution)||{};
  var noCards=(N.no_cards)||{};
  var html='';
  // (1) 4유형 패턴 narrative — 라벨 큰 글씨 한 줄 + 본문 단락 + 사이 여백 (5/3 정정)
  var typeName=_typeLabel(compType);
  var typeText=_typeText(compType);
  html+='<div class="report-narrative-block">';
  html+='<div class="report-narrative-title">'+_esc(titles.type||'학습자 패턴')+'</div>';
  html+='<div class="report-narrative-cardtype">'+_esc(typeName)+'</div>';
  html+='<div class="report-narrative-body">'+typeText+'</div>';
  html+='</div>';

  // (2) 카드 누적 인사이트 — v0.8 3트랙 통합
  var cards=_reportAllCards();
  var humanCount=0,domainCount=0,growthCount=0;
  var groupCounts={};
  for(var i=0;i<cards.length;i++){
    var lbl=cards[i].label;
    groupCounts[lbl]=(groupCounts[lbl]||0)+1;
    if(cards[i].track==='human')humanCount++;
    else if(cards[i].track==='domain')domainCount++;
    else if(cards[i].track==='growth')growthCount++;
  }
  var labels=Object.keys(groupCounts).sort(function(a,b){return groupCounts[b]-groupCounts[a];});
  var top=labels.slice(0,3);
  var cardsByScene={};
  if(history)for(var k=0;k<history.length;k++){cardsByScene[history[k].scenarioId]=0;}
  for(var ci=0;ci<cards.length;ci++){var sid=cards[ci].scenario;if(sid in cardsByScene)cardsByScene[sid]++;}
  var zeroScenes=[];
  if(history)for(var hi=0;hi<history.length;hi++){
    var r=history[hi];
    if((cardsByScene[r.scenarioId]||0)===0){
      var sc=SCENARIOS[r.scenarioId];
      zeroScenes.push(sc?sc.title:r.scenarioId);
    }
  }
  html+='<div class="report-narrative-block">';
  html+='<div class="report-narrative-title">'+_esc(titles.cards||'카드 누적 인사이트')+'</div>';
  html+='<div class="report-narrative-body">';
  if(cards.length===0){
    html+='<div class="narrative-line">'+(noCards.title||'이번 학기는 카드를 한 장도 받지 못했다.')+'</div>';
    html+='<div class="narrative-line">'+(noCards.body||'시나리오 후반부의 leaf 선택이 카드 보상과 연결되어 있다 — 다음 학기에는 자기 선택이 어떤 카드로 이어지는지 의식해 보자.')+'</div>';
  }else{
    // 동률 감지 — 모든 카드가 같은 수이면 별도 메시지
    var allSameCount=true;
    var firstCount=groupCounts[labels[0]]||0;
    for(var qi=1;qi<labels.length;qi++){if(groupCounts[labels[qi]]!==firstCount){allSameCount=false;break;}}
    if(allSameCount&&labels.length>1){
      html+='<div class="narrative-line">이번 학기에는 다양한 역량을 고르게 획득했습니다. 총 '+labels.length+'종 카드, 각 '+firstCount+'장.</div>';
    }else{
      if(top[0]){
        html+='<div class="narrative-line">가장 많이 받은 카드: <b>'+_esc(top[0])+'</b> '+groupCounts[top[0]]+'장</div>';
      }
      if(top.length>=2){
        var nextLine='다음: <b>'+_esc(top[1])+'</b> '+groupCounts[top[1]]+'장';
        if(top.length>=3){
          nextLine+=' / <b>'+_esc(top[2])+'</b> '+groupCounts[top[2]]+'장';
        }
        html+='<div class="narrative-line">'+nextLine+'</div>';
      }
    }
    // 카드별 해석 — 각 top 카드 한 줄씩 (texts.yaml cards[label].short)
    for(var ti=0;ti<top.length;ti++){
      var l=top[ti];
      var insight=_cardShort(l);
      if(insight){
        html+='<div class="narrative-line"><b>'+_esc(l)+'</b>은(는) '+_esc(insight)+'.</div>';
      }
    }
    if(humanCount+domainCount>0){
      var balKey;
      if(humanCount>=domainCount*1.5)balKey='human_centric_dominant';
      else if(domainCount>=humanCount*1.5)balKey='domain_dominant';
      else balKey='balanced';
      var balTpl=cdist[balKey] ||
        (balKey==='human_centric_dominant'?'인간중심 카드 {humanCentric}장 / 도메인 카드 {domain}장 — <b>자기 기준과 사고력</b>이 학기 통틀어 자랐다.':
         balKey==='domain_dominant'?'인간중심 카드 {humanCentric}장 / 도메인 카드 {domain}장 — <b>실제 행동 역량</b>에서 깊은 카드가 쌓였다.':
         '인간중심 카드 {humanCentric}장 / 도메인 카드 {domain}장 — 사고력과 행동 역량이 균형 있게 쌓였다.');
      var balLine=balTpl.replace(/\{humanCentric\}/g,humanCount).replace(/\{domain\}/g,domainCount);
      html+='<div class="narrative-line">'+balLine+'</div>';
    }
    if(growthCount>0){
      html+='<div class="narrative-line">성장 카드 '+growthCount+'장 — 실패에서 배우고 다시 도전한 흔적.</div>';
    }
    // 0장 회기 — 한 줄
    if(zeroScenes.length>0){
      var zeroTpl=N.zero_card_scenes||'<b>{scenarios}</b> 회기에서는 카드를 받지 못했다 — 다음 학기 도전 포인트.';
      html+='<div class="narrative-line">'+zeroTpl.replace(/\{scenarios\}/g,_esc(zeroScenes.join(', ')))+'</div>';
    }
  }
  html+='</div></div>';

  // (3) 학생 선택 패턴 (tier1 분포) — 분포 한 줄 + 해석 한 줄 (5/3 정정)
  if(history && history.length>0){
    var tier1Counts={A:0,B:0,C:0};
    for(var hi2=0;hi2<history.length;hi2++){
      var t=history[hi2].tier1;
      if(t && tier1Counts.hasOwnProperty(t))tier1Counts[t]++;
    }
    var maxT=Math.max(tier1Counts.A,tier1Counts.B,tier1Counts.C);
    var totalT=tier1Counts.A+tier1Counts.B+tier1Counts.C;
    var distLine='';
    var interpLine='';
    function _patternFor(key){
      var p=t1pat[key]||{};
      return {pattern:p.pattern||'', interpretation:p.interpretation||''};
    }
    function _distLine(patKey){
      var p=_patternFor(patKey);
      return totalT+' 시나리오 중 <b>'+_esc(p.pattern)+'</b> (A '+tier1Counts.A+'·B '+tier1Counts.B+'·C '+tier1Counts.C+').';
    }
    if(totalT===0){
      var nd=t1pat.no_data||{};
      distLine=nd.distribution||'1차 선택 데이터가 없다.';
      interpLine=nd.interpretation||'패턴을 보기 어렵다.';
    }else if(tier1Counts.A===tier1Counts.B && tier1Counts.B===tier1Counts.C){
      distLine=_distLine('balanced');
      interpLine=_patternFor('balanced').interpretation;
    }else if(tier1Counts.A===maxT && tier1Counts.B<maxT && tier1Counts.C<maxT){
      distLine=_distLine('A_dominant');
      interpLine=_patternFor('A_dominant').interpretation;
    }else if(tier1Counts.B===maxT && tier1Counts.A<maxT && tier1Counts.C<maxT){
      distLine=_distLine('B_dominant');
      interpLine=_patternFor('B_dominant').interpretation;
    }else if(tier1Counts.C===maxT && tier1Counts.A<maxT && tier1Counts.B<maxT){
      distLine=_distLine('C_dominant');
      interpLine=_patternFor('C_dominant').interpretation;
    }else{
      distLine=_distLine('mixed');
      interpLine=_patternFor('mixed').interpretation;
    }
    html+='<div class="report-narrative-block">';
    html+='<div class="report-narrative-title">'+_esc(titles.tier1||'학생 선택 패턴')+'</div>';
    html+='<div class="report-narrative-body">';
    html+='<div class="narrative-line">'+distLine+'</div>';
    html+='<div class="narrative-line">'+interpLine+'</div>';
    html+='</div></div>';
  }

  return '<div class="report-narrative">'+html+'</div>';
}

function showFinalReport(){
  hideStats();
  var invTab=document.getElementById('inv-tab');if(invTab)invTab.style.display='none';
  var debugBtn=document.querySelector('.debug-toggle');if(debugBtn)debugBtn.style.display='none';
  var verLabel=document.getElementById('version-label');if(verLabel)verLabel.style.display='none';
  trackEvent('semester_report_viewed',{totalScore:gameState.totalScore,history:gameState.scenarioHistory,level:gameState.exp.level,cards:_reportAllCards().map(function(c){return c.label;}),items:gameState.itemsCollected});
  var hist=gameState.scenarioHistory||[];
  var totalScore=hist.reduce(function(s,r){return s+(r.finalScore||0);},0);
  var lv=gameState.exp.level;
  var dv=gameState.competencies.delegationChoice.value;
  var kv=gameState.competencies.knowledge.value;
  var compType=getCompetencyType(dv,kv);
  var compText=(CONFIG.resultTextsByType||{})[compType]||'';
  function _esc(s){return (s==null?'':String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

  // texts.yaml — report 섹션 텍스트
  var R=(typeof TEXTS!=='undefined' && TEXTS && TEXTS.report) || {};
  var statL=R.stat_labels||{};
  var cardsSec=R.cards_section||{};
  var dvE=effectiveCompetency(dv);
  var kvE=effectiveCompetency(kv);

  var h='<div class="report-overlay"><div class="report-inner report-v813">';
  h+='<div style="display:flex;align-items:center;min-height:56px;padding:0 22px;margin-bottom:24px;background:var(--acc-yellow);border:var(--border-w) solid var(--ink);box-shadow:var(--shadow);font-size:20px;font-weight:700;letter-spacing:1px;">AI 리터러시 성장 리포트</div>';
  h+='<div class="report-subtitle">한 학기 동안 다섯 시나리오에서 내린 선택과 그 결과를 돌아봅니다.<br>AI에게 무엇을 맡기고 무엇을 직접 했는지, 어떤 역량이 자랐는지 확인하세요.</div>';

  // 상단: 4박스 통계 (총점 + 레벨 + 판단하는 힘 + 아는것의 힘)
  h+='<div class="report-grid" style="grid-template-columns:repeat(4,1fr);max-width:600px;margin:0 auto 16px;">';
  h+='<div class="report-stat-box"><div class="report-stat-num">'+totalScore+'</div><div class="report-stat-label">학기 총점</div></div>';
  h+='<div class="report-stat-box"><div class="report-stat-num">Lv.'+lv+'</div><div class="report-stat-label">최종 레벨</div></div>';
  h+='<div class="report-stat-box"><div class="report-stat-num" style="color:'+(dvE>=0?'var(--acc-mint-deep)':'var(--acc-pink-deep)')+'">'+(dvE>0?'+':'')+dvE+'</div><div class="report-stat-label">판단하는 힘</div></div>';
  h+='<div class="report-stat-box"><div class="report-stat-num" style="color:'+(kvE>=0?'var(--acc-mint-deep)':'var(--acc-pink-deep)')+'">'+(kvE>0?'+':'')+kvE+'</div><div class="report-stat-label">아는것의 힘</div></div>';
  h+='</div>';

  ensureInventory();

  var allCards=_reportAllCards();
  var ownedHC={};
  var inv=gameState.inventory||{};
  if(inv.humanCentricCards){
    for(var hi=0;hi<inv.humanCentricCards.length;hi++){
      var hc=inv.humanCentricCards[hi];
      ownedHC[hc.axis+'::'+hc.tag]=true;
    }
  }
  var ownedDomain={};
  if(inv.domainCards){
    for(var di2=0;di2<inv.domainCards.length;di2++){
      ownedDomain[inv.domainCards[di2].label]=true;
    }
  }

  var HC_ALL=[
    {axis:'중심잡기',tags:['주체성','적응성','호기심']},
    {axis:'융합하기',tags:['창의적 사고','문제해결적 사고','직관적 통찰','통합적 사고','맥락적 사고']},
    {axis:'성찰하기',tags:['비판적 사고','윤리적 사고','성찰적 사고','사회·관계적 사고']}
  ];
  var hcFlat=[];
  for(var ai=0;ai<HC_ALL.length;ai++){
    for(var ti=0;ti<HC_ALL[ai].tags.length;ti++){
      hcFlat.push({axis:HC_ALL[ai].axis,tag:HC_ALL[ai].tags[ti]});
    }
  }
  var hcOwned=0;
  for(var oi=0;oi<hcFlat.length;oi++){if(ownedHC[hcFlat[oi].axis+'::'+hcFlat[oi].tag])hcOwned++;}

  h+='<div class="report-cards-section" style="border:var(--border-w) solid var(--ink);background:var(--bg-card);box-shadow:var(--shadow);padding:0 0 20px;margin-bottom:20px;">';
  h+='<div style="display:flex;align-items:center;justify-content:space-between;min-height:44px;padding:0 16px;background:var(--acc-mint);border-bottom:var(--border-w) solid var(--ink);font-size:16px;font-weight:700;">판단하는 힘 — 인간중심 역량 카드<span style="font-size:13px;font-weight:600;color:var(--ink-mute);">'+hcOwned+' / '+hcFlat.length+'</span></div>';
  h+='<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:10px;padding:14px 16px;">';
  for(var ci=0;ci<hcFlat.length;ci++){
    var card=hcFlat[ci];
    var owned=!!ownedHC[card.axis+'::'+card.tag];
    var am=_axisMeta(card.axis);
    if(owned){
      h+='<div style="border:var(--border-w) solid var(--ink);background:'+am.bg+';padding:10px 6px;text-align:center;box-shadow:var(--shadow);">';
      h+='<div style="font-size:15px;font-weight:600;color:'+am.color+';margin-bottom:3px;">'+_esc(card.axis)+'</div>';
      h+='<div style="font-size:13px;font-weight:700;color:var(--ink);">'+_esc(card.tag)+'</div>';
      h+='</div>';
    }else{
      h+='<div style="border:2px dashed #ccc;background:transparent;padding:10px 6px;text-align:center;">';
      h+='<div style="font-size:15px;font-weight:600;color:#bbb;margin-bottom:3px;">'+_esc(card.axis)+'</div>';
      h+='<div style="font-size:12px;color:#bbb;">'+_esc(card.tag)+'</div>';
      h+='</div>';
    }
  }
  h+='</div>';

  var DOM_ALL=['자기이해','표현력','문해력','분석력','검토력','자료판단력','소통력','협업력','학습력','탐색력'];
  var domOwned=[];
  for(var dj=0;dj<DOM_ALL.length;dj++){if(ownedDomain[DOM_ALL[dj]])domOwned.push(DOM_ALL[dj]);}

  h+='</div>';
  h+='<div class="report-cards-section" style="border:var(--border-w) solid var(--ink);background:var(--bg-card);box-shadow:var(--shadow);padding:0 0 20px;margin-bottom:20px;">';
  h+='<div style="display:flex;align-items:center;justify-content:space-between;min-height:44px;padding:0 16px;background:var(--acc-cyan);border-bottom:var(--border-w) solid var(--ink);font-size:16px;font-weight:700;">아는것의 힘 — 도메인 역량 카드<span style="font-size:13px;font-weight:600;color:var(--ink-mute);">'+domOwned.length+'장</span></div>';
  if(domOwned.length===0){
    h+='<div style="font-size:13px;color:#888;padding:14px 16px;">이번 학기는 도메인 역량 카드를 받지 못했어요.</div>';
  }else{
    h+='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding:14px 16px;">';
    for(var dk=0;dk<domOwned.length;dk++){
      var dlbl=domOwned[dk];
      var dc=(typeof TEXTS!=='undefined'&&TEXTS&&TEXTS.domainCards)?TEXTS.domainCards[dlbl]:null;
      var dcolor=(dc&&dc.color)||'var(--ink)';
      h+='<div style="border:var(--border-w) solid var(--ink);background:var(--bg-card);padding:12px 8px;text-align:center;box-shadow:var(--shadow);">';
      h+='<div style="font-size:14px;font-weight:700;color:'+dcolor+';">'+_esc(dlbl)+'</div>';
      if(dc&&dc.short)h+='<div style="font-size:11px;color:var(--ink-soft);margin-top:4px;line-height:1.4;">'+_esc(dc.short)+'</div>';
      h+='</div>';
    }
    h+='</div>';
  }
  h+='</div>';

  // §18: 성장 리포트 통합 — 학습자 유형 + 카드 분포 + 선택 패턴 + 강점/보완/약속
  h+=_renderGrowthReport(hist, compType, gameState.inventory||{});

  // 회기별 카드 그룹
  var cardsByScene=_reportCardsByScenario();

  // 하단: 시나리오별 카툰
  h+='<div class="report-comic">';
  var sceneColors=['var(--acc-cyan)','var(--acc-mint)','var(--acc-yellow)','var(--acc-pink-soft)','var(--acc-cyan-soft)'];
  hist.forEach(function(r,i){
    var sc=SCENARIOS[r.scenarioId];
    var grade=r.grade||'D';
    var fin=(sc&&sc.finals)?sc.finals[r.leaf]:null;
    var accentColor=sceneColors[i%sceneColors.length];

    h+='<div style="margin-bottom:24px;border:var(--border-w) solid var(--ink);background:var(--bg-card);box-shadow:var(--shadow);overflow:hidden;">';
    h+='<div style="display:flex;align-items:center;justify-content:space-between;padding:0 16px;min-height:42px;background:'+accentColor+';border-bottom:var(--border-w) solid var(--ink);font-size:15px;font-weight:700;">';
    h+='<span>'+(i+1)+'. '+_esc(sc?sc.title:r.scenarioId)+'</span>';
    h+='<span>'+r.finalScore+'점 · '+grade+'</span>';
    h+='</div>';

    var reflection=(fin&&fin.reportReflection)||'';
    if(reflection){
      h+='<div style="margin:10px 14px 4px;padding:8px 12px;background:var(--bg-soft);border:2px solid var(--ink);font-size:12px;line-height:1.6;color:var(--ink-mute);">';
      h+='<b>핵심 돌아보기</b> — '+_esc(reflection);
      h+='</div>';
    }

    h+='<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;padding:10px 14px 14px;">';
    for(var c=1;c<=5;c++){
      var src=getCutImageFor(r.scenarioId, r.leaf, c);
      var cap=getCutCaptionFor(r.scenarioId, r.leaf, c);
      h+='<div>';
      if(src)h+='<div style="aspect-ratio:1/1;position:relative;overflow:hidden;border:2px solid var(--ink);"><img src="'+src+'" alt="컷'+c+'" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;" onerror="this.style.display=\'none\'"><div style="position:absolute;inset:0;box-shadow:inset 0 0 0 5px #fff,inset 0 0 0 6px var(--ink);pointer-events:none;"></div></div>';
      if(cap)h+='<div style="font-family:var(--font-hand);font-size:16px;line-height:1.3;color:var(--ink-mute);margin-top:4px;word-break:keep-all;">'+cap+'</div>';
      h+='</div>';
    }
    h+='</div>';
    h+='</div>';
  });
  h+='</div>';

  h+='<button class="start-btn" onclick="backToStartScreen()">시작 화면 돌아가기</button>';
  h+='</div></div>';
  container.innerHTML=h;
}

function _renderGrowthReport(hist, compType, inventory){
  var GR=(typeof TEXTS!=='undefined'&&TEXTS&&TEXTS.growthReport)||{};
  var N=(typeof TEXTS!=='undefined'&&TEXTS&&TEXTS.narrative)||{};
  function _esc(s){return (s==null?'':String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

  // 패턴 판정
  var t1Counts={A:0,B:0,C:0},rvCounts={R1:0,R2:0,R3:0},grCounts={S:0,A:0,B:0,C:0,D:0};
  var total=hist.length||1;
  for(var i=0;i<hist.length;i++){
    var t1=hist[i].tier1;if(t1&&t1Counts.hasOwnProperty(t1))t1Counts[t1]++;
    var rv=hist[i].review||'';if(rv&&rvCounts.hasOwnProperty(rv))rvCounts[rv]++;
    var gr=hist[i].grade||'D';if(grCounts.hasOwnProperty(gr))grCounts[gr]++;
  }
  var pattern='selfStart';
  if((grCounts.C+grCounts.D)/total>0.6)pattern='recoveryNeeded';
  else if(rvCounts.R1/total>0.6)pattern='reviewWeak';
  else if((t1Counts.B+t1Counts.C)/total>0.6)pattern='aiHeavy';
  else if((rvCounts.R2+rvCounts.R3)/total>0.6)pattern='reviewStrong';
  else if(t1Counts.A/total>0.6)pattern='selfStart';

  var h='<div class="report-growth" style="margin:28px 0 20px;padding:22px 20px;background:var(--bg-card);border:var(--border-w) solid var(--ink);box-shadow:var(--shadow);">';

  // (5) 학습자 유형 + 패턴 요약 — 하나의 박스
  var typeName=_typeLabel(compType);
  var typeText=_typeText(compType);
  var patText=(GR.patterns||{})[pattern]||'';
  h+='<div style="margin-bottom:20px;padding:16px 18px;background:var(--bg-soft);border:var(--border-w) solid var(--ink);">';
  h+='<div style="font-size:11px;color:var(--ink-soft);font-weight:700;letter-spacing:1.5px;margin-bottom:4px;">학습자 유형</div>';
  h+='<div style="font-size:18px;font-weight:800;margin-bottom:8px;">'+_esc(typeName)+'</div>';
  if(typeText)h+='<div style="font-size:13px;line-height:1.7;color:var(--ink-mute);margin-bottom:8px;">'+typeText+'</div>';
  if(patText)h+='<div style="font-size:13px;line-height:1.7;color:var(--ink-mute);">'+_esc(patText)+'</div>';
  h+='</div>';

  // (6) 시나리오별 선택 경로 + 결과 메시지
  h+='<div style="margin-bottom:20px;">';
  h+='<div style="font-size:16px;font-weight:700;margin-bottom:12px;">시나리오별 결과</div>';
  for(var j=0;j<hist.length;j++){
    var r=hist[j];
    var sc=SCENARIOS[r.scenarioId];
    var fin=(sc&&sc.finals)?sc.finals[r.leaf]:null;
    var scTitle=(sc&&sc.title)||r.scenarioId;
    var info=_reportLeafInfo(r);
    var feedback=fin?(fin.shortFeedback||fin.reportFeedback||fin.awareness||''):'';
    var gradeColor=({S:'var(--acc-mint-deep)',A:'var(--acc-mint-deep)',B:'var(--ink)',C:'var(--acc-yellow-deep)',D:'var(--acc-pink-deep)'})[r.grade]||'var(--ink)';
    h+='<div style="margin-bottom:10px;padding:12px 14px;border:2px solid var(--ink);background:var(--bg-card);box-shadow:3px 3px 0 var(--ink);">';
    h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">';
    h+='<span style="font-size:14px;font-weight:700;">'+_esc(scTitle)+'</span>';
    h+='<span style="font-size:14px;font-weight:700;color:'+gradeColor+';">'+r.finalScore+'점 · '+(r.grade||'')+'</span>';
    h+='</div>';
    h+='<div style="font-size:12px;color:var(--ink-soft);margin-bottom:4px;">'+_esc(info.t1)+' → '+_esc(info.t2)+' → '+_esc(info.rv)+'</div>';
    if(feedback)h+='<div style="font-size:13px;line-height:1.6;color:var(--ink-mute);">'+feedback+'</div>';
    h+='</div>';
  }
  h+='</div>';

  // (9) 회복력 / 도전력
  var allCards=_reportAllCards();
  var hasRecovery=false,hasChallengeCard=false;
  for(var gc=0;gc<allCards.length;gc++){
    if(allCards[gc].label==='회복력')hasRecovery=true;
    if(allCards[gc].label==='도전력')hasChallengeCard=true;
  }
  if(hasRecovery||hasChallengeCard){
    h+='<div style="margin-bottom:20px;padding:14px 16px;background:var(--acc-yellow-soft);border:var(--border-w) solid var(--ink);box-shadow:var(--shadow);">';
    h+='<div style="font-size:15px;font-weight:700;margin-bottom:8px;">성장 카드</div>';
    if(hasRecovery){
      h+='<div style="font-size:13px;line-height:1.7;color:var(--ink-mute);margin-bottom:6px;">';
      h+='<b>회복력</b> — 결과가 아쉬웠지만 포기하지 않았다. 다시 도전할 수 있는 힘이 생겼다.';
      h+='</div>';
    }
    if(hasChallengeCard){
      h+='<div style="font-size:13px;line-height:1.7;color:var(--ink-mute);">';
      h+='<b>도전력</b> — 같은 시나리오에 다시 도전해서 더 나은 결과를 만들었다. 실패에서 배우는 힘이다.';
      h+='</div>';
    }
    h+='</div>';
  }

  h+='</div>';
  return h;
}

