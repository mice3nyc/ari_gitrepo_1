// =====================================================
// 8d. Play Record 전송 (SPEC-log-transmit §7)
// 08b가 로컬 outbox에 쌓은 레코드를 우리 AWS 수집 API로 보낸다.
// 성공(200) → dequeueFromOutbox(pid). 실패 → 큐 유지, 다음 기회에 재시도(데이터 손실 없음).
// 08c(동현공 Lambda /log, game_start 참여 집계)와는 별개 시스템 — 엔드포인트도 다르다.
// 게임 흐름을 절대 막지 않는다: 전부 비동기 + try/catch, 실패는 조용히 넘어간다.
// =====================================================

var _LT_MAX_BYTES = 5120;   // 서버 payload 캡(SPEC §4)과 동일 — 초과분은 보내기 전에 거른다
var _lt_busy = false;       // 동시 flush 방지 (시나리오 종료가 연달아 불릴 때)

// 4xx는 재시도해도 안 고쳐지는 거부(스키마·크기) → 큐에서 뺀다. 큐 머리에 남아 뒤를 막지 않게.
// 403·429·5xx·네트워크 오류(CORS 실패 포함)는 유지 — 설정/일시 장애라 나중에 성공할 수 있다.
function _ltIsPermanentReject(status) {
  return status === 400 || status === 413 || status === 422;
}

function _ltSendOne(rec, onDone) {
  var body;
  try { body = JSON.stringify(rec); } catch (e) { onDone(false, true); return; }
  if (body.length > _LT_MAX_BYTES) { onDone(false, true); return; }  // 서버가 거부할 것 — 보내지 않고 버린다
  try {
    fetch(CONFIG.logApiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body,
      credentials: 'omit',
      keepalive: true  // 마지막 시나리오 직후 창을 닫아도 전송 보장
    }).then(function (res) {
      onDone(!!(res && res.ok), !!(res && _ltIsPermanentReject(res.status)));
    }).catch(function () {
      onDone(false, false);  // 네트워크·CORS 실패 → 큐 유지
    });
  } catch (e) { onDone(false, false); }
}

// 큐를 앞에서부터 하나씩. 일시 실패를 만나면 그 자리에서 멈춘다(순서 보존, 폭주 방지).
function _ltDrain(list, i) {
  if (i >= list.length) { _lt_busy = false; return; }
  var rec = list[i];
  _ltSendOne(rec, function (ok, permanent) {
    if (ok || permanent) {
      try { dequeueFromOutbox(rec.pid); } catch (e) {}
      _ltDrain(list, i + 1);
    } else {
      _lt_busy = false;  // 일시 실패 — 남은 것은 다음 기회에
    }
  });
}

// 호출 시점(SPEC §7-4): 게임 시작 1회 + 시나리오 종료마다 + 학기 완주 시.
// 매번 실패해도 outbox가 유지되므로 교실 와이파이가 끊겨도 손실 없음.
function flushOutbox() {
  try {
    if (!CONFIG.logApiEndpoint) return;
    if (_lt_busy) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    var box = getOutbox();
    if (!box.length) return;
    _lt_busy = true;
    _ltDrain(box.slice(), 0);
  } catch (e) { _lt_busy = false; }
}

// ─────────────────────────────────────────────────────────────
// 이탈 시점 기록 (SPEC-play-log §1 `cur`, r40)
// outbox 갱신은 "시나리오를 끝냈을 때"만 일어난다. 그래서 시나리오 도중에 그만두면
// 그 시나리오는 레코드에 아예 안 나타난다 — 어디서 놓쳤는지가 통째로 안 보인다.
// 탭을 떠나는 순간에 한 번 더 찍어, 미완료 판의 마지막 위치(`cur`)를 남긴다.
// 시나리오에 들어간 적 없는 사람(타이틀만 보고 나감)은 기록하지 않는다 — 빈 레코드 방지.
function _ltRecordLeave() {
  try {
    if (typeof gameState === 'undefined' || !gameState) return;
    var entered = !!gameState.currentScenarioId || ((gameState.scenarioHistory || []).length > 0);
    if (!entered) return;
    upsertOutbox(makePlayRecord(gameState, { done: false }));
  } catch (e) {}
  try { flushOutbox(); } catch (e) {}
}
if (typeof window !== 'undefined' && window.addEventListener) {
  // pagehide = 창 닫기·뒤로가기. visibilitychange hidden = 태블릿 앱 전환·화면 잠금(수업 중 실제 이탈 형태).
  window.addEventListener('pagehide', _ltRecordLeave);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') _ltRecordLeave();
  });
}
