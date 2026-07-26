import { FeaturePlaceholder } from '../../../components/FeaturePlaceholder'

export function MembersPage() {
  return (
    <FeaturePlaceholder
      title="Leden- en rollenbeheer"
      description="Schermskelet voor ledenlijst, rolwijzigingen en deactiveren/heractiveren."
      checklist={[
        'Members laden voor actieve band',
        'Rolwijziging via RPC koppelen',
        'Laatste owner-bescherming zichtbaar maken in UI',
      ]}
    />
  )
}
