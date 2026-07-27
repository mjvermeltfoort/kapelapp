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

  const performanceQuery = useQuery({
    queryKey: ['performance', performanceId],
    queryFn: async () => getPerformance(performanceId ?? ''),
    enabled: Boolean(performanceId && activeMembership?.band.id),
  })

  if (!activeMembership) {
    return (
      <PageCard title="Optreden wijzigen" description="Kies eerst een actieve kapel.">
        <p>Ga eerst naar kapellenkiezer en selecteer een kapel.</p>
      </PageCard>
    )
  }

  if (!canManagePerformances) {
    return (
      <PageCard title="Optreden wijzigen" description="Alleen planners, admins en owners kunnen optredens beheren.">
        <p>Je huidige rol heeft geen toegang tot dit scherm.</p>
      </PageCard>
    )
  }

  if (performanceQuery.isLoading) {
    return (
      <PageCard title="Optreden wijzigen" description="Optreden wordt geladen.">
        <LoadingState />
      </PageCard>
    )
  }

  if (performanceQuery.error instanceof Error || !performanceQuery.data) {
    return (
      <PageCard title="Optreden wijzigen" description="Optreden kon niet worden geladen.">
        <Alert tone="error">
          {performanceQuery.error instanceof Error ? performanceQuery.error.message : 'Niet gevonden.'}
        </Alert>
      </PageCard>
    )
  }

  const performance = performanceQuery.data

  async function handleDelete() {
    const confirmed = window.confirm(`Weet je zeker dat je ${performance.title} wilt verwijderen?`)

    if (!confirmed) {
      return
    }

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
    <PageCard title="Optreden wijzigen" description={`Werk ${performance.title} bij.`}>
      <PerformanceForm
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

      <Button type="button" variant="danger" onClick={() => void handleDelete()} disabled={isDeleting} fullWidth>
        {isDeleting ? 'Optreden wordt verwijderd…' : 'Optreden verwijderen'}
      </Button>

      {deleteError ? <Alert tone="error">{deleteError}</Alert> : null}
    </PageCard>
  )
}
