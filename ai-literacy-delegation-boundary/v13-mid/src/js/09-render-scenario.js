// =====================================================
// 9. Render Functions (v0.3 — 6컷 흐름)
// =====================================================
var container=document.getElementById('main-container');

function showStats(){
  document.getElementById('panel-row').classList.add('visible');
  document.body.classList.add('scenario-active'); // 6/15 r42 (§4n) — 우측 레일 자리 확보
  // §2d — inv-tab 버튼 대신 카드 독. 상세 패널은 독 클릭으로 진입.
  var invTab=document.getElementById('inv-tab');if(invTab)invTab.style.display='none';
  if(typeof dockShow==='function'){dockRender();dockShow(true);}
}
function hideStats(){
  document.getElementById('panel-row').classList.remove('visible');
  document.body.classList.remove('scenario-active'); // 6/15 r42 (§4n)
  var invTab=document.getElementById('inv-tab');if(invTab)invTab.style.display='none';
  if(typeof dockShow==='function')dockShow(false);
}

// 자원 게이지 업데이트 (작업 2)
// 색상 단계: 70%↑ 초록 / 50~70% 노랑 / 30~50% 주황 / <30% 빨강
function gaugeColorByPct(pct){
  // §4g v8 — 잔량별 색 변화 폐지, 비용 색(핑크) 고정
  return 'var(--acc-pink-deep)';
}
function updateResourceUI(){
  if(!gameState)return;
  var res=gameState.resources;
  ['time','energy'].forEach(function(key){
    var r=res[key];
    var pct=r.max>0?Math.max(0,Math.min(100,r.current/r.max*100)):0;
    document.getElementById('rnum-'+key).textContent=r.current;
    document.getElementById('rgauge-'+key).style.width=pct+'%';
    document.getElementById('rgauge-'+key).style.background=gaugeColorByPct(pct);
  });
}

// 자원 게이지 ±pop 애니메이션 (작업 5 — v0.3 animateStat 패턴 재사용)
function animateResource(key,oldVal,newVal){
  var diff=newVal-oldVal;if(diff===0)return;
  var el=document.getElementById('res-'+key);
  var nm=document.getElementById('rnum-'+key);
  var dl=document.getElementById('rdelta-'+key);
  el.classList.add(diff>0?'flash-up':'flash-down');
  nm.textContent=newVal;
  nm.classList.add('pulsing');
  dl.textContent=(diff>0?'+':'')+diff;
  dl.className='resource-change-indicator show '+(diff>0?'up':'down');
  setTimeout(function(){el.classList.remove('flash-up','flash-down');nm.classList.remove('pulsing');dl.className='resource-change-indicator';},2000);
}

// v0.6 §12 — pending 점수를 원 마커로 렌더 (양수=초록, 음수=빨강)
// 좌우 분할: value 부호에 따라 -neg(좌측 33%, 중앙 쪽 정렬) 또는 -pos(우측 67%) 컨테이너에만 렌더
// prevValue 비교로 양수↔음수 전환 시 깨짐 연출
function renderPendingDots(containerId,value,prevValue){
  var negBox=document.getElementById(containerId+'-neg');
  var posBox=document.getElementById(containerId+'-pos');
  if(!negBox||!posBox)return;
  var activeBox=value>0?posBox:(value<0?negBox:null);
  var inactiveBox=value>0?negBox:(value<0?posBox:null);
  // 비활성 컨테이너에 잔존 dot이 있으면 정리 (안전망)
  if(inactiveBox){
    var stray=inactiveBox.querySelectorAll('.pending-dot:not(.breaking)');
    stray.forEach(function(d){d.classList.add('breaking');(function(node){setTimeout(function(){if(node.parentNode)node.parentNode.removeChild(node);},350);})(d);});
  }
  // 0이면 활성 박스 없음 — 양쪽 모두 비움(깨짐 연출)
  if(value===0){
    [negBox,posBox].forEach(function(box){
      var dots=box.querySelectorAll('.pending-dot:not(.breaking)');
      dots.forEach(function(d){d.classList.add('breaking');(function(node){setTimeout(function(){if(node.parentNode)node.parentNode.removeChild(node);},350);})(d);});
    });
    return;
  }
  // 양수↔음수 전환 — 이전 활성 박스의 dot은 위 inactive 정리에서 이미 처리됨. 새 박스에 처음부터 그림
  var crossing=(typeof prevValue==='number')&&((prevValue>0&&value<0)||(prevValue<0&&value>0));
  if(crossing){
    var existing=activeBox.querySelectorAll('.pending-dot:not(.breaking)');
    existing.forEach(function(d){d.classList.add('breaking');});
    setTimeout(function(){activeBox.innerHTML='';drawDots(activeBox,value,true);},350);
    return;
  }
  // 추가/감소 — 동일 부호 내에서 활성 박스만 조작
  var prevAbs=Math.abs(prevValue||0), curAbs=Math.abs(value);
  if(curAbs>prevAbs){
    // 추가 — 새 dot N개 등장
    for(var i=prevAbs;i<curAbs;i++){
      var d=document.createElement('div');
      d.className='pending-dot '+(value>0?'positive':'negative')+' appearing';
      activeBox.appendChild(d);
    }
  }else if(curAbs<prevAbs){
    // 감소 — 끝(중앙에서 가장 먼 쪽)에서 깨짐
    var dots=activeBox.querySelectorAll('.pending-dot:not(.breaking)');
    for(var j=dots.length-1;j>=curAbs;j--){
      dots[j].classList.add('breaking');
      (function(node){setTimeout(function(){if(node.parentNode)node.parentNode.removeChild(node);},350);})(dots[j]);
    }
  }
  // 부호는 같지만 dot 색이 안 맞으면 강제 재그림 (edge case)
  if(prevValue!==undefined){
    var firstDot=activeBox.querySelector('.pending-dot');
    if(firstDot&&((value>0&&!firstDot.classList.contains('positive'))||(value<0&&!firstDot.classList.contains('negative')))){
      activeBox.innerHTML='';drawDots(activeBox,value,true);
    }
  }
}
function drawDots(box,value,animate){
  var n=Math.abs(value);
  for(var i=0;i<n;i++){
    var d=document.createElement('div');
    d.className='pending-dot '+(value>0?'positive':'negative')+(animate?' appearing':'');
    box.appendChild(d);
  }
}
// pending 흡수 애니메이션 — 모든 dot이 게이지로 흘러내림. Promise 반환
function absorbPending(){
  return new Promise(function(resolve){
    if(!gameState||!gameState.pending){resolve();return;}
    var dlgPending=gameState.pending.delegation||0;
    var knlPending=gameState.pending.knowledge||0;
    if(dlgPending===0&&knlPending===0){resolve();return;}
    var boxes=[document.getElementById('pending-dots-delegation'),document.getElementById('pending-dots-knowledge')];
    boxes.forEach(function(box){
      if(!box)return;
      var dots=box.querySelectorAll('.pending-dot');
      dots.forEach(function(d){d.classList.add('absorbing');});
    });
    setTimeout(function(){
      // 누적 반영 + pending 0 — §4g v8: 0 바닥 (마이너스 개념 없음)
      gameState.competencies.delegationChoice.value=Math.max(0,gameState.competencies.delegationChoice.value+dlgPending);
      gameState.competencies.knowledge.value=Math.max(0,gameState.competencies.knowledge.value+knlPending);
      gameState.pending.delegation=0;
      gameState.pending.knowledge=0;
      // dot 클리어 + 게이지 갱신 — sub container(.pending-dots-neg/.pending-dots-pos) 구조는 보존
      boxes.forEach(function(box){if(!box)return;var subs=box.querySelectorAll('.pending-dots-neg, .pending-dots-pos');subs.forEach(function(s){s.innerHTML='';});});
      updateStats();
      saveGame();
      resolve();
    },650);  // 0.6s 흡수 + 0.05s buffer
  });
}

// renderPendingDots용 prev 추적
var _prevPending={delegation:0,knowledge:0};

// v0.8 5/4 세션289 — 미터/숫자 표시는 effective 값(양수 ×mPos, 음수 ×mNeg).
// 비용 박스 -N과 같은 단위로 도착하게. 내부 점수(raw)는 그대로 두고 표시만 변환.
function effectiveCompetency(rawV){
  if(rawV>=0){
    var mPos=(typeof CONFIG.competencyDiscountMultPos==='number')?CONFIG.competencyDiscountMultPos:2;
    return rawV*mPos;
  }else{
    var mNeg=(typeof CONFIG.competencyDiscountMultNeg==='number')?CONFIG.competencyDiscountMultNeg:1;
    return rawV*mNeg;
  }
}
function updateStats(){
  if(!gameState)return;
  var dlg=gameState.competencies.delegationChoice.value;
  var knl=gameState.competencies.knowledge.value;
  // §4g v8 — 원 7개 미터. filled = clamp(raw, 0, 7). 0개부터 채워나감, 마이너스 개념 없음.
  setCircleMeter('meter-delegation',dlg);
  setCircleMeter('meter-knowledge',knl);
  // §12 pending 원 마커
  if(gameState.pending){
    renderPendingDots('pending-dots-delegation',gameState.pending.delegation||0,_prevPending.delegation);
    renderPendingDots('pending-dots-knowledge',gameState.pending.knowledge||0,_prevPending.knowledge);
    _prevPending.delegation=gameState.pending.delegation||0;
    _prevPending.knowledge=gameState.pending.knowledge||0;
  }
  // 6/15 r42 (§4n) — 우상단 SCORE = 전체 누적(totalScore). 중앙 알약(rider)이 해당 시나리오 점수 담당.
  var scoreNumEl=document.getElementById('score-num');
  if(scoreNumEl)scoreNumEl.textContent=(gameState.totalScore||0);
  // HUD 중앙 시나리오 제목 + 우측 레일 레벨 숫자
  var titleEl=document.getElementById('hud-scenario-title');
  if(titleEl){var _scT=getScenario();titleEl.textContent=_scT?("'"+_scT.title+"' 시나리오 점수"):'';} // §4r — "'제목' 시나리오 점수" 한 줄(피터공)
  if(typeof updateDockLevels==='function')updateDockLevels();
  updateScoreGraph();
  updateResourceUI();
  updateExpUI();
}

