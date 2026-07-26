import { useParams } from 'react-router-dom'
import { FeaturePlaceholder } from '../../../components/FeaturePlaceholder'

export function PerformanceEditPage() {
  const { performanceId } = useParams()

  return (
    <FeaturePlaceholder
      title="Optreden wijzigen"
      description={`Schermskelet voor wijzigflow van optreden ${performanceId ?? 'onbekend'}.`}
      checklist={[
        'Bestaande waarden laden',
        'Annuleren/afronden/archiveren ondersteunen',
        'Hard delete vermijden in MVP',
      ]}
    />
  )
}
