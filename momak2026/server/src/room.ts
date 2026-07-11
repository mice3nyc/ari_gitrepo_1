// 방(세션) — 단일 권위 상태. SPEC-market §5 상태기계 + §8 이벤트.
// Phase 1 PoC 범위: 마켓 상태·타이머·턴 전환·실시간 가격 브로드캐스트.
// (BUY/SELL 원장은 Phase 3. 여기선 가격 동기화까지.)
import { DEFAULTS, loadAssignments, type GameConfig } from './config.js';
import { planTurn, nextPrice, type TurnPlan } from './priceEngine.js';

export type MarketState = 'CLOSED' | 'OPEN' | 'PAUSED';

// ── 플레이어 지갑 + 거래 (SPEC §6) ──
export interface PlayerState {
  team: number; id: number;
  cash: number;
  holdings: Map<string, number>;      // itemCode → 보유수량
  seen: Map<string, OrderResult>;     // clientOrderId → 최초 결과 (멱등)
}
export interface OrderResult {
  ok: boolean;
  code?: string;                      // 실패 사유 (SPEC §6)
  side?: 'BUY' | 'SELL'; itemId?: string; qty?: number; price?: number;
  cash: number; holding: number;      // 처리 후 잔액·해당 아이템 보유량
}

export interface ItemState {
  code: string;
  ko: string;
  en: string;
  category: string;
  color: string;
  price: number;
  prevPrice: number;   // 직전 틱 가격 (방향·변동액 표시용)
  priceVersion: number;
}

// 클라이언트에 보내는 스냅샷 (연결 직후 + 매 틱)
export interface Snapshot {
  type: 'snapshot';
  roomCode: string;
  turn: number;
  totalTurns: number;
  marketState: MarketState;
  secondsLeft: number;
  sequenceNo: number;
  serverTime: number;
  playerCount: number;
  items: Array<{
    code: string; ko: string; en: string; category: string; color: string;
    price: number; prevPrice: number; priceVersion: number;
    // 디버그/관찰용 현재 세팅값
    low: number; high: number; step: number; cycleSec: number;
  }>;
}

type Listener = (msg: Snapshot) => void;

export class Room {
  readonly code: string;
  private cfg: GameConfig;
  private turn = 1;
  private marketState: MarketState = 'CLOSED';
  private secondsLeft: number;
  private sequenceNo = 0;
  private items: ItemState[];
  private plans: Map<string, TurnPlan> = new Map();
  private tickTimer: NodeJS.Timeout | null = null;
  private listeners = new Set<Listener>();
  private rng: () => number;
  private players = new Map<string, PlayerState>(); // key = `${team}-${id}`
  private assignments = loadAssignments();          // player 번호 → 담당 아이템
  private ledger: Array<Record<string, unknown>> = []; // append-only (SPEC §6)
  private autoDemo = false; // true면 타이머 만료 시 자동으로 다음 턴+재개 (손맛 확인용 무한 루프)
  private tickCount = 0;
  // 가격변동시간: 몇 초마다 가격이 한 스텝 움직이나 (관찰 가능한 주기용 튜닝, SPEC §4·§15). 타이머는 매 초 정확.
  private priceStepSec = 2;

  constructor(code: string, cfg: GameConfig, rng: () => number = Math.random) {
    this.code = code;
    this.cfg = cfg;
    this.rng = rng;
    this.secondsLeft = DEFAULTS.marketDurationSec;
    this.items = cfg.items.map((it) => ({
      code: it.code, ko: it.ko, en: it.en, category: it.category, color: it.color,
      price: it.initialPrice, prevPrice: it.initialPrice, priceVersion: 0,
    }));
    this.replanTurn();
  }

  // 현재 턴의 궤적 파라미터 재계산 + 가격을 그 턴 바닥에서 출발
  private replanTurn(): void {
    for (const it of this.cfg.items) {
      const plan = planTurn(it, this.turn, this.cfg.turns);
      this.plans.set(it.code, plan);
      const st = this.items.find((s) => s.code === it.code)!;
      // 턴 시작 = 사이클 내 랜덤 위상 (아이템마다 다른 지점에서 출발 → 저점/고점 시점 제각각)
      const k = Math.floor(this.rng() * plan.ticksPerCycle);
      st.price = Math.min(plan.low + plan.step * k, Math.max(plan.low, plan.high - 1));
      st.prevPrice = st.price;
    }
  }

