import { FeaturePlaceholder } from '../../../components/FeaturePlaceholder'

export function BandSettingsPage() {
  return (
    <FeaturePlaceholder
      title="Kapelinstellingen"
      description="Beheer van naam, beschrijving, zichtbaarheid van responses en verlaten van kapel."
      checklist={[
        'Bandgegevens laden en bewerken voor admin/owner',
        'Toggle show_member_responses toevoegen',
        'Leave-band flow via RPC koppelen',
      ]}
    />
  )
}
