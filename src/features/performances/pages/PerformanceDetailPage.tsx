import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useMatch, useNavigate, useParams } from 'react-router-dom'
import { Alert } from '../../../components/Alert'
import { Badge } from '../../../components/Badge'
import { LoadingState } from '../../../components/LoadingState'
import { PageCard } from '../../../components/PageCard'
import { canManagePerformances as canManage } from '../../../lib/roles'
import { useBand } from '../../bands/hooks/useBand'
import { PerformanceResponseForm } from '../../responses/components/PerformanceResponseForm'
import { getMyPerformanceResponse, upsertMyPerformanceResponse } from '../../responses/api/responses'
import { getPerformance } from '../api/performances'
import { PlannerOverviewModal } from '../components/PlannerOverviewModal'

export function PerformanceDetailPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { performanceId } = useParams()
  const { activeMembership } = useBand()
  const plannerOverviewMatch = useMatch('/performances/:performanceId/planner-overview')
  const canManagePerformances = canManage(activeMembership?.role)
  const canViewPlannerOverview = Boolean(activeMembership)

  const performanceQuery = useQuery({
    queryKey: ['performance', performanceId],
    queryFn: async () => getPerformance(performanceId ?? ''),
    enabled: Boolean(performanceId && activeMembership?.band.id),
  })

  const responseQuery = useQuery({
    queryKey: ['my-performance-response', performanceId],
    queryFn: async () => getMyPerformanceResponse(performanceId ?? ''),
    enabled: Boolean(performanceId && activeMembership?.band.id),
  })

  if (!activeMembership) {
    return (
      <PageCard title="Optreden-detail" description="Kies eerst een actieve kapel." backTo="/performances">
        <p>Ga eerst naar kapellenkiezer en selecteer een kapel.</p>
      </PageCard>
    )
  }

  if (performanceQuery.isLoading) {
    return (
      <PageCard title="Optreden-detail" description="Optreden wordt geladen." backTo="/performances">
        <LoadingState />
      </PageCard>
    )
  }

  if (performanceQuery.error instanceof Error || !performanceQuery.data) {
    return (
      <PageCard title="Optreden-detail" description="Optreden kon niet worden geladen." backTo="/performances">
        <Alert tone="error">
          {performanceQuery.error instanceof Error ? performanceQuery.error.message : 'Niet gevonden.'}
        </Alert>
      </PageCard>
    )
  }

  const performance = performanceQuery.data

  return (
    <>
      <div className="page-grid">
        <PageCard title={performance.title} description={formatLongDate(performance.performance_date)} backTo="/performances">
          <div className="performance-hero">
            <div className="performance-hero__status-row">
              <Badge tone={mapStatusTone(performance.status)}>{formatStatusLabel(performance.status)}</Badge>
              {performance.response_deadline ? (
                <span className="performance-hero__deadline">
                  Reageren voor {new Date(performance.response_deadline).toLocaleDateString('nl-NL', {
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              ) : null}
            </div>

            <div className="performance-meta-grid">
              <div className="performance-meta-card">
                <span className="performance-meta-card__label">Tijd</span>
                <strong>
                  {performance.start_time.slice(0, 5)}
                  {performance.end_time ? ` - ${performance.end_time.slice(0, 5)}` : ''}
                </strong>
              </div>

              {performance.gather_time ? (
                <div className="performance-meta-card">
                  <span className="performance-meta-card__label">Verzamelen</span>
                  <strong>{performance.gather_time.slice(0, 5)}</strong>
                </div>
              ) : null}

              <div className="performance-meta-card performance-meta-card--wide">
                <span className="performance-meta-card__label">Locatie</span>
                <strong>{performance.location}</strong>
              </div>
            </div>

            {performance.description?.trim() ? (
              <div className="performance-description-card">
                <span className="performance-meta-card__label">Meer informatie</span>
                <p>{performance.description}</p>
              </div>
            ) : null}

            <div className="performance-actions">
              {performance.map_url ? (
                <a href={performance.map_url} target="_blank" rel="noreferrer" className="home-create-button performance-link-button">
                  Open kaart
                </a>
              ) : null}

              {canViewPlannerOverview ? (
                <Link
                  to={`/performances/${performance.id}/planner-overview`}
                  className="home-create-button performance-link-button"
                >
                  Planner-overzicht
                </Link>
              ) : null}

              {canManagePerformances ? (
                <Link to={`/performances/${performance.id}/edit`} className="performance-secondary-link">
                  Wijzigen
                </Link>
              ) : null}
            </div>
          </div>
        </PageCard>

        <PageCard title="Jouw reactie" description="Geef aan of je aanwezig bent. Bij misschien is een reden verplicht.">
          {responseQuery.isLoading ? <LoadingState>Reactie wordt geladen…</LoadingState> : null}
          {responseQuery.error instanceof Error ? <Alert tone="error">{responseQuery.error.message}</Alert> : null}

          <PerformanceResponseForm
            currentResponse={responseQuery.data ?? null}
            onSubmit={async (input) => {
              await upsertMyPerformanceResponse({
                performanceId: performance.id,
                response: input.response,
                reason: input.reason,
              })
              await Promise.all([
                responseQuery.refetch(),
                queryClient.invalidateQueries({ queryKey: ['my-performance-responses', activeMembership.band.id] }),
              ])
              navigate('/performances', { replace: true })
            }}
          />
        </PageCard>
      </div>

      <PlannerOverviewModal
        performanceId={performance.id}
        performance={performance}
        canViewOverview={canViewPlannerOverview}
        isOpen={Boolean(plannerOverviewMatch)}
        onClose={() => void navigate(`/performances/${performance.id}`, { replace: true })}
      />
    </>
  )
}

function formatLongDate(date: string) {
  return new Date(date).toLocaleDateString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatStatusLabel(status: 'draft' | 'published' | 'cancelled' | 'completed' | 'archived') {
  switch (status) {
    case 'draft':
      return 'Concept'
    case 'published':
      return 'Gepubliceerd'
    case 'cancelled':
      return 'Geannuleerd'
    case 'completed':
      return 'Afgerond'
    case 'archived':
      return 'Gearchiveerd'
  }
}

function mapStatusTone(status: 'draft' | 'published' | 'cancelled' | 'completed' | 'archived') {
  switch (status) {
    case 'draft':
      return 'neutral' as const
    case 'published':
      return 'brand' as const
    case 'cancelled':
      return 'danger' as const
    case 'completed':
      return 'success' as const
    case 'archived':
      return 'neutral' as const
  }
}
