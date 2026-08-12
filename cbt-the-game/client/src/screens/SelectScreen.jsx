import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getImpulseCandidates, selectImpulses, TYPES } from '../store/index.js'
import Card from '../components/Card.jsx'

// 유형당 1장씩 6장. 유형 라벨은 가리고 내용만 보여 읽게 한다(캐넌).
// 버튼이 아니라 카드를 주워 담는 느낌 — 고른 카드는 들려 올라온다.
export default function SelectScreen() {
  const nav = useNavigate()
  const groups = getImpulseCandidates()
  const [picks, setPicks] = useState({}) // { type: idx }

  const choose = (type, idx) => setPicks(p => ({ ...p, [type]: idx }))
  const done = Object.keys(picks).length === TYPES.length

  const submit = () => {
    const list = groups.map(g => {
      const idx = picks[g.type]
      const opt = g.options[idx]
      return { type: g.type, idx, text: opt.text }
    })
    const r = selectImpulses(list)
    if (r.ok) nav('/play')
  }

  return (
    <div className="screen">
      <h2 className="h2">내가 경험한 충동을 골라보세요</h2>
      <p className="muted">여섯 묶음에서 가장 와닿는 카드를 하나씩 주워 담으세요. 고른 충동이 이번 게임의 상대가 됩니다.</p>

      <div className="select-groups">
        {groups.map((g, gi) => (
          <div key={g.type} className="select-group">
            <div className="select-group-no">묶음 {gi + 1}</div>
            <div className="pick-spread">
              {g.options.map(opt => (
                <Card
                  key={opt.idx}
                  kind="impulse"
                  size="md"
                  text={opt.text}
                  selected={picks[g.type] === opt.idx}
                  onClick={() => choose(g.type, opt.idx)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="select-footer">
        <span className="muted">{Object.keys(picks).length} / {TYPES.length} 주웠어요</span>
        <button className="btn btn-primary" disabled={!done} onClick={submit}>이 충동들로 시작</button>
      </div>
    </div>
  )
}
