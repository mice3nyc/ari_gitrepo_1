// =====================================================
// 8e. Verbose 전체 행동 기록 (SPEC-verbose-log)
// 동현공 「사용 기록 로깅 설계」(DMZ 아카이브)를 이 프로젝트로 옮긴 것. 행동 하나 = 이벤트 한 줄(NDJSON).
// 08b/08d(우리 압축 레코드 + /report)와 완전히 별개로 돈다 — 한쪽이 죽어도 다른 쪽은 정상(SPEC §0).
// 08c(동현공 참여 집계)와도 별개. 이 파일이 세 번째 트랙이다.
// 기본 OFF — CONFIG.verboseLog + CONFIG.logEvEndpoint 둘 다 있어야 켜진다(SPEC §5).
// 게임 흐름을 절대 막지 않는다: 전부 try/catch, 실패는 조용히 넘어간다.
// =====================================================

var _VL_DENY = { snap: 1, before: 1, after: 1, history: 1, items: 1 };  // SPEC §3-1 — 버리는 최상위 키
var _VL_MAX_PAYLOAD = 512;        // payload 직렬화 상한(B). 넘으면 자르고 표시를 남긴다
var _VL_ROLL_BYTES = 48 * 1024;   // 롤오버 임계 — keepalive 바디 상한 64KB 밑에서 마감(SPEC §1-3)
var _VL_FLUSH_EVERY = 10;         // 이벤트 N건마다 flush
var _VL_TICK_MS = 60000;          // 주기 flush
var _vl_busy = false;             // 직렬화 — 이전 flush 끝나고 다음
var _vl_tick = null;

