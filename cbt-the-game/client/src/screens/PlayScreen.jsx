import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getGameState, getHandView, getBoardView, getProgress, getThoughtShop, getPiles,
  autoDrawStart, drawCard, buyThought, resolveDay, CONST,
} from '../store/index.js'
import Card, { CardPile } from '../components/Card.jsx'

export default function PlayScreen() {
  const nav = useNavigate()
  const [, force] = useState(0)
  const refresh = () => force(n => n + 1)
  const [dayResult, setDayResult] = useState(null)
  const [flash, setFlash] = useState(null)     // 매칭 피드백
  const [focusId, setFocusId] = useState(null) // 지금 집은 충동(핀)

  useEffect(() => {
    const s = getGameState()
    if (s.phase === 'playing' && s.drawnToday === 0) { autoDrawStart(); refresh() }
  }, [])

  const s = getGameState()
  if (s.phase !== 'playing') { nav('/result'); return null }

  const hand = getHandView()
  const board = getBoardView()
  const prog = getProgress()
  const shop = getThoughtShop()
  const piles = getPiles()

  const focused = hand.impulses.find(i => i.id === focusId) || null

  const onDraw = () => { drawCard(); refresh() }
  const onBuy = (card) => {
    if (hand.coins < 1) { setFlash('생각하는 힘이 부족합니다'); return }
    const r = buyThought(card.type)
    if (r.result === 'suppress') setFlash('충동을 억제했습니다' + (r.formed ? ' · 실천이 만들어졌어요!' : ''))
    else if (r.result === 'store-only') setFlash(r.formed ? '생각이 모여 실천이 되었어요!' : '생각을 의식에 담았습니다')
    if (focused && focused.type === card.type) setFocusId(null)
    refresh()
    setTimeout(() => setFlash(null), 1400)
  }
  const onEndDay = () => setDayResult(resolveDay())
  const closeDayResult = () => {
    const r = dayResult; setDayResult(null); setFocusId(null)
    if (r.won || r.lost) nav('/result'); else { autoDrawStart(); refresh() }
  }

  // 보드 트랙용
  const thoughtProgress = board.filter(b => !b.actionPlaced && b.thoughtCount > 0)
  const placedActions = board.filter(b => b.actionPlaced)

  return (
    <div className="board-wrap">
      {/* ── 상태바 ───────────────────────────────── */}
      <div className="topbar">
        <span className="day">DAY {s.day}</span>
        <span className="coins">● 생각하는 힘 {hand.coins}</span>
        <Track label="실천" n={prog.practice} max={prog.win} kind="practice" />
        <Track label="과몰입" n={prog.overuse} max={prog.lose} kind="overuse" />
        {flash && <span className="flash">{flash}</span>}
      </div>

      {/* ── 상단: 메인 보드(좌) + 카드 시장(우) ──── */}
      <div className="play-grid">

        {/* 메인 보드 — 위→아래 3행 트랙 */}
        <section className="board-main">
          <SlotRow title="과몰입행동" subtitle="충동을 못 막으면 쌓임 · 6칸 패배" kind="overuse"
            n={prog.overuse} max={prog.lose} />
          <SlotRow title="실천" subtitle="생각이 모여 형성 · 6칸 승리" kind="action"
            n={prog.practice} max={prog.win} labels={placedActions.map(b => b.actionText)} />
          <div className="track-row track-thought">
            <div className="track-head"><b>생각</b><span className="muted small">보드에 올린 생각 · 2장이면 실천</span></div>
            <div className="thought-track">
              {thoughtProgress.length === 0 && <span className="muted small">아직 올린 생각이 없습니다.</span>}
              {thoughtProgress.map(b => (
                <Card key={b.type} kind="thought" size="sm"
                  text={`의식에 담은 생각`} footer={`${b.thoughtCount}/${b.needForAction}`} />
              ))}
            </div>
          </div>
        </section>

        {/* 카드 시장 — 펼쳐진 실천(위) / 생각(아래), 가로 스크롤 */}
        <section className="market">
          <div className="impulse-pin">
            {focused
              ? <><span className="pin-label">지금 다스릴 충동</span><span className="pin-text">{focused.text}</span></>
              : <span className="muted small">아래 딜 줄에서 충동을 하나 집어보세요. 그 충동을 읽고, 맞는 생각을 고릅니다.</span>}
          </div>

          <div className="strip-block">
            <h4 className="strip-h action">획득한 실천</h4>
            <div className="strip strip-action">
              {placedActions.length === 0 && <span className="muted small">아직 없음</span>}
              {placedActions.map(b => (
                <Card key={b.type} kind="action" size="md" text={b.actionText} />
              ))}
            </div>
          </div>

          <div className="strip-divider" />

          <div className="strip-block">
            <h4 className="strip-h thought">펼쳐진 생각카드 — 읽고 고르세요 (생각하는 힘 1)</h4>
            <div className="strip strip-thought">
              {shop.map(card => (
                <Card key={card.type} kind="thought" size="md"
                  text={card.text} footer={`의식 ${card.count}/${card.need}`}
                  disabled={hand.coins < 1}
                  onClick={() => onBuy(card)} />
              ))}
              {shop.length === 0 && <span className="muted small">모든 충동을 실천으로 끝냈습니다.</span>}
            </div>
          </div>
        </section>
      </div>

      {/* ── 하단: 딜 영역 ─────────────────────────── */}
      <section className="deal-area">
        <div className="deal-row">
          <div className="piles">
            <CardPile label="내 덱" count={piles.deck} faceDown />
            <CardPile label="버린 카드" count={piles.discard} />
          </div>
          <div className="deal-arrow">DEAL →</div>
          <div className="dealt" key={'day' + s.day}>
            {hand.impulses.length === 0 && hand.coins === 0 && <p className="muted">카드를 뽑아 시작하세요.</p>}
            {Array.from({ length: hand.coins }).map((_, i) => (
              <div key={'coin' + i} className="deal-in" style={{ animationDelay: `${i * 90}ms` }}>
                <Card kind="coin" text="생각하는 힘 ●" size="md" />
              </div>
            ))}
            {hand.impulses.map((c, i) => (
              <div key={c.id} className="deal-in" style={{ animationDelay: `${(hand.coins + i) * 90}ms` }}>
                <Card kind="impulse" text={c.text} size="md"
                  selected={focusId === c.id}
                  onClick={() => setFocusId(id => id === c.id ? null : c.id)} />
              </div>
            ))}
          </div>
        </div>
        <div className="deal-controls">
          <button className="btn" disabled={hand.drawsLeft <= 0} onClick={onDraw}>
            카드 더 뽑기 <span className="muted">({hand.drawsLeft}장 · 최대 {CONST.DRAW_MAX})</span>
          </button>
          <button className="btn btn-primary" onClick={onEndDay}>하루 마치기</button>
        </div>
      </section>

      {dayResult && (
        <div className="modal-back" onClick={closeDayResult}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="h3">DAY {s.day} 정산</h3>
            {dayResult.msgs && dayResult.msgs.length > 0 ? (
              <ul className="day-msgs">{dayResult.msgs.map((m, i) => <li key={i}>{m}</li>)}</ul>
            ) : <p className="muted">오늘은 모든 충동을 다스렸습니다.</p>}
            <p className="muted">실천 {dayResult.practiceTrack}/{CONST.WIN_TRACK} · 과몰입 {dayResult.overuseTrack}/{CONST.LOSE_TRACK}</p>
            <button className="btn btn-primary" onClick={closeDayResult}>
              {dayResult.won || dayResult.lost ? '결과 보기' : '다음 날로'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function SlotRow({ title, subtitle, kind, n, max, labels = [] }) {
  return (
    <div className={'track-row track-' + kind}>
      <div className="track-head"><b>{title}</b><span className="muted small">{subtitle}</span></div>
      <div className="slots">
        {Array.from({ length: max }).map((_, i) => (
          <div key={i} className={'slot' + (i < n ? ' filled' : '')}>
            {i < n
              ? <Card kind={kind} text={labels[i] || ''} size="slot" />
              : <span className="slot-ghost" />}
          </div>
        ))}
      </div>
    </div>
  )
}

function Track({ label, n, max, kind }) {
  return (
    <span className={'track track-' + kind}>
      {label} {n}/{max}
      <span className="track-dots">
        {Array.from({ length: max }).map((_, i) => <span key={i} className={'tdot' + (i < n ? ' on' : '')} />)}
      </span>
    </span>
  )
}
