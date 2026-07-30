import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { clearInstallPrompt, dismissIOSInstall, getInstallPrompt, hasIOSInstallBeenDismissed, isIOSSafari } from '../../lib/installPrompt'
import { canManagePerformances as canManage } from '../../lib/roles'
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
  const canManageBand = profile?.is_superadmin || ['admin', 'owner'].includes(activeMembership?.role ?? '')
  const brandMenuRef = useRef<HTMLDivElement>(null)
  const brandTriggerRef = useRef<HTMLButtonElement>(null)
  const [isBandMenuOpen, setIsBandMenuOpen] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showInstallHint, setShowInstallHint] = useState(false)
  const [showIOSBanner, setShowIOSBanner] = useState(false)

  const navigation = useMemo(() => {
    const items = [] as Array<{ to: string; label: string; icon: 'performances' | 'bands' | 'admin' | 'profile' }>

    if (activeMembership) {
      items.push({ to: '/performances', label: 'Optredens', icon: 'performances' })
    }

    if (canManageBand) {
      items.push({ to: '/bands', label: 'Kapel', icon: 'bands' })
      items.push({ to: '/admin?tab=band', label: 'Beheer', icon: 'admin' })
    }

    items.push({ to: '/profile', label: 'Profiel', icon: 'profile' })

    return items
  }, [activeMembership, canManageBand])

  const showCreatePerformanceAction = location.pathname === '/performances' && canManage(activeMembership?.role)

  useEffect(() => {
    const standalone = isStandaloneMode()
    setIsStandalone(standalone)

    if (!standalone) {
      const captured = getInstallPrompt()
      if (captured) {
        setInstallPrompt(captured as BeforeInstallPromptEvent)
      } else if (isAndroidChrome()) {
        setShowInstallHint(true)
      } else if (isIOSSafari() && !hasIOSInstallBeenDismissed()) {
        setShowIOSBanner(true)
      }
    }

    function handleInstallPromptReady() {
      const captured = getInstallPrompt()
      if (captured) {
        setInstallPrompt(captured as BeforeInstallPromptEvent)
        setShowInstallHint(false)
      }
    }

    function handleAppInstalled() {
      setInstallPrompt(null)
      setIsStandalone(true)
      setShowInstallHint(false)
    }

    function handleDisplayModeChange() {
      const isNowStandalone = isStandaloneMode()
      setIsStandalone(isNowStandalone)
      if (isNowStandalone) {
        setShowInstallHint(false)
        setShowIOSBanner(false)
      }
    }

    window.addEventListener('installpromptready', handleInstallPromptReady)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.matchMedia('(display-mode: standalone)').addEventListener('change', handleDisplayModeChange)

    return () => {
      window.removeEventListener('installpromptready', handleInstallPromptReady)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', handleDisplayModeChange)
    }
  }, [])

  useEffect(() => {
    if (!isBandMenuOpen) {
      return
    }

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !brandMenuRef.current?.contains(event.target)) {
        setIsBandMenuOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return
      }

      setIsBandMenuOpen(false)
      brandTriggerRef.current?.focus()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isBandMenuOpen])

  function handleIOSDismiss() {
    dismissIOSInstall()
    setShowIOSBanner(false)
  }

  async function handleInstallClick() {
    if (!installPrompt) {
      return
    }

    await installPrompt.prompt()
    await installPrompt.userChoice
    clearInstallPrompt()
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
                ? 'Installeer Kapel App voor snelle toegang vanaf je startscherm.'
                : 'Installeer Kapel App via Chrome-menu voor snelle toegang vanaf je startscherm.'}
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
      {showIOSBanner ? (
        <div className="app-shell__top">
          <div className="install-banner" role="region" aria-label="App installeren op iOS">
            <span className="install-banner__text">
              Installeer: tik op <strong>⎙</strong> en kies <strong>Zet op beginscherm</strong>.
            </span>
            <button
              type="button"
              className="install-banner__button"
              onClick={handleIOSDismiss}
              aria-label="Banner sluiten"
            >
              ✕
            </button>
          </div>
        </div>
      ) : null}

      <div className="app-shell__top app-shell__top--header">
        <header className="app-header">
          <div className="header-left">
            <div ref={brandMenuRef} className="brand-menu">
              <button
                ref={brandTriggerRef}
                type="button"
                className={isBandMenuOpen ? 'brand-trigger brand-trigger--open' : 'brand-trigger'}
                onClick={() => setIsBandMenuOpen((current) => !current)}
                aria-expanded={isBandMenuOpen}
                aria-haspopup="menu"
                aria-label={
                  activeMembership
                    ? `Actieve kapel: ${activeMembership.band.name}. Open kapelmenu`
                    : 'Open kapelmenu'
                }
              >
                <img src="/logo-v2.png" alt="Kapel App logo" className="brand-logo" />
                <div className="brand-text">
                  <h1>Kapel App</h1>
                  <span className="subtitle">
                    {activeMembership ? activeMembership.band.name : 'Geen actieve kapel'}
                  </span>
                </div>
              </button>

              {isBandMenuOpen ? (
                <div className="brand-panel" role="menu" aria-label="Kapelmenu">
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
                        aria-label={`Kies kapel ${membership.band.name}`}
                      >
                        <strong>{membership.band.name}</strong>
                        <span>{membership.role}</span>
                      </button>
                    ))}
                  </div>

                  {canManageBand ? (
                    <div className="brand-panel__footer">
                      <Link to="/bands" className="brand-panel__link" onClick={() => setIsBandMenuOpen(false)}>
                        Kapellen beheren
                      </Link>
                    </div>
                  ) : null}
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
