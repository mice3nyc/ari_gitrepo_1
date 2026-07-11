// 가격 엔진 — 예측 가능한 톱니(SAWTOOTH) 사이클 (SPEC-market §4, 2026-07-11 재설계)
// 랜덤 워크 폐기 이유: 예측 불가 → 저점 매수·고점 매도 타이밍이 성립 안 함.
// 실제 MOMAK: 저점(min)에서 출발해 delta만큼 매 스텝 상승 → 고점 찍으면 저점으로 급락 → 반복.
// 아이템마다 delta·폭이 달라 오르는 속도·높이가 다르다(관찰·예측 가능). 엑셀 min_price·delta_price 근거.
import { DEFAULTS, priceRowFor, type ItemDefinition } from './config.js';

export interface TurnPlan {
  low: number;        // 저점 = min[turn] (엑셀)
  high: number;       // 고점 = min[turn+1] (마지막 턴은 min[t] + 직전 증가값)
  step: number;       // 스텝당 상승폭 = delta[turn] (엑셀) × stepMult
  ticksPerCycle: number; // 저점→고점 도달에 걸리는 스텝 수 (관찰용)
}

// 튜닝 노브 (손맛 조정용, SPEC §4·§15). 엑셀 값은 그대로 두고 배수로 조절.
export const TUNING = {
  stepMult: 1,      // 상승 속도 배수 (↑=빨리 오름)
  amplitudeMult: 1, // 저점↔고점 폭 배수 (↑=스윙 큼)
};

// 아이템·턴의 사이클 파라미터 계산 (SPEC §4)
export function planTurn(
  item: ItemDefinition,
  turn: number,
  totalTurns: number,
): TurnPlan {
  const row = priceRowFor(item, turn);
  const low = row.min;
  let amplitude: number;
  if (turn < totalTurns) {
    amplitude = priceRowFor(item, turn + 1).min - low; // 다음 턴 저점까지가 이번 턴 고점
  } else {
    const prevMin = priceRowFor(item, turn - 1).min;   // 마지막 턴: 직전 증가값만큼
    amplitude = low - prevMin;
  }
  amplitude = Math.max(1, Math.round(amplitude * TUNING.amplitudeMult));
  const step = Math.max(1, Math.round(row.delta * TUNING.stepMult));
  const high = low + amplitude;
  return { low, high, step, ticksPerCycle: Math.ceil(amplitude / step) };
}

// 한 스텝 전진 — 결정적 톱니. 고점 도달/초과 시 저점으로 급락(뚝). 항상 양수 정수.
export function nextPrice(prev: number, plan: TurnPlan): number {
  const raised = prev + plan.step;
  if (raised >= plan.high) return plan.low; // 고점 찍음 → 저점으로 리셋
  return raised;
}

// 결정적 재현/향후 노이즈용 시드 난수 (현재 사이클은 결정적이라 미사용, 이벤트층에서 사용 예정). mulberry32.
export function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