function _vlEnabled() {
  try { return !!(CONFIG && CONFIG.verboseLog && CONFIG.logEvEndpoint && CONFIG.evOutboxKey); } catch (e) { return false; }
}
function _vlBytes(s) {
  if (s == null) return 0;
  try { return new TextEncoder().encode(s).length; } catch (e) { return String(s).length; }
}
function _vlNewPid(prefix) {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
// 키의 날짜 경로는 판 시작 시 1회 고정한다 — flush마다 재계산하면 자정을 넘길 때 키가 바뀌어
// "같은 키 덮어쓰기" 멱등이 깨진다(SPEC §1-4, 동현공 4절).
function _vlDatePath() {
  var d = new Date();
  var mm = String(d.getUTCMonth() + 1); if (mm.length < 2) mm = '0' + mm;
  var dd = String(d.getUTCDate()); if (dd.length < 2) dd = '0' + dd;
  return d.getUTCFullYear() + '/' + mm + '/' + dd;
}

// ── 버퍼 상태: 한 키에 원자적으로 영속(SPEC §4). 새로고침해도 pid·part·seq가 이어진다.
function _vlRead() {
  try {
    var raw = localStorage.getItem(CONFIG.evOutboxKey);
    if (raw) {
      var st = JSON.parse(raw);
      if (st && st.pid && Array.isArray(st.lines)) return st;
    }
  } catch (e) {}
  return null;
}
function _vlWrite(st) {
  try { localStorage.setItem(CONFIG.evOutboxKey, JSON.stringify(st)); return true; }
  catch (e) { return false; }   // 쿼터 초과 등 — 로깅이 게임을 막지 않는다
}
function _vlFresh(pid) {
  return { pid: pid, datePath: _vlDatePath(), part: 0, seq: 0, lines: [], cut: 0 };
}
function _vlState() {
  var st = _vlRead();
  if (!st) { st = _vlFresh(_vlNewPid('p_b')); _vlWrite(st); }   // 부트스트랩 pid(SPEC §3-2)
  return st;
}

// ── payload 걸러내기(SPEC §3-1). 규칙 하나로 처리한다 — 이벤트별 표를 두지 않는다.
function _vlStrip(payload) {
  var out = {}, k;
  if (payload && typeof payload === 'object') {
    for (k in payload) {
      if (!Object.prototype.hasOwnProperty.call(payload, k)) continue;
      if (_VL_DENY[k]) continue;
      out[k] = payload[k];
    }
  }
  var s;
  try { s = JSON.stringify(out); } catch (e) { return { __bad: 1 }; }
  if (_vlBytes(s) <= _VL_MAX_PAYLOAD) return out;
  // 규칙이 못 잡은 무거운 필드 — 큰 것부터 떨궈 상한 밑으로. 잘렸다는 표시를 남긴다.
  var keys = Object.keys(out).sort(function (a, b) {
    return _vlBytes(JSON.stringify(out[b])) - _vlBytes(JSON.stringify(out[a]));
  });
  var cut = 0;
  for (var i = 0; i < keys.length; i++) {
    delete out[keys[i]]; cut++;
    try { if (_vlBytes(JSON.stringify(out)) <= _VL_MAX_PAYLOAD) break; } catch (e) { break; }
  }
  out.__cut = cut;
  return out;
}

// ── 봉투 만들기 + 누적. trackEvent가 이걸 부른다(계측 신규 0, SPEC §3).
function verboseLogEvent(type, payload) {
  if (!_vlEnabled()) return;
  try {
    var st = _vlState();
    // pid 회전(SPEC §3-2) — 부트스트랩 구간을 마감하고 판 파일로 넘어간다
    var live = (typeof gameState !== 'undefined' && gameState && gameState.playId) ? gameState.playId : null;
    if (live && live !== st.pid) {
      // playId는 08b가 "첫 레코드 생성 시점"에 지연 발급한다(08b:25) — 즉 1번 시나리오를 끝낸 뒤다.
      // 그래서 타이틀~1번 시나리오는 부트스트랩 파일에, 그 뒤는 판 파일에 갈려 담긴다.
      // ⚠️ 잇는 열쇠가 없으면 판 파일에 첫 시나리오가 통째로 빠진 것으로 보인다(26.0813 검증에서 발견).
      // 새 파일 첫 줄에 직전 pid를 남겨 분석에서 두 파일을 이어 붙일 수 있게 한다.
      var prevPid = st.pid, prevPart = st.part || 0;
      _vlFlush(true);                 // 직전 part를 마지막으로 한 번 올려 마감
      st = _vlFresh(live);
      st.seq = 1;
      st.lines.push(JSON.stringify({ v: CONFIG.version, pid: st.pid, seq: 1, at: Date.now(),
        t: '__rotate', d: { from: prevPid, fromPart: prevPart } }));
      _vlWrite(st);
    }
    var d = _vlStrip(payload);
    // 시나리오 맥락이 payload에 없는 이벤트(hint_toggled 등)에만 보탠다 — 중복 필드는 만들지 않는다
    if (d.scenarioId === undefined && d.sid === undefined &&
        typeof gameState !== 'undefined' && gameState && gameState.currentScenarioId) {
      d.sid = gameState.currentScenarioId;
    }
    if (d.__cut) st.cut = (st.cut || 0) + 1;
    st.seq = (st.seq || 0) + 1;
    st.lines.push(JSON.stringify({ v: CONFIG.version, pid: st.pid, seq: st.seq, at: Date.now(), t: type, d: d }));
    _vlWrite(st);
    if (_vlBufBytes(st) >= _VL_ROLL_BYTES) { _vlRoll(); return; }
    if (st.lines.length % _VL_FLUSH_EVERY === 0) _vlFlush(false);
  } catch (e) {}
}
function _vlBufBytes(st) { return _vlBytes(st.lines.join('\n')); }

// ── 롤오버(SPEC §1-3): 지금 버퍼를 마지막으로 올려 마감하고 part+1로 넘어간다.
// 각 파일이 64KB 밑을 유지해 종료 flush(keepalive)가 조용히 실패하지 않게.
function _vlRoll() {
  try {
    var st = _vlRead(); if (!st) return;
    _vlPut(_vlKey(st), st.lines.join('\n'));   // 마감분은 한 번만 시도(재시도 안 함 — best-effort)
    st.part = (st.part || 0) + 1;
    st.lines = [];                             // seq는 리셋하지 않는다(판 전역 연속)
    _vlWrite(st);
  } catch (e) {}
}

function _vlKey(st) {
  return 'raw-ev/' + CONFIG.version + '/' + st.datePath + '/' + st.pid + '__' + (st.part || 0) + '.ndjson';
}
function _vlPut(key, body) {
  try {
    fetch(CONFIG.logEvEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-ndjson', 'X-Log-Key': key },
      body: body,
      credentials: 'omit',
      keepalive: true
    }).catch(function () {});
  } catch (e) {}
}

// ── flush: 현재 part의 버퍼 전체를 같은 키에 덮어쓴다(멱등, SPEC §1-2).
// 한 번 실패해도 다음 flush가 전체를 다시 올려 자동 복구되므로 버퍼는 비우지 않는다.
function _vlFlush(force) {
  if (!_vlEnabled()) return;
  if (_vl_busy && !force) return;
  try {
    var st = _vlRead(); if (!st || !st.lines.length) return;
    _vl_busy = true;
    _vlPut(_vlKey(st), st.lines.join('\n'));
  } catch (e) {}
  _vl_busy = false;
}

// ── 부팅. off면 리스너조차 걸지 않는다(SPEC §5).
function _vlBoot() {
  if (!_vlEnabled()) return;
  _vlState();
  if (!_vl_tick) _vl_tick = setInterval(function () { _vlFlush(false); }, _VL_TICK_MS);
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('pagehide', function () { _vlFlush(true); });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') _vlFlush(true);
    });
  }
}
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _vlBoot);
  else _vlBoot();
}