// v6 6/11 — 중앙 실시간 점수 그래프 (SPEC-ui-hud §4e). 채움 폭 + 머리 아이콘 위치 + 숫자.
var _prevLiveScore=-1;
function updateScoreGraph(){
  var fill=document.getElementById('score-graph-fill');
  var rider=document.getElementById('score-graph-rider');
  var num=document.getElementById('score-graph-num');
  if(!fill||!rider||!num)return;
  var s=(typeof getLiveScore==='function')?getLiveScore():0;
  fill.style.width=s+'%';
  // v6.4 — 초록 채움의 우측 끝 = 노랑 원(40px) 우측 끝. 채움이 원보다 짧으면 좌측 0에 클램프
  // v6.5 §4e-10 — max()/calc() 문자열은 트랜지션 보간이 안 걸려 원이 점프 → px로 계산.
  // 채움 바와 같은 0.6s 바운스 베지어로 함께 출렁임. 리사이즈 시 다음 갱신까지 px 고정(허용).
  var track=fill.parentNode;
  var tw=track?track.clientWidth:0;
  rider.style.left=Math.max(0,Math.round(tw*s/100-40))+'px';
  // 점수 낮을 땐 숫자를 머리 우측으로 (좌측 채움 공간 없음 — 흰 트랙 위라 ink)
  rider.classList.toggle('num-right',s<25);
  num.textContent=s;
  if(s!==_prevLiveScore&&_prevLiveScore>=0){
    num.classList.remove('pulsing');
    void num.offsetWidth;
    num.classList.add('pulsing');
    setTimeout(function(){num.classList.remove('pulsing');},600);
  }
  _prevLiveScore=s;
}

function setCircleMeter(meterId,value){
  var meter=document.getElementById(meterId);
  if(!meter)return;
  var filled=Math.max(0,Math.min(7,value));
  var over=value>7;
  // 8번째 자식 = 오버플로 마커 (초록 테두리 깜빡임, raw > 7일 때만 표시)
  if(meter.children.length!==8){
    meter.innerHTML='';
    for(var i=0;i<7;i++){var d=document.createElement('div');d.className='cm-dot';meter.appendChild(d);}
    var o=document.createElement('div');o.className='cm-overflow';meter.appendChild(o);
  }
  for(var j=0;j<7;j++){
    var dot=meter.children[j];
    var want=j<filled;
    if(want!==dot.classList.contains('filled')){
      dot.classList.toggle('filled',want);
      dot.classList.remove('pop');void dot.offsetWidth;dot.classList.add('pop');
    }
  }
  meter.children[7].classList.toggle('show',over);
  var label=meterId==='meter-delegation'?'선택':'능력';
  meter.setAttribute('aria-label',label+' '+filled+'/7'+(over?' (초과)':''));
}

function getCurrentCutNum(){
  if(!gameState)return 1;
  if(gameState.completed)return 6;
  if(gameState.selectedReview)return 6;
  if(gameState.selectedTier2)return gameState.currentTier==='final'?6:(gameState.currentTier==='result'?4:5);
  if(gameState.selectedTier1)return 3;
  return gameState.currentTier===1?1:2;
}

function animateStat(which,oldVal,newVal){
  var diff=newVal-oldVal;if(diff===0)return;
  var st=document.getElementById('stat-'+which);
  if(st)st.classList.add(diff>0?'flash-up':'flash-down');
  setCircleMeter('meter-'+which,newVal);
  // 6/15 r42 (§4n) — 우측 레일 레벨 숫자 갱신 + 펄스
  if(typeof updateDockLevels==='function')updateDockLevels();
  var dlEl=document.getElementById(which==='delegation'?'dock-level-hc':'dock-level-ab');
  if(dlEl){dlEl.classList.remove('pulsing');void dlEl.offsetWidth;dlEl.classList.add('pulsing');setTimeout(function(){dlEl.classList.remove('pulsing');},600);}
  setTimeout(function(){if(st)st.classList.remove('flash-up','flash-down');},2000);
}

// 타이틀 화면 — §4i v10: 레트로 + 물마루, 튜토리얼은 별도 화면으로 분리
// 흐름: showTitleScreen → enterFromTitle → showTutorialScreen → showStartScreen
function showTitleScreen(){
  hideStats();
  if(!gameState){
    var saved=loadGame();
    if(saved&&saved.clearedScenarios){gameState=saved;}
    else{gameState=createInitialState();saveGame();}
  }
  _crtClear();
  container.innerHTML=_crtMarkup();
  trackEvent('title_viewed',{tutorialSeenBefore:!!gameState.tutorialSeen});
  _crtRunBoot();
}

// §4i-7 — 공통 타이틀 헤더 (튜토리얼·시나리오 선택 상단)
function buildGameTitleHead(){
  var _ts=_t('title_screen',{});
  return '<div class="game-title-head">'+
    '<div class="gth-main">'+(_ts.main_title_1||'내가 할까? 시킬까?')+' '+(_ts.main_title_2||'그것이 문제로다!')+'</div>'+
    '<div class="gth-sub">'+(_ts.sub_title_2||'AI 리터러시, 위임의 경계!')+'</div>'+
  '</div>';
}

// 튜토리얼 진입(시작 화면 "튜토리얼 다시 보기") — 모니터 렌더 후 위임 정의부터(부팅·타이틀 생략)
function showTutorialScreen(){
  hideStats();
  _crtClear();
  container.innerHTML=_crtMarkup();
  crtShowDeleg();
}

// ===== r40 — 인트로 CRT 모니터 연출 (시안 mockups/title-crt-sian.html 승인분 통합) =====
// 부팅→타이틀→위임 정의→게임 방법, 한 번 렌더한 모니터 DOM의 4개 .crt-layer 토글. SPEC-intro-crt.md
var _crtTimers=[], _crtIntroLines=[], _crtTutLines=[];
function _crtT(fn,ms){var id=setTimeout(fn,ms);_crtTimers.push(id);return id;}
function _crtClear(){for(var i=0;i<_crtTimers.length;i++)clearTimeout(_crtTimers[i]);_crtTimers=[];}
function _g(id){return document.getElementById(id);}
function _crtHideAll(){var L=[_g('crtBoot'),_g('crtTitle'),_g('crtDeleg'),_g('crtMethod')];
  for(var i=0;i<L.length;i++){if(L[i]){L[i].style.display='none';L[i].classList.remove('crt-on');}}}
function _crtShow(el){if(!el)return;el.style.display='flex';void el.offsetWidth;el.classList.add('crt-on');}

function _crtMarkup(){
  var _ts=_t('title_screen',{}), _tu=_t('tutorial_screen',{});
  _crtIntroLines=_tu.delegation_intro||['위임이란 내가 할 일을 다른 누군가에게 맡기는 것!','내가 할까? <b>AI에게 시킬까?</b>','내 대신 AI에게 시키는 것이 바로 위임이다.'];
  _crtTutLines=_tu.tutorial||[];
  var dlns='';for(var i=0;i<_crtIntroLines.length;i++)dlns+='<div class="crt-dln"></div>';
  var mlns='';for(var j=0;j<_crtTutLines.length;j++)mlns+='<div class="crt-mline"><span class="crt-no">'+(j+1)+'</span><span class="crt-mtext"></span></div>';
  var kick=_tu.kicker?'<div class="crt-kicker">'+_tu.kicker+'</div>':'';
  return '<div class="crt-overlay"><div class="crt-monitor"><div class="crt-bezel"><div class="crt-screen">'
    +'<div class="crt-glare"></div><div class="crt-flash" id="crtFlash"></div><div class="crt-sweep" id="crtSweep"></div>'
    +'<div class="crt-layer" id="crtBoot"><div class="crt-bootline" id="crtBootLine"></div><div class="crt-bootline crt-sub" id="crtBootSub"></div></div>'
    +'<div class="crt-layer crt-title" id="crtTitle"><div class="crt-t1" id="crtT1"></div><div class="crt-t2" id="crtT2"></div>'
      +'<div class="crt-subs" id="crtSubs"></div>'
      +'<div class="crt-intro" id="crtIntro"><p id="crtIntroP"></p>'
      +'<button class="crt-btn" id="crtStartBtn" onclick="enterFromTitle()">▶ '+(_ts.btn_start||'시작하기')+'</button></div></div>'
    +'<div class="crt-layer crt-deleg" id="crtDeleg"><div class="crt-dword">'+(_tu.delegation_word||'위임')+'</div>'
      +'<div class="crt-dlines" id="crtDlines">'+dlns+'</div>'
      +'<button class="crt-btn" id="crtDelegBtn" onclick="crtShowMethod()">'+(_tu.btn_more||'계속 →')+'</button></div>'
    +'<div class="crt-layer crt-method" id="crtMethod"><div class="crt-mhead">'+(_tu.heading||'게임 방법')+'</div>'+mlns+kick
      +'<button class="crt-btn" id="crtMethodBtn" onclick="enterFromTutorial()">'+(_tu.btn_continue||'게임 시작 ▶')+'</button></div>'
    +'</div></div><div class="crt-base"><div class="crt-vents"></div><div class="crt-brand"><span class="crt-led"></span> NOLGONG-CRT · AI-2026</div></div></div></div>';
}

// 타이핑: 평문 / 태그 보존(<br>·<span>·<b>는 통째 즉시, 글자만 한 자씩)
function _crtType(el,str,sp,cb){var i=0;(function step(){if(i<=str.length){el.innerHTML=str.slice(0,i)+'<span class="crt-cur"></span>';i++;_crtT(step,sp);}else{el.textContent=str;if(cb)cb();}})();}
function _crtTypeHTML(el,html,sp,cb){var toks=[],re=/(<[^>]+>)|([^<])/g,m;while((m=re.exec(html))){toks.push(m[1]?{t:m[1]}:{c:m[2]});}var i=0,out='';(function step(){if(i<toks.length){var tk=toks[i++];out+=(tk.t||tk.c);el.innerHTML=out+'<span class="crt-cur"></span>';_crtT(step,tk.t?0:sp);}else{el.innerHTML=out;if(cb)cb();}})();}
function _crtGlitch(el){el.classList.add('crt-glitch');_crtT(function(){el.classList.remove('crt-glitch');},700);}

