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
  // HUD (상단 패널)
  var hud=TEXTS.hud||{};
  var _hudMap={
    'resource-bar':'resource_title','res-time':'','res-energy':'',
    'stat-delegation':'','stat-name-knowledge':''
  };
  var _rbTitle=document.querySelector('#resource-bar .panel-title');
  if(_rbTitle && hud.resource_title)_rbTitle.textContent=hud.resource_title;
  var _sbTitle=document.querySelector('#stats-bar .panel-title');
  if(_sbTitle && hud.competency_title)_sbTitle.textContent=hud.competency_title;
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
}
_applyStaticTexts();

// §11 진입 분기 — 새 학기 + 튜토리얼 미시청만 타이틀 화면
// 진행 중인 학기(구버전 save 포함) 또는 튜토리얼 본 적 있으면 시나리오 선택으로
(function initEntry(){
  var saved=loadGame();
  var hasProgress=saved&&((saved.clearedScenarios||[]).length>0);
  var seen=saved&&saved.tutorialSeen===true;
  if(seen||hasProgress){
    showStartScreen();
  }else{
    showTitleScreen();
  }
})();
