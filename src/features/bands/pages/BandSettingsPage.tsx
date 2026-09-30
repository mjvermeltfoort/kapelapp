import { useEffect, useState, type FormEvent } from 'react'
import { Alert } from '../../../components/Alert'
import { Badge } from '../../../components/Badge'
import { Button } from '../../../components/Button'
import { FormField, Input, Textarea } from '../../../components/FormField'
import { PageCard } from '../../../components/PageCard'
import { isAdminRole, formatRoleLabel } from '../../../lib/roles'
import { updateBand } from '../api/bands'
import { BandInstrumentsSection } from '../components/BandInstrumentsSection'
import { BandInviteSection } from '../components/BandInviteSection'
import { useBand } from '../hooks/useBand'
import { getErrorMessage } from '../../../lib/errors'

export function BandSettingsPage() {
  const { activeMembership, refreshBands } = useBand()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [showMemberResponses, setShowMemberResponses] = useState(false)
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [isSavingSettings, setIsSavingSettings] = useState(false)

  useEffect(() => {
    setName(activeMembership?.band.name ?? '')
    setDescription(activeMembership?.band.description ?? '')
    setShowMemberResponses(activeMembership?.band.show_member_responses ?? false)
  }, [activeMembership])

  const bandId = activeMembership?.band.id ?? ''
  const canManageBand = isAdminRole(activeMembership?.role ?? '')

  async function handleSettingsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!activeMembership || !isAdminRole(activeMembership.role)) {
      return
    }

    setSettingsMessage(null)
    setSettingsError(null)
    setIsSavingSettings(true)

    try {
      await updateBand({
        bandId: activeMembership.band.id,
        name,
        description,
        showMemberResponses,
      })
      await refreshBands()
      setSettingsMessage('Kapelinstellingen opgeslagen.')
    } catch (submitError) {
      setSettingsError(getErrorMessage(submitError, 'Opslaan mislukt.'))
    } finally {
      setIsSavingSettings(false)
    }
  }

  if (!activeMembership) {
    return (
      <PageCard title="Kapelinstellingen" backTo="/performances">
        <p>Kies eerst een actieve kapel.</p>
      </PageCard>
    )
  }

  return (
    <PageCard title="Kapelinstellingen" description="Pas naam, uitleg en zichtbaarheid van reacties aan." backTo="/performances">
      <div className="band-settings-header">
        <Badge tone={canManageBand ? 'brand' : 'neutral'}>{formatRoleLabel(activeMembership.role)}</Badge>
        <p className="muted-text">Actieve kapel: {activeMembership.band.name}</p>
      </div>

      {!canManageBand ? (
        <Alert tone="info">Alleen beheerders en eigenaren kunnen kapelinstellingen wijzigen.</Alert>
      ) : null}

      <form onSubmit={(event) => void handleSettingsSubmit(event)} className="performance-form">
        <section className="performance-form__section">
          <FormField label="Naam">
            <Input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={2}
              maxLength={120}
              disabled={!canManageBand}
            />
          </FormField>

          <FormField label="Beschrijving" hint="Zichtbaar voor leden in app">
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              disabled={!canManageBand}
              placeholder="Korte uitleg over kapel"
            />
          </FormField>
        </section>

        <section className="performance-form__section">
          <div className="band-toggle-card">
            <div>
              <strong>Leden mogen reacties van anderen zien</strong>
              <p className="muted-text">Handig voor afstemming rond optredens.</p>
            </div>

            <label className="band-switch">
              <input
                type="checkbox"
                checked={showMemberResponses}
                onChange={(event) => setShowMemberResponses(event.target.checked)}
                disabled={!canManageBand}
              />
              <span className={showMemberResponses ? 'band-switch__track band-switch__track--active' : 'band-switch__track'}>
                <span className="band-switch__thumb" />
              </span>
            </label>
          </div>
        </section>

        <Button type="submit" disabled={isSavingSettings || !canManageBand} fullWidth>
          {isSavingSettings ? 'Bezig met opslaan…' : 'Instellingen opslaan'}
        </Button>
      </form>

      {settingsMessage ? <Alert tone="success">{settingsMessage}</Alert> : null}
      {settingsError ? <Alert tone="error">{settingsError}</Alert> : null}

      {canManageBand ? <BandInviteSection key={`invite-${bandId}`} bandId={bandId} /> : null}
      {canManageBand ? <BandInstrumentsSection key={`instruments-${bandId}`} bandId={bandId} /> : null}
    </PageCard>
  )
}
