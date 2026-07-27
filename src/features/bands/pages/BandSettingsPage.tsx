import { useEffect, useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert } from '../../../components/Alert'
import { Badge } from '../../../components/Badge'
import { Button } from '../../../components/Button'
import { FormField, Input, Textarea } from '../../../components/FormField'
import { PageCard } from '../../../components/PageCard'
import { isAdminRole } from '../../../lib/roles'
import { getCurrentBandInvite, regenerateBandInvite } from '../../invites/api/invites'
import { updateBand } from '../api/bands'
import { useBand } from '../hooks/useBand'

export function BandSettingsPage() {
  const queryClient = useQueryClient()
  const { activeMembership, refreshBands } = useBand()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [showMemberResponses, setShowMemberResponses] = useState(false)
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [inviteMessage, setInviteMessage] = useState<string | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [isRegeneratingInvite, setIsRegeneratingInvite] = useState(false)

  useEffect(() => {
    setName(activeMembership?.band.name ?? '')
    setDescription(activeMembership?.band.description ?? '')
    setShowMemberResponses(activeMembership?.band.show_member_responses ?? false)
    setInviteMessage(null)
    setInviteError(null)
  }, [activeMembership])

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

  const bandId = activeMembership?.band.id ?? ''
  const canManageBand = isAdminRole(activeMembership?.role ?? '')
  const inviteQueryKey = ['current-band-invite', bandId]
  const inviteQuery = useQuery({
    queryKey: inviteQueryKey,
    queryFn: async () => getCurrentBandInvite(bandId),
    enabled: canManageBand && Boolean(bandId),
  })
  const joinUrl = inviteQuery.data ? `${window.location.origin}/join/${inviteQuery.data.token}` : ''

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
    if (!activeMembership || !canManageBand) {
      return
    }

    setInviteMessage(null)
    setInviteError(null)
    setIsRegeneratingInvite(true)

    try {
      const invite = await regenerateBandInvite(activeMembership.band.id)
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
    </PageCard>
  )
}
