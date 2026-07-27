import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { useBand } from '../../features/bands/hooks/useBand'
import './AppLayout.css'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

function isStandaloneMode() {
  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean }
  return window.matchMedia('(display-mode: standalone)').matches || navigatorWithStandalone.standalone === true
}

function isAndroidChrome() {
  const userAgent = window.navigator.userAgent.toLowerCase()
  return userAgent.includes('android') && userAgent.includes('chrome') && !userAgent.includes('wv')
}

export function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { activeMembership, memberships, setActiveBandId } = useBand()
  const [isBandMenuOpen, setIsBandMenuOpen] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showInstallHint, setShowInstallHint] = useState(false)

  const navigation = useMemo(() => {
    const items = [] as Array<{ to: string; label: string; icon: 'performances' | 'bands' | 'admin' | 'profile' }>

    if (activeMembership) {
      items.push({ to: '/performances', label: 'Optredens', icon: 'performances' })
      items.push({ to: '/bands', label: 'Kapel', icon: 'bands' })
    }

    if (profile?.is_superadmin || ['admin', 'owner'].includes(activeMembership?.role ?? '')) {
      items.push({ to: '/admin?tab=band', label: 'Beheer', icon: 'admin' })
    }

    items.push({ to: '/profile', label: 'Profiel', icon: 'profile' })

    return items
  }, [activeMembership, profile?.is_superadmin])

  const canManagePerformances = ['planner', 'admin', 'owner'].includes(activeMembership?.role ?? '')
  const showCreatePerformanceAction = location.pathname === '/performances' && canManagePerformances

  useEffect(() => {
    setIsStandalone(isStandaloneMode())
    setShowInstallHint(isAndroidChrome() && !isStandaloneMode())

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
      setShowInstallHint(false)
    }

    function handleAppInstalled() {
      setInstallPrompt(null)
      setIsStandalone(true)
      setShowInstallHint(false)
    }

    function handleDisplayModeChange() {
      const standalone = isStandaloneMode()
      setIsStandalone(standalone)
      if (standalone) {
        setShowInstallHint(false)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.matchMedia('(display-mode: standalone)').addEventListener('change', handleDisplayModeChange)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', handleDisplayModeChange)
    }
  }, [])

  async function handleInstallClick() {
    if (!installPrompt) {
      return
    }

    await installPrompt.prompt()
    await installPrompt.userChoice
    setInstallPrompt(null)
  }

  function handleBandSelect(bandId: string) {
    setActiveBandId(bandId)
    setIsBandMenuOpen(false)
    void navigate('/performances')
  }

  const showInstallBanner = !isStandalone && (Boolean(installPrompt) || showInstallHint)

  return (
    <div className="app-shell">
      {showInstallBanner ? (
        <div className="app-shell__top">
          <div className="install-banner" role="region" aria-label="App installeren">
            <span className="install-banner__text">
              {installPrompt
                ? 'Installeer Kapelapp voor snelle toegang vanaf je startscherm.'
                : 'Installeer Kapelapp via Chrome-menu voor snelle toegang vanaf je startscherm.'}
            </span>
            {installPrompt ? (
              <button
                type="button"
                className="install-banner__button"
                onClick={() => void handleInstallClick()}
              >
                Installeer
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="app-shell__top app-shell__top--header">
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
              <Link
                to="/performances/new"
                className="nav-icon-link nav-icon-link--primary"
                aria-label="Nieuw optreden"
                title="Nieuw optreden"
              >
                <Icon name="add" className="nav-icon" />
              </Link>
            ) : null}
            <Link to="/profile" className="nav-icon-link" aria-label="Profiel" title="Profiel">
              <Icon name="profile" className="nav-icon" />
            </Link>
          </div>
        </header>
      </div>

      <main className="app-main">
        <div className="app-main__content">
          <Outlet />
        </div>
      </main>

      <div className="app-nav-wrap">
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
                <span className="nav-link__label">{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
