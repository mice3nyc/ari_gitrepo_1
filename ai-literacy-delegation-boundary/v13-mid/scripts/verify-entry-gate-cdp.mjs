// CDP 헤드리스 검증 — SPEC-intro-crt "입장 게이트" 수업코드 (26.0813 복수 허용)
// 사용: node scripts/verify-entry-gate-cdp.mjs <게임 URL>
//  전제: Chrome을 --headless=new --remote-debugging-port=9222 로 띄워 둔다.
//
// 이 하니스가 무엇을 재는가:
//  - 「경기교육」이 통과하는가 (신규) · 「하이러닝」도 여전히 통과하는가 (구 명칭 하위호환)
//  - 띄어쓰기·앞뒤 공백·전각 공백이 보정되는가
//  - 틀린 코드는 여전히 막히는가 (게이트가 헐거워지지 않았는지 — 이게 없으면 "다 통과"도 통과다)
//  - 부팅 배지에서 발주처 표기가 빠졌는가
//  - 통과한 입력값이 gameState.classCode에 남는가
// ⚠️ 옛 빌드에 걸면 「경기교육」 케이스가 FAIL이어야 한다. 안 붉어지면 하니스를 의심할 것.
const BASE = process.argv[2]
if (!BASE) { console.error('사용: node scripts/verify-entry-gate-cdp.mjs <URL>'); process.exit(2) }
const PORT = 9222

const results = []
const ok = (name, pass, detail = '') => { results.push({ name, pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`) }

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

// 매 케이스마다 저장소를 비우고 새로 로드한다 — 재방문 프리필이 결과를 오염시키지 않게.
async function fresh() {
  await call('Page.navigate', { url: BASE })
  for (let i = 0; i < 60; i++) {
    const ready = await evalJs(`(function(){try{return !!(document.getElementById('crtCode')&&typeof enterFromEntry==='function')}catch(e){return false}})()`)
    if (ready) return true
    await new Promise((r) => setTimeout(r, 200))
  }
  return false
}

// 코드 하나를 넣고 입장을 시도한 뒤, 게이트를 통과했는지 판정.
// 판정은 «에러 문구가 비었는가»가 아니라 «입장 레이어가 닫혔는가»로 — DOM 상태가 진실.
async function tryCode(code) {
  if (!await fresh()) throw new Error('입장 화면이 안 뜸')
  // 저장소 비우기는 «페이지가 뜬 뒤에» — about:blank에선 localStorage 접근 자체가 예외다
  await evalJs(`(function(){try{localStorage.clear()}catch(e){}return 1})()`)
  if (!await fresh()) throw new Error('입장 화면이 안 뜸(재로드)')
  return await evalJs(`(function(){
    var n=document.getElementById('crtName'), c=document.getElementById('crtCode');
    n.value='검증학생'; c.value=${JSON.stringify(code)};
    if(typeof _crtEntryCheck==='function')_crtEntryCheck();
    var btnDisabled=!!document.getElementById('crtEntryBtn').disabled;
    enterFromEntry();
    var layer=document.getElementById('crtEntry');
    var visible=!!(layer && getComputedStyle(layer).display!=='none');
    return {passed:!visible, btnDisabled:btnDisabled,
            err:(document.getElementById('crtEntryErr')||{}).textContent||'',
            saved:(window.gameState||{}).classCode||''};
  })()`)
}

// ── 통과해야 하는 것들
const ACCEPT = [
  ['경기교육 (신규 코드)', '경기교육', '경기교육'],
  ['하이러닝 (구 명칭 하위호환)', '하이러닝', '하이러닝'],
  ['경기 교육 (가운데 띄어쓰기)', '경기 교육', '경기교육'],
  ['경 기 교 육 (다중 공백)', '경 기 교 육', '경기교육'],
  ['  경기교육   (앞뒤 공백)', '  경기교육   ', '경기교육'],
  ['경기　교육 (전각 공백 U+3000)', '경기　교육', '경기교육'],
  ['하이 러닝 (구 명칭 + 띄어쓰기)', '하이 러닝', '하이러닝'],
]
for (const [label, input, expectSaved] of ACCEPT) {
  const r = await tryCode(input)
  ok(`통과: ${label}`, r.passed && r.saved === expectSaved,
     r.passed ? `saved=${JSON.stringify(r.saved)} (기대 ${JSON.stringify(expectSaved)})` : `막힘 err=${JSON.stringify(r.err)}`)
}

// ── 막혀야 하는 것들 (게이트가 헐거워지지 않았는지 — 통과만 보면 «다 열림»도 통과다)
const REJECT = [
  ['경기교욱 (오타)', '경기교욱'],
  ['경기 (일부만)', '경기'],
  ['경기교육원 (덧붙음)', '경기교육원'],
  ['하이러닝경기교육 (이어붙임)', '하이러닝경기교육'],
  ['gyeonggi (로마자)', 'gyeonggi'],
]
for (const [label, input] of REJECT) {
  const r = await tryCode(input)
  ok(`차단: ${label}`, !r.passed && !!r.err, r.passed ? '통과해버림' : `err=${JSON.stringify(r.err)}`)
}

// ── 빈 칸은 버튼 자체가 비활성
{
  const r = await tryCode('   ')
  ok('차단: 공백만 입력 (버튼 비활성)', r.btnDisabled && !r.passed, `btnDisabled=${r.btnDisabled}`)
}

// ── 부팅 배지 — 발주처 표기 제거 확인
{
  await fresh()
  await evalJs(`(function(){try{localStorage.clear()}catch(e){}return 1})()`)
  const badge = await evalJs(`(function(){var t=(window.TEXTS&&TEXTS.title_screen&&TEXTS.title_screen.badge)||'';return t})()`)
  ok('배지에 발주처 표기 없음', badge === 'AI 리터러시', `badge=${JSON.stringify(badge)}`)
  ok('배지에 "하이러닝" 안 나옴', !badge.includes('하이러닝'), `badge=${JSON.stringify(badge)}`)
}

// ── 화면 전체에 "하이러닝"이 안 보이는가 (부팅 통과 후 DOM 텍스트)
{
  const r = await tryCode('경기교육')
  if (!r.passed) ok('부팅 진입', false, '입장 실패')
  await new Promise((res) => setTimeout(res, 2500)) // 부팅 타이핑이 도는 동안
  const seen = await evalJs(`(document.body.innerText||'').indexOf('하이러닝')>=0`)
  ok('화면 텍스트에 "하이러닝" 미노출', seen === false)
}

ok('JS 런타임 예외 0', jsErrors.length === 0, jsErrors.slice(0, 3).join(' | '))

const failed = results.filter((r) => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} PASS`)
if (results.length < 15) { console.log('⚠️ 케이스가 15개 미만이다 — 하니스가 중간에 죽었을 수 있다'); process.exit(1) }
process.exit(failed.length ? 1 : 0)
