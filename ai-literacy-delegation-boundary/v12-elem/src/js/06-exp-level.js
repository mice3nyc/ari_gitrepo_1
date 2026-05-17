// =====================================================
// 6c. Exp + Level System (v0.4 신규 — SPEC §3, Phase 4)
// =====================================================

// 작업 3: 경험치 획득 계산 (SPEC §3.2)
function calculateExpGain(leafPath){
  var sc=getScenario();
  var finals=sc.finals||{};
  var leaf=finals[leafPath];
  if(!leaf||!leaf.score)return 0;
  return Math.floor(leaf.score*(CONFIG.expScoreMultiplier||0.3));
}

// 작업 4: 레벨업 트리거 검출 (SPEC §3.1)
// v0.5: 한 번에 한 단계만 + 잉여 exp 손실 (다음 단계 0부터 카운트)
function checkLevelUp(prevExp,newExp){
  var thr=CONFIG.expThresholds; // [0,20,50,100,200] cumulative
  var prevLevel=gameState.exp.level;
  if(prevLevel>=5)return false; // MAX
  var nextThresh=thr[prevLevel]; // Lv1→thr[1]=20, Lv2→thr[2]=50, ...
  if(newExp>=nextThresh){
    gameState.exp.level=prevLevel+1;
    gameState.exp.current=nextThresh; // 잉여 exp 손실 — 다음 단계 0부터
    return true;
  }
  return false;
}

// 작업 5: 레벨업 시 미터 max 증가 (SPEC §11.4)
function applyLevelUpMeterIncrease(newLevel){
  var mbl=CONFIG.meterMaxByLevel[newLevel];
  if(!mbl)return;
  gameState.resources.time.max=mbl.time;
  gameState.resources.energy.max=mbl.energy;
}

// 작업 7: 레벨업 알림 UI — 좌측 패널 노란 깜빡
function flashLevelUpUI(){
  var bar=document.getElementById('resource-bar');
  if(!bar)return;
  bar.classList.remove('flash-levelup');
  // reflow trigger
  void bar.offsetWidth;
  bar.classList.add('flash-levelup');
  setTimeout(function(){bar.classList.remove('flash-levelup');},900);
}

// 경험치 바 UI 업데이트 — XP 진행률만. LV은 중앙 디스플레이가 담당
function updateExpUI(){
  if(!gameState||!gameState.exp)return;
  var exp=gameState.exp;
  var lv=exp.level;
  var cur=exp.current;
  var thr=CONFIG.expThresholds;
  var numEl=document.getElementById('exp-num');
  var fillEl=document.getElementById('exp-bar-fill');
  var lvNumEl=document.getElementById('lv-num');
  if(!fillEl)return;
  if(lv>=5){
    if(numEl)numEl.textContent='MAX';
    fillEl.style.width='100%';
  } else {
    var nextThr=thr[lv];
    var prevThr=thr[lv-1];
    var pct=(nextThr>prevThr)?Math.min(100,(cur-prevThr)/(nextThr-prevThr)*100):100;
    if(numEl)numEl.textContent=cur+'/'+nextThr;
    fillEl.style.width=pct+'%';
  }
  if(lvNumEl)lvNumEl.textContent=lv;
}

// 레벨 숫자 numPulse — 중앙 LV 표시
function pulseExpLevel(){
  var lvNumEl=document.getElementById('lv-num');
  if(!lvNumEl)return;
  lvNumEl.classList.add('pulsing');
  setTimeout(function(){lvNumEl.classList.remove('pulsing');},600);
}

// 자원 부족 페널티 (SPEC §2.4 A안). calculateFinalScore에서 호출.
function calcResourcePenalty(resources){
  var timeShortage=Math.max(0,-(resources||gameState.resources).time.current);
  var energyShortage=Math.max(0,-(resources||gameState.resources).energy.current);
  return Math.floor((timeShortage+energyShortage)*0.5);
}

// Phase 6: 힌트 토글 영구 저장 + 토글 함수 (SPEC §4 — B안: 시작 화면 + 디버그 둘 다)
var HINT_PREF_KEY='ai-literacy-delegation-boundary-v05-hintpref';
function getHintPref(){
  var v=localStorage.getItem(HINT_PREF_KEY);
  if(v===null)return CONFIG.hintEnabledDefault;
  return v==='1';
}
function setHintPref(b){localStorage.setItem(HINT_PREF_KEY,b?'1':'0');}
function toggleHint(){
  if(gameState){
    gameState.hintEnabled=!gameState.hintEnabled;
    setHintPref(gameState.hintEnabled);
    saveGame();
    trackEvent('hint_toggled',{newState:gameState.hintEnabled,context:'inGame'});
    if(typeof renderDebug==='function')renderDebug();
  }else{
    var cur=getHintPref();
    setHintPref(!cur);
    trackEvent('hint_toggled',{newState:!cur,context:'startScreen'});
    showStartScreen();
  }
}

// v0.8 §6.6.1 — 합산 모델로 재작성. lookup(`finals[leaf+review].score`) 폐기.
// score = tier1.points + tier2.points + review.points + bonus
//       = (basePoint+varPoint) + (basePoint+varPoint) + R*.points + (cardMatch + resourceLeftover ≤ 10)
// 폐기 인자: useReviewLevelBoost / detected / levelStep / levelExtraBonus / cardSlots / cardsHeld / getCardBonus
function calculateFinalScore(leaf,reviewId){
  if(!leaf||!reviewId)return 0;
  var sc=getScenario();
  var fin=(sc.finals||{})[leaf];
  if(fin&&typeof fin.score==='number'){
    // v0.8 — CSV 최종점수 lookup (단일 진실)
    if(typeof console!=='undefined')console.log('[v0.8 debug] leaf='+leaf+' finalScore='+fin.score+' finalGrade='+fin.grade);
    return fin.score;
  }
  // fallback: v0.8 합산 모델 (finals에 score가 없을 때)
  var t1Id=leaf.charAt(0);
  var t2Id=leaf.substr(0,2);
  var t1=getTier1Points(sc,t1Id);
  var t2=getTier2Points(sc,t2Id);
  var rv=getReviewPoints(sc,reviewId);
  var ownedCards=(gameState.inventory&&gameState.inventory.competencyCards)||[];
  var cap=(typeof CONFIG.cardMatchBonusCap==='number')?CONFIG.cardMatchBonusCap:10;
  var cardMatchBonus=getCardMatchBonus(sc,leaf,ownedCards);
  var resourceLeftoverBonus=getResourceLeftoverBonus();
  var bonus=Math.min(cap,cardMatchBonus+resourceLeftoverBonus);
  var resourcePenalty=calcResourcePenalty(gameState.resources);
  return Math.max(0,t1.points+t2.points+rv.points+bonus-resourcePenalty);
}
function getFinalGrade(leaf){
  var sc=getScenario();
  var fin=(sc.finals||{})[leaf];
  if(fin&&fin.grade)return fin.grade;
  return getGrade(gameState.score);
}

