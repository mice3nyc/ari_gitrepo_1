#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""todoy-bar 편집 창 — 로컬 웹(설치 불필요).

파이썬 http.server가 127.0.0.1 임시 포트에 한 페이지를 띄우고 Chrome 앱모드 창으로 연다.
여러 항목을 몰아서 체크·수정·추가·삭제하고 [저장하고 닫기] → JSON 반영 + 서버 종료 + 창 닫힘.
저장 규칙(정산·id·삭제)은 edit.py 순수함수 재사용. (Tkinter는 Apple Tk 8.5.9 렌더버그로 폐기.)
"""
import json
import os
import subprocess
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from edit import load, build_saved, save  # noqa: E402

IDLE_TIMEOUT = 600  # 창 방치 시 자동 종료(초)
_last_touch = [time.time()]


def page_html(items):
    data = json.dumps(items, ensure_ascii=False)
    return """<!doctype html><html lang="ko"><head><meta charset="utf-8">
<title>todoy 편집</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin:0; font-family:-apple-system,"Helvetica Neue",sans-serif; background:#fff; color:#111;
         padding:22px 20px 90px; -webkit-font-smoothing:antialiased; }
  h1 { font-size:17px; font-weight:700; margin:0 0 3px; }
  .sub { color:#999; font-size:12px; margin:0 0 16px; }
  .row { display:flex; align-items:center; gap:10px; padding:5px 0; border-bottom:1px solid #f0f0f0; }
  .row.dragging { opacity:.4; }
  .grip { flex:none; color:#c8c8c8; font-size:15px; line-height:1; cursor:grab;
          padding:2px 1px; user-select:none; letter-spacing:-1px; }
  .grip:hover { color:#1100ff; }
  .grip:active { cursor:grabbing; }
  .row input[type=checkbox] { width:17px; height:17px; accent-color:#111; cursor:pointer; flex:none; }
  .row input.txt { flex:1; border:1px solid #ddd; border-radius:5px; padding:7px 9px; font-size:15px;
                   font-family:inherit; color:#111; background:#fff; outline:none; }
  .row input.txt:focus { border-color:#1100ff; }
  .row.done input.txt { color:#009443; text-decoration:line-through; }
  .del { flex:none; border:none; background:none; color:#c33; font-size:15px; cursor:pointer;
         padding:2px 6px; border-radius:4px; }
  .del:hover { background:#fee; }
  .top { flex:none; border:none; background:none; color:#bbb; font-size:14px; cursor:pointer;
         padding:2px 5px; border-radius:4px; }
  .top:hover { background:#eef; color:#1100ff; }
  .addbar { display:flex; align-items:center; gap:8px; margin-top:14px; }
  .addbar .plus { color:#1100ff; font-size:16px; }
  .addbar input { flex:1; border:1px solid #ddd; border-radius:5px; padding:7px 9px; font-size:15px;
                  font-family:inherit; outline:none; }
  .addbar input:focus { border-color:#1100ff; }
  .addbar button { border:1px solid #ccc; background:#fff; border-radius:5px; padding:7px 12px;
                   font-size:13px; cursor:pointer; }
  .foot { position:fixed; left:0; right:0; bottom:0; background:#fff; border-top:1px solid #eee;
          padding:12px 20px; display:flex; justify-content:flex-end; gap:10px; }
  .foot button { border-radius:6px; padding:9px 16px; font-size:14px; font-family:inherit; cursor:pointer; }
  .cancel { border:1px solid #ccc; background:#fff; color:#111; }
  .savebtn { border:1px solid #111; background:#111; color:#fff; font-weight:600; }
  .msg { position:fixed; inset:0; display:none; align-items:center; justify-content:center;
         background:rgba(255,255,255,.94); font-size:16px; color:#555; }
</style></head><body>
<h1>오늘 할 일 — 편집</h1>
<p class="sub">체크·수정·추가 후 저장하고 닫기. ⠿를 끌어 순서 변경, ⇧는 맨 위로. 텍스트를 비우면 삭제됩니다.</p>
<div id="list"></div>
<div class="addbar">
  <span class="plus">＋</span>
  <input id="new" placeholder="새 항목 (Enter로 계속 추가)" autocomplete="off">
  <button onclick="commitNew()">추가</button>
</div>
<div class="foot">
  <button class="cancel" onclick="quit(false)">취소</button>
  <button class="savebtn" onclick="doSave()">저장하고 닫기</button>
</div>
<div class="msg" id="msg">저장됐어요. 창을 닫으셔도 됩니다.</div>
<script>
let items = __DATA__;
const listEl = document.getElementById('list');
function rid(){ return 'i' + Math.floor(Math.random()*1e9); }
// 핸들러는 index가 아니라 id로 바인딩한다 — 드래그로 DOM 순서가 바뀌면
// index 클로저는 엉뚱한 항목을 가리켜 "고쳤는데 다른 줄이 바뀌는" 버그가 된다.
function find(id){ return items.find(x => x.id === id); }

function render(){
  listEl.innerHTML = '';
  items.forEach(it => {
    const row = document.createElement('div');
    row.className = 'row' + (it.done ? ' done' : '');
    row.dataset.id = it.id;

    const grip = document.createElement('span');
    grip.className = 'grip'; grip.textContent = '⠿'; grip.title = '끌어서 순서 변경';
    // 핸들에서만 드래그 시작 — 행 전체를 draggable로 두면 텍스트 선택이 막힌다.
    grip.addEventListener('mousedown', () => { row.draggable = true; });
    grip.addEventListener('mouseup',   () => { row.draggable = false; });

    const cb = document.createElement('input'); cb.type='checkbox'; cb.checked=!!it.done;
    cb.onchange = () => { const o=find(row.dataset.id); if(o) o.done = cb.checked;
                          row.className = 'row' + (cb.checked?' done':''); };
    const tx = document.createElement('input'); tx.type='text'; tx.className='txt'; tx.value=it.text||'';
    tx.oninput = () => { const o=find(row.dataset.id); if(o) o.text = tx.value; };

    const top = document.createElement('button'); top.className='top'; top.textContent='⇧';
    top.title = '맨 위로';
    top.onclick = () => {
      const i = items.findIndex(x => x.id === row.dataset.id);
      if(i > 0){ items.unshift(items.splice(i,1)[0]); render(); }
    };
    const del = document.createElement('button'); del.className='del'; del.textContent='✕';
    del.onclick = () => {
      const i = items.findIndex(x => x.id === row.dataset.id);
      if(i >= 0){ items.splice(i,1); render(); }
    };

    row.addEventListener('dragstart', e => {
      dragEl = row; row.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', row.dataset.id); } catch(err){}
    });
    row.addEventListener('dragend', () => {
      row.classList.remove('dragging'); row.draggable = false; dragEl = null;
      syncOrderFromDom();
    });

    row.append(grip, cb, tx, top, del);
    listEl.append(row);
  });
}

// 드래그 중에는 DOM만 옮겨 실제 위치를 보여주고, 끝난 뒤 배열을 DOM 순서로 맞춘다.
let dragEl = null;
listEl.addEventListener('dragover', e => {
  if(!dragEl) return;
  e.preventDefault();
  const after = rowAfter(e.clientY);
  if(after == null) listEl.appendChild(dragEl);
  else if(after !== dragEl) listEl.insertBefore(dragEl, after);
});
function rowAfter(y){
  const rows = [...listEl.querySelectorAll('.row:not(.dragging)')];
  for(const r of rows){
    const box = r.getBoundingClientRect();
    if(y < box.top + box.height/2) return r;
  }
  return null;
}
function syncOrderFromDom(){
  const order = [...listEl.querySelectorAll('.row')].map(r => r.dataset.id);
  const seen = new Set(order);
  items = order.map(id => find(id)).filter(Boolean)
          .concat(items.filter(it => !seen.has(it.id)));
  render();
}
function commitNew(){
  const el = document.getElementById('new'); const t = el.value.trim();
  if(t){ items.push({id:rid(), text:t, done:false}); render(); }
  el.value=''; el.focus();
}
document.getElementById('new').addEventListener('keydown', e => { if(e.key==='Enter') commitNew(); });
async function doSave(){
  commitNew();
  const payload = items.map(it => ({id:it.id, text:it.text, done:!!it.done}));
  try { await fetch('/save', {method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({items:payload})}); } catch(e){}
  quit(true);
}
async function quit(saved){
  try { await fetch('/quit'); } catch(e){}
  if(saved){ document.getElementById('msg').style.display='flex'; }
  setTimeout(()=>{ window.close(); }, 120);
}
render();
document.getElementById('new').focus();
</script></body></html>""".replace("__DATA__", data)


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _touch(self):
        _last_touch[0] = time.time()

    def do_GET(self):
        self._touch()
        if self.path == "/quit":
            self._send(200, b"ok")
            threading.Thread(target=self.server.shutdown, daemon=True).start()
            return
        if self.path in ("/", "/index.html"):
            # dropped(오늘 안 하기로 뺀 것)는 편집창에 그리지 않는다.
            # 저장 시 build_saved가 원본에서 그대로 보존한다(edit.py). SPEC §빼기 참조.
            body = page_html([it for it in load() if not it.get("dropped")]).encode("utf-8")
            self._send(200, body, "text/html; charset=utf-8")
            return
        self._send(404, b"nope")

    def do_POST(self):
        self._touch()
        if self.path == "/save":
            length = int(self.headers.get("Content-Length", 0))
            raw = self.rfile.read(length) if length else b"{}"
            try:
                payload = json.loads(raw.decode("utf-8"))
                rows = [(i.get("id"), i.get("text", ""), bool(i.get("done")))
                        for i in payload.get("items", [])]
                save(build_saved(load(), rows, []))
                self._send(200, b'{"ok":true}', "application/json")
            except Exception as e:
                self._send(500, json.dumps({"error": str(e)}).encode(), "application/json")
            return
        self._send(404, b"nope")

    def _send(self, code, body, ctype="text/plain; charset=utf-8"):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        try:
            self.wfile.write(body)
        except Exception:
            pass


CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"


def open_window(url):
    # Chrome 실행파일에 직접 --app (이미 실행 중이어도 새 앱 창을 연다: 탭·주소창 없음).
    # 없으면 기본 브라우저 탭으로 폴백(피터공이 탭을 직접 닫으면 됨).
    if os.path.exists(CHROME):
        try:
            subprocess.Popen(
                [CHROME, "--app=" + url,
                 "--window-size=430,560", "--window-position=120,110",
                 "--no-first-run", "--no-default-browser-check",
                 "--user-data-dir=" + os.path.expanduser("~/.todoy-chrome")],
                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return
        except Exception:
            pass
    subprocess.run(["/usr/bin/open", url], check=False)


def idle_watch(httpd):
    while True:
        time.sleep(20)
        if time.time() - _last_touch[0] > IDLE_TIMEOUT:
            httpd.shutdown()
            return


def main():
    httpd = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    port = httpd.server_address[1]
    url = "http://127.0.0.1:%d/" % port
    threading.Thread(target=idle_watch, args=(httpd,), daemon=True).start()
    if "--no-open" not in sys.argv:
        threading.Timer(0.4, open_window, args=(url,)).start()
    else:
        print(url, flush=True)
    httpd.serve_forever()


if __name__ == "__main__":
    main()
