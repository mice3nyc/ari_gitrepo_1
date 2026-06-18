// =====================================================
// 13. Initialization
// =====================================================
// 5/3 — 정적 HTML 텍스트(GAME OVER 모달, 인벤토리 탭/패널, reset confirm) → texts.yaml inject
function _applyStaticTexts(){
  if(typeof TEXTS==='undefined' || !TEXTS) return;
  var U=TEXTS.ui_messages||{};
  function _set(id,val){var el=document.getElementById(id); if(el && val!=null) el.innerHTML=val;}
  // GAME OVER 모달
  var go=U.game_over||{};
  _set('gameover-title',go.title);
  _set('gameover-body',go.body);
  _set('gameover-time-label',go.time_label);
  _set('gameover-energy-label',go.energy_label);
  _set('gameover-btn-report',go.btn_report);
  _set('gameover-btn-restart',go.btn_restart);
  // 인벤토리 탭 + 패널 헤더 + 빈 상태
  var inv=U.inventory||{};
  _set('inv-tab-name',inv.tab_name);
  _set('inv-tab-desc',inv.tab_desc);
  _set('inv-panel-title',inv.panel_title);
  if(inv.empty){
    var list=document.getElementById('inv-list');
    if(list && list.children.length===1 && list.firstElementChild && list.firstElementChild.classList.contains('inv-empty')){
      list.firstElementChild.innerHTML=inv.empty;
    }
  }
  // HUD (상단 패널) — 6/11 개편: panel-title([자원]/[역량]) 제거됨
  var hud=TEXTS.hud||{};
  var _resNames=document.querySelectorAll('.resource-name');
  if(_resNames.length>=2){
    if(hud.time)_resNames[0].textContent=hud.time;
    if(hud.energy)_resNames[1].textContent=hud.energy;
  }
  var _statNames=document.querySelectorAll('.stat-name');
  if(_statNames.length>=1 && hud.delegation)_statNames[0].textContent=hud.delegation;
  var _knlEl=document.getElementById('stat-name-knowledge');
  if(_knlEl && hud.knowledge)_knlEl.textContent=hud.knowledge;
  // 모달 — 레벨업
  var ml=TEXTS.modals&&TEXTS.modals.levelup||{};
  var _lvBadge=document.querySelector('.lvup-badge');
  if(_lvBadge && ml.badge)_lvBadge.textContent=ml.badge;
  var _lvEffLabel=document.querySelector('.lvup-effect-label');
  if(_lvEffLabel && ml.token_bonus_label)_lvEffLabel.textContent=ml.token_bonus_label;
  var _lvBtn=document.getElementById('lvup-confirm');
  if(_lvBtn && ml.btn_confirm)_lvBtn.textContent=ml.btn_confirm;
  // 모달 — RP 분배
  var mr=TEXTS.modals&&TEXTS.modals.rp_distribution||{};
  var rpModal=document.getElementById('rp-modal');
  if(rpModal){
    var rpT=rpModal.querySelector('.modal-title');
    if(rpT && mr.title)rpT.textContent=mr.title;
    var rpS=rpModal.querySelector('.modal-subtitle');
    if(rpS && mr.subtitle){
      rpS.innerHTML=mr.subtitle+(mr.subtitle_hint?'<br><span style="font-size:11px;color:#888;">'+mr.subtitle_hint+'</span>':'');
    }
    var rpBL=rpModal.querySelector('.rp-bal-label');
    if(rpBL && mr.remaining_label)rpBL.textContent=mr.remaining_label;
    var rpBkLabels=rpModal.querySelectorAll('.rp-bucket-label');
    if(rpBkLabels.length>=2){
      if(hud.time)rpBkLabels[0].textContent=hud.time;
      if(hud.energy)rpBkLabels[1].textContent=hud.energy;
    }
    var rpPrev=document.getElementById('rp-preview');
    if(rpPrev && mr.preview_empty)rpPrev.textContent=mr.preview_empty;
    var rpConf=document.getElementById('rp-confirm');
    if(rpConf && mr.btn_confirm)rpConf.textContent=mr.btn_confirm;
  }
  // reset confirm 모달 — id 없는 부분은 querySelector로
  var rc=U.reset_confirm||{};
  var rcModal=document.getElementById('reset-confirm-modal');
  if(rcModal){
    var rcTitle=rcModal.querySelector('.modal-title');
    var rcSub=rcModal.querySelector('.modal-subtitle');
    var rcCancel=rcModal.querySelector('.confirm-cancel');
    var rcDestructive=rcModal.querySelector('.confirm-destructive');
    if(rcTitle && rc.title)rcTitle.innerHTML=rc.title;
    if(rcSub && rc.subtitle)rcSub.innerHTML=rc.subtitle;
    if(rcCancel && rc.btn_cancel)rcCancel.innerHTML=rc.btn_cancel;
    if(rcDestructive && rc.btn_destructive)rcDestructive.innerHTML=rc.btn_destructive;
  }
  // §17.2 — 시나리오 나가기 버튼 + 확인 모달 (세션467, 6/11)
  var gfBtns=TEXTS.game_flow&&TEXTS.game_flow.buttons||{};
  _set('scenario-exit',gfBtns.exit_scenario);
  var xc=U.exit_confirm||{};
  _set('exit-confirm-title',xc.title);
  _set('exit-confirm-subtitle',xc.subtitle);
  _set('exit-confirm-stay',xc.btn_cancel);
  _set('exit-confirm-go',xc.btn_destructive);
}
_applyStaticTexts();
if(typeof _initDevNav==='function')_initDevNav(); // CONFIG.debug일 때만 dev-nav 노출
// 배포(변종) 빌드 — 디버그 표면 전부 숨김 (피터공 6/18: 학교 라이브엔 디버그 노출 금지)
if(!CONFIG.debug){
  ['debug-panel','version-label','dev-nav'].forEach(function(id){var el=document.getElementById(id);if(el)el.style.display='none';});
  var _dt=document.querySelector('.debug-toggle');if(_dt)_dt.style.display='none';
}

// §11 진입 분기 → §4i-10 (피터공): 부팅은 항상 타이틀부터 (레트로 PRESS START 관례)
// 재방문 라우팅(튜토리얼 생략, 플래시 후 선택 화면)은 enterFromTitle이 처리.
(function initEntry(){
  var saved=loadGame();
  // v1.3 §14.1 (최서연샘) — 진행 중인 시나리오가 있으면 새로고침 시 그 위치로 자동 복원.
  // continueGame이 currentTier/selected 값으로 컷 단계까지 복원한다 ("이어서 진행"과 동일 엔진).
  if(saved&&saved.currentScenarioId&&!saved.completed){
    continueGame();
    return;
  }
  showTitleScreen();
})();