// 부팅: 좌측 커서 깜빡 → 좌→우 타이핑 → 준비 줄 → 타이틀
function _crtRunBoot(){
  var _ts=_t('title_screen',{});
  var line=(_ts.badge||'경기도 하이러닝 - AI 리터러시')+': 게임 시작';
  var sub='> 시스템 준비 완료. 잠시 후 시작합니다_';
  var bl=_g('crtBootLine'), bs=_g('crtBootSub');
  _crtHideAll(); _crtShow(_g('crtBoot'));
  bs.innerHTML=''; bl.innerHTML='<span class="crt-cur"></span>';
  _crtT(function(){_crtType(bl,line,60,function(){_crtT(function(){_crtType(bs,sub,36,function(){_crtT(_crtToTitle,1000);});},420);});},1300);
}

// 타이틀: 스윕 → 제목 2줄 타이핑+글리치 → 부제·인트로 써짐 → 시작 버튼
function _crtToTitle(){
  var _ts=_t('title_screen',{});
  var t1=_ts.main_title_1||'내가 할까? 시킬까?', t2=_ts.main_title_2||'그것이 문제로다!';
  var subs=_ts.sub_title_1||'AI 시대, 무엇을 맡기고 무엇을 직접 할 것인가!';
  var host=_ts.host_text||'딸깍하면 누구나 할 수 있는 AI 시대라고 한다.';
  _crtHideAll(); _crtShow(_g('crtTitle'));
  var eT1=_g('crtT1'), eT2=_g('crtT2'), eS=_g('crtSubs'), eI=_g('crtIntro'), eP=_g('crtIntroP'), eB=_g('crtStartBtn');
  eT1.textContent='';eT2.textContent='';eS.innerHTML='';eP.innerHTML='';
  eI.classList.remove('draw');eB.classList.remove('show');eT1.classList.remove('crt-glitch');eT2.classList.remove('crt-glitch');
  _crtT(function(){
    _crtType(eT1,t1,60,function(){
      _crtType(eT2,t2,60,function(){
        _crtT(function(){_crtTypeHTML(eS,subs,18,function(){
          eI.classList.add('draw');
          _crtT(function(){_crtTypeHTML(eP,host,11,function(){_crtT(function(){eB.classList.add('show');},160);});},320);
        });},250);
      });
    });
  },720);
}

// 위임 정의: 3줄 글자별 타이핑 → 깜빡 → 계속 버튼
function crtShowDeleg(){
  _crtClear();
  _crtHideAll(); _crtShow(_g('crtDeleg'));
  var dl=_g('crtDlines'), lns=dl.querySelectorAll('.crt-dln'), btn=_g('crtDelegBtn');
  for(var i=0;i<lns.length;i++)lns[i].innerHTML='';
  btn.classList.remove('show'); dl.classList.remove('blink');
  trackEvent('tutorial_viewed',{});
  _crtDelegLine(0,lns,btn);
}
function _crtDelegLine(i,lns,btn){
  if(i>=_crtIntroLines.length){
    _crtT(function(){var dl=_g('crtDlines');dl.classList.add('blink');_crtT(function(){dl.classList.remove('blink');btn.classList.add('show');},900);},350);
    return;
  }
  _crtTypeHTML(lns[i],_crtIntroLines[i],33,function(){_crtT(function(){_crtDelegLine(i+1,lns,btn);},260);});
}

// 게임 방법: 번호 배지 2회 깜빡 → 줄 타이핑, 5단계 순차 → kicker → 게임 시작
function crtShowMethod(){
  _crtClear();
  _crtHideAll(); _crtShow(_g('crtMethod'));
  var m=_g('crtMethod'), lines=m.querySelectorAll('.crt-mline');
  var kicker=m.querySelector('.crt-kicker'), mbtn=_g('crtMethodBtn');
  for(var i=0;i<lines.length;i++){lines[i].querySelector('.crt-mtext').innerHTML='';var n=lines[i].querySelector('.crt-no');n.classList.remove('numon','blink2');}
  if(kicker)kicker.classList.remove('show'); mbtn.classList.remove('show');
  _crtMethodLine(0,lines,kicker,mbtn);
}
function _crtMethodLine(i,lines,kicker,mbtn){
  if(i>=lines.length){
    _crtT(function(){if(kicker)kicker.classList.add('show');_crtT(function(){mbtn.classList.add('show');},350);},250);
    return;
  }
  var no=lines[i].querySelector('.crt-no'), txt=lines[i].querySelector('.crt-mtext');
  no.classList.add('blink2');
  _crtT(function(){no.classList.remove('blink2');no.classList.add('numon');
    _crtTypeHTML(txt,_crtTutLines[i],28,function(){_crtT(function(){_crtMethodLine(i+1,lines,kicker,mbtn);},200);});
  },860);
}
// §4j-1 — CRT 부팅 플래시 헬퍼: 레트로(다크)에서 본게임(라이트)으로 넘어가는 경계 연출
function bootFlashTo(fn){
  var fl=document.createElement('div');
  fl.className='boot-flash';
  document.body.appendChild(fl);
  setTimeout(fn,380);
  setTimeout(function(){if(fl.parentNode)fl.parentNode.removeChild(fl);},760);
}
function enterFromTutorial(){
  if(btnGuard('enterTutorial'))return;
  bootFlashTo(showStartScreen);
}

var _btnLock={};
function btnGuard(key){if(_btnLock[key])return true;_btnLock[key]=true;setTimeout(function(){_btnLock[key]=false;},600);return false;}

function enterFromTitle(){
  if(btnGuard('enterTitle'))return;
  if(!gameState)return;
  // §4i-10 — 재방문(튜토리얼 기시청)은 튜토리얼 생략, 플래시 후 바로 선택 화면
  if(gameState.tutorialSeen===true){
    bootFlashTo(showStartScreen);
    return;
  }
  gameState.tutorialSeen=true;
  saveGame();
  crtShowDeleg();
}

function showStartScreen(){
  hideStats();
  if(!gameState){
    var saved=loadGame();
    if(saved&&saved.clearedScenarios){gameState=saved;}
    else{gameState=createInitialState();saveGame();}
  }
  var hintOn=getHintPref();
  var order=CONFIG.scenarios; // 학기 시간 순
  var cleared=gameState.clearedScenarios||[];
  var nextId=null;
  for(var i=0;i<order.length;i++){if(cleared.indexOf(order[i])<0){nextId=order[i];break;}}
  var allDone=(nextId===null);
  var _ss=_t('start_screen',{});
  var h='<div class="semester-frame">';
  h+=buildGameTitleHead(); // §4i-7 — 기존 h1 대체
  h+='<div class="subtitle">'+(_ss.subtitle||'이건 AI한테 맡겨도 돼?')+'</div>';
  if(allDone){
    // r41/r43b — 완료 배너: 픽셀 폰트·연두 박스. 줄바꿈 금지(nowrap·내용폭) + 글씨 키움 + 노랑 글씨 + 초록 그림자(타이틀 화면 톤)
    h+='<div style="text-align:center;margin:8px 0 24px;"><span style="display:inline-block;padding:18px 42px;background:var(--acc-mint);border:var(--border-w) solid var(--ink);box-shadow:var(--shadow);font-family:var(--font-pixel);font-size:28px;font-weight:400;color:var(--acc-yellow);text-shadow:3px 3px 0 var(--acc-mint-deep);letter-spacing:2px;white-space:nowrap;">'+(_ss.all_done_banner||'AI 리터러시 시나리오를 모두 완료했습니다!')+'</span></div>';
  }
  h+='<div class="scenario-list">';
  order.forEach(function(sid,idx){
    var s=SCENARIOS[sid];
    var isCleared=cleared.indexOf(sid)>=0;
    var isNext=(sid===nextId);
    var cls='scenario-card';
    if(isCleared)cls+=' cleared';
    if(isNext)cls+=' next';
    if(isCleared){
      // v1.3 §14.2 (사성진샘) — 완료 카드: 기존 등급/점수 뱃지 + 재도전 버튼.
      // 비활성 대신 replayScenario 직접 진입(cut6 "다시 해보기"와 동일). best 기록은 replay[sid]에 보존.
      var rp=(gameState.replay&&gameState.replay[sid])||{};
      var gradeTxt=rp.bestGrade||(_ss.mark_cleared||'클리어');
      var scoreTxt=(typeof rp.bestScore==='number')?(' · '+rp.bestScore+(_ss.score_unit||'점')):'';
      h+='<div class="'+cls+'">';
      h+='<span class="sc-num">'+(idx+1)+'</span>';
      h+='<div class="sc-body"><div class="sc-title">'+s.title+'</div><div class="sc-meta">'+s.categoryName+'</div></div>';
      h+='<span class="sc-mark sc-grade">'+gradeTxt+scoreTxt+'</span>';
      h+='<button class="sc-replay-btn" type="button" onclick="replayScenario(\''+sid+'\')">'+(_ss.btn_replay||'재도전')+'</button>';
      h+='</div>';
    }else if(isNext){
      // v1.3 §14.4 (피터공 6/8) — 다음 추천 카드만 하늘색 PLAY 배지.
      h+='<button class="'+cls+'" type="button" onclick="startScenario(\''+sid+'\')">';
      h+='<span class="sc-num">'+(idx+1)+'</span>';
      h+='<div class="sc-body"><div class="sc-title">'+s.title+'</div><div class="sc-meta">'+s.categoryName+'</div></div>';
      h+='<span class="sc-mark sc-play">'+(_ss.mark_play||'PLAY')+'</span>';
      h+='</button>';
    }else{
      // §14.5 (피터공 6/11) — 순차 진행: 다음이 아닌 미완료 카드는 잠김 (클릭 불가)
      h+='<div class="'+cls+' locked">';
      h+='<span class="sc-num">'+(idx+1)+'</span>';
      h+='<div class="sc-body"><div class="sc-title">'+s.title+'</div><div class="sc-meta">'+s.categoryName+'</div></div>';
      h+='<span class="sc-mark sc-lock">'+(_ss.mark_locked||'잠김')+'</span>';
      h+='</div>';
    }
  });
  h+='</div>';
  h+='<div class="semester-actions">';
  if(allDone){
    h+='<button class="action-main" onclick="showFinalReport()">'+(_ss.btn_report||'AI 리터러시 성장 리포트')+'</button>';
  }else if(hasSave()&&gameState.currentScenarioId&&!gameState.completed){
    h+='<button class="action-main" onclick="continueGame()">'+(_ss.btn_continue||'이어서 진행')+'</button>';
  }else if(nextId){
    h+='<button class="action-main" onclick="startScenario(\''+nextId+'\')">'+(_ss.btn_next_scenario||'다음 시나리오')+'</button>';
  }
  h+='</div>';
  h+='<div class="select-footer-links">'; // §4i-10 — 튜토리얼·타이틀 재방문 링크
  h+='<button class="tutorial-link" onclick="showTutorialScreen()">'+(_ss.btn_tutorial_again||'튜토리얼 다시 보기')+'</button>';
  h+='<button class="tutorial-link" onclick="showTitleScreen()">'+(_ss.btn_title_again||'타이틀 화면')+'</button>';
  h+='</div>';
  h+='</div>';
  container.innerHTML=h;
}

