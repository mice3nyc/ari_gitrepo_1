// CBT 덱빌딩 게임 — store (1단계 로컬 우선)
// 화면은 이 모듈의 함수만 호출한다. 규칙·승패 판정은 전부 여기 안.
// 2단계: loadState/saveState만 서버 fetch로 교체하면 화면 무수정.
import cards from '../../data/cards-session1.json'

const PREFIX = 'cbt_s1_'
const KEY = PREFIX + 'state'

export const TYPES = cards.types.map(t => t.key)
export const TYPE_LABEL = Object.fromEntries(cards.types.map(t => [t.key, t.label]))
const TYPE_MAP = Object.fromEntries(cards.types.map(t => [t.key, t]))

const DRAW_START = 4
const DRAW_MAX = 7
const THOUGHT_COST = 1
const THOUGHTS_FOR_ACTION = 2
const WIN_TRACK = 6   // 실천 6칸
const LOSE_TRACK = 6  // 과몰입 6칸

let _id = 0
const nid = (p) => `${p}_${++_id}`

// ── 카드 풀 ─────────────────────────────────────────────
// 충동 후보: 6유형 × 3장. 선택 화면에서 유형당 1장 고른다.
export function getImpulseCandidates() {
  return cards.types.map(t => ({
    type: t.key, label: t.label,
    options: t.cards.map((c, i) => ({ type: t.key, idx: i, text: c.impulse })),
  }))
}
// 유형의 생각/실천 텍스트 풀
const thoughtText = (type, n) => {
  const arr = TYPE_MAP[type].cards.map(c => c.thought)
  return arr[n % arr.length]
}
const actionText = (type) => TYPE_MAP[type].cards.map(c => c.action)[0]

function shuffle(a) {
  // 결정론 아님이 필요 없으므로 Fisher–Yates. (Math.random 사용 가능 — 빌드 코드, 워크플로 아님)
  const arr = a.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function emptyBoard() {
  const b = {}
  for (const t of TYPES) b[t] = { thoughtCount: 0, actionPlaced: false }
  return b
}

const DEFAULT = () => ({
  phase: 'intro',
  selected: [],       // [{type, idx, text}]
  deck: [], hand: [], discard: [],
  drawnToday: 0,
  board: emptyBoard(),
  practiceTrack: 0,   // 실천 칸 채움 (승리 0→6)
  overuseTrack: 0,    // 과몰입 칸 채움 (실패 0→6)
  day: 0,
  log: [],            // DayResult용 최근 정산 메시지
})

// ── 영속 ────────────────────────────────────────────────
function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw) } catch (_) {}
  return DEFAULT()
}
function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)) } catch (_) {} }

export function getGameState() { return load() }
export function resetGame() { const s = DEFAULT(); save(s); return s }
export function startGame() { const s = DEFAULT(); s.phase = 'select'; save(s); return s }

// ── 충동 선택 → 덱 구성 ─────────────────────────────────
export function selectImpulses(picks) {
  // picks: [{type, idx, text}] 길이 6 (유형당 1)
  if (!picks || picks.length !== TYPES.length) return { ok: false, error: '유형당 1장씩 6장을 골라주세요' }
  const s = load()
  s.selected = picks
  const impulses = picks.map(p => ({
    id: nid('imp'), kind: 'impulse', type: p.type, text: p.text,
  }))
  // 생각하는힘(코인): 충동 6장에 맞춰 6장 시작 (밸런스 — 억제가 따라갈 수 있게)
  const coins = Array.from({ length: 6 }).map(() => ({ id: nid('coin'), kind: 'coin' }))
  s.deck = shuffle([...impulses, ...coins])
  s.hand = []; s.discard = []; s.drawnToday = 0
  s.board = emptyBoard(); s.practiceTrack = 0; s.overuseTrack = 0; s.day = 1
  s.phase = 'playing'; s.log = []
  save(s)
  return { ok: true }
}

// ── 드로우 ──────────────────────────────────────────────
function refillDeck(s) {
  if (s.deck.length === 0 && s.discard.length > 0) {
    s.deck = shuffle(s.discard); s.discard = []
  }
}
export function drawCard() {
  const s = load()
  if (s.phase !== 'playing') return { drawsLeft: 0 }
  if (s.drawnToday >= DRAW_MAX) return { card: null, drawsLeft: 0, hand: s.hand }
  refillDeck(s)
  if (s.deck.length === 0) return { card: null, drawsLeft: 0, hand: s.hand }
  const card = s.deck.shift()
  s.hand.push(card); s.drawnToday++
  save(s)
  return { card, drawsLeft: DRAW_MAX - s.drawnToday, hand: s.hand }
}
export function autoDrawStart() {
  const s = load()
  if (s.phase !== 'playing' || s.drawnToday > 0) return { hand: s.hand }
  for (let i = 0; i < DRAW_START; i++) {
    refillDeck(s); if (s.deck.length === 0) break
    s.hand.push(s.deck.shift()); s.drawnToday++
  }
  save(s)
  return { hand: s.hand, drawsLeft: DRAW_MAX - s.drawnToday }
}
export function stopDraw() { return { ok: true } } // 명시적 멈춤(상태 변화 없음, 의미상 존재)

