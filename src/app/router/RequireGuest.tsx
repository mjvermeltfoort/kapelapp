import { Navigate } from 'react-router-dom'
import { type PropsWithChildren } from 'react'
import { useAuth } from '../../features/auth/hooks/useAuth'

export function RequireGuest({ children }: PropsWithChildren) {
  const { isLoading, user } = useAuth()

  if (isLoading) {
    return <p>Session wordt hersteld…</p>
  }

  if (user) {
    return <Navigate to="/bands" replace />
  }

  return <>{children}</>
}