function ensureRow(){
  if(currentRow)return currentRow;
  var sc=getScenario();
  var row=document.createElement('div');row.className='scenario-row';row.id='scenario-row';
  // 6 panels in 2 rows of 3
  var panels='';
  for(var i=1;i<=6;i++){
    panels+='<div class="panel" data-cut="'+i+'"><div class="panel-image"><span class="cut-num">'+i+'</span><span class="cut-label">'+i+'</span></div><div class="panel-body"></div></div>';
    if(i===3)panels='<div class="panels-grid panels-row1">'+panels+'</div><div class="panels-grid panels-row2">';
  }
  panels+='</div>';
  row.innerHTML=panels+'<div class="next-btn-wrap" id="next-wrap"><button class="next-btn" id="next-btn" onclick="onNext()">'+_t('game_flow.buttons.next','다음 →')+'</button></div>';
  container.appendChild(row);
  currentRow=row;
  return row;
}

function setPanelImage(cutNum,labelText){
  var panel=currentRow.querySelector('[data-cut="'+cutNum+'"]');
  if(!panel)return;
  var imgEl=panel.querySelector('.panel-image');
  var src=gameState&&gameState.currentScenarioId?getCutImage(gameState.currentScenarioId,cutNum):CUT_IMAGES[cutNum];
  if(src){
    var img=new Image();img.src=src;
    img.onload=function(){imgEl.innerHTML='<img src="'+src+'" alt="컷 '+cutNum+'"><span class="cut-num">'+cutNum+'</span>'+(labelText?'<span class="panel-place">'+labelText+'</span>':'');};
    img.onerror=function(){imgEl.innerHTML='<span class="cut-num">'+cutNum+'</span><span class="cut-label">'+cutNum+'</span>'+(labelText?'<span class="panel-place">'+labelText+'</span>':'');};
  }
}

// 6/15 — sticky HUD(.panel-row) 높이만큼 보정한 스크롤. block:'center'는 키 큰 패널의
// 상단(이미지·제목)을 HUD 밑으로 밀어넣어, 컷 시작 시 위쪽이 가려졌다. 패널 top을 HUD 바로 아래에 맞춘다.
function _hudOffset(){
  var hud=document.querySelector('.panel-row');
  if(!hud)return 0;
  var cs=getComputedStyle(hud);
  if(cs.display==='none'||(cs.position!=='sticky'&&cs.position!=='fixed'))return 0;
  return hud.getBoundingClientRect().height;
}
// 패널 위쪽(이미지)을 HUD 바로 아래로 — 컷 시작 + 선택 후 이미지 복귀에 쓰임
function _scrollPanelTop(panel){
  if(!panel)return;
  var gap=12;
  var top=panel.getBoundingClientRect().top+window.pageYOffset-_hudOffset()-gap;
  window.scrollTo({top:Math.max(0,top),behavior:'smooth'});
}

function activatePanel(cutNum){
  var panel=currentRow.querySelector('[data-cut="'+cutNum+'"]');
  if(!panel)return null;
  panel.classList.add('active','slide-in');
  setTimeout(function(){_scrollPanelTop(panel);},80);
  return panel;
}

// 컷 1: 상황 제시
function renderCut1(){
  var sc=getScenario();
  ensureRow();
  trackEvent('scenario_viewed',{scenarioId:sc.id,title:sc.title});
  setPanelImage(1,sc.categoryName);
  var panel=activatePanel(1);
  panel.querySelector('.panel-body').innerHTML=
    '<p class="highlight">'+sc.title+'</p>'+
    '<p class="situation-text">'+sc.situation.text+'</p>'+
    '<div class="advance-wrap"><button class="advance-btn" onclick="showTier1Choices()">'+_t('game_flow.buttons.tier1_advance','어떻게 할까? →')+'</button></div>';
  updateStats();
}

// 선택 버튼에 표시할 비용 미터 HTML — 시간/에너지 숫자+바
// v0.5 Phase 8 — 잔여자원 부족 판정 (DECISIONS §9.2)
function canAffordCost(cost){
  if(!gameState.resources)return true;
  return cost.time<=gameState.resources.time.current && cost.energy<=gameState.resources.energy.current;
}

// 5/3 정정 — 모든 선택지 비용 부족 시 GAME OVER. costs 배열 받아서 어느 것도 못 고르면 트리거.
// 학생이 disable된 선택지를 0.7초 인지한 후 모달 노출.
function _checkAllUnaffordable(costs){
  if(!costs||!costs.length)return false;
  for(var i=0;i<costs.length;i++){if(canAffordCost(costs[i]))return false;}
  return true;
}
function triggerGameOver(){
  // 중복 호출 방지
  if(gameState&&gameState._gameOverShown)return;
  if(!gameState)gameState={};
  gameState._gameOverShown=true;
  setTimeout(function(){
    var modal=document.getElementById('gameover-modal');
    if(!modal)return;
    var t=document.getElementById('gameover-time');
    var e=document.getElementById('gameover-energy');
    if(t&&gameState.resources)t.textContent=gameState.resources.time.current;
    if(e&&gameState.resources)e.textContent=gameState.resources.energy.current;
    modal.classList.remove('hidden');
    requestAnimationFrame(function(){modal.classList.add('visible');});
    trackEvent('game_over_triggered',{time:gameState.resources?gameState.resources.time.current:null,energy:gameState.resources?gameState.resources.energy.current:null,scenarioId:gameState.currentScenarioId});
  },700);
}
function _closeGameOverModal(){
  var modal=document.getElementById('gameover-modal');
  if(!modal)return;
  modal.classList.remove('visible');
  setTimeout(function(){modal.classList.add('hidden');},250);
}
function gameOverShowReport(){
  _closeGameOverModal();
  // 미완 시나리오 history 정리 — 자동으로 처리: scenarioHistory만 사용
  setTimeout(function(){
    if(gameState)gameState._gameOverShown=false;
    showFinalReport();
  },150);
}
function gameOverRestart(){
  _closeGameOverModal();
  setTimeout(function(){
    if(gameState)gameState._gameOverShown=false;
    resetGame();
  },150);
}
// v0.8 §3.4 / §6.6.2 — 공식형 박스 두 줄 라벨 분리.
// 시간 줄: 시간 비용 [N] − 위임 할인 [N] = 최종 시간 [N]  (위임 할인이 시간 자리)
// 에너지 줄: 에너지 비용 [N] − 지식 할인 [N] = 최종 에너지 [N]  (지식 할인이 에너지 자리)
// 두 역량의 독립 학습 메시지가 살아남. 최종 시간·최종 에너지 볼드. 학생 톤. 카드 매칭은 박스 X (점수 자리).
function buildEffectCell(label,value){
  // (legacy 호환 stub — 새 박스에서는 사용 X. 기존 호출자 안전 차원 보존)
  var cls='cost-box-effect',text;
  if(value===0){cls+=' zero';text='0';}
  else if(value>0){text='-'+value;}
  else {cls+=' penalty';text='+'+(-value);}
  return '<div class="cost-cell"><div class="cost-cell-label">'+label+'</div><div class="'+cls+'">'+text+'</div></div>';
}
// 한 줄: 비용 [N] − 할인 [N] = 최종 [N] (학생 톤, 최종 볼드)
function _buildCostLine(costLabel,rawVal,discountLabel,discountVal,finalLabel,actualFinal){
  var finalVal=(typeof actualFinal==='number')?actualFinal:Math.max(0,rawVal-discountVal);
  var opSym='−',discText=String(Math.abs(discountVal));
  var discCls='cost-formula-discount';
  if(discountVal===0){discCls+=' zero';}
  else if(discountVal<0){opSym='+';discCls+=' penalty';}
  return '<div class="cost-formula-line">'+
    '<div class="cost-formula-cell"><div class="cost-formula-label">'+costLabel+'</div>'+
      '<div class="cost-formula-val cost-formula-raw">'+rawVal+'</div></div>'+
    '<div class="cost-formula-op">'+opSym+'</div>'+
    '<div class="cost-formula-cell"><div class="cost-formula-label">'+discountLabel+'</div>'+
      '<div class="cost-formula-val '+discCls+'">'+discText+'</div></div>'+
    '<div class="cost-formula-op">=</div>'+
    '<div class="cost-formula-cell"><div class="cost-formula-label">'+finalLabel+'</div>'+
      '<div class="cost-formula-val cost-formula-final"><b>'+finalVal+'</b></div></div>'+
  '</div>';
}
// §4p v3 — 시간·에너지를 한 줄에("시간 비용 : N | 에너지 비용 : N"). 초기 raw, 캐스케이드가 숫자만 final로 교체.
function _costSimpleLine(label,res,raw,final){
  return '<span class="cost-line" data-res="'+res+'" data-raw="'+raw+'" data-final="'+final+'">'+label+' : <span class="cost-num">'+raw+'</span></span>';
}
function buildCostHTML(cost){
  var d=cost._discount||{rawTime:cost.time,rawEnergy:cost.energy};
  var _cl=_t('cost_labels',{});
  return '<div class="choice-cost cost-simple">'+
    _costSimpleLine(_cl.time_cost||'시간 비용','time',d.rawTime,cost.time)+
    '<span class="cost-sep">|</span>'+
    _costSimpleLine(_cl.energy_cost||'에너지 비용','energy',d.rawEnergy,cost.energy)+
  '</div>';
}
// §4p — 역량카드 할인 가능 표식 폐지(쿠폰 모달 폐지). 호출부 호환 위해 빈 문자열.
function getCardDiscountMark(stageType,choiceId){return '';}

