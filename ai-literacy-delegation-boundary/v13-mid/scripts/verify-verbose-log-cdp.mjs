// SPEC-verbose-log §8-2 검증
const BASE=process.argv[2],PORT=9222,SINK='http://127.0.0.1:8791'
const sleep=ms=>new Promise(r=>setTimeout(r,ms))
const R=[];const ok=(n,p,d='')=>{R.push(p);console.log(`${p?'PASS':'FAIL'}  ${n}${d?' — '+d:''}`)}
async function rpc(ws,id,m,p={}){return new Promise((res,rej)=>{const on=e=>{const x=JSON.parse(e.data);if(x.id===id){ws.removeEventListener('message',on);x.error?rej(new Error(JSON.stringify(x.error))):res(x.result)}};ws.addEventListener('message',on);ws.send(JSON.stringify({id,method:m,params:p}));setTimeout(()=>rej(new Error('timeout '+m)),30000)})}
const tg=await(await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();const page=tg.find(x=>x.type==='page')
const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r))
let id=0;const call=(m,p)=>rpc(ws,++id,m,p);await call('Runtime.enable');await call('Page.enable')
const errs=[];ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errs.push(String(m.params?.exceptionDetails?.exception?.description||'').split('\n')[0])})
async function ev(x){const r=await call('Runtime.evaluate',{expression:x,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error((r.exceptionDetails.exception?.description||'').split('\n')[0]+' :: '+x.slice(0,100));return r.result.value}
async function goto(u){await call('Page.navigate',{url:u});for(let i=0;i<100;i++){await sleep(150);if(await ev('document.readyState==="complete"'))break}await sleep(600)}
const dump=async()=>(await(await fetch(SINK+'/__dump')).json())
const reset=async()=>{await fetch(SINK+'/__reset')}
async function play(n){
  const SC=await ev(`CONFIG.scenarios`),T1=['A','B','C'],RV=['R1','R2','R3']
  await ev(`startNewGame();1`);await sleep(500)
  for(let i=0;i<Math.min(n,SC.length);i++){
    await ev(`startScenario(${JSON.stringify(SC[i])});1`);await sleep(900)
    if((await ev(`getCurrentCutNum()`))!==1)continue
    const t1=T1[i%3]
    await ev(`onTier1(${JSON.stringify(t1)});1`);await sleep(750)
    await ev(`onTier2(${JSON.stringify(t1+String((i%3)+1))});1`);await sleep(750)
    await ev(`onReview(${JSON.stringify(RV[i%3])});1`);await sleep(1300)
  }
}

// ───── T1: OFF = 완전 no-op
await goto(BASE);await ev(`localStorage.clear();sessionStorage.clear();1`);await goto(BASE)
await ev(`CONFIG.logApiEndpoint='';CONFIG.logEndpoint='';1`)
await reset()
await play(1)
ok('T1 OFF — evbuf 키 자체가 안 생김', (await ev(`localStorage.getItem(CONFIG.evOutboxKey)===null`)), `verboseLog=${await ev(`CONFIG.verboseLog`)}`)
ok('T1 OFF — 네트워크 0건', (await dump()).length===0)
ok('T1 OFF — 게임은 정상 (시나리오 1건 완료)', (await ev(`gameState.scenarioHistory.length`))===1)

// ───── T2: ON = 쌓이고 나간다
await ev(`localStorage.clear();sessionStorage.clear();1`);await goto(BASE)
await ev(`CONFIG.verboseLog=true;CONFIG.logEvEndpoint='${SINK}/log-ev';CONFIG.logApiEndpoint='${SINK}/log';CONFIG.logEndpoint='';_vlBoot();1`)
await reset()
await play(2)
await ev(`_vlFlush(true);1`);await sleep(500)
const st=await ev(`JSON.parse(localStorage.getItem(CONFIG.evOutboxKey))`)
const lines=st.lines.map(l=>JSON.parse(l))
ok('T2 ON — 이벤트가 쌓인다', lines.length>10, `${lines.length}줄 · seq=${st.seq} · part=${st.part}`)
ok('T2 seq 연속·누락 0', lines.every((l,i)=>l.seq===i+1), `첫=${lines[0]?.seq} 끝=${lines[lines.length-1]?.seq}`)
ok('T2 봉투 6필드 고정', lines.every(l=>['v','pid','seq','at','t','d'].every(k=>k in l)&&Object.keys(l).length===6))
const deny=['snap','before','after','history','items']
const bad=lines.filter(l=>deny.some(k=>k in (l.d||{})))
ok('T2 금지 키 0 (snap·before·after·history·items)', bad.length===0, bad.length?`${bad.length}건 ${bad[0].t}`:'')
const blob=JSON.stringify(lines)
ok('T2 PII 없음 — UA·기기UUID 미포함', !/Mozilla|AppleWebKit|Chrome\//.test(blob) && !(await ev(`(function(){var c=localStorage.getItem(CONFIG.clientIdKey);return c&&${JSON.stringify(blob)}.indexOf(c)>=0})()`)))
const D=await dump()
const evReq=D.filter(r=>r.url==='/log-ev')
ok('T2 전송됨 — NDJSON', evReq.length>0 && evReq[0].ct==='application/x-ndjson', `${evReq.length}회 · ct=${evReq[0]?.ct}`)
ok('T2 키 스킴 raw-ev/{v}/{y}/{m}/{d}/{pid}__{part}.ndjson', /^raw-ev\/v1\.3-mid-r41\/\d{4}\/\d{2}\/\d{2}\/p_[a-z0-9]+__0\.ndjson$/.test(evReq[evReq.length-1].key||''), evReq[evReq.length-1].key)
ok('T2 pid 회전 — 부트스트랩(p_b)과 판(p_) 파일이 갈린다', new Set(evReq.map(r=>r.key.split('/').pop().split('__')[0])).size>=2, [...new Set(evReq.map(r=>r.key.split('/').pop().split('__')[0]))].join(', '))
ok('T2 A파이프 pid와 동일 — 조인된다', st.pid===(await ev(`gameState.playId`)), `${st.pid} vs ${await ev(`gameState.playId`)}`)

// ───── T3: A·B 독립
const obLen=await ev(`getOutbox().length`)
ok('T3 A파이프 살아있음 (B가 켜져도 레코드 생성)', obLen>0 || (await dump()).some(r=>r.url==='/log'), `outbox=${obLen}`)
await ev(`CONFIG.logEvEndpoint='http://127.0.0.1:9/dead';1`)   // B 죽이기
await play(1);await sleep(300)
ok('T3 B가 죽어도 A 정상 + 게임 진행', (await ev(`gameState.scenarioHistory.length`))>=1, `history=${await ev(`gameState.scenarioHistory.length`)}`)
await ev(`CONFIG.logEvEndpoint='${SINK}/log-ev';CONFIG.logApiEndpoint='http://127.0.0.1:9/dead';1`)  // A 죽이기
await reset();await play(1);await ev(`_vlFlush(true);1`);await sleep(400)
ok('T3 A가 죽어도 B 정상', (await dump()).filter(r=>r.url==='/log-ev').length>0)

// ───── T4: 48KB 롤오버
await ev(`(function(){var st=JSON.parse(localStorage.getItem(CONFIG.evOutboxKey));var pad='y'.repeat(2000);
  for(var i=0;i<26;i++){st.seq++;st.lines.push(JSON.stringify({v:CONFIG.version,pid:st.pid,seq:st.seq,at:Date.now(),t:'__pad',d:{p:pad}}))}
  localStorage.setItem(CONFIG.evOutboxKey,JSON.stringify(st));return 1})()`)
const beforePart=(await ev(`JSON.parse(localStorage.getItem(CONFIG.evOutboxKey)).part`))
await ev(`CONFIG.logEvEndpoint='${SINK}/log-ev';verboseLogEvent('__trigger',{});1`);await sleep(400)
const st2=await ev(`JSON.parse(localStorage.getItem(CONFIG.evOutboxKey))`)
ok('T4 48KB 롤오버 — part 증가 + 버퍼 비움', st2.part===beforePart+1 && st2.lines.length===0, `part ${beforePart}→${st2.part}, lines=${st2.lines.length}`)
ok('T4 seq는 리셋 안 됨 (판 전역 연속)', st2.seq>26, `seq=${st2.seq}`)

// ───── T5
ok('T5 런타임 예외 0', errs.length===0, errs.slice(0,2).join(' | '))
console.log(`\n${R.filter(Boolean).length}/${R.length} PASS`)
ws.close()
