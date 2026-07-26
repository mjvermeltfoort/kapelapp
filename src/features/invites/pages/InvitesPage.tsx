import { FeaturePlaceholder } from '../../../components/FeaturePlaceholder'

export function InvitesPage() {
  return (
    <FeaturePlaceholder
      title="Uitnodigingslinks beheren"
      description="Schermskelet voor create, kopiëren, intrekken en gebruikstellerweergave."
      checklist={[
        'Actieve invites laden voor admin/owner',
        'Nieuwe invite genereren via RPC',
        'Intrekken via RPC',
        'Join-link kopieeractie toevoegen',
      ]}
    />
  )
}
