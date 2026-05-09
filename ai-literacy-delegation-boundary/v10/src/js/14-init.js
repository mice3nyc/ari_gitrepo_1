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
