import { Navigate, useSearchParams } from 'react-router-dom'
import { type PropsWithChildren } from 'react'
import { sanitizeRedirectTarget } from '../../lib/redirect'
import { useAuth } from '../../features/auth/hooks/useAuth'

export function RequireGuest({ children }: PropsWithChildren) {
  const { isLoading, user } = useAuth()
  const [searchParams] = useSearchParams()

  if (isLoading) {
    return <p>Session wordt hersteld…</p>
  }

  if (user) {
    const redirectTo = sanitizeRedirectTarget(searchParams.get('redirectTo'), '/bands')
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}
