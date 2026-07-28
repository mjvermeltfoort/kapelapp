import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert } from '../../../components/Alert'
import { Badge } from '../../../components/Badge'
import { Button } from '../../../components/Button'
import { FormField, Input, Textarea } from '../../../components/FormField'
import { PageCard } from '../../../components/PageCard'
import { isAdminRole } from '../../../lib/roles'
import { getCurrentBandInvite, regenerateBandInvite } from '../../invites/api/invites'
import { listBandMembers } from '../../members/api/members'
import { createBandInstrument, deactivateBandInstrument, listBandInstruments, updateBandInstrument } from '../api/instruments'
import { updateBand } from '../api/bands'
import { useBand } from '../hooks/useBand'

export function BandSettingsPage() {
  const queryClient = useQueryClient()
  const { activeMembership, refreshBands } = useBand()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [showMemberResponses, setShowMemberResponses] = useState(false)
  const [newInstrumentName, setNewInstrumentName] = useState('')
  const [editingInstrumentId, setEditingInstrumentId] = useState<string | null>(null)
  const [editingInstrumentName, setEditingInstrumentName] = useState('')
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [inviteMessage, setInviteMessage] = useState<string | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [instrumentMessage, setInstrumentMessage] = useState<string | null>(null)
  const [instrumentError, setInstrumentError] = useState<string | null>(null)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [isRegeneratingInvite, setIsRegeneratingInvite] = useState(false)
  const [isSavingInstrument, setIsSavingInstrument] = useState(false)

  useEffect(() => {
    setName(activeMembership?.band.name ?? '')
    setDescription(activeMembership?.band.description ?? '')
    setShowMemberResponses(activeMembership?.band.show_member_responses ?? false)
    setInviteMessage(null)
    setInviteError(null)
  }, [activeMembership])

  const bandId = activeMembership?.band.id ?? ''
  const canManageBand = isAdminRole(activeMembership?.role ?? '')
  const inviteQueryKey = ['current-band-invite', bandId]
  const instrumentQueryKey = ['band-instruments', bandId, true]

  const inviteQuery = useQuery({
    queryKey: inviteQueryKey,
    queryFn: async () => getCurrentBandInvite(bandId),
    enabled: canManageBand && Boolean(bandId),
  })

  const instrumentsQuery = useQuery({
    queryKey: instrumentQueryKey,
    queryFn: async () => listBandInstruments(bandId, true),
    enabled: canManageBand && Boolean(bandId),
  })

  const membersQuery = useQuery({
    queryKey: ['band-members', bandId],
    queryFn: async () => listBandMembers(bandId),
    enabled: canManageBand && Boolean(bandId),
  })

  const existingInstrumentNames = useMemo(
    () => new Set((instrumentsQuery.data ?? []).map((instrument) => normalizeInstrumentName(instrument.name))),
    [instrumentsQuery.data],
  )

  const missingMemberInstruments = useMemo(() => {
    const seen = new Set<string>()

    return (membersQuery.data ?? [])
      .filter((member) => member.is_active && member.instrument?.trim())
      .map((member) => member.instrument!.trim())
      .filter((instrument) => {
        const normalized = normalizeInstrumentName(instrument)
        if (existingInstrumentNames.has(normalized) || seen.has(normalized)) {
          return false
        }

        seen.add(normalized)
        return true
      })
  }, [existingInstrumentNames, membersQuery.data])

  const joinUrl = inviteQuery.data ? `${window.location.origin}/join/${inviteQuery.data.token}` : ''

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

  async function handleCopyInviteLink() {
    if (!joinUrl) {
      return
    }

    setInviteMessage(null)
    setInviteError(null)

    try {
      await navigator.clipboard.writeText(joinUrl)
      setInviteMessage('Uitnodigingslink gekopieerd.')
    } catch {
      setInviteError('Kopiëren mislukt. Kopieer de link handmatig.')
    }
  }

  async function handleRegenerateInvite() {
    if (!canManageBand) {
      return
    }

    setInviteMessage(null)
    setInviteError(null)
    setIsRegeneratingInvite(true)

    try {
      const invite = await regenerateBandInvite(activeMembership!.band.id)
      const nextJoinUrl = `${window.location.origin}/join/${invite.token}`

      queryClient.setQueryData(inviteQueryKey, invite)

      try {
        await navigator.clipboard.writeText(nextJoinUrl)
        setInviteMessage('Nieuwe uitnodigingslink gemaakt, oude link ingetrokken en nieuwe link gekopieerd.')
      } catch {
        setInviteMessage('Nieuwe uitnodigingslink gemaakt en oude link ingetrokken.')
      }
    } catch (submitError) {
      setInviteError(submitError instanceof Error ? submitError.message : 'Nieuwe link maken mislukt.')
    } finally {
      setIsRegeneratingInvite(false)
    }
  }

  async function handleAddInstrument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canManageBand) {
      return
    }

    await addInstrument(newInstrumentName, () => setNewInstrumentName(''))
  }

  async function handleAddMissingInstrument(instrumentName: string) {
    await addInstrument(instrumentName)
  }

  async function addInstrument(instrumentName: string, onSuccess?: () => void) {
    if (!canManageBand) {
      return
    }

    setInstrumentMessage(null)
    setInstrumentError(null)
    setIsSavingInstrument(true)

    try {
      await createBandInstrument(activeMembership!.band.id, instrumentName)
      await queryClient.invalidateQueries({ queryKey: instrumentQueryKey })
      onSuccess?.()
      setInstrumentMessage('Instrument toegevoegd.')
    } catch (submitError) {
      setInstrumentError(submitError instanceof Error ? submitError.message : 'Instrument toevoegen mislukt.')
    } finally {
      setIsSavingInstrument(false)
    }
  }

  async function handleSaveInstrument(instrumentId: string) {
    setInstrumentMessage(null)
    setInstrumentError(null)
    setIsSavingInstrument(true)

    try {
      await updateBandInstrument(instrumentId, editingInstrumentName)
      setEditingInstrumentId(null)
      setEditingInstrumentName('')
      await queryClient.invalidateQueries({ queryKey: instrumentQueryKey })
      setInstrumentMessage('Instrument bijgewerkt.')
    } catch (submitError) {
      setInstrumentError(submitError instanceof Error ? submitError.message : 'Instrument bijwerken mislukt.')
    } finally {
      setIsSavingInstrument(false)
    }
  }

  async function handleDeactivateInstrument(instrumentId: string) {
    setInstrumentMessage(null)
    setInstrumentError(null)
    setIsSavingInstrument(true)

    try {
      await deactivateBandInstrument(instrumentId)
      await queryClient.invalidateQueries({ queryKey: instrumentQueryKey })
      setInstrumentMessage('Instrument gedeactiveerd.')
    } catch (submitError) {
      setInstrumentError(submitError instanceof Error ? submitError.message : 'Instrument deactiveren mislukt.')
    } finally {
      setIsSavingInstrument(false)
    }
  }

  return (
    <PageCard title="Kapelinstellingen" description="Pas naam, uitleg en zichtbaarheid van reacties aan.">
      <div className="band-settings-header">
        <Badge tone={canManageBand ? 'brand' : 'neutral'}>{activeMembership.role}</Badge>
        <p className="muted-text">Actieve kapel: {activeMembership.band.name}</p>
      </div>

      {!canManageBand ? (
        <Alert tone="info">Alleen admins en owners kunnen kapelinstellingen wijzigen.</Alert>
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

      {canManageBand ? (
        <section className="performance-form__section">
          <div className="invite-header">
            <Badge tone="brand">Nieuwe leden</Badge>
            <p className="muted-text">Deze link blijft geldig totdat je een nieuwe link genereert.</p>
          </div>

          {inviteQuery.error instanceof Error ? <Alert tone="error">{inviteQuery.error.message}</Alert> : null}

          <div className="invite-link-card">
            <FormField label="Actieve uitnodigingslink">
              <Input
                type="text"
                value={joinUrl}
                readOnly
                disabled={inviteQuery.isLoading || isRegeneratingInvite}
                placeholder="Uitnodigingslink wordt klaargezet…"
              />
            </FormField>

            <p className="muted-text">Regenereren maakt oude link direct ongeldig.</p>
          </div>

          <div className="performance-form__footer">
            <Button
              type="button"
              variant="secondary"
              onClick={() => void handleCopyInviteLink()}
              disabled={!joinUrl || inviteQuery.isLoading || isRegeneratingInvite}
              fullWidth
            >
              Link kopiëren
            </Button>
            <Button
              type="button"
              onClick={() => void handleRegenerateInvite()}
              disabled={inviteQuery.isLoading || isRegeneratingInvite}
              fullWidth
            >
              {isRegeneratingInvite ? 'Nieuwe link maken…' : 'Nieuwe link genereren'}
            </Button>
          </div>

          {inviteMessage ? <Alert tone="success">{inviteMessage}</Alert> : null}
          {inviteError ? <Alert tone="error">{inviteError}</Alert> : null}
        </section>
      ) : null}

      {canManageBand ? (
        <section className="performance-form__section">
          <div className="invite-header">
            <Badge tone="brand">Instrumenten</Badge>
            <p className="muted-text">Beheer actieve instrumenten voor deze kapel.</p>
          </div>

          <form onSubmit={(event) => void handleAddInstrument(event)} className="performance-form">
            <FormField label="Nieuw instrument">
              <Input
                type="text"
                value={newInstrumentName}
                onChange={(event) => setNewInstrumentName(event.target.value)}
                maxLength={80}
                placeholder="Bijvoorbeeld: Trompet"
              />
            </FormField>
            <Button type="submit" disabled={isSavingInstrument} fullWidth>
              Instrument toevoegen
            </Button>
          </form>

          {instrumentMessage ? <Alert tone="success">{instrumentMessage}</Alert> : null}
          {instrumentError ? <Alert tone="error">{instrumentError}</Alert> : null}
          {membersQuery.error instanceof Error ? <Alert tone="error">{membersQuery.error.message}</Alert> : null}

          {missingMemberInstruments.length ? (
            <div className="members-list">
              {missingMemberInstruments.map((instrumentName) => (
                <div key={instrumentName} className="member-card member-card--enhanced">
                  <div className="member-card__topline">
                    <strong>{instrumentName}</strong>
                    <Badge tone="warning">Nog niet in lijst</Badge>
                  </div>
                  <p className="muted-text">Gebruikt door leden, maar nog niet toegevoegd aan instrumentenlijst.</p>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isSavingInstrument}
                    onClick={() => void handleAddMissingInstrument(instrumentName)}
                    fullWidth
                  >
                    Toevoegen aan lijst
                  </Button>
                </div>
              ))}
            </div>
          ) : null}

          <div className="members-list">
            {instrumentsQuery.data?.map((instrument) => (
              <div key={instrument.id} className="member-card member-card--enhanced">
                <div className="member-card__topline">
                  <strong>{instrument.name}</strong>
                  <Badge tone={instrument.is_active ? 'success' : 'neutral'}>
                    {instrument.is_active ? 'Actief' : 'Inactief'}
                  </Badge>
                </div>

                {editingInstrumentId === instrument.id ? (
                  <div className="member-card__button-stack">
                    <FormField label="Instrumentnaam">
                      <Input
                        type="text"
                        value={editingInstrumentName}
                        onChange={(event) => setEditingInstrumentName(event.target.value)}
                        maxLength={80}
                      />
                    </FormField>
                    <Button type="button" disabled={isSavingInstrument} onClick={() => void handleSaveInstrument(instrument.id)} fullWidth>
                      Opslaan
                    </Button>
                    <Button type="button" variant="ghost" disabled={isSavingInstrument} onClick={() => setEditingInstrumentId(null)} fullWidth>
                      Annuleren
                    </Button>
                  </div>
                ) : (
                  <div className="member-card__button-stack" role="group" aria-label={`Acties voor instrument ${instrument.name}`}>
                    {instrument.is_active ? (
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={isSavingInstrument}
                        onClick={() => {
                          setEditingInstrumentId(instrument.id)
                          setEditingInstrumentName(instrument.name)
                        }}
                        fullWidth
                      >
                        Naam wijzigen
                      </Button>
                    ) : null}
                    {instrument.is_active ? (
                      <Button
                        type="button"
                        variant="danger"
                        disabled={isSavingInstrument}
                        onClick={() => void handleDeactivateInstrument(instrument.id)}
                        fullWidth
                      >
                        Deactiveren
                      </Button>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </PageCard>
  )
}

function normalizeInstrumentName(name: string) {
  return name.trim().toLowerCase()
}
