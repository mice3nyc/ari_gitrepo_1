import { useNavigate } from 'react-router-dom'
import { getGameState, startGame } from '../store/index.js'

export default function StartScreen() {
  const nav = useNavigate()
  const s = getGameState()
  const hasGame = s.phase === 'playing'

  return (
    <div className="screen screen-center">
      <div className="title-block">
        <h1 className="game-title">마인드 매치</h1>
        <p className="game-sub">내 머릿속 충동을 들여다보고, 생각으로 다스리는 게임</p>
      </div>
      <p className="lead">
        게임하고 싶은 충동이 떠오를 때, 어떤 <b>생각</b>을 하면 그 충동을 다스릴 수 있을까.
        생각이 모이면 <b>실천</b>이 되고, 실천이 충동을 끝낸다. 미루면 <b>과몰입</b>이 쌓인다.
      </p>
      <div className="btn-row">
        {hasGame && (
          <button className="btn" onClick={() => nav('/play')}>이어하기</button>
        )}
        <button className="btn btn-primary" onClick={() => { startGame(); nav('/select') }}>
          {hasGame ? '새로 시작' : '시작하기'}
        </button>
      </div>
    </div>
  )
}
