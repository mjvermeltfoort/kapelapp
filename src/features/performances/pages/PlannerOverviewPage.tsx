import { useParams } from 'react-router-dom'
import { FeaturePlaceholder } from '../../../components/FeaturePlaceholder'

export function PlannerOverviewPage() {
  const { performanceId } = useParams()

  return (
    <FeaturePlaceholder
      title="Overzicht van reacties voor planners"
      description={`Planner-overzicht voor optreden ${performanceId ?? 'onbekend'}.`}
      checklist={[
        'Aantallen ja/misschien/nee tonen',
        'Niet-gereageerden tonen',
        'Redenen en instrumentverdeling tonen',
        'Herinneringstekst kopieerbaar maken',
      ]}
    />
  )
}
