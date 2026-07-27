import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Alert } from '../../../components/Alert'
import { Badge } from '../../../components/Badge'
import { Button } from '../../../components/Button'
import { EmptyState } from '../../../components/EmptyState'
import { FormField, Input, Select } from '../../../components/FormField'
import { PageCard } from '../../../components/PageCard'
import { useAuth } from '../../auth/hooks/useAuth'
import { listBandInstruments } from '../../bands/api/instruments'
import { useBand } from '../../bands/hooks/useBand'

export function ProfilePage() {
  const { profile, saveProfile, signOut, user } = useAuth()
  const { activeMembership, leaveActiveBand, refreshBands, saveMyInstrument } = useBand()
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [selectedInstrument, setSelectedInstrument] = useState('')
  const [customInstrument, setCustomInstrument] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [membershipError, setMembershipError] = useState<string | null>(null)
  const [membershipMessage, setMembershipMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingMembership, setIsSavingMembership] = useState(false)
  const [isLeavingBand, setIsLeavingBand] = useState(false)
  const [isConfirmingLeave, setIsConfirmingLeave] = useState(false)

  const instrumentsQuery = useQuery({
    queryKey: ['band-instruments', activeMembership?.band.id, false],
    queryFn: async () => listBandInstruments(activeMembership!.band.id),
    enabled: Boolean(activeMembership?.band.id),
  })

  useEffect(() => {
    setDisplayName(profile?.display_name ?? '')
  }, [profile?.display_name])

  const activeInstrumentNames = useMemo(
    () => (instrumentsQuery.data ?? []).map((instrument) => instrument.name),
    [instrumentsQuery.data],
  )

  useEffect(() => {
    const instrument = activeMembership?.instrument ?? ''

    if (!instrument) {
      setSelectedInstrument('')
      setCustomInstrument('')
      return
    }

    if (activeInstrumentNames.includes(instrument)) {
      setSelectedInstrument(instrument)
      setCustomInstrument('')
      return
    }

    setSelectedInstrument('anders')
    setCustomInstrument(instrument)
  }, [activeInstrumentNames, activeMembership?.instrument])

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
        instrument: selectedInstrument === 'anders' ? customInstrument : selectedInstrument,
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

    if (!isConfirmingLeave) {
      setIsConfirmingLeave(true)
      return
    }

    setIsConfirmingLeave(false)
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

  const profileName = profile?.display_name ?? 'Nog niet ingesteld'
  const profileEmail = profile?.email ?? user?.email ?? 'Onbekend'
  const initials = (profile?.display_name ?? user?.email ?? 'K').trim().slice(0, 1).toUpperCase()

  return (
    <div className="page-grid">
      <PageCard title="Profiel" description="Jouw account en persoonlijke gegevens.">
        <div className="profile-hero">
          <div className="profile-hero__avatar" aria-hidden="true">
            {initials}
          </div>
          <div className="profile-hero__content">
            <strong>{profileName}</strong>
            <p>{profileEmail}</p>
            <Badge tone="brand">Profiel</Badge>
          </div>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="performance-form">
          <section className="performance-form__section">
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
          </section>

          <Button type="submit" disabled={isSaving} fullWidth>
            {isSaving ? 'Bezig met opslaan…' : 'Opslaan'}
          </Button>
        </form>

        {message ? <Alert tone="success">{message}</Alert> : null}
        {error ? <Alert tone="error">{error}</Alert> : null}

        <Button type="button" variant="ghost" onClick={() => void signOut()} fullWidth>
          Uitloggen
        </Button>
      </PageCard>

      <PageCard title="Actieve kapel" description="Jouw rol en instellingen binnen huidige kapel.">
        {!activeMembership ? <EmptyState>Geen actieve kapel geselecteerd.</EmptyState> : null}

        {activeMembership ? (
          <>
            <div className="profile-band-header">
              <div>
                <strong>{activeMembership.band.name}</strong>
                <p className="muted-text">Werk hier je instrument en kapelgegevens bij.</p>
              </div>
              <Badge tone="brand">{formatRoleLabel(activeMembership.role)}</Badge>
            </div>

            <form onSubmit={(event) => void handleMembershipSubmit(event)} className="performance-form">
              <section className="performance-form__section">
                <FormField label="Instrument">
                  <Select
                    value={selectedInstrument}
                    onChange={(event) => setSelectedInstrument(event.target.value)}
                  >
                    <option value="">Geen instrument</option>
                    {activeInstrumentNames.map((instrument) => (
                      <option key={instrument} value={instrument}>
                        {instrument}
                      </option>
                    ))}
                    <option value="anders">Anders</option>
                  </Select>
                </FormField>

                {selectedInstrument === 'anders' ? (
                  <FormField label="Ander instrument">
                    <Input
                      type="text"
                      value={customInstrument}
                      onChange={(event) => setCustomInstrument(event.target.value)}
                      maxLength={80}
                      placeholder="Bijvoorbeeld: trompet"
                    />
                  </FormField>
                ) : null}
              </section>

              <Button type="submit" disabled={isSavingMembership} fullWidth>
                {isSavingMembership ? 'Bezig met opslaan…' : 'Instrument opslaan'}
              </Button>
            </form>

            {isConfirmingLeave ? (
              <div className="stack-sm">
                <p className="muted-text">Weet je zeker dat je {activeMembership.band.name} wilt verlaten?</p>
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => void handleLeaveBand()}
                  disabled={isLeavingBand}
                  fullWidth
                >
                  {isLeavingBand ? 'Kapel wordt verlaten…' : 'Ja, kapel verlaten'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsConfirmingLeave(false)}
                  disabled={isLeavingBand}
                  fullWidth
                >
                  Annuleren
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="danger"
                onClick={() => void handleLeaveBand()}
                disabled={isLeavingBand}
                fullWidth
              >
                Kapel verlaten
              </Button>
            )}

            {membershipMessage ? <Alert tone="success">{membershipMessage}</Alert> : null}
            {membershipError ? <Alert tone="error">{membershipError}</Alert> : null}
          </>
        ) : null}
      </PageCard>
    </div>
  )
}

function formatRoleLabel(role: 'member' | 'planner' | 'admin' | 'owner') {
  switch (role) {
    case 'member':
      return 'Lid'
    case 'planner':
      return 'Planner'
    case 'admin':
      return 'Admin'
    case 'owner':
      return 'Eigenaar'
  }
}