// ── 코인/구매(억제) ─────────────────────────────────────
export function getCoins(s = load()) { return s.hand.filter(c => c.kind === 'coin').length }

// 생각카드 구매: 같은 유형 충동이 손패에 있으면 억제, 생각 칸 누적, 2장 → 실천 형성
export function buyThought(type) {
  const s = load()
  if (s.phase !== 'playing') return { result: 'no-play' }
  if (s.board[type].actionPlaced) return { result: 'done' } // 이미 실천 완료 유형
  const coinIdx = s.hand.findIndex(c => c.kind === 'coin')
  if (coinIdx < 0) return { result: 'no-coin' }
  // 코인 1 소비 (버린덱으로 — 다음 셔플에 복귀)
  const [coin] = s.hand.splice(coinIdx, 1)
  s.discard.push(coin)

  const thought = thoughtText(type, s.board[type].thoughtCount)
  s.board[type].thoughtCount++

  // 같은 유형 활성 충동이 손패에 있으면 억제
  let suppressed = null
  const impIdx = s.hand.findIndex(c => c.kind === 'impulse' && c.type === type)
  if (impIdx >= 0) {
    suppressed = s.hand.splice(impIdx, 1)[0]
    s.discard.push(suppressed)
  }

  let formed = false
  if (s.board[type].thoughtCount >= THOUGHTS_FOR_ACTION && !s.board[type].actionPlaced) {
    formed = formAction(s, type)
  }
  save(s)
  return { result: suppressed ? 'suppress' : 'store-only', thought, formed, type }
}

// 실천 형성: 해당 유형 충동을 덱/손/버린덱에서 영구 제거 + 실천 칸 +1
function formAction(s, type) {
  s.board[type].actionPlaced = true
  s.practiceTrack++
  const purge = (arr) => arr.filter(c => !(c.kind === 'impulse' && c.type === type))
  s.deck = purge(s.deck); s.hand = purge(s.hand); s.discard = purge(s.discard)
  return true
}

// ── 하루 정산 ───────────────────────────────────────────
export function resolveDay() {
  const s = load()
  if (s.phase !== 'playing') return { phase: s.phase }
  const msgs = []
  // 손패에 남은(억제 못한) 충동 → 과몰입 트랙 + 발동(같은 유형 충동 1장 덱 추가)
  const leftover = s.hand.filter(c => c.kind === 'impulse')
  for (const imp of leftover) {
    if (s.board[imp.type].actionPlaced) continue
    s.overuseTrack++
    msgs.push(`"${imp.text}" — 억제하지 못해 과몰입 행동으로 이어졌습니다 (${TYPE_LABEL[imp.type]})`)
    // 발동 효과는 1단계에서 비활성(증식 escalation 제거 — 밸런스). 충동은 버린덱으로 복귀(아래).
  }
  // 손패 비우기(버린덱으로), 다음날
  s.discard.push(...s.hand); s.hand = []
  s.drawnToday = 0; s.day++
  s.log = msgs
  // 승패
  const end = checkEnd(s)
  save(s)
  return { phase: s.phase, overuseTrack: s.overuseTrack, practiceTrack: s.practiceTrack, day: s.day, msgs, ...end }
}

function checkEnd(s) {
  if (s.practiceTrack >= WIN_TRACK) { s.phase = 'cleared'; return { won: true } }
  if (s.overuseTrack >= LOSE_TRACK) { s.phase = 'failed'; return { lost: true } }
  return {}
}

// ── 화면용 셀렉터 ───────────────────────────────────────
export function getProgress(s = load()) {
  return { practice: s.practiceTrack, overuse: s.overuseTrack, win: WIN_TRACK, lose: LOSE_TRACK }
}
export function getHandView(s = load()) {
  return {
    impulses: s.hand.filter(c => c.kind === 'impulse'),
    coins: getCoins(s),
    drawsLeft: Math.max(0, DRAW_MAX - s.drawnToday),
    drawnToday: s.drawnToday,
  }
}
// 생각카드 상점: 아직 실천 못 한 유형마다 생각카드 1장(내용 보임, 유형은 UI에서 가림).
// 플레이어는 딜된 충동을 읽고, 이 펼쳐진 생각카드 중 의미가 맞는 걸 골라 산다.
export function getThoughtShop(s = load()) {
  return cards.types
    .filter(t => !s.board[t.key].actionPlaced)
    .map(t => ({ type: t.key, text: thoughtText(t.key, s.board[t.key].thoughtCount), count: s.board[t.key].thoughtCount, need: THOUGHTS_FOR_ACTION }))
}
// 덱/버린덱 장수
export function getPiles(s = load()) {
  return { deck: s.deck.length, discard: s.discard.length }
}

export function getBoardView(s = load()) {
  return cards.types.map(t => ({
    type: t.key, label: t.label,
    thoughtCount: s.board[t.key].thoughtCount,
    actionPlaced: s.board[t.key].actionPlaced,
    needForAction: THOUGHTS_FOR_ACTION,
    actionText: actionText(t.key),
  }))
}

export const CONST = { DRAW_START, DRAW_MAX, THOUGHT_COST, THOUGHTS_FOR_ACTION, WIN_TRACK, LOSE_TRACK }
