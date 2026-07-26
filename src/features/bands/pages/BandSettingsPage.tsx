import { useEffect, useState, type FormEvent } from 'react'
import { PageCard } from '../../../components/PageCard'
import { useBand } from '../hooks/useBand'
import { updateBand } from '../api/bands'

export function BandSettingsPage() {
  const { activeMembership, refreshBands } = useBand()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [showMemberResponses, setShowMemberResponses] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setName(activeMembership?.band.name ?? '')
    setDescription(activeMembership?.band.description ?? '')
    setShowMemberResponses(activeMembership?.band.show_member_responses ?? false)
  }, [activeMembership])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!activeMembership || !['admin', 'owner'].includes(activeMembership.role)) {
      return
    }

    setMessage(null)
    setError(null)
    setIsSaving(true)

    try {
      await updateBand({
        bandId: activeMembership.band.id,
        name,
        description,
        showMemberResponses,
      })
      await refreshBands()
      setMessage('Kapelinstellingen opgeslagen.')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Opslaan mislukt.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!activeMembership) {
    return (
      <PageCard
        title="Kapelinstellingen"
        description="Kies eerst een actieve kapel voordat je instellingen kunt beheren."
      >
        <p>Ga eerst naar kapellenkiezer en selecteer of maak een kapel.</p>
      </PageCard>
    )
  }

  const canManageBand = ['admin', 'owner'].includes(activeMembership.role)

  return (
    <PageCard
      title="Kapelinstellingen"
      description="Basisbeheer voor naam, beschrijving en zichtbaarheid van onderlinge reacties."
    >
      {!canManageBand ? (
        <p>Alleen admins en owners kunnen kapelinstellingen wijzigen.</p>
      ) : null}

      <form onSubmit={(event) => void handleSubmit(event)}>
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

        <button type="submit" disabled={isSaving || !canManageBand}>
          {isSaving ? 'Bezig met opslaan…' : 'Instellingen opslaan'}
        </button>
      </form>

      <dl>
        <div>
          <dt>Jouw rol</dt>
          <dd>{activeMembership.role}</dd>
        </div>
        <div>
          <dt>Instrument</dt>
          <dd>{activeMembership.instrument ?? 'Nog niet ingevuld'}</dd>
        </div>
      </dl>

      {message ? <p>{message}</p> : null}
      {error ? <p role="alert">{error}</p> : null}
    </PageCard>
  )
}
