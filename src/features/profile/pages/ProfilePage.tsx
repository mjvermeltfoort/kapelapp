import { useEffect, useState, type FormEvent } from 'react'
import { Alert } from '../../../components/Alert'
import { Button } from '../../../components/Button'
import { EmptyState } from '../../../components/EmptyState'
import { FormField, Input } from '../../../components/FormField'
import { PageCard } from '../../../components/PageCard'
import { useAuth } from '../../auth/hooks/useAuth'
import { useBand } from '../../bands/hooks/useBand'

export function ProfilePage() {
  const { profile, saveProfile, signOut, user } = useAuth()
  const { activeMembership, leaveActiveBand, refreshBands, saveMyInstrument } = useBand()
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [instrument, setInstrument] = useState(activeMembership?.instrument ?? '')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [membershipError, setMembershipError] = useState<string | null>(null)
  const [membershipMessage, setMembershipMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingMembership, setIsSavingMembership] = useState(false)
  const [isLeavingBand, setIsLeavingBand] = useState(false)

  useEffect(() => {
    setDisplayName(profile?.display_name ?? '')
  }, [profile?.display_name])

  useEffect(() => {
    setInstrument(activeMembership?.instrument ?? '')
  }, [activeMembership?.instrument])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setIsSaving(true)

    try {
      await saveProfile({ displayName })
      setMessage('Profiel opgeslagen.')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Opslaan mislukt.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleMembershipSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!activeMembership) {
      return
    }

    setMembershipError(null)
    setMembershipMessage(null)
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

    setMembershipError(null)
    setMembershipMessage(null)
    setIsLeavingBand(true)

    try {
      await leaveActiveBand()
    } catch (submitError) {
      setMembershipError(submitError instanceof Error ? submitError.message : 'Kapel verlaten mislukt.')
    } finally {
      setIsLeavingBand(false)
    }
  }

  return (
    <div className="page-grid">
      <PageCard title="Profiel">
        <form onSubmit={(event) => void handleSubmit(event)}>
          <FormField label="Weergavenaam">
            <Input
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
              minLength={2}
              maxLength={80}
            />
          </FormField>

          <Button type="submit" disabled={isSaving} fullWidth>
            {isSaving ? 'Bezig met opslaan…' : 'Opslaan'}
          </Button>
        </form>

        {message ? <Alert tone="success">{message}</Alert> : null}
        {error ? <Alert tone="error">{error}</Alert> : null}

        <dl>
          <div>
            <dt>E-mailadres</dt>
            <dd>{profile?.email ?? user?.email ?? 'Onbekend'}</dd>
          </div>
          <div>
            <dt>Weergavenaam</dt>
            <dd>{profile?.display_name ?? 'Nog niet ingesteld'}</dd>
          </div>
          <div>
            <dt>Gebruikers-ID</dt>
            <dd>{user?.id ?? 'Onbekend'}</dd>
          </div>
        </dl>

        <Button type="button" variant="ghost" onClick={() => void signOut()} fullWidth>
          Uitloggen
        </Button>
      </PageCard>

      <PageCard title="Actieve kapel">
        {!activeMembership ? <EmptyState>Geen actieve kapel geselecteerd.</EmptyState> : null}

        {activeMembership ? (
          <>
            <form onSubmit={(event) => void handleMembershipSubmit(event)}>
              <FormField label="Instrument">
                <Input
                  type="text"
                  value={instrument}
                  onChange={(event) => setInstrument(event.target.value)}
                  maxLength={80}
                  placeholder="Bijvoorbeeld: trompet"
                />
              </FormField>

              <Button type="submit" disabled={isSavingMembership} fullWidth>
                {isSavingMembership ? 'Bezig met opslaan…' : 'Instrument opslaan'}
              </Button>
            </form>

            <dl>
              <div>
                <dt>Kapel</dt>
                <dd>{activeMembership.band.name}</dd>
              </div>
              <div>
                <dt>Rol</dt>
                <dd>{activeMembership.role}</dd>
              </div>
              <div>
                <dt>Instrument</dt>
                <dd>{activeMembership.instrument ?? 'Nog niet ingevuld'}</dd>
              </div>
            </dl>

            <Button
              type="button"
              variant="danger"
              onClick={() => void handleLeaveBand()}
              disabled={isLeavingBand}
              fullWidth
            >
              {isLeavingBand ? 'Kapel wordt verlaten…' : 'Kapel verlaten'}
            </Button>

            {membershipMessage ? <Alert tone="success">{membershipMessage}</Alert> : null}
            {membershipError ? <Alert tone="error">{membershipError}</Alert> : null}
          </>
        ) : null}
      </PageCard>
    </div>
  )
}
