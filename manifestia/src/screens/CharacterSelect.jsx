import { useNavigate } from 'react-router-dom'
import { initPlayer } from '../store/index.js'
import ko from '../i18n/ko.json'

const CHARACTERS = ['HEALER', 'TANKER', 'ILLUSIONIST', 'PROFESSOR']

export default function CharacterSelect() {
  const navigate = useNavigate()

  function handleSelect(character) {
    initPlayer(character)
    navigate('/match')
  }

  return (
    <div className="screen">
      <h1 className="screen-title">{ko['screen.character.title']}</h1>
      <p className="screen-subtitle">{ko['screen.character.subtitle']}</p>
      <div className="char-grid">
        {CHARACTERS.map(char => (
          <div key={char} className="char-card">
            <div className="char-type">{char}</div>
            <div className="char-name">{ko[`char.${char}`]}</div>
            <div className="char-desc">{ko[`char.${char}.desc`]}</div>
            <button
              className="char-select-btn"
              onClick={() => handleSelect(char)}
            >
              {ko['screen.character.btn.select']}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
