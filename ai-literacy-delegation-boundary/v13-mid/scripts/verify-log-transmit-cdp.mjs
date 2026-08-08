// CDP 헤드리스 검증 — SPEC-log-transmit §7·§10 (플레이 로그 서버 전송)
// 사용: node scripts/verify-log-transmit-cdp.mjs <게임 URL>
//  전제: Chrome을 --headless=new --remote-debugging-port=9222 --disable-web-security 로 띄워 둔다.
//  ⚠️ --disable-web-security는 "전송 로직"만 보기 위한 것이다. 실제 CORS는 이 검증으로 알 수 없고,
//     허용 오리진(https://mice3nyc.github.io 등)에서 따로 확인해야 한다 — SPEC §2·§10.
// 의존성 없이 Node 내장 fetch/WebSocket 사용.
const BASE = process.argv[2]
const PORT = 9222
const API = 'https://1js1lu6g60.execute-api.ap-northeast-2.amazonaws.com'
const TEST_V = 'v0-e2e-test'   // 합성 레코드 전용 버전 — raw/v0-e2e-test/ 로 따로 떨어져 운영 집계를 안 건드린다

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const results = []
const ok = (name, pass, detail = '') => { results.push({ name, pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`) }

async function rpc(ws, id, method, params = {}) {
  return new Promise((res, rej) => {
    const onMsg = (ev) => {
      const m = JSON.parse(ev.data)
      if (m.id === id) { ws.removeEventListener('message', onMsg); m.error ? rej(new Error(method + ': ' + JSON.stringify(m.error))) : res(m.result) }
    }
    ws.addEventListener('message', onMsg)
    ws.send(JSON.stringify({ id, method, params }))
    setTimeout(() => rej(new Error('timeout ' + method)), 20000)
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
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') jsErrors.push(m.params.args.map((a) => a.value ?? a.description).join(' '))
})

async function evalJs(expr) {
  const r = await call('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' :: ' + expr.slice(0, 120))
  return r.result.value
}
async function goto(url) {
  await call('Page.navigate', { url })
  for (let i = 0; i < 80; i++) { await sleep(150); if (await evalJs('document.readyState === "complete"')) break }
  await sleep(400)
}
const stats = async () => (await (await fetch(`${API}/stats`)).json())

// 합성 레코드 — SPEC-play-log §1 스키마 최소형
const mkRec = (pid, extra = {}) => ({ v: TEST_V, pid, st: 1754300000000, en: 1754300500000, done: true,
  sc: [{ id: 'selfintro', t1: 'B', t2: 'B2', rv: 'R3', g: 'A', s: 88, dl: 2, dk: 1, ct: 14, ce: 9, rep: 0 }],
  end: { total: 88, lv: 1, type: 2, cards: { h: [], d: [], g: [] } }, ...extra })

await goto(BASE)

// ─────────── T0 로딩 ───────────
ok('모듈 로드 — flushOutbox 정의됨', await evalJs(`typeof flushOutbox === 'function'`))
ok('CONFIG.logApiEndpoint 주입됨', (await evalJs(`CONFIG.logApiEndpoint`)) === `${API}/log`, await evalJs(`CONFIG.logApiEndpoint`))
ok('08c와 다른 엔드포인트(별개 트랙)', (await evalJs(`CONFIG.logApiEndpoint !== CONFIG.logEndpoint`)))

// ─────────── T1 성공 경로: 큐 → 서버 → 큐에서 제거 ───────────
const s0 = await stats()
const pid1 = 'p_e2e_' + Date.now().toString(36)
await evalJs(`localStorage.setItem(CONFIG.outboxKey, JSON.stringify([${JSON.stringify(mkRec(pid1))}])); getOutbox().length`)
await evalJs(`flushOutbox()`)
await sleep(2500)
ok('T1 전송 성공 → 로컬 큐에서 제거', (await evalJs(`getOutbox().length`)) === 0, `outbox=${await evalJs(`getOutbox().length`)}`)
const s1 = await stats()
ok('T1 서버 반영 (total +1)', s1.total === s0.total + 1, `${s0.total} → ${s1.total}`)
ok('T1 byVersion에 테스트 버전 기록', (s1.byVersion?.[TEST_V] || 0) >= 1, JSON.stringify(s1.byVersion))

// ─────────── T2 실패 경로: 네트워크 죽으면 큐 유지(손실 없음) ───────────
const pid2 = 'p_e2e_keep_' + Date.now().toString(36)
await evalJs(`window._realApi = CONFIG.logApiEndpoint; CONFIG.logApiEndpoint = 'https://127.0.0.1:9/log';
  localStorage.setItem(CONFIG.outboxKey, JSON.stringify([${JSON.stringify(mkRec(pid2))}])); 1`)
await evalJs(`flushOutbox()`)
await sleep(3000)
ok('T2 전송 실패 → 큐에 그대로 유지', (await evalJs(`getOutbox().length`)) === 1, `outbox=${await evalJs(`getOutbox().length`)}`)
const s2 = await stats()
ok('T2 서버에 아무것도 안 올라감', s2.total === s1.total, `${s1.total} → ${s2.total}`)

// 복구 후 재시도로 결국 전송되는지 (재시도 = 데이터 손실 없음의 증명)
await evalJs(`CONFIG.logApiEndpoint = window._realApi; 1`)
await evalJs(`flushOutbox()`)
await sleep(2500)
ok('T2b 복구 후 재시도로 전송 완료', (await evalJs(`getOutbox().length`)) === 0)
const s2b = await stats()
ok('T2b 서버 반영 (total +1)', s2b.total === s2.total + 1, `${s2.total} → ${s2b.total}`)

// ─────────── T3 5KB 초과: 보내기 전에 버린다(큐 머리 막힘 방지) ───────────
const fat = mkRec('p_e2e_fat_' + Date.now().toString(36))
fat.sc = Array.from({ length: 120 }, () => fat.sc[0])   // 직렬화 5KB 초과
await evalJs(`localStorage.setItem(CONFIG.outboxKey, JSON.stringify([${JSON.stringify(fat)}])); 1`)
await evalJs(`flushOutbox()`)
await sleep(2000)
ok('T3 5KB 초과 레코드는 큐에서 제거(무한 재시도 안 함)', (await evalJs(`getOutbox().length`)) === 0)
const s3 = await stats()
ok('T3 서버에 안 올라감', s3.total === s2b.total, `${s2b.total} → ${s3.total}`)

// ─────────── T4 실제 플레이 1판: 버튼이 부르는 그 함수들로 진행 ───────────
// ⚠️ 세이브가 남아 있으면 startScenario가 "이미 클리어"로 조용히 return한다(10-event-handlers §14.5 순차 진행).
//    그래서 화면이 안 그려지고 onTier1이 panel null로 죽는다 — 반드시 localStorage를 비우고 새로 로드한다.
await goto(BASE)
await evalJs(`localStorage.clear(); 1`)
await goto(BASE)
await evalJs(`startNewGame(); 1`)
await sleep(500)
await evalJs(`startScenario('selfintro'); 1`)
await sleep(1200)
ok('T4 시나리오 진입 (cut 1)', (await evalJs(`getCurrentCutNum()`)) === 1, `cut=${await evalJs(`getCurrentCutNum()`)}`)
await evalJs(`onTier1('A'); 1`); await sleep(900)
await evalJs(`onTier2('A1'); 1`); await sleep(900)
await evalJs(`onReview('R1'); 1`); await sleep(1500)
const cut = await evalJs(`typeof getCurrentCutNum==='function' ? getCurrentCutNum() : -1`)
if (cut !== 6) { await evalJs(`if(typeof goCut6==='function')goCut6(); 1`); await sleep(1500) }
const played = await evalJs(`JSON.stringify({outbox:getOutbox().length, hist:(gameState.scenarioHistory||[]).length, pid:gameState.playId})`)
const P = JSON.parse(played)
ok('T4 실플레이 — 시나리오 1개 완료됨', P.hist === 1, played)
await sleep(2500)
ok('T4 실플레이 레코드가 큐에서 빠짐(전송 성공)', (await evalJs(`getOutbox().length`)) === 0, `outbox=${await evalJs(`getOutbox().length`)}`)
const s4 = await stats()
ok('T4 서버 반영 — 운영 버전 prefix로 기록', s4.total === s3.total + 1 && (s4.byVersion?.['v1.3-mid-r40'] || 0) > (s3.byVersion?.['v1.3-mid-r40'] || 0), JSON.stringify(s4.byVersion))

// ─────────── T5 r40 스키마: 소요 시간 ───────────
const r4 = JSON.parse(await evalJs(`JSON.stringify(makePlayRecord(gameState,{done:false}).sc[0])`))
ok('T5 dur 기록됨(초, 숫자)', typeof r4.dur === 'number' && r4.dur >= 0, `dur=${r4.dur}`)
ok('T5 첫 판엔 gs·du 없음(재도전 없을 때 생략)', r4.gs === undefined && r4.du === undefined)

// ─────────── T6 r40 스키마: 재도전 등급 순서 ───────────
await evalJs(`replayScenario('selfintro'); 1`); await sleep(1000)
await evalJs(`onTier1('C'); 1`); await sleep(900)
await evalJs(`onTier2('C1'); 1`); await sleep(900)
await evalJs(`onReview('R3'); 1`); await sleep(1500)
if ((await evalJs(`getCurrentCutNum()`)) !== 6) { await evalJs(`if(typeof goCut6==='function')goCut6(); 1`); await sleep(1500) }
const r5 = JSON.parse(await evalJs(`JSON.stringify(makePlayRecord(gameState,{done:false}).sc[0])`))
ok('T6 재도전 후 gs = 시도별 등급 2개', Array.isArray(r5.gs) && r5.gs.length === 2, JSON.stringify(r5.gs))
ok('T6 du = 시도별 소요 시간 2개', Array.isArray(r5.du) && r5.du.length === 2, JSON.stringify(r5.du))
ok('T6 rep 증가', r5.rep === 1, `rep=${r5.rep}`)

// ─────────── T7 r40 스키마: 중간 이탈 지점 ───────────
// 다음 시나리오에 들어가 1차만 고르고 떠난다 — sc에는 안 잡히는 구간.
await evalJs(`goNextScenario(); 1`); await sleep(800)
await evalJs(`startScenario(CONFIG.scenarios[1]); 1`); await sleep(1200)
await evalJs(`onTier1('B'); 1`); await sleep(1000)
try { await call('Page.setWebLifecycleState', { state: 'frozen' }); await sleep(800); await call('Page.setWebLifecycleState', { state: 'active' }) } catch (e) { await evalJs(`_ltRecordLeave(); 1`) }
await sleep(1500)
const leave = JSON.parse(await evalJs(`JSON.stringify(makePlayRecord(gameState,{done:false}).cur||null)`))
ok('T7 이탈 지점 cur 기록', !!leave && leave.id === (await evalJs(`CONFIG.scenarios[1]`)), JSON.stringify(leave))
ok('T7 cur.step = 멈춘 단계', leave && leave.step === 'tier2', `step=${leave && leave.step}`)
ok('T7 cur.dur 기록', leave && typeof leave.dur === 'number', `dur=${leave && leave.dur}`)
const sLeave = await stats()
ok('T7 이탈분이 서버에 도달(pagehide/visibilitychange 경로)', (sLeave.byVersion?.['v1.3-mid-r40'] || 0) >= 1, JSON.stringify(sLeave.byVersion))

// ─────────── T8 게임 흐름 무해성 ───────────
ok('런타임 예외 0', jsErrors.length === 0, jsErrors.slice(0, 3).join(' | '))

console.log('\n최종 stats:', JSON.stringify(await stats()))
const failed = results.filter((r) => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} PASS`)
if (failed.length) { console.log('실패:', failed.map((f) => f.name).join(', ')); process.exit(1) }
