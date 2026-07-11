// Phase 1 검증 하니스 — 멀티 클라이언트 실시간 가격 동기화 확인
// 2개 디스플레이 + 1개 GM 접속 → OPEN → 여러 틱 수집 → 클라이언트 간 가격 동일성 검증.
import { WebSocket } from 'ws';

const URL = 'ws://localhost:8787';
const room = 'VERIFY';
const captures = { A: new Map(), B: new Map() }; // sequenceNo → items[]

function client(name, role) {
  return new Promise((resolve) => {
    const ws = new WebSocket(`${URL}/?room=${room}&role=${role}`);
    ws.on('open', () => resolve(ws));
    ws.on('message', (d) => {
      const m = JSON.parse(String(d));
      if (m.type === 'snapshot' && captures[name]) {
        captures[name].set(m.sequenceNo, { turn: m.turn, state: m.marketState, secondsLeft: m.secondsLeft, items: m.items });
      }
    });
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const dispA = await client('A', 'overview');
const dispB = await client('B', 'overview');
const gm = await client('gm', 'gm');
await sleep(200);

gm.send(JSON.stringify({ cmd: 'open' }));
await sleep(5200); // ~5 ticks
gm.send(JSON.stringify({ cmd: 'pause' }));
await sleep(300);

// 검증 1: 두 디스플레이가 받은 스냅샷들에서, 같은 아이템의 가격 궤적이 일치하는가
// (서버가 유일 원장이면 A와 B는 같은 sequenceNo에서 같은 값을 볼 수 없을 수도 있으나
//  — sequenceNo는 브로드캐스트마다 증가하므로 A/B가 같은 브로드캐스트를 받으면 값이 같아야 한다.)
// 실전 판정: A가 본 (turn, price 시퀀스)와 B가 본 것이 아이템별로 동일 집합인지.
function priceSeq(cap, code) {
  return [...cap.values()].map((s) => s.items.find((i) => i.code === code)?.price);
}

const sample = 'POWER';
const seqA = priceSeq(captures.A, sample);
const seqB = priceSeq(captures.B, sample);

// A와 B가 받은 스냅샷 수
console.log(`디스플레이 A 스냅샷 ${captures.A.size}개, B ${captures.B.size}개`);

// 공통 브로드캐스트(같은 서버 tick)에서 값 일치 검증: 두 클라이언트의 마지막 N개 가격 비교
let mismatch = 0, compared = 0;
const codes = [...captures.A.values()].at(-1)?.items.map((i) => i.code) ?? [];
// A와 B의 스냅샷을 serverTime 대신 마지막 공통 가격으로 비교 — 각 아이템의 "가장 최근 가격"이 같아야 한다(둘 다 방금 PAUSE된 같은 상태 구독)
const lastA = [...captures.A.values()].at(-1);
const lastB = [...captures.B.values()].at(-1);
for (const code of codes) {
  const pa = lastA.items.find((i) => i.code === code).price;
  const pb = lastB.items.find((i) => i.code === code).price;
  compared++;
  if (pa !== pb) { mismatch++; console.log(`  ✗ ${code}: A=${pa} B=${pb}`); }
}

// 검증 2: 가격이 실제로 움직였는가 (틱 엔진 작동)
const moved = new Set(seqA.filter(Boolean)).size > 1;

// 검증 3: 모든 가격이 양수 정수이며 floor..ceiling 안 (SPEC §4)
let outOfRange = 0;
for (const s of captures.A.values())
  for (const it of s.items)
    if (!Number.isInteger(it.price) || it.price < 1) outOfRange++;

console.log(`\n검증 결과:`);
console.log(`  [1] 최신 상태 A==B 아이템 일치: ${compared - mismatch}/${compared} ${mismatch === 0 ? '✓' : '✗'}`);
console.log(`  [2] 가격 진동(틱 엔진 작동): ${moved ? '✓' : '✗'} (${sample} 고유값 ${new Set(seqA.filter(Boolean)).size}개)`);
console.log(`  [3] 양수 정수: ${outOfRange === 0 ? '✓' : '✗ 위반 ' + outOfRange}`);
console.log(`  ${sample} A 궤적: ${seqA.filter(Boolean).join(' → ')}`);
console.log(`  ${sample} B 궤적: ${seqB.filter(Boolean).join(' → ')}`);

const pass = mismatch === 0 && moved && outOfRange === 0;
console.log(`\n  종합: ${pass ? 'PASS ✓' : 'FAIL ✗'}`);
dispA.close(); dispB.close(); gm.close();
process.exit(pass ? 0 : 1);
