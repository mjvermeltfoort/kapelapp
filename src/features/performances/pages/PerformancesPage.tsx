import { FeaturePlaceholder } from '../../../components/FeaturePlaceholder'

export function PerformancesPage() {
  return (
    <FeaturePlaceholder
      title="Overzicht aankomende optredens"
      description="Startpunt voor performance-lijst per actieve kapel."
      checklist={[
        'Komende optredens ophalen',
        'Eigen response-status tonen',
        'Drafts alleen voor planner+ tonen',
      ]}
      links={[
        { to: '/performances/new', label: 'Nieuw optreden' },
        { to: '/performances/demo/planner-overview', label: 'Planner-overzicht' },
      ]}
    />
  )
}
