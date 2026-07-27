import { Navigate } from 'react-router-dom'
import { LoadingState } from '../components/LoadingState'
import { useBand } from '../features/bands/hooks/useBand'

export function HomeRedirect() {
  const { activeMembership, isLoading, memberships } = useBand()

  if (isLoading) {
    return <LoadingState>Startpagina wordt geladen…</LoadingState>
  }

  if (activeMembership) {
    return <Navigate to="/performances" replace />
  }

  if (!memberships.length) {
    return <Navigate to="/bands" replace />
  }

  return <Navigate to="/bands" replace />
}
