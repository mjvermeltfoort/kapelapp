import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { PageCard } from '../../../components/PageCard'
import { useBand } from '../../bands/hooks/useBand'
import { getPerformance } from '../api/performances'

export function PerformanceDetailPage() {
  const { performanceId } = useParams()
  const { activeMembership } = useBand()
  const canManagePerformances = ['planner', 'admin', 'owner'].includes(activeMembership?.role ?? '')

  const performanceQuery = useQuery({
    queryKey: ['performance', performanceId],
    queryFn: async () => getPerformance(performanceId ?? ''),
    enabled: Boolean(performanceId && activeMembership?.band.id),
  })

  if (!activeMembership) {
    return (
      <PageCard title="Optreden-detail" description="Kies eerst een actieve kapel.">
        <p>Ga eerst naar kapellenkiezer en selecteer een kapel.</p>
      </PageCard>
    )
  }

  if (performanceQuery.isLoading) {
    return <PageCard title="Optreden-detail" description="Optreden wordt geladen."><p>Laden…</p></PageCard>
  }

  if (performanceQuery.error instanceof Error || !performanceQuery.data) {
    return (
      <PageCard title="Optreden-detail" description="Optreden kon niet worden geladen.">
        <p role="alert">{performanceQuery.error instanceof Error ? performanceQuery.error.message : 'Niet gevonden.'}</p>
      </PageCard>
    )
  }

  const performance = performanceQuery.data

  return (
    <PageCard title={performance.title} description={`Status: ${performance.status}`}>
      <dl>
        <div>
          <dt>Datum</dt>
          <dd>{new Date(performance.performance_date).toLocaleDateString()}</dd>
        </div>
        <div>
          <dt>Begintijd</dt>
          <dd>{performance.start_time.slice(0, 5)}</dd>
        </div>
        <div>
          <dt>Eindtijd</dt>
          <dd>{performance.end_time?.slice(0, 5) ?? 'Niet ingevuld'}</dd>
        </div>
        <div>
          <dt>Verzameltijd</dt>
          <dd>{performance.gather_time?.slice(0, 5) ?? 'Niet ingevuld'}</dd>
        </div>
        <div>
          <dt>Locatie</dt>
          <dd>{performance.location}</dd>
        </div>
        <div>
          <dt>Kaartlink</dt>
          <dd>
            {performance.map_url ? (
              <a href={performance.map_url} target="_blank" rel="noreferrer">
                Open kaart
              </a>
            ) : (
              'Niet ingevuld'
            )}
          </dd>
        </div>
        <div>
          <dt>Reactiedeadline</dt>
          <dd>
            {performance.response_deadline
              ? new Date(performance.response_deadline).toLocaleString()
              : 'Niet ingesteld'}
          </dd>
        </div>
        <div>
          <dt>Omschrijving</dt>
          <dd>{performance.description ?? 'Geen omschrijving'}</dd>
        </div>
      </dl>

      {canManagePerformances ? (
        <div className="inline-links">
          <Link to={`/performances/${performance.id}/edit`}>Wijzigen</Link>
          <Link to={`/performances/${performance.id}/planner-overview`}>Planner-overzicht</Link>
        </div>
      ) : null}
    </PageCard>
  )
}