  // ── 이벤트 구독 ──
  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    fn(this.snapshot()); // 연결 직후 스냅샷 (SPEC §8)
    return () => this.listeners.delete(fn);
  }

  get playerCount(): number { return this.listeners.size; }

  private broadcast(): void {
    const snap = this.snapshot();
    for (const fn of this.listeners) fn(snap);
  }

  snapshot(): Snapshot {
    return {
      type: 'snapshot',
      roomCode: this.code,
      turn: this.turn,
      totalTurns: this.cfg.turns,
      marketState: this.marketState,
      secondsLeft: this.secondsLeft,
      sequenceNo: ++this.sequenceNo,
      serverTime: Date.now(),
      playerCount: this.listeners.size,
      items: this.items.map((s) => {
        const p = this.plans.get(s.code)!;
        return {
          code: s.code, ko: s.ko, en: s.en, category: s.category, color: s.color,
          price: s.price, prevPrice: s.prevPrice, priceVersion: s.priceVersion,
          low: p.low, high: p.high, step: p.step, cycleSec: p.ticksPerCycle * this.priceStepSec,
        };
      }),
    };
  }

  // ── 마켓 제어 (GM) SPEC §5·§10 ──
  open(): void {
    if (this.marketState === 'OPEN') return;
    this.marketState = 'OPEN';
    this.startTicking();
    this.broadcast();
  }

  pause(): void {
    if (this.marketState !== 'OPEN') return;
    this.marketState = 'PAUSED';
    this.stopTicking();      // 타이머·Tick 정지 (SPEC §4·§5)
    this.broadcast();
  }

  resume(): void {
    if (this.marketState !== 'PAUSED') return;
    this.marketState = 'OPEN';
    this.startTicking();
    this.broadcast();
  }

  close(): void {
    if (this.marketState === 'CLOSED') return;
    this.marketState = 'CLOSED';
    this.stopTicking();
    this.broadcast();
  }

  nextTurn(): void {
    if (this.turn >= this.cfg.turns) return;
    this.close();
    this.turn += 1;
    this.secondsLeft = DEFAULTS.marketDurationSec;
    this.replanTurn();       // 새 턴 시작가·규칙 적용
    this.broadcast();        // turn.changed (SPEC §5) — OPEN 전까지 주문 불가
  }

  private startTicking(): void {
    if (this.tickTimer) return;
    this.tickTimer = setInterval(() => this.tick(), DEFAULTS.tickIntervalMs);
  }

  private stopTicking(): void {
    if (this.tickTimer) { clearInterval(this.tickTimer); this.tickTimer = null; }
  }

  // 매 틱(1초): 타이머는 매 초 감소, 가격은 priceStepSec마다 한 스텝 전진 + 브로드캐스트
  private tick(): void {
    this.tickCount += 1;
    if (this.tickCount % this.priceStepSec === 0) {
      for (const st of this.items) {
        const plan = this.plans.get(st.code)!;
        st.prevPrice = st.price;
        st.price = nextPrice(st.price, plan);
        st.priceVersion += 1;
      }
    }
    this.secondsLeft = Math.max(0, this.secondsLeft - 1);
    if (this.secondsLeft === 0) {
      if (this.autoDemo) { this.demoAdvance(); return; } // 데모: 멈추지 않고 다음 턴으로
      // 턴 시간 만료 → 자동 CLOSE (GM이 NEXT TURN 하기 전까지 종가 유지)
      this.close();
      return;
    }
    this.broadcast();
  }

  // 손맛 확인용 자동 데모: OPEN 상태로 두고, 턴이 끝나면 다음 턴으로 계속 돌린다 (조작 불필요)
  startAutoDemo(): void { this.autoDemo = true; this.open(); }

  private demoAdvance(): void {
    this.turn = this.turn >= this.cfg.turns ? 1 : this.turn + 1; // 마지막 턴 → 1턴 순환
    this.secondsLeft = DEFAULTS.marketDurationSec;
    this.replanTurn();
    this.marketState = 'CLOSED';
    this.open(); // 새 턴 바로 재개 (틱 이어감 + 브로드캐스트)
  }

  // ── 플레이어 (SPEC §6·§9.1) ──
  joinPlayer(team: number, id: number): PlayerState {
    const key = `${team}-${id}`;
    let p = this.players.get(key);
    if (!p) {
      p = { team, id, cash: DEFAULTS.startingCash, holdings: new Map(), seen: new Map() };
      this.players.set(key, p);
    }
    return p;
  }

  assignedItems(id: number): string[] {
    return this.assignments.get(id) ?? this.cfg.items.slice(0, 2).map((i) => i.code);
  }

  private priceOf(itemId: string): number {
    return this.items.find((s) => s.code === itemId)?.price ?? 0;
  }

  walletMsg(team: number, id: number) {
    const p = this.joinPlayer(team, id);
    return { type: 'wallet' as const, cash: p.cash, holdings: Object.fromEntries(p.holdings) };
  }

  // 주문 처리 — 멱등 + 표시가 체결 + 음수 가드 (SPEC §6·§7). 단일 스레드라 직렬화는 자명.
  order(team: number, id: number, o: { side: 'BUY' | 'SELL'; itemId: string; qty: number; clientOrderId?: string }): OrderResult {
    const p = this.joinPlayer(team, id);
    if (o.clientOrderId && p.seen.has(o.clientOrderId)) return p.seen.get(o.clientOrderId)!; // 멱등(광클릭·재전송)
    const result = this.execOrder(p, o);
    if (o.clientOrderId) p.seen.set(o.clientOrderId, result);
    return result;
  }

  private execOrder(p: PlayerState, o: { side: 'BUY' | 'SELL'; itemId: string; qty: number }): OrderResult {
    const held = p.holdings.get(o.itemId) ?? 0;
    if (this.marketState !== 'OPEN') return { ok: false, code: 'MARKET_NOT_OPEN', cash: p.cash, holding: held };
    const price = this.priceOf(o.itemId);
    if (price <= 0) return { ok: false, code: 'BAD_ITEM', cash: p.cash, holding: held };
    const qty = Math.max(1, Math.floor(o.qty || 1));
    if (o.side === 'BUY') {
      const cost = price * qty;
      if (p.cash < cost) return { ok: false, code: 'INSUFFICIENT_CASH', price, cash: p.cash, holding: held };
      p.cash -= cost; p.holdings.set(o.itemId, held + qty);
    } else {
      if (held < qty) return { ok: false, code: 'INSUFFICIENT_INVENTORY', price, cash: p.cash, holding: held };
      p.holdings.set(o.itemId, held - qty); p.cash += price * qty;
    }
    const newHeld = p.holdings.get(o.itemId)!;
    this.ledger.push({ team: p.team, id: p.id, side: o.side, itemId: o.itemId, qty, price, cashAfter: p.cash });
    return { ok: true, side: o.side, itemId: o.itemId, qty, price, cash: p.cash, holding: newHeld };
  }

  dispose(): void { this.stopTicking(); this.listeners.clear(); }
}
