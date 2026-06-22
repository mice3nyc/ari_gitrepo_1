import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import StartScreen from './screens/StartScreen.jsx'
import SelectScreen from './screens/SelectScreen.jsx'
import PlayScreen from './screens/PlayScreen.jsx'
import ResultScreen from './screens/ResultScreen.jsx'
import { getGameState } from './store/index.js'

// 게임 단계에 맞지 않은 라우트 접근 시 올바른 화면으로 보정
function Guard({ need, children }) {
  const { phase } = getGameState()
  if (need === 'playing' && phase !== 'playing') {
    return <Navigate to={phase === 'cleared' || phase === 'failed' ? '/result' : '/start'} replace />
  }
  if (need === 'result' && phase !== 'cleared' && phase !== 'failed') {
    return <Navigate to="/start" replace />
  }
  if (need === 'select' && phase === 'playing') {
    return <Navigate to="/play" replace />
  }
  return children
}

function AppContent() {
  useLocation() // 라우트 변화 시 리렌더
  return (
    <div className="app">
      <Routes>
        <Route path="/start" element={<StartScreen />} />
        <Route path="/select" element={<Guard need="select"><SelectScreen /></Guard>} />
        <Route path="/play" element={<Guard need="playing"><PlayScreen /></Guard>} />
        <Route path="/result" element={<Guard need="result"><ResultScreen /></Guard>} />
        <Route path="*" element={<Navigate to="/start" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  )
}
