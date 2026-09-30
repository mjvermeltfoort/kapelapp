import { Navigate, useSearchParams } from 'react-router-dom'
import { type PropsWithChildren } from 'react'
import { SplashScreen } from '../../components/SplashScreen'
import { sanitizeRedirectTarget } from '../../lib/redirect'
import { useAuth } from '../../features/auth/hooks/useAuth'

export function RequireGuest({ children }: PropsWithChildren) {
  const { isLoading, user } = useAuth()
  const [searchParams] = useSearchParams()

  if (isLoading) {
    return <SplashScreen message="Sessie wordt hersteld…" />
  }

  if (user) {
    const redirectTo = sanitizeRedirectTarget(searchParams.get('redirectTo'), '/bands')
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}
