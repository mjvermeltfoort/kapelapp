import { useNavigate } from 'react-router-dom'
import { Badge } from '../../../components/Badge'
import { PageCard } from '../../../components/PageCard'
import { canManagePerformances as canManage } from '../../../lib/roles'
import { useBand } from '../../bands/hooks/useBand'
import { createPerformance } from '../api/performances'
import { PerformanceForm } from '../components/PerformanceForm'

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
  const { activeMembership } = useBand()
  const canManagePerformances = canManage(activeMembership?.role)

  if (!activeMembership) {
    return (
      <PageCard title="Optreden aanmaken" description="Kies eerst een actieve kapel.">
        <p>Ga eerst naar kapellenkiezer en selecteer een kapel.</p>
      </PageCard>
    )
  }

  if (!canManagePerformances) {
    return (
      <PageCard title="Optreden aanmaken" description="Alleen planners, admins en owners kunnen optredens beheren.">
        <p>Je huidige rol heeft geen toegang tot dit scherm.</p>
      </PageCard>
    )
  }

  return (
    <div className="page-grid">
      <PageCard title="Optreden toevoegen" description="Maak snel een nieuw optreden aan voor je kapel.">
        <div className="performance-create-intro">
          <Badge tone="brand">Nieuwe planning</Badge>
          <p className="muted-text">
            Vul alleen in wat nodig is. Je kunt optreden opslaan als concept en later aanvullen.
          </p>
        </div>
      </PageCard>

      <PageCard title="Gegevens invullen" description="Rustige opbouw in duidelijke stappen.">
        <PerformanceForm
          submitLabel="Optreden opslaan"
          initialValues={initialValues}
          onSubmit={async (values) => {
            const performance = await createPerformance({
              bandId: activeMembership.band.id,
              ...values,
            })
            navigate(`/performances/${performance.id}`, { replace: true })
          }}
        />
      </PageCard>
    </div>
  )
}
