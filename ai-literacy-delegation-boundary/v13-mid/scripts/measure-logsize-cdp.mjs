// 실측 — 한 판 플레이가 localStorage에 얼마를 남기는가 (SPEC-verbose-log §8-1)
// 사용: node measure-logsize-cdp.mjs <게임 URL>
// 전제: Chrome --headless=new --remote-debugging-port=9222
// ⚠️ 전송은 막는다(엔드포인트를 블랙홀로) — 실측이 운영 /report 집계를 오염시키지 않게.
const BASE = process.argv[2]
const PORT = 9222
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function rpc(ws, id, method, params = {}) {
  return new Promise((res, rej) => {
    const onMsg = (ev) => {
      const m = JSON.parse(ev.data)
      if (m.id === id) { ws.removeEventListener('message', onMsg); m.error ? rej(new Error(method + ': ' + JSON.stringify(m.error))) : res(m.result) }
    }
    ws.addEventListener('message', onMsg)
    ws.send(JSON.stringify({ id, method, params }))
    setTimeout(() => rej(new Error('timeout ' + method)), 30000)
  })
}
const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()
const page = targets.find((t) => t.type === 'page')
const ws = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((r) => ws.addEventListener('open', r))
let id = 0
const call = (m, p) => rpc(ws, ++id, m, p)
await call('Runtime.enable'); await call('Page.enable')

const jsErrors = []
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data)
  if (m.method === 'Runtime.exceptionThrown') jsErrors.push(String(m.params?.exceptionDetails?.text))
})

async function evalJs(expr) {
  const r = await call('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' :: ' + expr.slice(0, 140))
  return r.result.value
}
async function goto(url) {
  await call('Page.navigate', { url })
  for (let i = 0; i < 100; i++) { await sleep(150); if (await evalJs('document.readyState === "complete"')) break }
  await sleep(600)
}

// localStorage 실측 헬퍼를 페이지에 주입
const PROBE = `(function(){
  function B(s){return s==null?0:new TextEncoder().encode(s).length;}
  var out={keys:{},total:0};
  for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);var b=B(localStorage.getItem(k));out.keys[k]=b;out.total+=B(k)+b;}
  out.events = (function(){try{return JSON.parse(localStorage.getItem(CONFIG.eventLogKey)||'[]').length;}catch(e){return -1;}})();
  out.outbox = (function(){try{return JSON.parse(localStorage.getItem(CONFIG.outboxKey)||'[]').length;}catch(e){return -1;}})();
  return out;
})()`

await goto(BASE)
// 깨끗한 출발 + 전송 차단
await evalJs(`localStorage.clear(); sessionStorage.clear(); 1`)
await goto(BASE)
await evalJs(`CONFIG.logApiEndpoint='http://127.0.0.1:9/blackhole'; CONFIG.logEndpoint=''; 1`)

const version = await evalJs(`CONFIG.version`)
const scenarios = await evalJs(`CONFIG.scenarios`)
console.log(`빌드 ${version} · 시나리오 ${scenarios.length}개: ${scenarios.join(', ')}\n`)

const before = await evalJs(PROBE)
console.log(`[출발] 총 ${before.total}B · 이벤트 ${before.events}건`)

await evalJs(`startNewGame(); 1`); await sleep(600)
const T1 = ['A', 'B', 'C'], T2 = ['A1', 'B2', 'C1', 'A3', 'C2'], RV = ['R1', 'R2', 'R3']
const rows = []
for (let i = 0; i < scenarios.length; i++) {
  const sc = scenarios[i]
  await evalJs(`startScenario(${JSON.stringify(sc)}); 1`); await sleep(1000)
  const cut = await evalJs(`typeof getCurrentCutNum==='function'?getCurrentCutNum():-1`)
  if (cut !== 1) { console.log(`  ⚠️ ${sc}: 진입 실패(cut=${cut}) — 건너뜀`); continue }
  const t1 = T1[i % 3]
  await evalJs(`onTier1(${JSON.stringify(t1)}); 1`); await sleep(900)
  const t2 = t1 + String((i % 3) + 1)   // 하니스 관례: tier1 글자 + 갈래 번호 (A1·B2·C1…)
  await evalJs(`onTier2(${JSON.stringify(t2)}); 1`); await sleep(900)
  await evalJs(`onReview(${JSON.stringify(RV[i % 3])}); 1`); await sleep(1600)
  const p = await evalJs(PROBE)
  rows.push({ sc, ...p })
  console.log(`  ${i + 1}. ${sc}  이벤트 ${p.events}건 · 이벤트로그 ${p.keys[await evalJs('CONFIG.eventLogKey')] || 0}B · 총 ${p.total}B`)
}

// 학기 리포트까지
try { await evalJs(`typeof showFinalReport==='function'&&showFinalReport(); 1`); await sleep(1200) } catch (e) { }

const after = await evalJs(PROBE)
const evKey = await evalJs(`CONFIG.eventLogKey`)
const stKey = await evalJs(`CONFIG.storageKey`)
const obKey = await evalJs(`CONFIG.outboxKey`)

console.log(`\n===== 한 판 완주 후 =====`)
console.log(`이벤트 건수      ${after.events}`)
console.log(`이벤트 로그      ${after.keys[evKey] || 0} B`)
console.log(`세이브(게임상태) ${after.keys[stKey] || 0} B`)
console.log(`outbox(전송대기) ${after.keys[obKey] || 0} B`)
console.log(`localStorage 총  ${after.total} B`)
console.log(`키 목록: ${Object.entries(after.keys).map(([k, v]) => `${k}=${v}B`).join('\n         ')}`)

const perPlayGrow = (after.keys[evKey] || 0)
const QUOTA = 5 * 1024 * 1024
console.log(`\n===== 누적 판정 =====`)
console.log(`판당 이벤트 로그 증가분  ≈ ${perPlayGrow} B  (판마다 clearEvents 안 됨 → 계속 누적)`)
console.log(`5MB 쿼터까지            ≈ ${Math.floor(QUOTA / Math.max(perPlayGrow, 1))} 판`)
console.log(`\nJS 예외: ${jsErrors.length}건 ${jsErrors.slice(0, 3).join(' | ')}`)
ws.close()
