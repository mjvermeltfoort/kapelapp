import { Navigate, useSearchParams } from 'react-router-dom'
import { type PropsWithChildren } from 'react'
import { useAuth } from '../../features/auth/hooks/useAuth'

export function RequireGuest({ children }: PropsWithChildren) {
  const { isLoading, user } = useAuth()
  const [searchParams] = useSearchParams()

  if (isLoading) {
    return <p>Session wordt hersteld…</p>
  }

  if (user) {
    const redirectTo = searchParams.get('redirectTo') || '/bands'
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}