// ===== §4q v7 할인 정보창 (세션486, 피터공) — 자원 1개씩 정적 표시, 버튼 누르면 큰 숫자 카운트 후 다음 =====
// 자동은 정신없다 → 사용자 페이스. 한 박스에 자원 한 칸(시간→에너지)씩 정적 표시 + [적용확인].
// 버튼 누르면 그때 큰 숫자로 할인이 오르고(-1..-N) 비용이 내리는 카운트 연출 → 끝나면 다음 칸/선택지.
var _cascadeBusy=false;
var FX_META={
  time:{head:'시킬까!',label:'시간 할인',levelLabel:'위임레벨',dock:'dock-list-hc'},
  energy:{head:'내가 할까!',label:'에너지 할인',levelLabel:'능력레벨',dock:'dock-list-ab'}
};
// §4q v8 (6/16) — 박스 칸의 레벨 숫자. 시킬까=위임레벨(시킬까 카드 장수), 내가할까=능력레벨(능력 카드 장수)
function _fxLevelFor(res){
  if(res==='time')return (typeof _delegationCardCount==='function')?_delegationCardCount():0;
  return (typeof _abilityCardCount==='function')?_abilityCardCount():0;
}
function _fxDiscountedLines(card){
  return Array.prototype.slice.call(card.querySelectorAll('.cost-line')).filter(function(l){return (+l.dataset.raw)>(+l.dataset.final);});
}
// 슬롯에 실제 카드 내용/컬러 채우고 강조(reveal)
function _fxFillSlot(slot,chip){
  slot.classList.remove('fx-empty');
  slot.innerHTML=chip.innerHTML;
  slot.style.background=chip.style.background||'';
  slot.style.borderLeft=chip.style.borderLeft||'';
  slot.classList.remove('reveal');void slot.offsetWidth;slot.classList.add('reveal');
}
// §4q v9.1 (6/16 피터공) — 빈 점선 슬롯 먼저, 목록 카드가 하나씩 회전하며 날아와 채운다(획득팝업 회전-비행 모티프 재사용).
function _fxFillCards(container,res){
  var list=document.getElementById(FX_META[res].dock);
  var chips=list?Array.prototype.slice.call(list.querySelectorAll('.dock-card.locked')):[];
  chips=chips.slice(0,3); // 최대 3장(할인 가격은 동일)
  // 1) 빈 점선 슬롯
  var slots=chips.map(function(){var s=document.createElement('div');s.className='fx-clone fx-empty';container.appendChild(s);return s;});
  // 2) 카드 하나씩 회전 비행 → 슬롯 채움(강조)
  chips.forEach(function(chip,i){
    (function(chip,slot,idx){
      setTimeout(function(){
        var sr=chip.getBoundingClientRect(),tr=slot.getBoundingClientRect();
        if(sr.width<=0||tr.width<=0){_fxFillSlot(slot,chip);return;} // 독 안 보이면 즉시 채움(degrade)
        var ghost=chip.cloneNode(true);
        ghost.classList.add('fx-clone');ghost.classList.remove('locking','reveal','pending');
        ghost.style.cssText+=';position:fixed;left:'+sr.left+'px;top:'+sr.top+'px;width:'+sr.width+'px;height:'+sr.height+'px;margin:0;z-index:600;box-shadow:none;border-radius:8px;transition:transform .5s cubic-bezier(.45,0,.55,1),opacity .2s ease .42s;';
        document.body.appendChild(ghost);
        var tx=tr.left+tr.width/2-(sr.left+sr.width/2);
        var ty=tr.top+tr.height/2-(sr.top+sr.height/2);
        var scl=tr.width/sr.width;
        requestAnimationFrame(function(){ghost.style.transform='translate('+tx+'px,'+ty+'px) rotate(540deg) scale('+scl.toFixed(2)+')';ghost.style.opacity='0.25';});
        setTimeout(function(){if(ghost.parentNode)ghost.parentNode.removeChild(ghost);_fxFillSlot(slot,chip);},520);
      },idx*180+120);
    })(chip,slots[i],i);
  });
}
// 한 자원 칸 박스: 할인 수치(-N)만 박스에. 실제 비용은 선택 버튼(cut2)에서 큰 글씨(cost-zoom).
function _fxBuildSectionBox(card,line,host){
  var res=line.dataset.res,M=FX_META[res],N=(+line.dataset.raw)-(+line.dataset.final);
  var hostRect=host.getBoundingClientRect(),bTop=host.clientTop||0,r=card.getBoundingClientRect();
  var box=document.createElement('div');box.className='choice-fx show';box.style.position='absolute';
  // §4q v9.2 (6/16 피터공) — 박스를 20px 좌측으로 → cut3/cut2 경계에 걸치게(dfx-host overflow:visible 필요)
  box.style.top=Math.max(0,Math.round(r.top-hostRect.top-bTop))+'px';box.style.left='-20px';box.style.right='4px';
  // §4q v8 (6/16 피터공) — 1줄: 헤드 볼드 + 위임/능력 레벨(다른 색) / 2줄: 동일 폭 카드 박스 / 3줄: ← + -N 큰 글씨 + 라벨 + [적용하기]
  box.innerHTML='<div class="fx-sec" data-res="'+res+'">'
    +'<div class="fx-head-row"><span class="fx-head">'+M.head+'</span><span class="fx-level">'+M.levelLabel+' '+_fxLevelFor(res)+'</span></div>'
    +'<div class="fx-cards"></div>'
    +'<div class="fx-apply-row">'
      +'<span class="fx-arrow">&larr;</span>'
      +'<span class="fx-disc">-'+N+'</span>'
      +'<span class="fx-label">'+M.label+'</span>'
      +'<button type="button" class="fx-confirm">적용하기</button>'
    +'</div>'
    +'</div>';
  _fxFillCards(box.querySelector('.fx-cards'),res);
  var cn=line.querySelector('.cost-num');if(cn)cn.classList.add('cost-zoom'); // 선택 버튼 비용 큰 글씨
  host.appendChild(box);
  return box;
}
// [적용하기] 클릭 시: 할인 -N에서 줄어 사라지고(박스), 선택버튼 비용 raw→final로 줄어든다. 끝나면 비용 2번 깜빡 후 원래 크기 복귀.
// §4q v9.1 (6/16 피터공) — ① 펄스를 더 팝하게+아주 살짝 빠르게(360→300, fxNumPulse back-ease) ② 마지막 숫자도 효과(finalpop) 후 사라짐.
function _fxRunCount(box,line){
  return new Promise(function(res){
    var raw=+line.dataset.raw,final=+line.dataset.final,N=raw-final;
    var disc=box.querySelector('.fx-disc'),costNum=line.querySelector('.cost-num');
    var STEP=300;
    function pop(el){if(!el)return;el.classList.remove('pulse');void el.offsetWidth;el.classList.add('pulse');}
    function settleCost(){
      if(costNum){
        costNum.textContent=String(final);costNum.classList.add('discounted');
        costNum.classList.remove('blink2');void costNum.offsetWidth;costNum.classList.add('blink2'); // 2번 깜빡
        setTimeout(function(){costNum.classList.remove('blink2','cost-zoom');res();},760); // 깜빡 후 원래 크기 복귀
      }else res();
    }
    function finish(){
      // 마지막 숫자까지 팝(finalpop) 후 사라짐 — 효과 없이 그냥 사라지던 것 보완
      if(disc&&disc.parentNode){
        disc.classList.remove('pulse');void disc.offsetWidth;disc.classList.add('finalpop');
        setTimeout(function(){if(disc&&disc.parentNode)disc.parentNode.removeChild(disc);settleCost();},300);
      }else settleCost();
    }
    if(disc)pop(disc); // 첫 숫자(-N)도 팝
    var k=0;
    (function tick(){
      k++;
      if(costNum)costNum.textContent=String(raw-k);   // 비용 10→9→8→7
      var dv=N-k;
      if(dv>0){
        if(disc){disc.textContent='-'+dv;pop(disc);}  // 할인 -3→-2→-1, 각 팝
        setTimeout(tick,STEP);
      }else{
        setTimeout(finish,STEP);                       // 마지막 비트 — disc는 -1 유지하다 finalpop으로 사라짐
      }
    })();
  });
}
// §4q v7 (피터공) — 스텝 = (선택지 × 할인 자원). 시간 먼저, 에너지 다음, 그다음 선택지.
function runDiscountCascade(area,targetCut){
  var _unlock=function(){_cascadeBusy=false;if(area)area.classList.remove('cascade-locked');};
  if(!area){_cascadeBusy=false;return;}
  var cards=Array.prototype.slice.call(area.querySelectorAll('.choice-card'));
  var panel=currentRow&&currentRow.querySelector('[data-cut="'+targetCut+'"]');
  var host=panel&&panel.querySelector('.panel-body');
  var steps=[];
  cards.forEach(function(card){
    var lines=_fxDiscountedLines(card);
    lines.sort(function(a,b){return (a.dataset.res==='time'?0:1)-(b.dataset.res==='time'?0:1);}); // 시간 먼저
    lines.forEach(function(l){steps.push({card:card,line:l});});
  });
  if(!steps.length||!host){_unlock();return;}
  panel.classList.add('dfx-host');
  host.innerHTML='';host.style.position='relative'; // 절대배치 기준
  var idx=0;
  function done(){if(host){host.innerHTML='';host.style.position='';}if(panel)panel.classList.remove('dfx-host');_unlock();}
  function step(){
    if(idx>=steps.length){done();return;}
    var s=steps[idx],box=_fxBuildSectionBox(s.card,s.line,host);
    var btn=box.querySelector('.fx-confirm');
    var go=function(){
      if(btn)btn.disabled=true;
      _fxRunCount(box,s.line).then(function(){if(box.parentNode)box.parentNode.removeChild(box);idx++;step();}); // 카운트 후 다음
    };
    if(btn)btn.onclick=go;else go();
  }
  step();
}
// 선택지 영역에 할인이 하나라도 있으면 즉시 잠금 + 카드 다 뜬 뒤 캐스케이드 시작 (targetCut: 정보창 띄울 옆 칸)
// §4q v9 (6/16) — 자동 전체 캐스케이드 폐기. 아래 selectChoiceWithDiscount(선택 후 그 선택지만)로 대체. (호환 위해 함수 유지·미사용)
function _scheduleCascade(area,count,targetCut){
  if(!area)return;
  var any=Array.prototype.slice.call(area.querySelectorAll('.cost-line')).some(function(l){return (+l.dataset.raw)>(+l.dataset.final);});
  if(!any)return;
  _cascadeBusy=true;area.classList.add('cascade-locked');
  setTimeout(function(){runDiscountCascade(area,targetCut);},count*120+550);
}
// §4q v9 (6/16 피터공) — 선택 → 선택할인 → 다음. 클릭한 선택지의 할인만 순차(시간→에너지) 적용 후 proceedFn 호출.
// 할인 없으면 바로 진행. 적용하기 버튼·카운트 연출은 동일(_fxBuildSectionBox/_fxRunCount 재사용).
function runChoiceDiscount(card,targetCut){
  return new Promise(function(resolve){
    var lines=_fxDiscountedLines(card);
    lines.sort(function(a,b){return (a.dataset.res==='time'?0:1)-(b.dataset.res==='time'?0:1);});
    var panel=currentRow&&currentRow.querySelector('[data-cut="'+targetCut+'"]');
    var host=panel&&panel.querySelector('.panel-body');
    if(!lines.length||!host){resolve();return;}
    _cascadeBusy=true;
    var area=card.parentNode;if(area)area.classList.add('cascade-locked');
    card.classList.add('fx-selected'); // §4q v9.4 — 선택한 카드 표식 → 비선택 카드 회색 처리(CSS)
    panel.classList.add('dfx-host');
    host.innerHTML='';host.style.position='relative';
    var idx=0;
    function done(){
      if(host){host.innerHTML='';host.style.position='';}
      if(panel)panel.classList.remove('dfx-host');
      _cascadeBusy=false;if(area)area.classList.remove('cascade-locked');
      card.classList.remove('fx-selected');
      resolve();
    }
    function step(){
      if(idx>=lines.length){done();return;}
      var box=_fxBuildSectionBox(card,lines[idx],host);
      var btn=box.querySelector('.fx-confirm');
      var go=function(){
        if(btn)btn.disabled=true;
        _fxRunCount(box,lines[idx]).then(function(){if(box.parentNode)box.parentNode.removeChild(box);idx++;step();});
      };
      if(btn)btn.onclick=go;else go();
    }
    step();
  });
}
// 선택지 클릭 핸들러: 할인 있으면 그 선택지 할인 박스 → 적용 후 진행 / 없으면 바로 진행
function selectChoiceWithDiscount(choiceId,card,proceedFn,targetCut){
  if(_cascadeBusy)return;
  if(!_fxDiscountedLines(card).length){proceedFn(choiceId);return;}
  runChoiceDiscount(card,targetCut).then(function(){proceedFn(choiceId);});
}

