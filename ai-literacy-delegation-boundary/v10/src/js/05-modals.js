// =====================================================
// v0.5 Phase 8.10 — 모달 (DECISIONS §10.5, §10.11)
// =====================================================

// 버튼 hold-to-repeat with acceleration: mousedown 즉시 1회 + 시작 간격(180ms)부터 0.93배수로 가속,
// 최소 간격(35ms)까지 단축. 손 떼면 즉시 중단 + 다음 누름 시 처음 간격부터 (가속 누적 X).
// disabled되면 자동 정지. setTimeout 재귀 패턴 (setInterval보다 동적 간격 제어 쉬움).
function bindHoldRepeat(btn,action){
  var START_INTERVAL=180, MIN_INTERVAL=35, ACCEL=0.93;
  var chargingTimer=null, currentInterval=START_INTERVAL;
  function tick(){
    if(btn.disabled){stop();return;}
    action();
    if(btn.disabled){stop();return;} // action으로 disabled가 됐을 수 있음 (RP=0, max 도달)
    currentInterval=Math.max(MIN_INTERVAL,currentInterval*ACCEL);
    chargingTimer=setTimeout(tick,currentInterval);
  }
  function start(e){
    if(e&&e.preventDefault)e.preventDefault();
    if(btn.disabled)return;
    if(chargingTimer)clearTimeout(chargingTimer); // 중복 누름 방어
    btn.classList.add('charging');
    action(); // 첫 충전 즉시
    if(btn.disabled){stop();return;}
    currentInterval=START_INTERVAL;
    chargingTimer=setTimeout(tick,currentInterval);
  }
  function stop(){
    if(chargingTimer){clearTimeout(chargingTimer);chargingTimer=null;}
    currentInterval=START_INTERVAL; // 가속 리셋
    btn.classList.remove('charging');
  }
  btn.onmousedown=start;
  btn.onmouseup=stop;
  btn.onmouseleave=stop;
  btn.ontouchstart=start;
  btn.ontouchend=stop;
  btn.ontouchcancel=stop;
}

// 8.10b — 레벨업 이벤트 팝업. Promise 반환 (확인 클릭 시 resolve).
// args: prevLevel, newLevel, prevMax{time,energy}, newMax{time,energy}, tokenBonus
// v0.9 — 에너지 회복 애니메이션 (바 상승 + 숫자 팝)
function showEnergyRecoverAnimation(){
  return new Promise(function(resolve){
    var res=gameState.resources;
    var before=res.energy.current;
    recoverResources('',false);
    var after=res.energy.current;
    var gained=after-before;
    if(gained<=0){updateResourceUI();resolve();return;}
    var el=document.getElementById('res-energy');
    var nm=document.getElementById('rnum-energy');
    var gauge=document.getElementById('rgauge-energy');
    var dl=document.getElementById('rdelta-energy');
    // 게이지 바 부드럽게 올리기
    gauge.style.transition='width 1.2s cubic-bezier(0.22,1,0.36,1), background 0.3s';
    var step=0;var steps=20;var dur=1200;
    var interval=setInterval(function(){
      step++;
      var t=step/steps;
      var eased=1-Math.pow(1-t,3);
      var cur=Math.round(before+gained*eased);
      nm.textContent=cur;
      var pct=res.energy.max>0?(cur/res.energy.max*100):0;
      gauge.style.width=pct+'%';
      gauge.style.background=gaugeColorByPct(pct);
      if(step>=steps){
        clearInterval(interval);
        nm.textContent=after;
        // 숫자 팝
        el.classList.add('flash-up');
        dl.textContent='+'+gained;
        dl.className='resource-change-indicator show up';
        dl.style.fontSize='18px';dl.style.fontWeight='900';
        setTimeout(function(){
          el.classList.remove('flash-up');
          dl.className='resource-change-indicator';
          dl.style.fontSize='';dl.style.fontWeight='';
          resolve();
        },1800);
      }
    },dur/steps);
  });
}
// v0.9 세션322 — 레벨업 모달 (에너지 자동 충전 폐기, 보너스 RP 적립 안내만)
function showLevelUpModal(prevLevel,newLevel){
  return new Promise(function(resolve){
    var modal=document.getElementById('levelup-modal');
    if(!modal){resolve();return;}
    document.getElementById('lvup-from').textContent='Lv.'+prevLevel;
    document.getElementById('lvup-to').textContent='Lv.'+newLevel;
    var lvBonus=CONFIG.rpLevelUpBonusByLevel[newLevel]||10;
    var tokenEl=document.getElementById('lvup-token-bonus');
    if(tokenEl)tokenEl.textContent='+'+lvBonus;
    modal.classList.remove('hidden');
    requestAnimationFrame(function(){modal.classList.add('visible');});
    var btn=document.getElementById('lvup-confirm');
    btn.onclick=function(){
      modal.classList.remove('visible');
      setTimeout(function(){modal.classList.add('hidden');resolve();},250);
    };
  });
}

