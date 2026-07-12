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
  stepSec: number;     // 변동시간: 몇 초마다 한 스텝 (아이템별, SPEC §4.1)
  sinceStep: number;   // 마지막 스텝 이후 경과 초 (per-item 틱 카운터)
  durationSec: number; // 총변동주기: 한 사이클 총 시간. 변동폭(step)은 이것+stepSec+밴드에서 파생 (SPEC §4.1)
  event: PriceEvent | null; // 진행 중 충격 이벤트 (SPEC §4.2)
}

// 충격 이벤트 (spike/crash) — 톱니를 지속시간 동안 대체 (SPEC §4.2)
export interface PriceEvent {
  kind: 'spike' | 'crash';
  magnitude: number; // 스텝당 변동폭. 0이면 스텝마다 랜덤
  secLeft: number;   // 남은 지속시간(초)
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
  priceStepSec: number;   // 전역 가격변동주기 (SPEC §4.1 편집 UI 표시용)
  items: Array<{
    code: string; ko: string; en: string; category: string; color: string;
    price: number; prevPrice: number; priceVersion: number;
    // 디버그/관찰용 현재 세팅값
    low: number; high: number; step: number; stepSec: number; cycleSec: number;
    event: 'spike' | 'crash' | null; // 진행 중 이벤트 (중앙화면 배지, SPEC §4.2)
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
  // 가격변동시간: 몇 초마다 가격이 한 스텝 움직이나 (관찰 가능한 주기용 튜닝, SPEC §4·§4.1). 0.5초 단위.
  private priceStepSec = 1.5; // 기본 1.5초 (2026-07-12 피터공)
  private subSecAcc = 0;      // 초 타이머용 누적 (틱 500ms → 2틱마다 1초 차감)
  private displayOrder: string[]; // 중앙(overview) 아이템 표시 순서 (SPEC §10.1 셔플)
  private channels = new Map<number, { send: (m: unknown) => void; items: string[] }>(); // 채널 레지스트리
  private nextChannelId = 1;

  constructor(code: string, cfg: GameConfig, rng: () => number = Math.random) {
    this.code = code;
    this.cfg = cfg;
    this.rng = rng;
    this.secondsLeft = DEFAULTS.marketDurationSec;
    this.items = cfg.items.map((it, i) => ({
      code: it.code, ko: it.ko, en: it.en, category: it.category, color: it.color,
      price: it.initialPrice, prevPrice: it.initialPrice, priceVersion: 0,
      // 변동시간=전역 기본(1.5초), 총주기=아이템별 20~40초 분산(이웃끼리 다르게, SPEC §4.1)
      stepSec: this.priceStepSec, sinceStep: 0, durationSec: 20 + ((i * 13) % 21),
      event: null,
    }));
    this.displayOrder = this.items.map((s) => s.code);
    this.replanTurn();
  }

  // 변동폭(step)을 밴드·변동시간·총주기에서 파생 (SPEC §4.1). 입력은 저/고/변동시간/총주기 넷뿐.
  private deriveStep(plan: TurnPlan, st: ItemState): void {
    const band = plan.high - plan.low;
    const steps = Math.max(1, Math.round(st.durationSec / st.stepSec)); // 목표 스텝수 = 총주기/변동시간
    // 폭 = 밴드÷스텝수를 반올림(ceil 아님 — 좁은 밴드에서 총주기 언더슛 최소화). 1~밴드폭.
    plan.step = Math.max(1, Math.min(band, Math.round(band / steps)));
    plan.ticksPerCycle = Math.ceil(band / plan.step);
  }

  // 현재 턴의 궤적 파라미터 재계산 + 가격을 그 턴 바닥에서 출발
  private replanTurn(): void {
    for (const it of this.cfg.items) {
      const plan = planTurn(it, this.turn, this.cfg.turns); // 엑셀 min/delta 기반 밴드·초기 step
      this.plans.set(it.code, plan);
      const st = this.items.find((s) => s.code === it.code)!;
      // 총주기 미시드면 엑셀 궤적에서 시드(첫 총주기 = 엑셀 스텝수 × 변동시간). 이후엔 사용자값 유지.
      if (st.durationSec <= 0) st.durationSec = plan.ticksPerCycle * st.stepSec;
      st.event = null; // 새 턴 = 이벤트 초기화 (SPEC §4.2)
      this.deriveStep(plan, st); // 폭을 총주기·변동시간·새 밴드로 재파생
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
      priceStepSec: this.priceStepSec,
      // 중앙 표시 순서(displayOrder)대로 방출 (SPEC §10.1 셔플)
      items: this.displayOrder.map((code) => {
        const s = this.items.find((it) => it.code === code)!;
        const p = this.plans.get(code)!;
        return {
          code: s.code, ko: s.ko, en: s.en, category: s.category, color: s.color,
          price: s.price, prevPrice: s.prevPrice, priceVersion: s.priceVersion,
          low: p.low, high: p.high, step: p.step, stepSec: s.stepSec, cycleSec: p.ticksPerCycle * s.stepSec,
          event: s.event ? s.event.kind : null,
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

  // ── GM 폰 컨트롤 (SPEC §10.1) ──

  // 중앙(overview) 아이템 표시 순서 셔플. 가격·세팅 그대로, 자리만 바뀜.
  shuffleItems(): void {
    for (let i = this.displayOrder.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [this.displayOrder[i], this.displayOrder[j]] = [this.displayOrder[j], this.displayOrder[i]];
    }
    this.broadcast();
  }

  // 아이템 충격 이벤트 발동 (SPEC §4.2). magnitude 0/미지정 → 스텝마다 랜덤.
  triggerEvent(itemId: string, kind: 'spike' | 'crash', magnitude: number, durationSec: number): void {
    const st = this.items.find((s) => s.code === itemId);
    if (!st) return;
    const mag = Number.isFinite(magnitude) && magnitude > 0 ? Math.round(magnitude) : 0;
    const dur = Math.max(1, Math.round(durationSec) || 5);
    st.event = { kind, magnitude: mag, secLeft: dur };
    this.broadcast();
  }

  // 이벤트 한 스텝의 새 가격. spike=상승(고점 초과 허용), crash=하락(바닥 1).
  private eventStep(st: ItemState, plan: TurnPlan): number {
    const ev = st.event!;
    const mag = ev.magnitude > 0 ? ev.magnitude : Math.max(1, Math.round(plan.step * (2 + this.rng() * 3)));
    return ev.kind === 'spike' ? st.price + mag : Math.max(1, st.price - mag);
  }

  // ── 채널 레지스트리 (SPEC §10.1 채널 섞기) ──
  registerChannel(send: (m: unknown) => void, items: string[] = []): number {
    const id = this.nextChannelId++;
    this.channels.set(id, { send, items: items.slice(0, 2) });
    return id;
  }
  setChannelItems(id: number, items: string[]): void {
    const ch = this.channels.get(id);
    if (ch) ch.items = items.slice(0, 2);
  }
  unregisterChannel(id: number): void { this.channels.delete(id); }

  // 열린 채널들의 표시 아이템을 서로 순환(랜덤 시프트 — 전원 변경 보장). 채널 0~1개면 무동작.
  shuffleChannels(): void {
    const chans = [...this.channels.values()].filter((c) => c.items.length > 0);
    if (chans.length < 2) return;
    const shift = 1 + Math.floor(this.rng() * (chans.length - 1)); // 1~n-1 → 전원 바뀜
    const arrays = chans.map((c) => c.items);
    for (let i = 0; i < chans.length; i++) {
      chans[i].items = arrays[(i + shift) % chans.length];
      chans[i].send({ type: 'setChannelItems', items: chans[i].items });
    }
  }

  // ── 라이브 세팅 편집 (SPEC §4.1 중앙화면 오버레이) ──
  // 입력 4개: 밴드(저/고)·변동시간(stepSec)·총주기(durationSec). 변경된 필드만 온다.
  // 변동폭(step)은 입력이 아니라 셋에서 파생(deriveStep) — 재조정 규칙 불필요.
  setItemPlan(
    code: string,
    patch: { low?: number; high?: number; stepSec?: number; durationSec?: number },
  ): void {
    const plan = this.plans.get(code);
    const st = this.items.find((s) => s.code === code);
    if (!plan || !st) return;

    // 밴드 (독립)
    const low = Math.max(1, patch.low !== undefined ? Math.round(patch.low) : plan.low);
    const high = Math.max(low + 1, patch.high !== undefined ? Math.round(patch.high) : plan.high);
    plan.low = low; plan.high = high;

    // 변동시간 (독립) — 0.5초 단위 (SPEC §4.1)
    if (patch.stepSec !== undefined && Number.isFinite(patch.stepSec)) {
      st.stepSec = Math.max(0.5, Math.min(15, Math.round(patch.stepSec * 2) / 2));
    }
    // 총주기 (독립) — 최소 한 스텝 시간
    if (patch.durationSec !== undefined && Number.isFinite(patch.durationSec)) {
      st.durationSec = Math.max(st.stepSec, Math.round(patch.durationSec));
    }

    this.deriveStep(plan, st); // 폭·스텝수 파생
    // 현재가를 새 밴드 [low, high)로 당겨넣음
    st.price = Math.min(Math.max(st.price, low), high - 1);
    st.prevPrice = st.price;
    st.sinceStep = 0;
    st.priceVersion += 1;
    this.broadcast();
  }

  // 전역 변동시간 일괄 (모든 아이템 stepSec를 한 번에) + 신규/리셋 기본값. 이후 턴에도 지속.
  setPriceStepSec(value: number): void {
    if (!Number.isFinite(value)) return;
    this.priceStepSec = Math.max(0.5, Math.min(15, Math.round(value * 2) / 2)); // 0.5초 단위
    for (const st of this.items) {
      st.stepSec = this.priceStepSec; st.sinceStep = 0;
      this.deriveStep(this.plans.get(st.code)!, st); // 변동시간 바뀌면 폭 재파생
    }
    this.broadcast();
  }

  private startTicking(): void {
    if (this.tickTimer) return;
    this.tickTimer = setInterval(() => this.tick(), DEFAULTS.tickIntervalMs);
  }

  private stopTicking(): void {
    if (this.tickTimer) { clearInterval(this.tickTimer); this.tickTimer = null; }
  }

  // 매 틱(500ms): 각 아이템은 자기 stepSec(초)마다 한 스텝 전진, 타이머는 2틱마다 1초 감소 (SPEC §4.1)
  private tick(): void {
    this.tickCount += 1;
    const dt = DEFAULTS.tickIntervalMs / 1000; // 0.5초
    for (const st of this.items) {
      st.sinceStep += dt;
      if (st.sinceStep + 1e-9 >= st.stepSec) {
        st.sinceStep = 0;
        const plan = this.plans.get(st.code)!;
        st.prevPrice = st.price;
        if (st.event) st.price = this.eventStep(st, plan); // 이벤트 중 = 방향 충격 (SPEC §4.2)
        else st.price = nextPrice(st.price, plan);         // 평시 = 톱니
        st.priceVersion += 1;
      }
      // 이벤트 타이머 감소 (실초). 끝나면 밴드로 복귀 후 톱니 재개
      if (st.event) {
        st.event.secLeft -= dt;
        if (st.event.secLeft <= 0) {
          const plan = this.plans.get(st.code)!;
          st.price = st.event.kind === 'crash' ? plan.low : plan.high - 1;
          st.event = null;
        }
      }
    }
    this.subSecAcc += dt;
    if (this.subSecAcc + 1e-9 < 1) { this.broadcast(); return; } // 아직 1초 안 참 → 가격만 갱신 브로드캐스트
    this.subSecAcc -= 1;
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