// §23 — 1차 선택지를 Cut 1 body 아래에 펼침
function _scrollChoicesIntoView(area,count){
  setTimeout(function(){
    if(!area)return;
    var hud=_hudOffset();
    var avail=window.innerHeight-hud;
    var rect=area.getBoundingClientRect();
    if(rect.height<=avail-16){
      // 질문+선택지 전체가 한 화면에 들어가면 영역 top을 HUD 바로 아래로 (3개 다 보이게)
      var top=rect.top+window.pageYOffset-hud-12;
      window.scrollTo({top:Math.max(0,top),behavior:'smooth'});
    }else{
      // 너무 길어 한 화면에 안 들어가면 마지막 선택지라도 보이도록
      var last=area.lastElementChild;
      if(last)last.scrollIntoView({behavior:'smooth',block:'nearest'});
    }
  },count*120+300);
}
function showTier1Choices(){
  if(btnGuard('showTier1Choices'))return;
  var sc=getScenario();
  var btn=currentRow.querySelector('[data-cut="1"] .advance-wrap');if(btn)btn.style.display='none';
  var body=currentRow.querySelector('[data-cut="1"] .panel-body');
  var area=document.createElement('div');area.className='choices-area';area.id='tier1-choices';
  area.innerHTML='<div class="choices-q">'+_t('game_flow.questions.tier1','어떻게 할까?')+'</div>';
  body.appendChild(area);
  var costs=sc.tier1.map(function(c){return getTier1Cost(c.id);});
  sc.tier1.forEach(function(c,i){
    var card=document.createElement('div');
    var afford=canAffordCost(costs[i]);
    card.className='choice-card choice-card-nocost'+(afford?'':' disabled');
    if(afford)card.onclick=function(){onTier1(c.id);};
    var tag=afford?'':'<span class="insufficient-tag">'+_t('game_flow.insufficient','자원 부족')+'</span>';
    card.innerHTML='<div class="choice-header"><span class="choice-num">'+c.id+'</span><span class="choice-text">'+c.label+tag+'</span></div>';
    area.appendChild(card);
    setTimeout(function(){card.classList.add('visible');},i*120+150);
  });
  _scrollChoicesIntoView(area,sc.tier1.length);
  updateStats();
  if(_checkAllUnaffordable(costs))triggerGameOver();
}

// §23 — Cut 2 활성화: 이미지 + 1차 선택 요약 + "더 자세히" 버튼
function showCut2Summary(){
  var sc=getScenario(),t1=gameState.selectedTier1;
  var t1obj=sc.tier1.find(function(x){return x.id===t1;});
  setPanelImage(2,_t('game_flow.panel_labels.tier1_choice','1차 선택'));
  var panel=activatePanel(2);
  panel.querySelector('.panel-body').innerHTML=
    '<div class="chosen-summary"><div class="chosen-label">'+_t('game_flow.chosen_labels.tier1','1차 선택')+'</div><div class="chosen-title">'+t1+'. '+t1obj.label+'</div><div class="chosen-way">'+t1obj.desc+'</div></div>'+
    '<div class="advance-wrap"><button class="advance-btn" onclick="showTier2Choices()">'+_t('game_flow.buttons.tier2_advance','더 자세히 — 어떻게 할까? →')+'</button></div>';
}

// §23 — 2차 선택지를 Cut 2 body 아래에 펼침
function showTier2Choices(){
  if(btnGuard('showTier2Choices'))return;
  var sc=getScenario(),t1=gameState.selectedTier1;
  var btn=currentRow.querySelector('[data-cut="2"] .advance-wrap');if(btn)btn.style.display='none';
  var body=currentRow.querySelector('[data-cut="2"] .panel-body');
  var area=document.createElement('div');area.className='choices-area';area.id='tier2-choices';
  area.innerHTML='<div class="choices-q">'+_t('game_flow.questions.tier2','더 자세히 — 어떻게 할까?')+'</div>';
  body.appendChild(area);
  var t2list=sc.tier2[t1];
  var costs=t2list.map(function(c){return getTier2Cost(c.id);});
  t2list.forEach(function(c,i){
    var card=document.createElement('div');
    var afford=canAffordCost(costs[i]);
    card.className='choice-card'+(afford?'':' disabled');
    if(afford)card.onclick=function(){selectChoiceWithDiscount(c.id,card,onTier2,3);}; // §4q v9 — 선택→선택할인→다음
    var costHTML=buildCostHTML(costs[i]);
    var mark=afford?getCardDiscountMark('tier2',c.id):'';
    var tag=afford?'':'<span class="insufficient-tag">'+_t('game_flow.insufficient','자원 부족')+'</span>';
    card.innerHTML='<div class="choice-header"><span class="choice-num">'+(i+1)+'</span><span class="choice-text">'+c.label+mark+tag+'</span></div>'+costHTML;
    area.appendChild(card);
    setTimeout(function(){card.classList.add('visible');},i*120+150);
  });
  _scrollChoicesIntoView(area,t2list.length);
  updateStats();
  if(_checkAllUnaffordable(costs))triggerGameOver();
  // §4q v9 — 자동 캐스케이드 폐기: 선택 클릭 시 selectChoiceWithDiscount가 그 선택지 할인만 띄움
}

