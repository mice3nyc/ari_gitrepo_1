import { useNavigate } from 'react-router-dom'
import { getGameState, resetGame, startGame } from '../store/index.js'

export default function ResultScreen() {
  const nav = useNavigate()
  const s = getGameState()
  const won = s.phase === 'cleared'

  return (
    <div className="screen screen-center">
      <h1 className={'result-title ' + (won ? 'win' : 'lose')}>
        {won ? '여섯 가지 충동을 모두 다스렸습니다' : '과몰입이 가득 찼습니다'}
      </h1>
      <p className="lead">
        {won
          ? `${s.day}일에 걸쳐, 떠오른 충동마다 생각으로 억제하고 실천으로 끝냈습니다.`
          : '충동을 다스리지 못한 채 두면, 과몰입은 돌이키기 어려운 상태로 이어집니다. 다시 해볼까요.'}
      </p>
      <div className="btn-row">
        <button className="btn btn-primary" onClick={() => { startGame(); nav('/select') }}>다시 하기</button>
        <button className="btn" onClick={() => { resetGame(); nav('/start') }}>처음으로</button>
      </div>
    </div>
  )
}
