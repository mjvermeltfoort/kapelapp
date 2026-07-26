import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { PageCard } from '../../../components/PageCard'
import { useBand } from '../../bands/hooks/useBand'
import { getPerformance, updatePerformance } from '../api/performances'
import { PerformanceForm } from '../components/PerformanceForm'

export function PerformanceEditPage() {
  const navigate = useNavigate()
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
    return <PageCard title="Optreden wijzigen" description="Optreden wordt geladen."><p>Laden…</p></PageCard>
  }

  if (performanceQuery.error instanceof Error || !performanceQuery.data) {
    return (
      <PageCard title="Optreden wijzigen" description="Optreden kon niet worden geladen.">
        <p role="alert">{performanceQuery.error instanceof Error ? performanceQuery.error.message : 'Niet gevonden.'}</p>
      </PageCard>
    )
  }

  const performance = performanceQuery.data

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
          navigate(`/performances/${performance.id}`, { replace: true })
        }}
      />
    </PageCard>
  )
}
