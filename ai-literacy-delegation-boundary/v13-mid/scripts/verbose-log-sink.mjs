import http from 'node:http'
const got=[]
http.createServer((req,res)=>{
  // OPTIONS는 여기서 끝낸다. 전엔 아래 end 핸들러가 같은 요청에 또 응답해서
  // ERR_HTTP_HEADERS_SENT로 sink가 통째로 죽었다(2026-08-16).
  // X-Log-Key가 커스텀 헤더라 브라우저가 preflight를 반드시 보낸다 — 늘 걸리는 길이다.
  if(req.method==='OPTIONS'){res.writeHead(204,{'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'});return res.end()}
  let b=''; req.on('data',c=>b+=c); req.on('end',()=>{
    if(req.url==='/__dump'){res.writeHead(200,{'content-type':'application/json'});return res.end(JSON.stringify(got))}
    if(req.url==='/__reset'){got.length=0;res.writeHead(200);return res.end('ok')}
    got.push({url:req.url,key:req.headers['x-log-key']||null,ct:req.headers['content-type']||null,bytes:Buffer.byteLength(b),body:b})
    res.writeHead(200,{'access-control-allow-origin':'*'});res.end('{"ok":true}')
  })
}).listen(8791,()=>console.log('sink 8791'))
