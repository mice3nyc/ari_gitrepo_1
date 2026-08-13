import http from 'node:http'
const got=[]
http.createServer((req,res)=>{
  let b=''; req.on('data',c=>b+=c); req.on('end',()=>{
    if(req.url==='/__dump'){res.writeHead(200,{'content-type':'application/json'});return res.end(JSON.stringify(got))}
    if(req.url==='/__reset'){got.length=0;res.writeHead(200);return res.end('ok')}
    got.push({url:req.url,key:req.headers['x-log-key']||null,ct:req.headers['content-type']||null,bytes:Buffer.byteLength(b),body:b})
    res.writeHead(200,{'access-control-allow-origin':'*'});res.end('{"ok":true}')
  })
  if(req.method==='OPTIONS'){res.writeHead(204,{'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'});res.end()}
}).listen(8791,()=>console.log('sink 8791'))
