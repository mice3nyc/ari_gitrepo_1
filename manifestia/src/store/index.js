import postersData from '../../data/posters.json'

const PREFIX = 'mnf_proto_'

// --- 포스터 조회 ---

export function getPosterByNo(poster_no) {
  const str = String(poster_no).trim()
  return postersData.posters.find(p => String(p.poster_no) === str) || null
}

// --- PlayerState ---

const DEFAULT_STATE = {
  character: null,
  inventory: [],      // [{wordId, word_ko, fromPoster, slot}]
  acquired: {},       // { poster_no: [slot, ...] }
  score: 0,
}

function loadState() {
  try {
    const raw = localStorage.getItem(PREFIX + 'player')
    if (raw) return JSON.parse(raw)
  } catch (_) {}
  return { ...DEFAULT_STATE, inventory: [], acquired: {} }
}

function saveState(state) {
  localStorage.setItem(PREFIX + 'player', JSON.stringify(state))
}

export function initPlayer(character) {
  const state = {
    ...DEFAULT_STATE,
    character,
    inventory: [],
    acquired: {},
    score: 0,
  }
  saveState(state)
  return state
}

export function getPlayerState() {
  return loadState()
}

export function addWordToInventory(word) {
  // word: { wordId, word_ko, fromPoster, slot }
  const state = loadState()
  const alreadyHas = state.inventory.some(w => w.wordId === word.wordId)
  if (alreadyHas) return false
  state.inventory.push(word)
  saveState(state)
  return true
}

export function recordAcquired(poster_no, slot) {
  const state = loadState()
  const key = String(poster_no)
  if (!state.acquired[key]) state.acquired[key] = []
  if (!state.acquired[key].includes(slot)) {
    state.acquired[key].push(slot)
  }
  saveState(state)
}

export function addScore(pts) {
  const state = loadState()
  state.score = (state.score || 0) + pts
  saveState(state)
  return state.score
}

// --- 매칭 로직 헬퍼 ---
// stars: value_marks[character]에서 true인 값 수
export function countStars(poster, character) {
  const marks = poster.value_marks[character]
  if (!marks) return 0
  return Object.values(marks).filter(Boolean).length
}

// 이미 acquired된 슬롯 목록
export function getAcquiredSlots(poster_no) {
  const state = loadState()
  return state.acquired[String(poster_no)] || []
}
