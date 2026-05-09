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
  h+='<button class="start-btn" onclick="goNextScenario()">'+(willBeAllDone?'학기 종합 리포트 보기':'시나리오 선택으로')+'</button>';
  h+='<button class="start-btn secondary" onclick="resetGame()">학기 처음부터</button>';
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
    // top1 — 한 줄
    if(top[0]){
      html+='<div class="narrative-line">가장 많이 받은 카드: <b>'+_esc(top[0])+'</b> '+groupCounts[top[0]]+'장</div>';
    }
    // top2/top3 — 한 줄
    if(top.length>=2){
      var nextLine='다음 많이 받은 카드: <b>'+_esc(top[1])+'</b> '+groupCounts[top[1]]+'장';
      if(top.length>=3){
        nextLine+=' / <b>'+_esc(top[2])+'</b> '+groupCounts[top[2]]+'장';
      }
      html+='<div class="narrative-line">'+nextLine+'</div>';
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
  var h='<div class="report-overlay"><div class="report-inner report-v813">';
  h+='<h2>'+_esc(R.title||'한 학기 활동 리포트')+'</h2>';
  h+='<div class="report-subtitle">'+(R.subtitle||'자기소개 → 모둠 발표 → 어린왕자 → 진로 → 시험 공부<br>다섯 결정이 한 학생의 한 학기를 만들었다.')+'</div>';

  // 상단: 2박스 통계 (총점 + 레벨만, §18)
  h+='<div class="report-grid" style="grid-template-columns:1fr 1fr;max-width:320px;margin:0 auto 16px;">';
  h+='<div class="report-stat-box"><div class="report-stat-num">'+totalScore+'</div><div class="report-stat-label">'+_esc(statL.total||'학기 총점')+'</div></div>';
  h+='<div class="report-stat-box"><div class="report-stat-num">Lv.'+lv+'</div><div class="report-stat-label">'+_esc(statL.level||'최종 레벨')+'</div></div>';
  h+='</div>';

  ensureInventory();

  // 카드 누적 리뷰 섹션 — v0.8 3트랙 통합
  var allCards=_reportAllCards();
  var totalCardCount=allCards.length;
  h+='<div class="report-cards-section">';
  var cardsTitleTpl=cardsSec.title||'한 학기 동안 모은 역량 카드 — 총 {N}장';
  h+='<div class="report-cards-title">'+cardsTitleTpl.replace(/\{N\}/g,totalCardCount)+'</div>';
  if(totalCardCount===0){
    h+='<div class="report-cards-empty">'+_esc(cardsSec.empty||'이번 학기는 역량 카드를 받지 못했어요. 다시 도전!')+'</div>';
  }else{
    // 라벨로 그룹화 + 회기 출처 회수 (renderInventory와 동일 패턴)
    var cardGroups={};
    for(var ci=0;ci<allCards.length;ci++){
      var cc=allCards[ci];
      if(!cardGroups[cc.label])cardGroups[cc.label]={count:0,sources:[]};
      cardGroups[cc.label].count++;
      var scObj=SCENARIOS[cc.scenario];
      var stitle=(scObj&&scObj.title)||cc.scenarioTitle||cc.scenario||'';
      cardGroups[cc.label].sources.push(stitle);
    }
    h+='<div class="report-cards-grid">';
    Object.keys(cardGroups).sort(function(a,b){
      return cardGroups[b].count - cardGroups[a].count || a.localeCompare(b,'ko');
    }).forEach(function(label){
      var g=cardGroups[label];
      var color=_cardColor(label);
      var bg=_cardBg(label);
      var seen={},uniqSrc=[];
      for(var si=0;si<g.sources.length;si++){var s=g.sources[si];if(!seen[s]){seen[s]=1;uniqSrc.push(s);}}
      var axisMatch=label.match(/^\[(.+?)\]\s*(.+)/);
      var rowBg=bg?'background:'+bg+';':'';
      var rowBorder=bg?'border:1.5px solid rgba(0,0,0,0.06);':'';
      h+='<div class="report-card-row" style="'+rowBg+rowBorder+'">';
      h+='<div class="report-card-row-head">';
      h+='<span class="report-card-count" style="background:'+color+'">x'+g.count+'</span>';
      if(axisMatch){
        h+='<span class="report-card-label"><span style="font-size:10px;color:'+(_axisMeta(axisMatch[1]).color||'#888')+';font-weight:700;display:block;margin-bottom:1px;">'+_esc(axisMatch[1])+'</span>'+_esc(axisMatch[2])+'</span>';
      }else{
        h+='<span class="report-card-label">'+_esc(label)+'</span>';
      }
      h+='</div>';
      h+='<div class="report-card-source">'+_esc(uniqSrc.join(', '))+'</div>';
      h+='</div>';
    });
    h+='</div>';
  }
  h+='</div>';

  // §18: 성장 리포트 통합 — 학습자 유형 + 카드 분포 + 선택 패턴 + 강점/보완/약속
  h+=_renderGrowthReport(hist, compType, gameState.inventory||{});

  // 회기별 카드 그룹
  var cardsByScene=_reportCardsByScenario();

  // 하단: 시나리오별 카툰 6컷 시리얼 (위→아래)
  h+='<div class="report-comic">';
  hist.forEach(function(r,i){
    var sc=SCENARIOS[r.scenarioId];
    var grade=r.grade||'D';
    var gradeLow=grade.toLowerCase();
    var fin=(sc&&sc.finals)?sc.finals[r.leaf]:null;

    h+='<div class="comic-scene">';
    h+='<div class="comic-scene-title">'+(i+1)+'. '+_esc(sc?sc.title:r.scenarioId)+' <span class="comic-scene-meta">'+r.finalScore+'점 · '+grade+'등급</span></div>';
    var pathSummary=(fin&&fin.reportPathSummary)||'';
    if(pathSummary){
      h+='<div class="comic-scene-path" style="font-size:13px;color:#555;margin:4px 0 8px;">'+_esc(pathSummary)+'</div>';
    }
    h+='<div class="comic-strip">';
    for(var c=1;c<=5;c++){
      var src=getCutImageFor(r.scenarioId, r.leaf, c);
      var cap=getCutCaptionFor(r.scenarioId, r.leaf, c);
      h+='<div class="comic-panel">';
      if(src)h+='<img class="comic-cut" src="'+src+'" alt="컷'+c+'" onerror="this.style.display=\'none\'">';
      if(cap)h+='<div class="comic-caption">'+cap+'</div>';
      h+='</div>';
    }
    h+='<div class="comic-panel comic-panel-prize">';
    h+='<img class="comic-cut comic-prize" src="../scenario_results/scenario_result__'+gradeLow+'.png" alt="'+grade+' 시상" onerror="this.style.display=\'none\'">';
    h+='</div>';
    h+='</div>';
    var reflection=(fin&&fin.reportReflection)||'';
    var cardSummary=(fin&&fin.reportCardSummary)||'';
    if(reflection||cardSummary){
      h+='<div class="comic-scene-footer" style="margin:8px 0 16px;padding:10px 12px;background:#f4f1ea;border:3px solid #000;border-radius:0;font-size:13px;line-height:1.6;">';
      if(reflection)h+='<div style="margin-bottom:4px;"><b>핵심 돌아보기</b><br>'+_esc(reflection)+'</div>';
      if(cardSummary&&cardSummary!=='없음')h+='<div style="color:#666;">카드: '+_esc(cardSummary)+'</div>';
      h+='</div>';
    }
    h+='</div>';
  });
  h+='</div>';

  h+='<button class="start-btn" onclick="resetGame()">'+_esc(R.btn_restart||'학기 처음부터')+'</button>';
  h+='</div></div>';
  container.innerHTML=h;
}

