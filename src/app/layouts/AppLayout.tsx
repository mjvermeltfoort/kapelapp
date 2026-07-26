import { useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { useBand } from '../../features/bands/hooks/useBand'
import './AppLayout.css'

export function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { activeMembership, memberships, setActiveBandId } = useBand()
  const [isBandMenuOpen, setIsBandMenuOpen] = useState(false)

  const navigation = useMemo(() => {
    const items = [] as Array<{ to: string; label: string; icon: 'performances' | 'admin' }>

    if (activeMembership) {
      items.push({ to: '/performances', label: 'Optredens', icon: 'performances' })

      if (['admin', 'owner'].includes(activeMembership.role)) {
        items.push({ to: '/admin?tab=band', label: 'Beheer', icon: 'admin' })
      }
    }

    return items
  }, [activeMembership])

  const canManagePerformances = ['planner', 'admin', 'owner'].includes(activeMembership?.role ?? '')
  const showCreatePerformanceAction = location.pathname === '/performances' && canManagePerformances

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
          {showCreatePerformanceAction ? (
            <Link to="/performances/new" className="nav-icon-link" aria-label="Nieuw optreden" title="Nieuw optreden">
              <Icon name="add" className="nav-icon" />
            </Link>
          ) : null}
          <Link to="/profile" className="nav-icon-link" aria-label="Profiel" title="Profiel">
            <Icon name="profile" className="nav-icon" />
          </Link>
        </div>
      </header>

      <nav className="app-nav" aria-label="Hoofdnavigatie">
        {navigation.map((item) => {
          const isActive = item.to.startsWith('/admin')
            ? location.pathname === '/admin'
            : location.pathname.startsWith(item.to)

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={isActive ? 'nav-link active' : 'nav-link'}
              aria-label={item.label}
              title={item.label}
            >
              <Icon name={item.icon} className="nav-icon" />
              <span className="sr-only">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
