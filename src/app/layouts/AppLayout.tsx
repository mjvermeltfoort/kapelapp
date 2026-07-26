import { useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { useBand } from '../../features/bands/hooks/useBand'
import './AppLayout.css'

export function AppLayout() {
  const navigate = useNavigate()
  const { profile, user, signOut } = useAuth()
  const { activeMembership, memberships, setActiveBandId } = useBand()
  const [isBandMenuOpen, setIsBandMenuOpen] = useState(false)

  const navigation = useMemo(() => {
    const items = [] as Array<{ to: string; label: string }>

    if (activeMembership) {
      items.push({ to: '/performances', label: 'Optredens' })
      items.push({ to: '/settings/band', label: 'Kapel' })

      if (['admin', 'owner'].includes(activeMembership.role)) {
        items.push({ to: '/settings/members', label: 'Leden' })
        items.push({ to: '/settings/invites', label: 'Uitnodigingen' })
      }
    }

    items.push({ to: '/profile', label: 'Profiel' })

    return items
  }, [activeMembership])

  function handleBandSelect(bandId: string) {
    setActiveBandId(bandId)
    setIsBandMenuOpen(false)
    void navigate('/performances')
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-left">
          <div className="brand-menu">
            <button
              type="button"
              className={isBandMenuOpen ? 'brand-trigger brand-trigger--open' : 'brand-trigger'}
              onClick={() => setIsBandMenuOpen((current) => !current)}
              aria-expanded={isBandMenuOpen}
              aria-haspopup="menu"
            >
              <img src="/favicon.svg" alt="Kapelapp logo" className="brand-logo" />
              <div className="brand-text">
                <h1>Kapelapp</h1>
                <span className="subtitle">
                  {activeMembership ? activeMembership.band.name : 'Geen actieve kapel'}
                </span>
              </div>
            </button>

            {isBandMenuOpen ? (
              <div className="brand-panel" role="menu">
                <div className="brand-panel__section">
                  {memberships.map((membership) => (
                    <button
                      key={membership.id}
                      type="button"
                      className={
                        membership.band_id === activeMembership?.band_id
                          ? 'brand-panel__item brand-panel__item--active'
                          : 'brand-panel__item'
                      }
                      onClick={() => handleBandSelect(membership.band_id)}
                    >
                      <strong>{membership.band.name}</strong>
                      <span>{membership.role}</span>
                    </button>
                  ))}
                </div>

                <div className="brand-panel__footer">
                  <Link to="/bands" className="brand-panel__link" onClick={() => setIsBandMenuOpen(false)}>
                    Kapellen beheren
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="user-block">
          <span className="user-name">{profile?.display_name ?? user?.email ?? 'Onbekende gebruiker'}</span>
          <button type="button" className="ghost-button" onClick={() => void signOut()}>
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
