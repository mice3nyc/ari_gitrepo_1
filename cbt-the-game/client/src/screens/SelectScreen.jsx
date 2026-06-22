import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getImpulseCandidates, selectImpulses, TYPES } from '../store/index.js'

// 유형당 1장씩 6장. 유형 라벨은 가리고 내용만 보여 읽게 한다(캐넌).
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
      <p className="muted">여섯 묶음에서 가장 와닿는 것을 하나씩. 고른 충동이 이번 게임의 상대가 됩니다.</p>

      <div className="select-groups">
        {groups.map((g, gi) => (
          <div key={g.type} className="select-group">
            <div className="select-group-no">묶음 {gi + 1}</div>
            <div className="select-options">
              {g.options.map(opt => (
                <button
                  key={opt.idx}
                  className={'pick-card' + (picks[g.type] === opt.idx ? ' picked' : '')}
                  onClick={() => choose(g.type, opt.idx)}
                >
                  {opt.text}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="select-footer">
        <span className="muted">{Object.keys(picks).length} / {TYPES.length} 선택</span>
        <button className="btn btn-primary" disabled={!done} onClick={submit}>이 충동들로 시작</button>
      </div>
    </div>
  )
}
