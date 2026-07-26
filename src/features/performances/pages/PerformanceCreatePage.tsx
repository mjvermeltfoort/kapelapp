import { FeaturePlaceholder } from '../../../components/FeaturePlaceholder'

export function PerformanceCreatePage() {
  return (
    <FeaturePlaceholder
      title="Optreden aanmaken"
      description="Schermskelet voor create-flow van optredens."
      checklist={[
        'Formulier bouwen voor titel, datum, tijd en locatie',
        'Status draft/published ondersteunen',
        'Alleen planner+ toegang geven',
      ]}
    />
  )
}
