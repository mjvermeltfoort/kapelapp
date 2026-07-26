import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { useBand } from '../../features/bands/hooks/useBand'
import './AppLayout.css'

const navigation = [
  { to: '/bands', label: 'Kapellen' },
  { to: '/performances', label: 'Optredens' },
  { to: '/settings/members', label: 'Leden' },
  { to: '/settings/invites', label: 'Uitnodigingen' },
  { to: '/profile', label: 'Profiel' },
]

export function AppLayout() {
  const { profile, user, signOut } = useAuth()
  const { activeMembership } = useBand()

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Kapelapp</p>
          <h1>MVP shell</h1>
          <p className="subtitle">
            {activeMembership
              ? `Actieve kapel: ${activeMembership.band.name} · rol ${activeMembership.role}`
              : 'Nog geen actieve kapel geselecteerd.'}
          </p>
        </div>
        <div className="user-block">
          <span>{profile?.display_name ?? user?.email ?? 'Onbekende gebruiker'}</span>
          <button type="button" onClick={() => void signOut()}>
            Uitloggen
          </button>
        </div>
      </header>

      <nav className="app-nav" aria-label="Hoofdnavigatie">
        {navigation.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
