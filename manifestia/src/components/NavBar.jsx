import { NavLink } from 'react-router-dom'
import ko from '../i18n/ko.json'

const TABS = [
  { key: 'character', path: '/character', label: ko['nav.character'] },
  { key: 'matching',  path: '/match',     label: ko['nav.matching']  },
  { key: 'manifesto', path: '/manifesto', label: ko['nav.manifesto'] },
  { key: 'vote',      path: '/vote',      label: ko['nav.vote']      },
]

export default function NavBar() {
  return (
    <nav className="nav-bar">
      {TABS.map(tab => (
        <NavLink
          key={tab.key}
          to={tab.path}
          className={({ isActive }) => 'nav-tab' + (isActive ? ' active' : '')}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