// 8.10a — 자원토큰 분배 팝업. Promise 반환 (분배 완료 시 분배결과로 resolve).
// gameState.rp.balance를 모두 시간/에너지에 분배해야 활성화. use-it-or-lose-it.
function showRPDistributionModal(){
  return new Promise(function(resolve){
    var modal=document.getElementById('rp-modal');
    if(!modal||!gameState||!gameState.rp){resolve(null);return;}
    var balance=gameState.rp.balance;
    if(balance<=0){
      // 토큰 0이면 팝업 의미 없음. 바로 리졸브.
      resolve({applied:{time:0,energy:0},spent:0,balanceAfter:0,skipped:true});
      return;
    }
    var alloc={time:0,energy:0};
    var rt=gameState.resources.time, re=gameState.resources.energy;

    function update(){
      var spent=alloc.time*CONFIG.rpCost.time+alloc.energy*CONFIG.rpCost.energy;
      var remaining=balance-spent;
      var balNum=document.getElementById('rp-bal-num');
      balNum.textContent=remaining;
      balNum.classList.toggle('zero',remaining===0);

      // Time bucket
      var tCurrent=rt.current+alloc.time;
      var tClamp=Math.min(rt.max,tCurrent);
      var tWaste=tCurrent-tClamp;
      document.getElementById('rp-allocate-time').textContent='+'+alloc.time;
      var tNum=document.getElementById('rp-bucket-time-num');
      var _rpM=_t('modals.rp_distribution',{});
      var _wasteFmt=(_rpM.waste_format||'(+{alloc}, 손실 {waste})');
      tNum.innerHTML=tClamp+'/'+rt.max+(tWaste>0?' <span class="waste">'+_wasteFmt.replace('{alloc}',alloc.time).replace('{waste}',tWaste)+'</span>':'');
      document.getElementById('rp-bucket-time-fill').style.width=((rt.current/rt.max)*100)+'%';
      var tOver=document.getElementById('rp-bucket-time-overlay');
      var tApplied=tClamp-rt.current;
      tOver.style.left=((rt.current/rt.max)*100)+'%';
      tOver.style.width=((tApplied/rt.max)*100)+'%';

      // Energy bucket
      var eCurrent=re.current+alloc.energy;
      var eClamp=Math.min(re.max,eCurrent);
      var eWaste=eCurrent-eClamp;
      document.getElementById('rp-allocate-energy').textContent='+'+alloc.energy;
      var eNum=document.getElementById('rp-bucket-energy-num');
      eNum.innerHTML=eClamp+'/'+re.max+(eWaste>0?' <span class="waste">'+_wasteFmt.replace('{alloc}',alloc.energy).replace('{waste}',eWaste)+'</span>':'');
      document.getElementById('rp-bucket-energy-fill').style.width=((re.current/re.max)*100)+'%';
      var eOver=document.getElementById('rp-bucket-energy-overlay');
      var eApplied=eClamp-re.current;
      eOver.style.left=((re.current/re.max)*100)+'%';
      eOver.style.width=((eApplied/re.max)*100)+'%';

      // Preview
      var preview=document.getElementById('rp-preview');
      if(alloc.time||alloc.energy){
        var _prevFmt=(_rpM.preview_format||'→ 시간 +{time} / 에너지 +{energy} 충전');
        var p=_prevFmt.replace('{time}',tApplied).replace('{energy}',eApplied);
        var totalWaste=tWaste+eWaste;
        if(totalWaste>0)p+=' <span class="rp-overflow-warn">'+(_rpM.overflow_warn||'(메터 초과로 {waste} 손실)').replace('{waste}',totalWaste)+'</span>';
        preview.innerHTML=p;
        preview.classList.remove('empty');
      }else{
        preview.textContent=(_rpM.preview_empty||'토큰을 시간/에너지에 분배하세요');
        preview.classList.add('empty');
      }

      // Buttons enabled state — 미터 초과 불가
      var timeFull=(rt.current+alloc.time)>=rt.max;
      var energyFull=(re.current+alloc.energy)>=re.max;
      modal.querySelector('.rp-minus[data-axis="time"]').disabled=alloc.time<=0;
      modal.querySelector('.rp-plus[data-axis="time"]').disabled=remaining<=0||timeFull;
      modal.querySelector('.rp-minus[data-axis="energy"]').disabled=alloc.energy<=0;
      modal.querySelector('.rp-plus[data-axis="energy"]').disabled=remaining<=0||energyFull;
      var bothFull=timeFull&&energyFull;
      document.getElementById('rp-confirm').disabled=remaining!==0&&!bothFull;
    }

    // Reset alloc + bind buttons with hold-to-repeat (re-bind safe across invocations)
    var btns=modal.querySelectorAll('.rp-btn');
    btns.forEach(function(btn){
      bindHoldRepeat(btn,function(){
        var axis=btn.dataset.axis;
        var isPlus=btn.classList.contains('rp-plus');
        if(isPlus){
          var spent=alloc.time*CONFIG.rpCost.time+alloc.energy*CONFIG.rpCost.energy;
          if(balance-spent>0)alloc[axis]++;
        }else if(alloc[axis]>0){
          alloc[axis]--;
        }
        update();
      });
    });

    update();
    modal.classList.remove('hidden');
    requestAnimationFrame(function(){modal.classList.add('visible');});

    document.getElementById('rp-confirm').onclick=function(){
      var info=applyRPDistribution(alloc);
      modal.classList.remove('visible');
      setTimeout(function(){
        modal.classList.add('hidden');
        if(typeof updateStats==='function')updateStats();
        resolve(info);
      },250);
    };
  });
}

// 작업 6: 자원 회복 — v0.9: 시간 회복 없음, 에너지 고정 +18 (SPEC §19.2)
function recoverResources(grade,didLevelUp){
  var res=gameState.resources;
  var energyBefore=res.energy.current;
  res.energy.current=Math.min(res.energy.max,res.energy.current+CONFIG.energyRecoverFlat);
  trackEvent('resource_recovered',{
    grade:grade,
    energyRecoverFlat:CONFIG.energyRecoverFlat,
    energy_before:energyBefore,
    energy_after:res.energy.current,
    time_current:res.time.current
  });
}

