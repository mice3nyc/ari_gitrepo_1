import { useState } from 'react'
import {
  getPosterByNo,
  getPlayerState,
  addWordToInventory,
  recordAcquired,
  addScore,
  countStars,
  getAcquiredSlots,
} from '../store/index.js'
import ko from '../i18n/ko.json'

export default function PosterMatch() {
  const [input, setInput] = useState('')
  const [poster, setPoster] = useState(null)
  const [msg, setMsg] = useState(null)      // { text, type: 'success'|'partial'|'error' }
  const [newWords, setNewWords] = useState([])
  const [stateVersion, setStateVersion] = useState(0) // force re-render on store change

  function refreshState() {
    setStateVersion(v => v + 1)
  }

  function handleMatch() {
    const raw = input.trim()
    if (!raw) return

    // 1. 포스터 조회
    const found = getPosterByNo(raw)
    if (!found) {
      setPoster(null)
      setMsg({ text: ko['screen.matching.msg.notFound'], type: 'error' })
      setNewWords([])
      return
    }
    setPoster(found)

    const playerState = getPlayerState()
    const character = playerState.character
    const stars = countStars(found, character)
    const acquiredSlots = getAcquiredSlots(found.poster_no)

    // 2. stars == 0: 획득 없음
    if (stars === 0) {
      setMsg({ text: ko['screen.matching.msg.noMatch'], type: 'error' })
      setNewWords([])
      return
    }

    let gained = []

    if (stars === 4) {
      // 3. 완전 매칭: 4단어 전부 획득 시도
      for (const wordObj of found.words) {
        const wordId = `${found.poster_no}_${wordObj.slot}`
        const added = addWordToInventory({
          wordId,
          word_ko: wordObj.word_ko,
          fromPoster: found.poster_no,
          slot: wordObj.slot,
        })
        if (added) {
          recordAcquired(found.poster_no, wordObj.slot)
          gained.push(wordObj.word_ko)
        }
      }
      if (gained.length === 0) {
        setMsg({ text: ko['screen.matching.msg.alreadyAll'], type: 'error' })
        setNewWords([])
        return
      }
      addScore(5)
      refreshState()
      setMsg({ text: ko['screen.matching.msg.fullMatch'], type: 'success' })
      setNewWords(gained)
    } else {
      // 4. 부분 매칭 (stars 1~3): 랜덤 1단어
      // 후보: 아직 acquired[poster_no]에 없는 슬롯
      const candidates = found.words.filter(
        w => !acquiredSlots.includes(w.slot)
      )
      if (candidates.length === 0) {
        setMsg({ text: ko['screen.matching.msg.noNew'], type: 'error' })
        setNewWords([])
        return
      }
      const pick = candidates[Math.floor(Math.random() * candidates.length)]
      const wordId = `${found.poster_no}_${pick.slot}`
      addWordToInventory({
        wordId,
        word_ko: pick.word_ko,
        fromPoster: found.poster_no,
        slot: pick.slot,
      })
      recordAcquired(found.poster_no, pick.slot)
      addScore(5)
      refreshState()
      setMsg({ text: ko['screen.matching.msg.partialMatch'], type: 'partial' })
      setNewWords([pick.word_ko])
    }
  }

  // 현재 상태 읽기 (stateVersion 변화 시 재계산)
  const playerState = getPlayerState()
  const character = playerState.character
  const inventory = playerState.inventory || []
  const score = playerState.score || 0
  const acquiredSlotsForPoster = poster ? getAcquiredSlots(poster.poster_no) : []

  return (
    <div className="screen">
      {/* 헤더 */}
      <div className="match-header">
        <h1 className="screen-title">{ko['screen.matching.title']}</h1>
        <div className="score-display">
          {ko['screen.matching.label.score']}
          <span className="score-value">{score}</span>
        </div>
      </div>

      {/* 입력 폼 */}
      <div className="match-form">
        <input
          className="match-input"
          type="text"
          inputMode="numeric"
          placeholder={ko['screen.matching.placeholder']}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleMatch() }}
        />
        <button className="match-btn" onClick={handleMatch}>
          {ko['screen.matching.btn.match']}
        </button>
      </div>

      {/* 결과 메시지 */}
      {msg && (
        <div className={`match-msg ${msg.type}`}>
          {msg.text}
          {newWords.length > 0 && (
            <div className="poster-acquired-words" style={{ marginTop: 8 }}>
              {newWords.map(w => (
                <span key={w} className="word-chip new">{w}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 포스터 카드 */}
      {poster && (
        <div className="poster-card">
          <div className="poster-artist">{poster.artist_ko}</div>
          <div className="poster-text">{poster.text_ko}</div>
          {character && (
            <div className="poster-stars">
              {character} {ko['screen.matching.label.match']}: {countStars(poster, character)} / 4
            </div>
          )}
          {acquiredSlotsForPoster.length > 0 && (
            <div className="poster-acquired-words">
              {poster.words
                .filter(w => acquiredSlotsForPoster.includes(w.slot))
                .map(w => (
                  <span key={w.slot} className="word-chip">{w.word_ko}</span>
                ))}
            </div>
          )}
        </div>
      )}

      {/* 인벤토리 */}
      <div className="inventory-section">
        <div className="inventory-label">{ko['screen.matching.label.inventory']}</div>
        {inventory.length === 0 ? (
          <div className="inventory-empty">{ko['screen.matching.inventory.empty']}</div>
        ) : (
          <div className="word-chips">
            {inventory.map(w => (
              <span key={w.wordId} className="word-chip">{w.word_ko}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
