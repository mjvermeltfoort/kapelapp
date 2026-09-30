import { Navigate, useLocation } from 'react-router-dom'
import { type PropsWithChildren } from 'react'
import { Button } from '../../components/Button'
import { SplashScreen } from '../../components/SplashScreen'
import { sanitizeRedirectTarget } from '../../lib/redirect'
import { useAuth } from '../../features/auth/hooks/useAuth'

export function RequireAuth({ children }: PropsWithChildren) {
  const location = useLocation()
  const { isLoading, profile, profileLoadFailed, refreshProfile, user } = useAuth()

  if (isLoading) {
    return <SplashScreen message="Sessie wordt hersteld…" />
  }

  if (!user) {
    const redirectTo = sanitizeRedirectTarget(`${location.pathname}${location.search}${location.hash}`, '/')
    return <Navigate to={`/login?redirectTo=${encodeURIComponent(redirectTo)}`} replace />
  }

  if (profileLoadFailed) {
    return (
      <SplashScreen
        message="Profiel laden mislukt. Controleer je verbinding."
        action={
          <Button type="button" onClick={() => void refreshProfile()}>
            Opnieuw proberen
          </Button>
        }
      />
    )
  }

  const isProfileSetupRoute = location.pathname === '/profile/setup'
  const isProfileComplete = Boolean(profile?.display_name)

  if (!isProfileComplete && !isProfileSetupRoute) {
    const next = sanitizeRedirectTarget(`${location.pathname}${location.search}${location.hash}`, '/')
    return <Navigate to={`/profile/setup?next=${encodeURIComponent(next)}`} replace />
  }

  if (isProfileComplete && isProfileSetupRoute) {
    return <Navigate to="/bands" replace />
  }

  return <>{children}</>
}
