import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { PageCard } from '../../../components/PageCard'
import { canManagePerformances as canManage } from '../../../lib/roles'
import { useBand } from '../../bands/hooks/useBand'
import { createPerformance } from '../api/performances'
import { PerformanceForm } from '../components/PerformanceForm'
import { performanceKeys } from '../queryKeys'

const initialValues = {
  title: '',
  description: '',
  performanceDate: '',
  startTime: '',
  endTime: '',
  gatherTime: '',
  location: '',
  mapUrl: '',
  responseDeadline: '',
  status: 'draft' as const,
}

export function PerformanceCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { activeMembership } = useBand()
  const canManagePerformances = canManage(activeMembership?.role)

  if (!activeMembership) {
    return (
      <PageCard title="Optreden aanmaken" description="Kies eerst een actieve kapel." backTo="/performances">
        <p>Ga eerst naar kapellenkiezer en selecteer een kapel.</p>
      </PageCard>
    )
  }

  if (!canManagePerformances) {
    return (
      <PageCard title="Optreden aanmaken" description="Alleen planners, beheerders en eigenaren kunnen optredens beheren." backTo="/performances">
        <p>Je huidige rol heeft geen toegang tot dit scherm.</p>
      </PageCard>
    )
  }

  return (
    <PageCard title="Optreden toevoegen" description="Plan een nieuw optreden voor je kapel." backTo="/performances">
      <PerformanceForm
        mode="create"
        initialValues={initialValues}
        onSubmit={async (values) => {
          const performance = await createPerformance({
            bandId: activeMembership.band.id,
            ...values,
          })
          await queryClient.invalidateQueries({ queryKey: performanceKeys.list(activeMembership.band.id) })
          navigate(`/performances/${performance.id}`, { replace: true })
        }}
      />
    </PageCard>
  )
}
