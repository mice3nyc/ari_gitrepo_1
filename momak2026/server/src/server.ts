// MOMAK 마켓타임 — 단일 권위 웹소켓 서버 (Phase 1 PoC)
// SPEC-market §8·§12. 정적 화면 서빙 + 방(세션)별 실시간 가격 브로드캐스트.
// 실행: npm run dev  (tsx watch)  → http://localhost:8787
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, normalize } from 'node:path';
import { WebSocketServer, WebSocket } from 'ws';
import { loadGameConfig } from './config.js';
import { Room } from './room.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');
const PORT = Number(process.env.PORT ?? 8787);

const cfg = loadGameConfig();
console.log(`[config] edition=${cfg.edition} items=${cfg.items.length} turns=${cfg.turns}`);

// ── 방 레지스트리 (단일 권위 프로세스가 인메모리 소유, SPEC §12) ──
const rooms = new Map<string, Room>();
function getOrCreateRoom(code: string): Room {
  let room = rooms.get(code);
  if (!room) {
    room = new Room(code, cfg);
    rooms.set(code, room);
    console.log(`[room] created "${code}" (총 ${rooms.size}방)`);
  }
  return room;
}
getOrCreateRoom('DEMO').startAutoDemo(); // 기본 방: 조작 없이 계속 도는 손맛 데모

// ── 정적 파일 서빙 ──
const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

async function serveStatic(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  let path = decodeURIComponent(url.pathname);
  if (path === '/') path = '/index.html';
  // 경로 탈출 방지
  const safe = normalize(join(PUBLIC_DIR, path));
  if (!safe.startsWith(PUBLIC_DIR)) { res.writeHead(403).end('forbidden'); return; }
  if (path === '/api/rooms') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify([...rooms.values()].map((r) => ({ code: r.code, players: r.playerCount }))));
    return;
  }
  try {
    const body = await readFile(safe);
    res.writeHead(200, { 'content-type': MIME[extname(safe)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
}

const http = createServer((req, res) => { void serveStatic(req, res); });

// ── 웹소켓: 방 구독 + GM 명령 ──
const wss = new WebSocketServer({ server: http });

wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  const code = (url.searchParams.get('room') ?? 'DEMO').toUpperCase();
  const role = url.searchParams.get('role') ?? 'display'; // display | gm | overview
  const room = getOrCreateRoom(code);

  const send = (obj: unknown) => { if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj)); };
  const unsub = room.subscribe(send); // 연결 즉시 스냅샷 + 이후 매 틱 (시세 구독)

  // 플레이어면 정체성·담당 아이템·지갑을 초기 전송
  const team = Number(url.searchParams.get('team') ?? 0);
  const pid = Number(url.searchParams.get('id') ?? 0);
  if (role === 'player' && team > 0 && pid > 0) {
    room.joinPlayer(team, pid);
    send({ type: 'player', team, id: pid, items: room.assignedItems(pid) });
    send(room.walletMsg(team, pid));
  }

  ws.on('message', (data) => {
    let msg: { cmd?: string; side?: 'BUY' | 'SELL'; itemId?: string; qty?: number; clientOrderId?: string };
    try { msg = JSON.parse(String(data)); } catch { return; }
    // GM 제어
    if (role === 'gm') {
      switch (msg.cmd) {
        case 'open': room.open(); break;
        case 'pause': room.pause(); break;
        case 'resume': room.resume(); break;
        case 'close': room.close(); break;
        case 'nextTurn': room.nextTurn(); break;
      }
      return;
    }
    // 플레이어 주문 (BUY/SELL)
    if (role === 'player' && msg.cmd === 'order' && team > 0 && pid > 0 && msg.side && msg.itemId) {
      const result = room.order(team, pid, { side: msg.side, itemId: msg.itemId, qty: msg.qty ?? 1, clientOrderId: msg.clientOrderId });
      send({ type: 'orderResult', ...result });
      send(room.walletMsg(team, pid));
    }
  });

  ws.on('close', () => unsub());
  console.log(`[ws] +${role} room="${code}" (구독 ${room.playerCount})`);
});

http.listen(PORT, () => {
  console.log(`\n  MOMAK 마켓타임 서버 (Phase 1 PoC)`);
  console.log(`  → http://localhost:${PORT}  (기본 방: DEMO)`);
  console.log(`  중앙화면: /overview.html   GM 콘솔: /gm.html\n`);
});
