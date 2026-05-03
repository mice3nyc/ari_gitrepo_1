#!/usr/bin/env node
/**
 * extract_balance.js — AI Literacy v0.5 발란스 CSV 추출기
 *
 * index.html 의 CONFIG / DELEGATION_DELTA / SCENARIOS 객체를 읽어
 * 4종 CSV 를 balance/ 폴더에 생성한다.
 *
 * (Phase 8.15 이후 SCENARIO_* 7개 var → SCENARIOS 단일 객체로 통합됨.
 *  build.py 가 data/scenarios.yaml 에서 inject 한다.)
 *
 * 실행: node extract_balance.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SRC = path.resolve(__dirname, '..', 'index.html');
const OUT_DIR = __dirname;

// ----------------------------------------------------------
// 1) HTML 에서 데이터 블록만 잘라낸다.
//    CONFIG, DELEGATION_DELTA, SCENARIO_* 5개의 var 정의를 정규식으로 가져와
//    sandbox 에서 평가한다.
// ----------------------------------------------------------
const html = fs.readFileSync(SRC, 'utf8');

// 한 줄 var 선언이 닫히는 위치(}; 또는 ];)를 찾는다.
function sliceVarBlock(source, varName) {
  const startRe = new RegExp(`var\\s+${varName}\\s*=\\s*`);
  const m = source.match(startRe);
  if (!m) throw new Error(`var ${varName} not found`);
  const start = m.index;
  // 첫 { 또는 [ 부터 균형 매칭
  let i = start;
  while (i < source.length && source[i] !== '{' && source[i] !== '[') i++;
  if (i >= source.length) throw new Error(`open bracket for ${varName} not found`);
  const open = source[i];
  const close = open === '{' ? '}' : ']';
  let depth = 0, inStr = false, strCh = '', escape = false;
  for (let j = i; j < source.length; j++) {
    const ch = source[j];
    if (escape) { escape = false; continue; }
    if (inStr) {
      if (ch === '\\') { escape = true; continue; }
      if (ch === strCh) inStr = false;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = true; strCh = ch; continue; }
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) {
        return source.slice(start, j + 1) + ';';
      }
    }
  }
  throw new Error(`closing bracket for ${varName} not found`);
}

const blocks = ['CONFIG', 'DELEGATION_DELTA', 'SCENARIOS'];

const sandboxSrc = blocks.map(n => sliceVarBlock(html, n)).join('\n');

const ctx = {};
vm.createContext(ctx);
vm.runInContext(sandboxSrc, ctx);

const CONFIG = ctx.CONFIG;
const DELEGATION_DELTA = ctx.DELEGATION_DELTA;
const SCENARIOS = ctx.SCENARIOS;

// 5개 시나리오 키 검증 (Phase 8.15 build.py 와 동일)
const REQUIRED_KEYS = ['selfintro', 'groupwork', 'eorinwangja', 'career', 'studyplan'];
REQUIRED_KEYS.forEach(k => {
  if (!SCENARIOS[k]) throw new Error(`SCENARIOS.${k} missing in index.html`);
});

// ----------------------------------------------------------
// 2) 비용 분할 함수 (index.html 의 _rawTier1Cost / _rawTier2Cost / _rawReviewCost
//    동일 로직을 scenario 객체를 인자로 받는 형태로 재구현)
// ----------------------------------------------------------
function rawTier1Cost(sc, t1) {
  if (!sc.resourceCosts) return { time: 0, energy: 0 };
  let minT = Infinity, minE = Infinity;
  Object.keys(sc.resourceCosts).forEach(k => {
    if (k.charAt(0) === t1) {
      const c = sc.resourceCosts[k];
      if (c.time   < minT) minT = c.time;
      if (c.energy < minE) minE = c.energy;
    }
  });
  return { time: isFinite(minT) ? minT : 0, energy: isFinite(minE) ? minE : 0 };
}
function rawTier2Cost(sc, t2) {
  if (!sc.resourceCosts || !t2) return { time: 0, energy: 0 };
  let minT = Infinity, minE = Infinity;
  Object.keys(sc.resourceCosts).forEach(k => {
    if (k.substr(0, 2) === t2) {
      const c = sc.resourceCosts[k];
      if (c.time   < minT) minT = c.time;
      if (c.energy < minE) minE = c.energy;
    }
  });
  const t1c = rawTier1Cost(sc, t2.charAt(0));
  return {
    time:   Math.max(0, (isFinite(minT) ? minT : 0) - t1c.time),
    energy: Math.max(0, (isFinite(minE) ? minE : 0) - t1c.energy),
  };
}
function rawReviewCost(sc, leaf) {
  if (!sc.resourceCosts || !sc.resourceCosts[leaf]) return { time: 0, energy: 0 };
  const t2 = leaf.substr(0, 2);
  const leafC = sc.resourceCosts[leaf];
  const t1c = rawTier1Cost(sc, leaf.charAt(0));
  const t2c = rawTier2Cost(sc, t2);
  return {
    time:   Math.max(0, leafC.time   - t1c.time   - t2c.time),
    energy: Math.max(0, leafC.energy - t1c.energy - t2c.energy),
  };
}

const MULT = (typeof CONFIG.resourceCostMultiplier === 'number') ? CONFIG.resourceCostMultiplier : 1;
const DISC = (typeof CONFIG.competencyDiscountMult  === 'number') ? CONFIG.competencyDiscountMult  : 1;

function applyMult(c) {
  return { time: Math.round(c.time * MULT), energy: Math.round(c.energy * MULT) };
}
function applyDiscount(c, dlg, knl) {
  // dlg / knl 은 위/도 점수 (정수). 음수면 페널티.
  const dlgEffect = dlg * DISC;
  const knlEffect = knl * DISC;
  return {
    time:   Math.max(0, c.time   - dlgEffect),
    energy: Math.max(0, c.energy - knlEffect),
  };
}

// ----------------------------------------------------------
// 3) CSV helpers
// ----------------------------------------------------------
const BOM = '﻿';
function csvEscape(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}
function writeCSV(filename, rows) {
  const text = BOM + rows.map(r => r.map(csvEscape).join(',')).join('\n') + '\n';
  fs.writeFileSync(path.join(OUT_DIR, filename), text, 'utf8');
  console.log('wrote', filename, '(' + (rows.length - 1) + ' rows)');
}

// ----------------------------------------------------------
// 4) scenarios.csv
// ----------------------------------------------------------
const scenarioOrder = ['selfintro', 'groupwork', 'eorinwangja', 'career', 'studyplan'];

const scenariosRows = [
  ['id', 'title', 'leaf_count', 'tier1_count', 'tier2_count_total', 'review_count'],
];
scenarioOrder.forEach(sid => {
  const sc = SCENARIOS[sid];
  const tier1Count = (sc.tier1 || []).length;
  let tier2Total = 0;
  Object.keys(sc.tier2 || {}).forEach(k => { tier2Total += sc.tier2[k].length; });
  const reviewCount = (sc.reviews || []).length;
  const leafCount = Object.keys(sc.resourceCosts || {}).length;
  scenariosRows.push([sc.id, sc.title, leafCount, tier1Count, tier2Total, reviewCount]);
});
writeCSV('scenarios.csv', scenariosRows);

// ----------------------------------------------------------
// 5) choices.csv (leaf 단위)
// ----------------------------------------------------------
// 기존 choices.csv 가 있으면 peter_note 컬럼만 보존 (재실행 시 메모 유지)
function loadExistingNotes() {
  const filepath = path.join(OUT_DIR, 'choices.csv');
  if (!fs.existsSync(filepath)) return new Map();
  const text = fs.readFileSync(filepath, 'utf8').replace(/^﻿/, '');  // strip BOM
  const lines = text.split(/\r?\n/).filter(l => l.length > 0);
  if (lines.length < 2) return new Map();
  // simple CSV parse — handle quoted fields
  function parseLine(line) {
    const cells = [];
    let cur = '', inStr = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inStr) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') inStr = false;
        else cur += ch;
      } else {
        if (ch === ',') { cells.push(cur); cur = ''; }
        else if (ch === '"') inStr = true;
        else cur += ch;
      }
    }
    cells.push(cur);
    return cells;
  }
  const headers = parseLine(lines[0]);
  const sIdx = headers.indexOf('scenario_id');
  const lIdx = headers.indexOf('leaf');
  const nIdx = headers.indexOf('peter_note');
  if (sIdx < 0 || lIdx < 0 || nIdx < 0) return new Map();
  const map = new Map();
  for (let i = 1; i < lines.length; i++) {
    const cells = parseLine(lines[i]);
    const note = cells[nIdx];
    if (note) map.set(`${cells[sIdx]}|${cells[lIdx]}`, note);
  }
  return map;
}
const existingNotes = loadExistingNotes();
console.log(`기존 peter_note 보존: ${existingNotes.size}건`);

const choiceHeaders = [
  // 식별자
  'scenario_id', 'leaf', 'tier1', 'tier2', 'review',
  // 시나리오 메타 (시나리오마다 동일, leaf마다 반복)
  'scenario_title', 'scenario_learningMessage', 'situation_text',
  // tier1 텍스트 (t1당 동일)
  'tier1_label', 'tier1_desc', 'tier1_lesson',
  // tier2 텍스트 + 위임 (t2당 동일)
  'tier2_label', 'tier2_lesson',
  't2_delegation_label', 't2_delegation_delta',
  // result (t2 단위)
  'result_text', 'result_summary', 'result_lesson', 'result_basePoint',
  // review (R1/R2/R3별)
  'review_label', 'review_desc', 'review_lesson',
  // reviewSupplement (leaf 단위, R1엔 빈값 — 디자인 의도)
  'reviewSupplement',
  // finals (leaf 단위)
  'final_score', 'final_grade', 'final_item',
  'final_delegation', 'final_knowledge', 'final_awareness',
  // 비용
  'raw_time', 'raw_energy',
  'mult_time', 'mult_energy',
  'discount_time_위+3', 'discount_energy_도+3',
  'discount_time_위-3', 'discount_energy_도-3',
  // 피터공 검수 메모 (yaml 외 — 재실행 시 보존)
  'peter_note',
];
const choiceRows = [choiceHeaders];

scenarioOrder.forEach(sid => {
  const sc = SCENARIOS[sid];
  const leaves = Object.keys(sc.resourceCosts || {}).sort();
  leaves.forEach(leaf => {
    const t1 = leaf.charAt(0);
    const t2 = leaf.substr(0, 2);
    const review = leaf.substr(2);  // "R1" / "R2" / "R3"
    const t1Entry = (sc.tier1 || []).find(o => o.id === t1) || {};
    const t2Entry = (sc.tier2 && sc.tier2[t1] || []).find(o => o.id === t2) || {};
    const resultEntry = (sc.results && sc.results[t2]) || {};
    const reviewEntry = (sc.reviews || []).find(o => o.id === review) || {};
    const supplement = (sc.reviewSupplements || {})[leaf] || '';
    const finalEntry = (sc.finals || {})[leaf] || {};
    const dlgLabel = t2Entry.delegation || '';
    const dlgDelta = (DELEGATION_DELTA[dlgLabel] !== undefined) ? DELEGATION_DELTA[dlgLabel] : '';
    const raw = sc.resourceCosts[leaf];
    const mult = applyMult(raw);
    const dPlus  = applyDiscount(mult,  3,  3);
    const dMinus = applyDiscount(mult, -3, -3);
    const peterNote = existingNotes.get(`${sid}|${leaf}`) || '';
    choiceRows.push([
      sid, leaf, t1, t2, review,
      sc.title || '',
      sc.learningMessage || '',
      (sc.situation && sc.situation.text) || '',
      t1Entry.label || '', t1Entry.desc || '', t1Entry.lesson || '',
      t2Entry.label || '', t2Entry.lesson || '',
      dlgLabel, dlgDelta,
      resultEntry.text || '', resultEntry.summary || '', resultEntry.lesson || '',
      (resultEntry.basePoint != null) ? resultEntry.basePoint : '',
      reviewEntry.label || '', reviewEntry.desc || '', reviewEntry.lesson || '',
      supplement,
      (finalEntry.score != null) ? finalEntry.score : '',
      finalEntry.grade || '', finalEntry.item || '',
      finalEntry.delegation || '', finalEntry.knowledge || '', finalEntry.awareness || '',
      raw.time, raw.energy,
      mult.time, mult.energy,
      dPlus.time, dPlus.energy,
      dMinus.time, dMinus.energy,
      peterNote,
    ]);
  });
});
writeCSV('choices.csv', choiceRows);

// ----------------------------------------------------------
// 6) config.csv
// ----------------------------------------------------------
function fmt(v) {
  if (typeof v === 'object' && v !== null) return JSON.stringify(v);
  return v;
}
const configKeys = [
  ['scenarios',                fmt(CONFIG.scenarios),               '학기 시나리오 순서'],
  ['resourceMaxStart',         fmt(CONFIG.resourceMaxStart),        'L1 시작 자원 (시간/에너지)'],
  ['resourceCostMultiplier',   fmt(CONFIG.resourceCostMultiplier),  'raw 비용 배율 (작을수록 자원 덜 깎임)'],
  ['competencyDiscountMult',   fmt(CONFIG.competencyDiscountMult),  '위/도 1점 → 비용 N 감소 / 음수 페널티'],
  ['rpRewardByGrade',          fmt(CONFIG.rpRewardByGrade),         '등급별 RP(자원토큰) 보상'],
  ['rpLevelUpBonus',           fmt(CONFIG.rpLevelUpBonus),          '레벨업 보너스 RP'],
  ['rpCost',                   fmt(CONFIG.rpCost),                  'RP 1개로 회복하는 자원량'],
  ['expThresholds',            fmt(CONFIG.expThresholds),           '레벨업 누적 EXP 컷'],
  ['meterMaxByLevel',          fmt(CONFIG.meterMaxByLevel),         '레벨별 자원 천장'],
  ['pointThresholds',          fmt(CONFIG.pointThresholds),         'S/A/B/C 등급 점수 컷'],
  ['cardBoost',                fmt(CONFIG.cardBoost),               '카드 부스트 점수'],
  ['detectedIssueBoost',       fmt(CONFIG.detectedIssueBoost),      '환각 발견 점수'],
  ['autoRecoverOnEnd',         fmt(CONFIG.autoRecoverOnEnd),        '시나리오 종료 자동 회복 여부'],
  ['recoverBase',              fmt(CONFIG.recoverBase),             '회복 기본 비율 (deprecated)'],
  ['gradeBonus',               fmt(CONFIG.gradeBonus),              '등급별 회복 보너스 (deprecated)'],
  ['useReviewLevelBoost',      fmt(CONFIG.useReviewLevelBoost),     '검토 격상 메커닉 ON/OFF'],
  ['levelStep',                fmt(CONFIG.levelStep),               '레벨별 검토 인덱스 격상 폭'],
  ['levelExtraBonus',          fmt(CONFIG.levelExtraBonus),         '격상 천장 후 미세 보너스'],
  ['hintEnabledDefault',       fmt(CONFIG.hintEnabledDefault),      '힌트 기본값'],
  ['resultMidZone',            fmt(CONFIG.resultMidZone),           '0±N zone (mid 판정)'],
  ['DELEGATION_DELTA',         fmt(DELEGATION_DELTA),               '위 점수 변화량 매핑'],
];
const configRows = [['key', 'value', 'note'], ...configKeys];
writeCSV('config.csv', configRows);

// ----------------------------------------------------------
// 7) simulation.csv
// ----------------------------------------------------------
// 시나리오별 max/avg/min (할인 0 기준 = mult 적용한 값)
const simHeader = [
  'block', 'scenario_id',
  'max_cost_path', 'max_time', 'max_energy',
  'avg_time', 'avg_energy',
  'min_time', 'min_energy',
];
const simRows = [simHeader];

let sumMaxT = 0, sumMaxE = 0;
let sumAvgT = 0, sumAvgE = 0;
let sumMinT = 0, sumMinE = 0;

scenarioOrder.forEach(sid => {
  const sc = SCENARIOS[sid];
  const leaves = Object.keys(sc.resourceCosts || {});
  let maxT = -Infinity, maxE = -Infinity, maxPathT = '', maxPathE = '';
  let minT = Infinity, minE = Infinity;
  let sT = 0, sE = 0;
  let maxLeafSum = -Infinity, maxLeaf = '';
  leaves.forEach(leaf => {
    const m = applyMult(sc.resourceCosts[leaf]);
    if (m.time > maxT)  { maxT = m.time;  maxPathT = leaf; }
    if (m.energy > maxE){ maxE = m.energy; maxPathE = leaf; }
    if (m.time < minT)  minT = m.time;
    if (m.energy < minE) minE = m.energy;
    sT += m.time; sE += m.energy;
    const sum = m.time + m.energy;
    if (sum > maxLeafSum) { maxLeafSum = sum; maxLeaf = leaf; }
  });
  const n = leaves.length;
  const avgT = Math.round(sT / n);
  const avgE = Math.round(sE / n);

  sumMaxT += maxT; sumMaxE += maxE;
  sumAvgT += avgT; sumAvgE += avgE;
  sumMinT += minT; sumMinE += minE;

  simRows.push([
    'scenario', sid,
    maxLeaf, maxT, maxE,
    avgT, avgE,
    minT, minE,
  ]);
});

// 학기 합산 블록
const startT = CONFIG.resourceMaxStart.time;
const startE = CONFIG.resourceMaxStart.energy;
const verdict = (sum, start) => (sum > start) ? `OVER (-${sum - start})` : `OK (+${start - sum})`;

simRows.push([]); // 빈 줄로 블록 구분
simRows.push([
  'block', 'metric',
  'value', 'note', '', '', '', '', '',
]);
simRows.push(['semester_total', 'time_max_start',  startT, 'L1 시작 시간 자원']);
simRows.push(['semester_total', 'energy_max_start', startE, 'L1 시작 에너지 자원']);
simRows.push(['semester_total', 'total_max_time',   sumMaxT, '5 시나리오 최대 비용 합 (할인 0)']);
simRows.push(['semester_total', 'total_max_energy', sumMaxE, '5 시나리오 최대 비용 합 (할인 0)']);
simRows.push(['semester_total', 'total_avg_time',   sumAvgT, '5 시나리오 평균 비용 합']);
simRows.push(['semester_total', 'total_avg_energy', sumAvgE, '5 시나리오 평균 비용 합']);
simRows.push(['semester_total', 'total_min_time',   sumMinT, '5 시나리오 최소 비용 합']);
simRows.push(['semester_total', 'total_min_energy', sumMinE, '5 시나리오 최소 비용 합']);
simRows.push(['verdict', 'verdict_time_max',   verdict(sumMaxT, startT), '시작 자원 100 대비']);
simRows.push(['verdict', 'verdict_energy_max', verdict(sumMaxE, startE), '시작 자원 100 대비']);
simRows.push(['verdict', 'verdict_time_avg',   verdict(sumAvgT, startT), '평균 선택 시']);
simRows.push(['verdict', 'verdict_energy_avg', verdict(sumAvgE, startE), '평균 선택 시']);

writeCSV('simulation.csv', simRows);

// ----------------------------------------------------------
console.log('\nDone. CSVs in', OUT_DIR);
console.log('Verdict (학기 max 합):',
            `time ${sumMaxT}/${startT}`, `energy ${sumMaxE}/${startE}`);
console.log('Verdict (학기 avg 합):',
            `time ${sumAvgT}/${startT}`, `energy ${sumAvgE}/${startE}`);
