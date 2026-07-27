import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Alert } from '../../../components/Alert'
import { Badge } from '../../../components/Badge'
import { Button } from '../../../components/Button'
import { EmptyState } from '../../../components/EmptyState'
import { Icon } from '../../../components/Icon'
import { LoadingState } from '../../../components/LoadingState'
import { PageCard } from '../../../components/PageCard'
import { useAuth } from '../../auth/hooks/useAuth'
import { useBand } from '../../bands/hooks/useBand'
import { listMyPerformanceResponses } from '../../responses/api/responses'
import { listBandPerformances } from '../api/performances'

export function PerformancesPage() {
  const { profile } = useAuth()
  const { activeMembership } = useBand()
  const canManagePerformances = ['planner', 'admin', 'owner'].includes(activeMembership?.role ?? '')
  const [visibleCount, setVisibleCount] = useState(3)

  const performancesQuery = useQuery({
    queryKey: ['performances', activeMembership?.band.id],
    queryFn: async () => listBandPerformances(activeMembership!.band.id),
    enabled: Boolean(activeMembership?.band.id),
  })

  const responsesQuery = useQuery({
    queryKey: [
      'my-performance-responses',
      activeMembership?.band.id,
      performancesQuery.data?.length ?? 0,
    ],
    queryFn: async () =>
      listMyPerformanceResponses((performancesQuery.data ?? []).map((performance) => performance.id)),
    enabled: Boolean(activeMembership?.band.id && performancesQuery.data?.length),
  })

  const upcomingPerformances = useMemo(() => {
    const today = new Date()
    const todayKey = [
      today.getFullYear(),
      `${today.getMonth() + 1}`.padStart(2, '0'),
      `${today.getDate()}`.padStart(2, '0'),
    ].join('-')

    return (performancesQuery.data ?? []).filter((performance) => performance.performance_date >= todayKey)
  }, [performancesQuery.data])

  const featuredPerformances = upcomingPerformances.slice(0, visibleCount)
  const hasMorePerformances = upcomingPerformances.length > featuredPerformances.length
  const firstName = profile?.display_name?.trim().split(/\s+/)[0] ?? 'daar'

  if (!activeMembership) {
    return (
      <PageCard title="Optredens" description="Kies eerst een actieve kapel.">
        <p>Ga eerst naar kapellenkiezer en selecteer een kapel.</p>
      </PageCard>
    )
  }

  return (
    <div className="page-grid">
      <PageCard
        title={`Welkom terug, ${firstName}!`}
        description="Hieronder je aankomende optredens."
      >
        {performancesQuery.isLoading ? <LoadingState>Optredens worden geladen…</LoadingState> : null}
        {responsesQuery.isLoading && performancesQuery.data?.length ? (
          <LoadingState>Jouw reacties worden bijgewerkt…</LoadingState>
        ) : null}
        {performancesQuery.error instanceof Error ? (
          <Alert tone="error">{performancesQuery.error.message}</Alert>
        ) : null}
        {responsesQuery.error instanceof Error ? (
          <Alert tone="error">{responsesQuery.error.message}</Alert>
        ) : null}

        {!performancesQuery.isLoading && !performancesQuery.data?.length ? (
          <EmptyState>Nog geen optredens voor deze kapel.</EmptyState>
        ) : null}

        {featuredPerformances.length ? (
          <div className="home-performance-list">
            {featuredPerformances.map((performance) => {
              const response = responsesQuery.data?.find((item) => item.performance_id === performance.id)

              return (
                <Link
                  key={performance.id}
                  to={`/performances/${performance.id}`}
                  className="home-performance-card"
                >
                  <div className="home-performance-card__date">
                    <span>{formatShortWeekday(performance.performance_date)}</span>
                    <strong>{new Date(performance.performance_date).getDate()}</strong>
                    <span>{formatShortMonth(performance.performance_date)}</span>
                  </div>

                  <div className="home-performance-card__content">
                    <div className="home-performance-card__topline">
                      <strong>{performance.title}</strong>
                      <Badge tone={mapResponseTone(response?.response)}>
                        {formatResponseLabel(response?.response)}
                      </Badge>
                    </div>

                    <div className="home-performance-card__meta">
                      <span>
                        {performance.start_time.slice(0, 5)}
                        {performance.end_time ? ` - ${performance.end_time.slice(0, 5)}` : ''}
                      </span>
                      <span>{performance.location}</span>
                    </div>

                    {performance.response_deadline ? (
                      <span className="home-performance-card__deadline">
                        Reageren voor {formatDeadlineLabel(performance.response_deadline)}
                      </span>
                    ) : null}
                  </div>
                </Link>
              )
            })}
          </div>
        ) : null}

        {hasMorePerformances ? (
          <Button type="button" variant="secondary" onClick={() => setVisibleCount((current) => current + 3)} fullWidth>
            Toon volgende 3 optredens
          </Button>
        ) : null}

        {canManagePerformances ? (
          <Link to="/performances/new" className="home-create-button">
            <Icon name="add" className="nav-icon" />
            <span>Optreden toevoegen</span>
          </Link>
        ) : null}
      </PageCard>
    </div>
  )
}

function formatShortWeekday(date: string) {
  return new Date(date).toLocaleDateString('nl-NL', { weekday: 'short' }).replace('.', '').toUpperCase()
}

function formatShortMonth(date: string) {
  return new Date(date).toLocaleDateString('nl-NL', { month: 'short' }).replace('.', '').toUpperCase()
}

function formatDeadlineLabel(dateTime: string) {
  const date = new Date(dateTime)

  return date.toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
  })
}

function formatResponseLabel(response?: 'yes' | 'maybe' | 'no') {
  switch (response) {
    case 'yes':
      return 'Ja'
    case 'maybe':
      return 'Misschien'
    case 'no':
      return 'Nee'
    default:
      return 'Nog niet gereageerd'
  }
}

function mapResponseTone(response?: 'yes' | 'maybe' | 'no') {
  switch (response) {
    case 'yes':
      return 'success' as const
    case 'maybe':
      return 'warning' as const
    case 'no':
      return 'danger' as const
    default:
      return 'neutral' as const
  }
}

