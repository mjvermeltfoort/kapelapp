import { useParams } from 'react-router-dom'
import { FeaturePlaceholder } from '../../../components/FeaturePlaceholder'

export function PerformanceDetailPage() {
  const { performanceId } = useParams()

  return (
    <FeaturePlaceholder
      title="Optreden-detail"
      description={`Detailpagina voor optreden ${performanceId ?? 'onbekend'}.`}
      checklist={[
        'Performancegegevens laden',
        'Eigen response tonen',
        'Responseformulier koppelen aan upsert-flow',
      ]}
    />
  )
}
