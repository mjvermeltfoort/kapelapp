import { FeaturePlaceholder } from '../../../components/FeaturePlaceholder'

export function BandSwitcherPage() {
  return (
    <FeaturePlaceholder
      title="Kapellenkiezer"
      description="Startpunt voor actieve kapelcontext en kapelwissel."
      checklist={[
        'Bands laden voor ingelogde gebruiker',
        'Actieve kapel bewaren in lokale state of localStorage',
        'Kapel aanmaken via RPC `create_band`',
        'Joinflow na uitnodigingsacceptatie koppelen',
      ]}
      links={[
        { to: '/performances', label: 'Ga naar optredens' },
        { to: '/settings/band', label: 'Kapelinstellingen' },
      ]}
    />
  )
}
