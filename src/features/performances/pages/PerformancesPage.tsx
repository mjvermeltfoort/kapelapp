import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageCard } from '../../../components/PageCard'
import { useBand } from '../../bands/hooks/useBand'
import { listBandPerformances } from '../api/performances'

export function PerformancesPage() {
  const { activeMembership } = useBand()
  const canManagePerformances = ['planner', 'admin', 'owner'].includes(activeMembership?.role ?? '')

  const performancesQuery = useQuery({
    queryKey: ['performances', activeMembership?.band.id],
    queryFn: async () => listBandPerformances(activeMembership!.band.id),
    enabled: Boolean(activeMembership?.band.id),
  })

  if (!activeMembership) {
    return (
      <PageCard title="Optredens" description="Kies eerst een actieve kapel.">
        <p>Ga eerst naar kapellenkiezer en selecteer een kapel.</p>
      </PageCard>
    )
  }

  return (
    <PageCard
      title="Overzicht aankomende optredens"
      description={`Optredens voor ${activeMembership.band.name}. Concepten zijn alleen zichtbaar voor planner, admin en owner.`}
    >
      <div className="inline-links">
        {canManagePerformances ? <Link to="/performances/new">Nieuw optreden</Link> : null}
      </div>

      {performancesQuery.isLoading ? <p>Optredens worden geladen…</p> : null}
      {performancesQuery.error instanceof Error ? <p role="alert">{performancesQuery.error.message}</p> : null}

      {!performancesQuery.isLoading && !performancesQuery.data?.length ? (
        <p>Nog geen optredens voor deze kapel.</p>
      ) : null}

      <div className="stack-sm">
        {performancesQuery.data?.map((performance) => (
          <Link key={performance.id} to={`/performances/${performance.id}`} className="list-card-link">
            <strong>{performance.title}</strong>
            <span>
              {new Date(performance.performance_date).toLocaleDateString()} · {performance.start_time.slice(0, 5)}
            </span>
            <span>{performance.location}</span>
            <span>Status: {performance.status}</span>
          </Link>
        ))}
      </div>
    </PageCard>
  )
}