// §23 — Cut 3 활성화: 이미지 + 2차 선택 요약 + "결과 확인하기" 버튼
function showCut3Summary(){
  var sc=getScenario(),t2=gameState.selectedTier2;
  var t2obj=null;
  ['A','B','C'].forEach(function(g){if(!t2obj&&sc.tier2[g])t2obj=sc.tier2[g].find(function(x){return x.id===t2;});});
  setPanelImage(3,_t('game_flow.panel_labels.tier2_choice','2차 선택'));
  var panel=activatePanel(3);
  if(panel)panel.classList.remove('dfx-host'); // §4q 할인 정보창 → 선택 요약으로 전환
  // §4g v8 — "위임 깊이: ±N" 줄 제거 (피터공)
  panel.querySelector('.panel-body').innerHTML=
    '<div class="chosen-summary"><div class="chosen-label">'+_t('game_flow.chosen_labels.tier2','2차 선택')+'</div><div class="chosen-title">'+t2+'. '+t2obj.label+'</div></div>'+
    '<div class="advance-wrap"><button class="advance-btn" onclick="goCut4()">'+_t('game_flow.buttons.result_advance','결과 확인하기 →')+'</button></div>';
}

// 컷 4: 결과 (raw 결과물) — §23: "결과 확인하기" 클릭 시 호출
function goCut4(){
  if(btnGuard('goCut4'))return;
  var sc=getScenario(),t2=gameState.selectedTier2;
  var t2obj=null;
  ['A','B','C'].forEach(function(g){if(!t2obj&&sc.tier2[g])t2obj=sc.tier2[g].find(function(x){return x.id===t2;});});
  var c3btn=currentRow.querySelector('[data-cut="3"] .advance-wrap');if(c3btn)c3btn.style.display='none';
  setPanelImage(4,_t('game_flow.panel_labels.result','결과'));
  var panel=activatePanel(4);
  var result=sc.results[t2];
  var t2Pts=getTier2Points(sc,t2);
  var _metaTpl=_t('game_flow.result_meta','{summary} (이 행동의 점수 {points}점)');
  var _metaStr=_metaTpl.replace('{summary}',result.summary).replace('{points}',t2Pts.points);
  panel.querySelector('.panel-body').innerHTML=
    '<p class="highlight">'+_t('game_flow.result_prefix','결과 — ')+sc.title+'</p>'+
    '<div class="result-text">'+result.text+'</div>'+
    '<div class="result-meta">'+_metaStr+'</div>'+
    '<div class="advance-wrap"><button class="advance-btn" onclick="showReviewChoices()">'+_t('game_flow.buttons.review_advance','검토할까? →')+'</button></div>';
  trackEvent('result_viewed',{scenarioId:sc.id,tier2:t2,tier2Points:t2Pts.points});
  updateStats();
}

// §23 — 검토 선택지를 Cut 4 body 아래에 펼침
function showReviewChoices(){
  if(btnGuard('showReviewChoices'))return;
  var sc=getScenario();
  var btn=currentRow.querySelector('[data-cut="4"] .advance-wrap');if(btn)btn.style.display='none';
  var body=currentRow.querySelector('[data-cut="4"] .panel-body');
  var area=document.createElement('div');area.className='choices-area';area.id='review-choices';
  area.innerHTML='<div class="choices-q">'+_t('game_flow.questions.review','제출 전, 어떻게 검토할까?')+'</div>';
  body.appendChild(area);
  var t2cur=gameState.selectedTier2;
  var costs=sc.reviews.map(function(r){return getReviewCost(t2cur+r.id);});
  sc.reviews.forEach(function(r,i){
    var card=document.createElement('div');
    var afford=canAffordCost(costs[i]);
    card.className='choice-card'+(afford?'':' disabled');
    if(afford)card.onclick=function(){selectChoiceWithDiscount(r.id,card,onReview,5);}; // §4q v9 — 선택→선택할인→다음
    var costHTML=buildCostHTML(costs[i]);
    var leafKey=t2cur+r.id;
    var mark=afford?getCardDiscountMark('review',leafKey):'';
    var tag=afford?'':'<span class="insufficient-tag">'+_t('game_flow.insufficient','자원 부족')+'</span>';
    var leafLabel=(sc.reviewLabels&&sc.reviewLabels[leafKey])||r.label;
    card.innerHTML='<div class="choice-header"><span class="choice-num">'+r.id.replace(/^R/,'')+'</span><span class="choice-text">'+leafLabel+mark+tag+'</span></div>'+costHTML;
    area.appendChild(card);
    setTimeout(function(){card.classList.add('visible');},i*120+150);
  });
  _scrollChoicesIntoView(area,sc.reviews.length);
  updateStats();
  if(_checkAllUnaffordable(costs))triggerGameOver();
  // §4q v9 — 자동 캐스케이드 폐기: 선택 클릭 시 selectChoiceWithDiscount가 그 선택지 할인만 띄움
}

// §23 — Cut 5 활성화: 이미지 + 검토 선택 요약
function showCut5Summary(){
  var sc=getScenario(),leaf=getLeafPath();
  var rvObj=sc.reviews.find(function(x){return x.id===gameState.selectedReview;});
  var supplement=sc.reviewSupplements[leaf]||'';
  var rvLabelLeaf=(sc.reviewLabels&&sc.reviewLabels[leaf])||rvObj.label;
  setPanelImage(5,_t('game_flow.panel_labels.review','검토'));
  var panel=activatePanel(5);
  if(panel)panel.classList.remove('dfx-host'); // §4q 할인 정보창 → 선택 요약으로 전환
  panel.querySelector('.panel-body').innerHTML='<div class="chosen-summary"><div class="chosen-label">'+_t('game_flow.chosen_labels.review','검토 선택')+'</div><div class="chosen-title">'+rvObj.id.replace(/^R/,'')+'. '+rvLabelLeaf+'</div>'+(supplement?'<div class="chosen-way">'+supplement+'</div>':'')+'</div>';
}

