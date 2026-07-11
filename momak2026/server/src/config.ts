// 게임 설정 로드 — market_config_miraeasset.json (16아이템 × 11턴 min/delta)
// SPEC-market §3·§4·§11. 서버가 부팅 시 이걸 읽어 Game Version 스냅샷을 만든다.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 서버 기본값 (SPEC §6 — v1은 이 값으로 못박고 간다)
export const DEFAULTS = {
  tickIntervalMs: 1000,
  marketDurationSec: 600, // 턴당 최소 10분 (2026-07-11 피터공 확정, 기존 원작 기준)
  startingCash: 50000,
} as const;

export interface PriceRow {
  turn: number;
  min: number;   // 그 턴의 바닥 가격
  delta: number; // 틱당 최대 진폭
}

export interface ItemDefinition {
  code: string;
  ko: string;
  en: string;
  category: 'core' | 'basic' | 'highvalue';
  color: string;
  initialPrice: number;
  prices: PriceRow[];
}

export interface GameConfig {
  edition: string;
  turns: number;
  note?: string;
  items: ItemDefinition[];
}

// docs/data/ 에서 로드 (server/ 기준 상위 → docs/data/)
const CONFIG_PATH = resolve(__dirname, '../../docs/data/market_config_miraeasset.json');

export function loadGameConfig(path: string = CONFIG_PATH): GameConfig {
  const raw = readFileSync(path, 'utf-8');
  const cfg = JSON.parse(raw) as GameConfig;
  if (!cfg.items?.length) throw new Error(`설정에 아이템이 없다: ${path}`);
  for (const it of cfg.items) {
    if (!it.prices?.length) throw new Error(`아이템 ${it.code}에 가격규칙이 없다`);
  }
  return cfg;
}

// 아이템의 특정 턴 가격규칙 조회
export function priceRowFor(item: ItemDefinition, turn: number): PriceRow {
  const row = item.prices.find((p) => p.turn === turn);
  if (!row) throw new Error(`${item.code} 턴 ${turn} 가격규칙 없음`);
  return row;
}

// 플레이어 배정표 (SPEC §3 AssignmentRule). player 번호 → 담당 아이템 코드 목록.
// assignments_default.json의 teams[0](15인) 패턴을 정본으로 쓴다(팀 무관 동일 배정).
const ASSIGN_PATH = resolve(__dirname, '../../docs/data/assignments_default.json');

export function loadAssignments(path: string = ASSIGN_PATH): Map<number, string[]> {
  const raw = JSON.parse(readFileSync(path, 'utf-8'));
  const map = new Map<number, string[]>();
  const team0 = raw.teams?.[0]?.assignment ?? [];
  for (const a of team0) map.set(Number(a.player), a.items as string[]);
  return map;
}
