import { useEffect, useState, type FormEvent } from 'react'
import { PageCard } from '../../../components/PageCard'
import { useBand } from '../hooks/useBand'
import { updateBand } from '../api/bands'

export function BandSettingsPage() {
  const { activeMembership, leaveActiveBand, refreshBands, saveMyInstrument } = useBand()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [instrument, setInstrument] = useState('')
  const [showMemberResponses, setShowMemberResponses] = useState(false)
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [membershipMessage, setMembershipMessage] = useState<string | null>(null)
  const [membershipError, setMembershipError] = useState<string | null>(null)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [isSavingMembership, setIsSavingMembership] = useState(false)
  const [isLeavingBand, setIsLeavingBand] = useState(false)

  useEffect(() => {
    setName(activeMembership?.band.name ?? '')
    setDescription(activeMembership?.band.description ?? '')
    setInstrument(activeMembership?.instrument ?? '')
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

  async function handleMembershipSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!activeMembership) {
      return
    }

    setMembershipMessage(null)
    setMembershipError(null)
    setIsSavingMembership(true)

    try {
      await saveMyInstrument({
        bandId: activeMembership.band.id,
        instrument,
      })
      await refreshBands()
      setMembershipMessage('Instrument opgeslagen.')
    } catch (submitError) {
      setMembershipError(submitError instanceof Error ? submitError.message : 'Opslaan mislukt.')
    } finally {
      setIsSavingMembership(false)
    }
  }

  async function handleLeaveBand() {
    if (!activeMembership) {
      return
    }

    const confirmed = window.confirm(
      `Weet je zeker dat je ${activeMembership.band.name} wilt verlaten?`,
    )

    if (!confirmed) {
      return
    }

    setMembershipMessage(null)
    setMembershipError(null)
    setIsLeavingBand(true)

    try {
      await leaveActiveBand()
    } catch (submitError) {
      setMembershipError(submitError instanceof Error ? submitError.message : 'Kapel verlaten mislukt.')
    } finally {
      setIsLeavingBand(false)
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
    <div className="page-grid">
      <PageCard
        title="Kapelinstellingen"
        description="Basisbeheer voor naam, beschrijving en zichtbaarheid van onderlinge reacties."
      >
        {!canManageBand ? (
          <p>Alleen admins en owners kunnen kapelinstellingen wijzigen.</p>
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

        {settingsMessage ? <p>{settingsMessage}</p> : null}
        {settingsError ? <p role="alert">{settingsError}</p> : null}
      </PageCard>

      <PageCard
        title="Mijn lidmaatschap"
        description="Beheer je instrument per kapel en verlaat kapel indien nodig."
      >
        <form onSubmit={(event) => void handleMembershipSubmit(event)}>
          <label>
            Instrument
            <input
              type="text"
              value={instrument}
              onChange={(event) => setInstrument(event.target.value)}
              maxLength={80}
              placeholder="Bijvoorbeeld: trompet"
            />
          </label>

          <button type="submit" disabled={isSavingMembership}>
            {isSavingMembership ? 'Bezig met opslaan…' : 'Instrument opslaan'}
          </button>
        </form>

        <dl>
          <div>
            <dt>Jouw rol</dt>
            <dd>{activeMembership.role}</dd>
          </div>
          <div>
            <dt>Huidig instrument</dt>
            <dd>{activeMembership.instrument ?? 'Nog niet ingevuld'}</dd>
          </div>
        </dl>

        <button
          type="button"
          className="danger-button"
          onClick={() => void handleLeaveBand()}
          disabled={isLeavingBand}
        >
          {isLeavingBand ? 'Kapel wordt verlaten…' : 'Kapel verlaten'}
        </button>

        <p className="muted-text">
          Als je enige owner bent, wordt verlaten door backend geblokkeerd.
        </p>

        {membershipMessage ? <p>{membershipMessage}</p> : null}
        {membershipError ? <p role="alert">{membershipError}</p> : null}
      </PageCard>
    </div>
  )
}
