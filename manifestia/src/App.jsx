import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { getPlayerState } from './store/index.js'
import NavBar from './components/NavBar.jsx'
import CharacterSelect from './screens/CharacterSelect.jsx'
import PosterMatch from './screens/PosterMatch.jsx'
import ComingSoon from './screens/ComingSoon.jsx'

function RequireCharacter({ children }) {
  const { character } = getPlayerState()
  if (!character) {
    return <Navigate to="/character" replace />
  }
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/character" element={<CharacterSelect />} />
        <Route
          path="/match"
          element={
            <RequireCharacter>
              <PosterMatch />
            </RequireCharacter>
          }
        />
        <Route path="/manifesto" element={<ComingSoon />} />
        <Route path="/vote" element={<ComingSoon />} />
        <Route path="*" element={<Navigate to="/character" replace />} />
      </Routes>
      <NavBar />
    </BrowserRouter>
  )
}
