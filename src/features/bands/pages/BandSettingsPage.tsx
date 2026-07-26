import { useEffect, useState, type FormEvent } from 'react'
import { PageCard } from '../../../components/PageCard'
import { useBand } from '../hooks/useBand'
import { updateBand } from '../api/bands'

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

  async function handleSettingsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!activeMembership || !['admin', 'owner'].includes(activeMembership.role)) {
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
      setSettingsError(submitError instanceof Error ? submitError.message : 'Opslaan mislukt.')
    } finally {
      setIsSavingSettings(false)
    }
  }

  if (!activeMembership) {
    return (
      <PageCard title="Kapelinstellingen">
        <p>Kies eerst een actieve kapel.</p>
      </PageCard>
    )
  }

  const canManageBand = ['admin', 'owner'].includes(activeMembership.role)

  return (
    <PageCard title="Kapelinstellingen">
      {!canManageBand ? (
        <p className="alert alert--info">Alleen admins en owners kunnen kapelinstellingen wijzigen.</p>
      ) : null}

      <form onSubmit={(event) => void handleSettingsSubmit(event)}>
        <label>
          Naam
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            minLength={2}
            maxLength={120}
            disabled={!canManageBand}
          />
        </label>

        <label>
          Beschrijving
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            disabled={!canManageBand}
          />
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={showMemberResponses}
            onChange={(event) => setShowMemberResponses(event.target.checked)}
            disabled={!canManageBand}
          />
          <span>Leden mogen elkaars reactie-status zien</span>
        </label>

        <button type="submit" disabled={isSavingSettings || !canManageBand}>
          {isSavingSettings ? 'Bezig met opslaan…' : 'Instellingen opslaan'}
        </button>
      </form>

      {settingsMessage ? <p className="alert alert--success">{settingsMessage}</p> : null}
      {settingsError ? <p role="alert" className="alert alert--error">{settingsError}</p> : null}
    </PageCard>
  )
}