function _renderGrowthReport(hist, compType, inventory){
  var GR=(typeof TEXTS!=='undefined'&&TEXTS&&TEXTS.growthReport)||{};
  if(!GR.patterns)return '';
  var HC=TEXTS.humanCentricCards||{};
  var DC=TEXTS.domainCards||{};
  var N=(typeof TEXTS!=='undefined'&&TEXTS&&TEXTS.narrative)||{};
  function _esc(s){return (s==null?'':String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

  // === 데이터 수집 ===

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

  // 카드 통계
  var allCards=_reportAllCards();
  var humanCount=0,domainCount=0,growthCount=0;
  var cardGroupCounts={};
  for(var ci=0;ci<allCards.length;ci++){
    var lbl=allCards[ci].label;
    cardGroupCounts[lbl]=(cardGroupCounts[lbl]||0)+1;
    if(allCards[ci].track==='human')humanCount++;
    else if(allCards[ci].track==='domain')domainCount++;
    else if(allCards[ci].track==='growth')growthCount++;
  }
  var topCards=Object.keys(cardGroupCounts).sort(function(a,b){return cardGroupCounts[b]-cardGroupCounts[a];}).slice(0,3);

  // 카드명 기반 강점 수집
  var strengthItems=[];
  var seenStrength={};
  var weakScenarios=[];
  for(var j=0;j<hist.length;j++){
    var sc=SCENARIOS[hist[j].scenarioId];
    var fin=(sc&&sc.finals)?sc.finals[hist[j].leaf]:null;
    if(!fin)continue;
    var scTitle=(sc&&sc.title)||hist[j].scenarioId;
    if(fin.humanCentricTag&&fin.humanCentricAxis){
      var axData=HC[fin.humanCentricAxis];
      var tagData=(axData&&axData.tags)?axData.tags[fin.humanCentricTag]:null;
      if(tagData&&tagData.short&&!seenStrength[fin.humanCentricTag]){
        seenStrength[fin.humanCentricTag]=1;
        strengthItems.push({label:'['+fin.humanCentricAxis+'] '+fin.humanCentricTag,desc:tagData.short,color:(axData&&axData.color)||'#111'});
      }
    }
    if(fin.domainCards){
      for(var di=0;di<fin.domainCards.length;di++){
        var dc=fin.domainCards[di];
        var dd=DC[dc];
        if(dd&&dd.short&&!seenStrength[dc]){
          seenStrength[dc]=1;
          strengthItems.push({label:dc,desc:dd.short,color:(dd&&dd.color)||'#555'});
        }
      }
    }
    if(fin.grade==='C'||fin.grade==='D'){
      weakScenarios.push({title:scTitle,reflection:fin.reportReflection||''});
    }
  }

  // 보완 매칭
  var growthMap={};
  for(var k=0;k<hist.length;k++){
    var sc2=SCENARIOS[hist[k].scenarioId];
    var fin2=(sc2&&sc2.finals)?sc2.finals[hist[k].leaf]:null;
    if(fin2){var gTag=(fin2.reportGrowthTags||'').trim();if(gTag)growthMap[gTag]=(growthMap[gTag]||0)+1;}
  }
  var improvements=GR.improvements||[];
  var iLines=[];
  var gSorted=Object.keys(growthMap).sort(function(a,b){return growthMap[b]-growthMap[a];});
  for(var gi=0;gi<gSorted.length&&iLines.length<3;gi++){
    var gt=gSorted[gi];
    for(var ii=0;ii<improvements.length;ii++){
      if(gt.indexOf(improvements[ii].tag)>=0||improvements[ii].tag.indexOf(gt)>=0){
        if(iLines.indexOf(improvements[ii].text)<0)iLines.push(improvements[ii].text);
        break;
      }
    }
  }

  // 약속
  var pledges=GR.pledges||[];
  var pLines=[];
  if(pledges.length){
    if(growthMap['검토 필요'])pLines.push(pledges[1]||pledges[0]);
    if(growthMap['위임 구분']&&pledges[3])pLines.push(pledges[3]);
    if(growthMap['근거 부족']&&pledges[4])pLines.push(pledges[4]);
    if(pLines.length===0)pLines.push(pledges[0]);
    if(pLines.length<2&&pledges[2]&&pLines.indexOf(pledges[2])<0)pLines.push(pledges[2]);
    if(pLines.length<3&&pledges[1]&&pLines.indexOf(pledges[1])<0)pLines.push(pledges[1]);
  }

  // 선택 패턴 해석
  var t1pat=(N.tier1_patterns)||{};
  var maxT=Math.max(t1Counts.A,t1Counts.B,t1Counts.C);
  var totalT=t1Counts.A+t1Counts.B+t1Counts.C;
  var patKey='balanced';
  if(totalT>0){
    if(t1Counts.A===t1Counts.B&&t1Counts.B===t1Counts.C)patKey='balanced';
    else if(t1Counts.A===maxT&&t1Counts.B<maxT&&t1Counts.C<maxT)patKey='A_dominant';
    else if(t1Counts.B===maxT)patKey='B_dominant';
    else if(t1Counts.C===maxT)patKey='C_dominant';
    else patKey='mixed';
  }
  var t1Interp=(t1pat[patKey]&&t1pat[patKey].interpretation)||'';

  // === 렌더링 ===
  var h='<div class="report-growth" style="margin:28px 0 20px;padding:22px 20px;background:#fff;border:3px solid #000;border-radius:0;box-shadow:4px 4px 0 #000;">';
  h+='<div style="font-size:18px;font-weight:800;margin-bottom:18px;letter-spacing:0.5px;">'+_esc(GR.title||'AI리터러시 성장 리포트')+'</div>';

  // (a) 학습자 유형
  var typeName=_typeLabel(compType);
  var typeText=_typeText(compType);
  h+='<div style="margin-bottom:18px;padding:14px 16px;background:#f4f1ea;border:3px solid #000;border-radius:0;">';
  h+='<div style="font-size:11px;color:#888;font-weight:700;letter-spacing:1.5px;margin-bottom:4px;">학습자 유형</div>';
  h+='<div style="font-size:17px;font-weight:800;margin-bottom:6px;">'+_esc(typeName)+'</div>';
  if(typeText)h+='<div style="font-size:13px;line-height:1.7;color:#333;">'+typeText+'</div>';
  h+='</div>';

  // (b) 패턴 요약
  var patText=(GR.patterns||{})[pattern]||'';
  if(patText){
    h+='<div style="font-size:14px;line-height:1.8;color:#000;margin-bottom:18px;padding:14px 16px;background:#f4f1ea;border:3px solid #000;border-radius:0;">'+_esc(patText)+'</div>';
  }

  // (c) 내가 키운 역량
  if(strengthItems.length){
    h+='<div style="margin-bottom:18px;">';
    h+='<div style="font-size:15px;font-weight:700;margin-bottom:10px;">내가 키운 역량</div>';
    var maxShow=Math.min(strengthItems.length,5);
    for(var s2=0;s2<maxShow;s2++){
      var si=strengthItems[s2];
      h+='<div style="display:flex;align-items:baseline;gap:8px;margin-bottom:6px;font-size:13px;line-height:1.6;">';
      h+='<span style="flex-shrink:0;font-weight:700;color:'+si.color+';">'+_esc(si.label)+'</span>';
      h+='<span style="color:#333;">'+_esc(si.desc)+'</span>';
      h+='</div>';
    }
    if(strengthItems.length>5){
      h+='<div style="font-size:12px;color:#888;margin-top:4px;">외 '+(strengthItems.length-5)+'개 역량</div>';
    }
    h+='</div>';
  }

  // (d) 역량 카드 분포
  if(allCards.length>0){
    h+='<div style="margin-bottom:18px;">';
    h+='<div style="font-size:15px;font-weight:700;margin-bottom:8px;">역량 카드 프로필</div>';
    if(topCards.length){
      h+='<div style="font-size:13px;line-height:1.7;color:#333;">';
      h+='가장 많이 받은 카드: <b>'+_esc(topCards[0])+'</b> '+cardGroupCounts[topCards[0]]+'장';
      if(topCards.length>=2){
        h+='<br>다음: <b>'+_esc(topCards[1])+'</b> '+cardGroupCounts[topCards[1]]+'장';
        if(topCards.length>=3)h+=' / <b>'+_esc(topCards[2])+'</b> '+cardGroupCounts[topCards[2]]+'장';
      }
      h+='</div>';
    }
    h+='<div style="font-size:12px;color:#666;margin-top:6px;">';
    h+='인간중심 '+humanCount+'장 / 도메인 '+domainCount+'장';
    if(growthCount>0)h+=' / 성장 '+growthCount+'장';
    h+=' — 총 '+allCards.length+'장</div>';
    h+='</div>';
  }

  // (e) 학생 선택 패턴
  if(totalT>0){
    h+='<div style="margin-bottom:18px;">';
    h+='<div style="font-size:15px;font-weight:700;margin-bottom:8px;">선택 패턴</div>';
    h+='<div style="font-size:13px;color:#333;line-height:1.7;">';
    h+=totalT+' 시나리오 중 A '+t1Counts.A+' · B '+t1Counts.B+' · C '+t1Counts.C;
    if(t1Interp)h+='<br>'+_esc(t1Interp);
    h+='</div></div>';
  }

  // (f) 더 연습할 과정
  if(iLines.length||weakScenarios.length){
    h+='<div style="margin-bottom:18px;">';
    h+='<div style="font-size:15px;font-weight:700;margin-bottom:10px;">더 연습할 과정</div>';
    for(var i2=0;i2<iLines.length;i2++){
      h+='<div style="font-size:13px;color:#333;line-height:1.7;padding-left:10px;margin-bottom:4px;">· '+_esc(iLines[i2])+'</div>';
    }
    if(weakScenarios.length&&iLines.length<2){
      for(var wi=0;wi<weakScenarios.length&&wi<2;wi++){
        h+='<div style="font-size:12px;color:#666;line-height:1.6;padding-left:10px;margin-top:4px;">';
        h+=_esc(weakScenarios[wi].title)+' — '+_esc(weakScenarios[wi].reflection);
        h+='</div>';
      }
    }
    h+='</div>';
  }

  // (g) 다음에 이렇게 해볼 수 있다
  if(pLines.length){
    h+='<div style="margin-bottom:14px;padding:12px 14px;background:#f4f1ea;border:3px solid #000;border-radius:0;">';
    h+='<div style="font-size:15px;font-weight:700;margin-bottom:8px;">다음에 이렇게 해볼 수 있다</div>';
    for(var p2=0;p2<pLines.length;p2++){
      h+='<div style="font-size:13px;color:#222;line-height:1.7;padding-left:10px;margin-bottom:3px;"><b>'+(p2+1)+'.</b> '+_esc(pLines[p2])+'</div>';
    }
    h+='</div>';
  }

  // (h) 교사용 관찰 포인트
  var teacherNote=(GR.teacherNotes||{})[pattern]||'';
  if(teacherNote){
    h+='<details style="margin-top:10px;"><summary style="font-size:12px;color:#999;cursor:pointer;letter-spacing:0.5px;">교사용 관찰 포인트</summary>';
    h+='<div style="font-size:12px;color:#000;line-height:1.7;margin-top:8px;padding:10px 12px;background:#f4f1ea;border:3px solid #000;border-radius:0;">'+_esc(teacherNote)+'</div>';
    h+='</details>';
  }
  h+='</div>';
  return h;
}

