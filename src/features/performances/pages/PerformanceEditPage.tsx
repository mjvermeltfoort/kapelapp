import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { Alert } from '../../../components/Alert'
import { Button } from '../../../components/Button'
import { LoadingState } from '../../../components/LoadingState'
import { PageCard } from '../../../components/PageCard'
import { useBand } from '../../bands/hooks/useBand'
import { deletePerformance, getPerformance, updatePerformance } from '../api/performances'
import { PerformanceForm } from '../components/PerformanceForm'

export function PerformanceEditPage() {
  const navigate = useNavigate()
  const { performanceId } = useParams()
  const { activeMembership } = useBand()
  const canManagePerformances = ['planner', 'admin', 'owner'].includes(activeMembership?.role ?? '')
  const queryClient = useQueryClient()
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  const performanceQuery = useQuery({
    queryKey: ['performance', performanceId],
    queryFn: async () => getPerformance(performanceId ?? ''),
    enabled: Boolean(performanceId && activeMembership?.band.id),
  })

  if (!activeMembership) {
    return (
      <PageCard title="Optreden wijzigen" description="Kies eerst een actieve kapel." backTo="/performances">
        <p>Ga eerst naar kapellenkiezer en selecteer een kapel.</p>
      </PageCard>
    )
  }

  if (!canManagePerformances) {
    return (
      <PageCard title="Optreden wijzigen" description="Alleen planners, admins en owners kunnen optredens beheren." backTo="/performances">
        <p>Je huidige rol heeft geen toegang tot dit scherm.</p>
      </PageCard>
    )
  }

  if (performanceQuery.isLoading) {
    return (
      <PageCard title="Optreden wijzigen" description="Optreden wordt geladen." backTo="/performances">
        <LoadingState />
      </PageCard>
    )
  }

  if (performanceQuery.error instanceof Error || !performanceQuery.data) {
    return (
      <PageCard title="Optreden wijzigen" description="Optreden kon niet worden geladen." backTo="/performances">
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

    try {
      await deletePerformance(performance.id)
      await queryClient.invalidateQueries({ queryKey: ['performances', activeMembership!.band.id] })
      await navigate('/performances', { replace: true })
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Verwijderen mislukt.')
      setIsDeleting(false)
    }
  }

  return (
    <PageCard title="Optreden wijzigen" description={`Werk ${performance.title} bij.`} backTo={`/performances/${performance.id}`}>
      <PerformanceForm
        mode="edit"
        submitLabel="Wijzigingen opslaan"
        initialValues={{
          title: performance.title,
          description: performance.description ?? '',
          performanceDate: performance.performance_date,
          startTime: performance.start_time.slice(0, 5),
          endTime: performance.end_time?.slice(0, 5) ?? '',
          gatherTime: performance.gather_time?.slice(0, 5) ?? '',
          location: performance.location,
          mapUrl: performance.map_url ?? '',
          responseDeadline: performance.response_deadline
            ? performance.response_deadline.slice(0, 16)
            : '',
          status: performance.status,
        }}
        onSubmit={async (values) => {
          await updatePerformance(performance.id, {
            bandId: performance.band_id,
            ...values,
          })
          await queryClient.invalidateQueries({ queryKey: ['performances', activeMembership.band.id] })
          await queryClient.invalidateQueries({ queryKey: ['performance', performance.id] })
          navigate(`/performances/${performance.id}`, { replace: true })
        }}
      />

      <section className="performance-form__section">
        <div className="performance-form__section-header">
          <h3 className="section-title">Gevarenzone</h3>
          <p className="muted-text">Verwijder dit optreden definitief. Dit kan niet ongedaan worden gemaakt.</p>
        </div>

        {!isConfirmingDelete ? (
          <Button type="button" variant="danger" onClick={() => setIsConfirmingDelete(true)} disabled={isDeleting} fullWidth>
            Optreden verwijderen
          </Button>
        ) : (
          <div className="stack-sm">
            <p className="muted-text">Weet je zeker dat je {performance.title} definitief wilt verwijderen?</p>
            <Button type="button" variant="danger" onClick={() => void handleDelete()} disabled={isDeleting} fullWidth>
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

        {deleteError ? <Alert tone="error">{deleteError}</Alert> : null}
      </section>
    </PageCard>
  )
}
