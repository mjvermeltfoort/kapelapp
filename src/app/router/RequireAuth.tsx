import { Navigate, useLocation } from 'react-router-dom'
import { type PropsWithChildren } from 'react'
import { useAuth } from '../../features/auth/hooks/useAuth'

export function RequireAuth({ children }: PropsWithChildren) {
  const location = useLocation()
  const { isLoading, profile, user } = useAuth()

  if (isLoading) {
    return <p>Session wordt hersteld…</p>
  }

  if (!user) {
    const redirectTo = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to={`/login?redirectTo=${encodeURIComponent(redirectTo)}`} replace />
  }

  const isProfileSetupRoute = location.pathname === '/profile/setup'
  const isProfileComplete = Boolean(profile?.display_name)

  if (!isProfileComplete && !isProfileSetupRoute) {
    const next = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to={`/profile/setup?next=${encodeURIComponent(next)}`} replace />
  }

  if (isProfileComplete && isProfileSetupRoute) {
    return <Navigate to="/bands" replace />
  }

  return <>{children}</>
}
