import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useMatch, useNavigate, useParams } from 'react-router-dom'
import { Alert } from '../../../components/Alert'
import { Badge } from '../../../components/Badge'
import { Button } from '../../../components/Button'
import { LoadingState } from '../../../components/LoadingState'
import { PageCard } from '../../../components/PageCard'
import { canManagePerformances as canManage } from '../../../lib/roles'
import { useBand } from '../../bands/hooks/useBand'
import { PerformanceResponseForm } from '../../responses/components/PerformanceResponseForm'
import { getMyPerformanceResponse, upsertMyPerformanceResponse } from '../../responses/api/responses'
import { deletePerformance, getPerformance } from '../api/performances'
import { PlannerOverviewModal } from '../components/PlannerOverviewModal'

export function PerformanceDetailPage() {
  const navigate = useNavigate()
  const { performanceId } = useParams()
  const { activeMembership } = useBand()
  const plannerOverviewMatch = useMatch('/performances/:performanceId/planner-overview')
  const canManagePerformances = canManage(activeMembership?.role)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const queryClient = useQueryClient()

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
      <PageCard title="Optreden-detail" description="Kies eerst een actieve kapel.">
        <p>Ga eerst naar kapellenkiezer en selecteer een kapel.</p>
      </PageCard>
    )
  }

  if (performanceQuery.isLoading) {
    return (
      <PageCard title="Optreden-detail" description="Optreden wordt geladen.">
        <LoadingState />
      </PageCard>
    )
  }

  if (performanceQuery.error instanceof Error || !performanceQuery.data) {
    return (
      <PageCard title="Optreden-detail" description="Optreden kon niet worden geladen.">
        <Alert tone="error">
          {performanceQuery.error instanceof Error ? performanceQuery.error.message : 'Niet gevonden.'}
        </Alert>
      </PageCard>
    )
  }

  const performance = performanceQuery.data

  async function handleDelete() {
    setDeleteError(null)
    setIsDeleting(true)
    setIsConfirmingDelete(false)

    try {
      await deletePerformance(performance.id)
      await queryClient.invalidateQueries({ queryKey: ['performances', activeMembership?.band.id] })
      await navigate('/performances', { replace: true })
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Verwijderen mislukt.')
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="page-grid">
      <PageCard title={performance.title} description={formatLongDate(performance.performance_date)}>
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

            <div className="performance-meta-card">
              <span className="performance-meta-card__label">Verzamelen</span>
              <strong>{performance.gather_time?.slice(0, 5) ?? 'Niet ingevuld'}</strong>
            </div>

            <div className="performance-meta-card performance-meta-card--wide">
              <span className="performance-meta-card__label">Locatie</span>
              <strong>{performance.location}</strong>
            </div>
          </div>

          <div className="performance-description-card">
            <span className="performance-meta-card__label">Meer informatie</span>
            <p>{performance.description ?? 'Geen omschrijving toegevoegd.'}</p>
          </div>

          <div className="performance-actions">
            {performance.map_url ? (
              <a href={performance.map_url} target="_blank" rel="noreferrer" className="home-create-button performance-link-button">
                Open kaart
              </a>
            ) : null}

            {canManagePerformances ? (
              <div className="performance-admin-links">
                <Link to={`/performances/${performance.id}/edit`} className="performance-secondary-link">
                  Wijzigen
                </Link>
                <Link
                  to={`/performances/${performance.id}/planner-overview`}
                  className="performance-secondary-link"
                >
                  Planner-overzicht
                </Link>
                {!isConfirmingDelete ? (
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => setIsConfirmingDelete(true)}
                    fullWidth
                  >
                    Optreden verwijderen
                  </Button>
                ) : (
                  <div className="stack-sm">
                    <p className="muted-text">Weet je zeker dat je dit optreden definitief wilt verwijderen?</p>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => void handleDelete()}
                      disabled={isDeleting}
                      fullWidth
                    >
                      {isDeleting ? 'Optreden wordt verwijderd…' : 'Ja, definitief verwijderen'}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setIsConfirmingDelete(false)}
                      disabled={isDeleting}
                      fullWidth
                    >
                      Annuleren
                    </Button>
                  </div>
                )}
              </div>
            ) : null}

            {deleteError ? <Alert tone="error">{deleteError}</Alert> : null}
          </div>
        </div>
      </PageCard>

      <PageCard
        title="Jouw reactie"
        description="Geef aan of je aanwezig bent. Bij misschien is een reden verplicht."
      >
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
            await responseQuery.refetch()
          }}
        />
      </PageCard>
      </div>

      <PlannerOverviewModal
        performanceId={performance.id}
        performance={performance}
        canViewOverview={canManagePerformances}
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
