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
  const [flash, setFlash] = useState(null) // 매칭 피드백

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
  const handTypes = new Set(hand.impulses.map(i => i.type))

  const onDraw = () => { drawCard(); refresh() }
  const onBuy = (card) => {
    if (hand.coins < 1) { setFlash('생각하는 힘이 부족합니다'); return }
    const r = buyThought(card.type)
    if (r.result === 'suppress') setFlash('충동을 억제했습니다' + (r.formed ? ' · 실천이 만들어졌어요!' : ''))
    else if (r.result === 'store-only') setFlash(r.formed ? '생각이 모여 실천이 되었어요!' : '생각을 의식에 담았습니다')
    refresh()
    setTimeout(() => setFlash(null), 1400)
  }
  const onEndDay = () => setDayResult(resolveDay())
  const closeDayResult = () => {
    const r = dayResult; setDayResult(null)
    if (r.won || r.lost) nav('/result'); else { autoDrawStart(); refresh() }
  }

  return (
    <div className="board-wrap">
      {/* 상태바 */}
      <div className="topbar">
        <span className="day">DAY {s.day}</span>
        <span className="coins">● 생각하는 힘 {hand.coins}</span>
        <Track label="실천" n={prog.practice} max={prog.win} kind="practice" />
        <Track label="과몰입" n={prog.overuse} max={prog.lose} kind="overuse" />
        {flash && <span className="flash">{flash}</span>}
      </div>

      {/* 목표 트랙: 과몰입(막아야 함) / 실천(채워야 함) */}
      <div className="zones">
        <SlotRow title="과몰입 행동" subtitle="6칸 다 차면 패배" kind="overuse" n={prog.overuse} max={prog.lose} />
        <SlotRow title="실천 카드" subtitle="6칸 다 채우면 승리" kind="action" n={prog.practice} max={prog.win}
          labels={board.filter(b => b.actionPlaced).map(b => b.actionText)} />
      </div>

      <div className="play-grid">
        {/* 좌: 덱 + 딜 영역 */}
        <section className="deal-area">
          <h3 className="zone-h">오늘 떠오른 카드</h3>
          <div className="deal-row">
            <div className="piles">
              <CardPile label="내 덱" count={piles.deck} faceDown />
              <CardPile label="버린 카드" count={piles.discard} />
            </div>
            <div className="dealt">
              {hand.impulses.length === 0 && hand.coins === 0 && <p className="muted">카드를 뽑아 시작하세요.</p>}
              {Array.from({ length: hand.coins }).map((_, i) => (
                <Card key={'coin' + i} kind="coin" text="생각하는 힘 ●" size="sm" />
              ))}
              {hand.impulses.map(c => (
                <Card key={c.id} kind="impulse" text={c.text} size="sm" />
              ))}
            </div>
          </div>
          <div className="deal-controls">
            <button className="btn" disabled={hand.drawsLeft <= 0} onClick={onDraw}>
              카드 뽑기 <span className="muted">({hand.drawsLeft}장 남음 · 최대 {CONST.DRAW_MAX})</span>
            </button>
            <button className="btn btn-primary" onClick={onEndDay}>하루 마치기</button>
          </div>
        </section>

        {/* 우: 생각카드 상점 (읽고 고른다) */}
        <section className="shop-area">
          <h3 className="zone-h">생각카드 — 충동에 맞는 생각을 골라 사세요</h3>
          <p className="muted small">왼쪽 충동을 읽고, 그 충동을 다스릴 수 있는 생각을 고릅니다. 같은 결의 생각 2장이 모이면 실천이 됩니다. (생각하는 힘 1)</p>
          <div className="shop-spread">
            {shop.map(card => (
              <Card
                key={card.type}
                kind="thought"
                text={card.text}
                footer={`의식 ${card.count}/${card.need}`}
                size="md"
                disabled={hand.coins < 1}
                selected={handTypes.has(card.type)}
                onClick={() => onBuy(card)}
              />
            ))}
            {shop.length === 0 && <p className="muted">모든 충동을 실천으로 끝냈습니다.</p>}
          </div>
        </section>
      </div>

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
    <div className={'slotrow slotrow-' + kind}>
      <div className="slotrow-head"><b>{title}</b><span className="muted small">{subtitle}</span></div>
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