// 컷 6: 최종 점수 + 아이템 + 자각 + 경험치/레벨업 (Phase 4 통합)
function goCut6(){
  var sc=getScenario(),leaf=getLeafPath(),fin=sc.finals[leaf];
  setPanelImage(6,_t('game_flow.panel_labels.final','최종'));
  var panel=activatePanel(6);
  // v0.8 — CSV 최종등급 lookup
  var grade=getFinalGrade(leaf);
  var item=fin?fin.item:null;
  var awareness=fin?(fin.shortFeedback||fin.awareness||''):'';
  // cut6 panel-image에 등급+점수 큰 글자로 표시 (이미지 대신, final-grade 컬러 매칭)
  var c6img=currentRow.querySelector('[data-cut="6"] .panel-image');
  if(c6img){
    var gradeColor=({S:'#5fbf95',A:'#5fbf95',B:'#000',C:'#d9b620',D:'#d63f7a'})[grade]||'#000';
    var replayInGrade=(grade==='C'||grade==='D');
    var gradeHTML='<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;">';
    gradeHTML+='<div style="font-size:140px;font-weight:700;color:'+gradeColor+';letter-spacing:-4px;line-height:1;">'+grade+'</div>';
    gradeHTML+='<div style="font-size:28px;color:#444;font-weight:600;">'+gameState.score+'점</div>';
    if(replayInGrade){
      gradeHTML+='<button id="replay-btn-grade" style="margin-top:12px;padding:10px 28px;font-size:14px;font-weight:700;background:#ffd93d;color:#000;border:3px solid #000;border-radius:0;cursor:pointer;letter-spacing:0.5px;box-shadow:4px 4px 0 #000;transition:transform 0.05s,box-shadow 0.05s;" onmousedown="this.style.transform=\'translate(2px,2px)\';this.style.boxShadow=\'2px 2px 0 #000\'" onmouseup="this.style.transform=\'none\';this.style.boxShadow=\'4px 4px 0 #000\'" onmouseleave="this.style.transform=\'none\';this.style.boxShadow=\'4px 4px 0 #000\'">'+_t('game_flow.buttons.replay_grade','다시 도전하기')+'</button>';
    }
    gradeHTML+='</div><span class="cut-num">6</span><span class="panel-place">최종</span>';
    c6img.innerHTML=gradeHTML;
    if(replayInGrade){
      var gradeReplayBtn=document.getElementById('replay-btn-grade');
      if(gradeReplayBtn)gradeReplayBtn.onclick=function(){
        gradeReplayBtn.disabled=true;
        var replaySug=fin?fin.replaySuggestion:'';
        if(replaySug){
          var sugDiv=document.createElement('div');
          sugDiv.style.cssText='margin-top:10px;max-width:280px;padding:8px 12px;background:#fff;border:3px solid #000;border-radius:0;font-size:13px;line-height:1.5;color:#000;text-align:center;box-shadow:4px 4px 0 #000;';
          sugDiv.textContent=replaySug;
          gradeReplayBtn.parentNode.appendChild(sugDiv);
        }
        setTimeout(function(){replayScenario(scid);},replaySug?1500:0);
      };
    }
  }

  // === Phase 4 통합 흐름 ===
  var expGain=calculateExpGain(leaf);
  var prevExp=gameState.exp.current;
  var prevLevel=gameState.exp.level;
  gameState.exp.current+=expGain;
  var didLevelUp=checkLevelUp(prevExp,gameState.exp.current);
  var newLevel=gameState.exp.level;
  // v0.5 Phase 8.7 — 부분 회복 hook 제거 (DECISIONS §10.1). RP 시스템(8.8)에서 적립으로 대체
  if(didLevelUp)applyLevelUpMeterIncrease(newLevel);
  // v0.5 Phase 8.8 — 자원토큰(RP) 적립 (DECISIONS §10.2~10.3)
  var rpAwardInfo=awardRP(grade,didLevelUp,newLevel);
  // 9. scenarioRepeatCount 증가 (작업 8)
  var scid=gameState.currentScenarioId;
  gameState.scenarioRepeatCount[scid]=(gameState.scenarioRepeatCount[scid]||0)+1;

  // === v0.8 결과 화면 구성 — v12 간소화 (SPEC §15) ===
  // Cut6: 등급/점수 + awareness(결과 설명) + CUT6 보정 피드백(하단 메시지) + 버튼
  // 선택 경로 → 리포트로 이동, 획득 카드 → 팝업/인벤토리, 리플레이 제안 → 버튼 클릭 시만
  var h='';
  var dlgDelta=(gameState.pending&&typeof gameState.pending.delegation==='number')?gameState.pending.delegation:0;
  var knlDelta=(gameState.pending&&typeof gameState.pending.knowledge==='number')?gameState.pending.knowledge:0;
  var dlgTotal=gameState.competencies.delegationChoice.value+dlgDelta;
  var knlTotal=gameState.competencies.knowledge.value+knlDelta;

  // ① awareness — 결과 설명
  if(awareness){
    h+='<div class="result-awareness" style="margin-bottom:16px;font-size:16px;line-height:1.6;color:var(--ink-mute);">'+awareness+'</div>';
  }

  // ② CUT6 보정 피드백 — 하단 메시지
  var cut6Fb=fin?fin.cut6Feedback:'';
  if(cut6Fb){
    h+='<div class="result-feedback" style="margin-bottom:16px;padding:12px 14px;background:#f4f1ea;border:3px solid #000;border-radius:0;font-size:14px;line-height:1.6;color:#000;">'+cut6Fb+'</div>';
  }

  // ③ B — low key 리플레이 버튼 (C/D는 등급 박스에, S/A는 없음)
  if(grade==='B'){
    h+='<div style="text-align:center;margin-top:8px;"><button class="replay-btn" id="replay-btn-cut6" style="background:#fff;border:3px solid #000;padding:6px 16px;font-size:12px;color:#000;cursor:pointer;border-radius:0;box-shadow:4px 4px 0 #000;">'+_t('game_flow.buttons.replay','이 시나리오 다시 해보기')+'</button></div>';
  }

  panel.querySelector('.panel-body').innerHTML=h;
  var replayBtn=document.getElementById('replay-btn-cut6');
  if(replayBtn){
    replayBtn.onclick=function(){
      replayBtn.disabled=true;
      var replaySug=fin?fin.replaySuggestion:'';
      if(replaySug){
        var sugDiv=document.createElement('div');
        sugDiv.style.cssText='margin-top:8px;padding:10px;background:#f4f1ea;border:3px solid #000;border-radius:0;font-size:13px;line-height:1.5;color:#000;';
        sugDiv.textContent=replaySug;
        replayBtn.parentNode.insertBefore(sugDiv,replayBtn.nextSibling);
      }
      setTimeout(function(){replayScenario(scid);},replaySug?1500:0);
    };
  }
  trackEvent('final_viewed',{scenarioId:sc.id,leaf:leaf,score:gameState.score,grade:grade,item:item});

  // 시나리오 완료 처리
  // 5/3 세션278+ — 종합 리포트용 Δ/누적 스냅샷 동봉 (흡수 직전 시점, 위 dlgDelta·knlDelta·dlgTotal·knlTotal과 동일)
  gameState.scenarioHistory.push({
    scenarioId:sc.id,
    tier1:gameState.selectedTier1,
    tier2:gameState.selectedTier2,
    review:gameState.selectedReview,
    leaf:leaf,
    finalScore:gameState.score,
    grade:grade,
    item:item,
    dlgDelta:dlgDelta,
    knlDelta:knlDelta,
    dlgTotal:dlgTotal,
    knlTotal:knlTotal,
    discounts:(gameState._scDiscounts||[]).slice() // §3a R2 — 영수증 재료 (할인 사용 내역)
  });
  gameState.completed=true;

  // 이벤트 로그 (작업 9)
  trackEvent('exp_gained',{leafPath:leaf,grade:grade,baseScore:(sc.finals&&sc.finals[leaf])?sc.finals[leaf].score:0,gainedExp:expGain,expBefore:prevExp,expAfter:gameState.exp.current,level:newLevel});
  if(didLevelUp){
    trackEvent('level_up',{prevLevel:prevLevel,newLevel:newLevel,expAtLevelUp:gameState.exp.current,newTimeMax:gameState.resources.time.max,newEnergyMax:gameState.resources.energy.max});
  }
  trackEvent('scenario_completed',{scenarioId:sc.id,leaf:leaf,score:gameState.score,grade:grade});

  saveGame();
  updateStats();

  // 레벨업 애니메이션 (작업 7)
  if(didLevelUp){
    setTimeout(function(){
      flashLevelUpUI();
      pulseExpLevel();
    },400);
  }

  // v0.9 — 리플레이 판정 (덱스 12-ari-challenge-card-bug.md 권장안 적용)
  // 완료 처리 전 상태를 먼저 저장 — played가 완료 전부터 true였는지로 판단
  if(!gameState.replay)gameState.replay={};
  var replayState=gameState.replay[scid];
  var wasReplay=replayState&&replayState.played===true;
  var challengeAwardedNow=false;
  if(!replayState){
    // 방어 코드 — startScenario에서 보통 이미 만들어져 있지만 없을 경우 대비
    replayState=gameState.replay[scid]={played:true,improved:false,bestScore:gameState.score,bestGrade:grade,resourceSnapshot:{time:gameState.resources.time.current,energy:gameState.resources.energy.current}};
  } else if(!wasReplay){
    // 첫 플레이 완료
    replayState.played=true;
    replayState.improved=false;
    replayState.bestScore=gameState.score;
    replayState.bestGrade=grade;
  } else {
    // 진짜 리플레이 완료
    if(gameState.score>replayState.bestScore){
      replayState.bestScore=gameState.score;
      replayState.bestGrade=grade;
      if(!replayState.improved){
        replayState.improved=true;
        challengeAwardedNow=true;
        if(!gameState.inventory.growthCards)gameState.inventory.growthCards=[];
        gameState.inventory.growthCards.push({label:'도전력',scenario:scid,leaf:leaf});
      }
    }
  }

  // v0.5: 컷6 결과로 충분 → 활동 리포트 거치지 않고 바로 다음 시나리오/종합 리포트
  var nw=document.getElementById('next-wrap');
  var nb=document.getElementById('next-btn');
  var clearedAfter=(gameState.clearedScenarios||[]).slice();
  if(clearedAfter.indexOf(scid)<0)clearedAfter.push(scid);
  var willBeAllDone=(clearedAfter.length>=CONFIG.scenarios.length);
  nb.textContent=willBeAllDone?_t('game_flow.buttons.report','AI 리터러시 성장 리포트'):_t('game_flow.buttons.next_scenario','다음 시나리오로 →');
  nb.onclick=goNextScenario;

  // 시나리오 끝 chain (SPEC §6.3, v0.9 — RP 분배 제거, 에너지 자동 회복)
  // 결과 패널 1.4초 보여주고 → [0] pending 흡수 → [1] 카드 → [2] 레벨업 → [3] RP → [3.5] 철컥(시나리오 완료) → [4] 회복력 특별 UI(B 이하) → 다음 버튼
  // 6/16 — 회복력 모달은 카드 획득·철컥이 다 끝난 맨 끝으로 (피터공: 카드 팝업과 연속으로 뜨던 문제)
  var _v8CardLabels=[];
  var _hasRecoveryCard=false;
  // 6/11 파일럿 — 선택별 획득 시나리오: 검토 카드는 onReview에서 즉시 지급·레일 표시(§2b). 결말 일괄 지급 없음.
  var _pilotPC=(typeof pilotPerChoiceActive==='function')&&pilotPerChoiceActive(scid);
  if(!_pilotPC&&fin&&fin.cardEarned){
    if(fin.humanCentricAxis&&fin.humanCentricTag)_v8CardLabels.push('['+fin.humanCentricAxis+'] '+fin.humanCentricTag);
    if(fin.domainCards)for(var _di=0;_di<fin.domainCards.length;_di++)_v8CardLabels.push(fin.domainCards[_di]);
  }
  // 회복력은 B 이하만 — 특별 UI로 표시
  if(grade==='B'||grade==='C'||grade==='D')_hasRecoveryCard=true;
  // 도전력은 리플레이 완료 시 — wasReplay 기반 (덱스 권장안)
  if(challengeAwardedNow){
    _v8CardLabels.push('도전력');
  }
  setTimeout(function(){
    var chain=Promise.resolve();
    // [0] §12 pending → 누적 흡수 (원 마커가 게이지로 흘러내림)
    chain=chain.then(function(){return absorbPending();});
    // [1] v0.9 카드 reward — 인간중심 + 도메인 + 도전력 (회복력 제외)
    if(_v8CardLabels.length){
      chain=chain.then(function(){return playCardRewardSequential(_v8CardLabels,'');});
    }
    // [2] 레벨업 — 레벨 표시 + 보너스 RP 안내 (에너지 자동 충전 없음)
    if(didLevelUp){
      chain=chain.then(function(){return showLevelUpModal(prevLevel,newLevel);});
    }
    // [3] v0.9 세션322 — RP 직접 배분 (학기 끝 아닐 때만)
    if(!willBeAllDone){
      chain=chain.then(function(){return showRPDistributionModal();});
    }
    // [3.5] §2b — 레일 카드 → 역량카드 버튼 비행 (레일 비면 no-op, 비파일럿 영향 없음)
    if(typeof railFlyToInventory==='function'){
      chain=chain.then(function(){return railFlyToInventory();});
    }
    // [4] 회복력 특별 UI — B 이하만, 화면 중앙, 리플레이 진입점.
    // 6/16 피터공: 카드 획득 팝업·철컥(시나리오 완료)이 모두 끝난 뒤에 띄운다 (체인 맨 끝으로 이동).
    if(_hasRecoveryCard){
      chain=chain.then(function(){return showRecoveryCardModal(scid);});
    }
    chain.then(function(){
      var c6body=currentRow.querySelector('[data-cut="6"] .panel-body');
      if(c6body){
        var d=document.createElement('div');
        d.style.cssText='text-align:center;margin-top:16px;padding-top:12px;border-top:2px dashed var(--ink-soft);';
        var btn=document.createElement('button');
        btn.className='next-btn';
        btn.style.cssText='width:100%;padding:14px;font-size:15px;';
        btn.textContent=nb.textContent;
        btn.onclick=goNextScenario;
        d.appendChild(btn);
        c6body.appendChild(d);
      }
    });
  },1400);
}

