import { useMemo, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Alert } from '../../../components/Alert'
import { Badge } from '../../../components/Badge'
import { Button } from '../../../components/Button'
import { EmptyState } from '../../../components/EmptyState'
import { FormField, Input } from '../../../components/FormField'
import { LoadingState } from '../../../components/LoadingState'
import { PageCard } from '../../../components/PageCard'
import { useBand } from '../../bands/hooks/useBand'
import { createBandInvite, listBandInvites, revokeBandInvite } from '../api/invites'

export function InvitesPage() {
  const { activeMembership } = useBand()
  const [expiresAt, setExpiresAt] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [latestJoinUrl, setLatestJoinUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canManageInvites = useMemo(
    () => ['admin', 'owner'].includes(activeMembership?.role ?? ''),
    [activeMembership?.role],
  )

  const invitesQuery = useQuery({
    queryKey: ['band-invites', activeMembership?.band.id],
    queryFn: async () => listBandInvites(activeMembership!.band.id),
    enabled: Boolean(activeMembership?.band.id && canManageInvites),
  })

  async function handleCreateInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!activeMembership || !canManageInvites) {
      return
    }

    setMessage(null)
    setError(null)
    setIsSubmitting(true)

    try {
      const result = await createBandInvite({
        bandId: activeMembership.band.id,
        expiresAt,
        maxUses,
      })

      const joinUrl = `${window.location.origin}/join/${result.token}`
      setLatestJoinUrl(joinUrl)

      try {
        await navigator.clipboard.writeText(joinUrl)
        setMessage('Uitnodigingslink aangemaakt en naar klembord gekopieerd.')
      } catch {
        setMessage('Uitnodigingslink aangemaakt. Kopieer de link handmatig hieronder.')
      }
      setExpiresAt('')
      setMaxUses('')
      await invitesQuery.refetch()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Invite aanmaken mislukt.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRevokeInvite(inviteId: string) {
    setMessage(null)
    setError(null)

    try {
      await revokeBandInvite(inviteId)
      setMessage('Uitnodiging ingetrokken.')
      await invitesQuery.refetch()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Intrekken mislukt.')
    }
  }

  if (!activeMembership) {
    return (
      <PageCard
        title="Uitnodigingslinks beheren"
        description="Kies eerst een actieve kapel."
      >
        <p>Ga eerst naar kapellenkiezer en selecteer een kapel.</p>
      </PageCard>
    )
  }

  return (
    <div className="page-grid">
      <PageCard
        title="Uitnodigingslinks"
        description="Maak een link voor nieuwe leden en deel die veilig met je kapel."
      >
        <div className="invite-header">
          <Badge tone="brand">Nieuwe leden</Badge>
          <p className="muted-text">Nieuwe links geven standaard rol member.</p>
        </div>

        {!canManageInvites ? <Alert tone="info">Alleen admins en owners kunnen uitnodigingen beheren.</Alert> : null}

        <form onSubmit={(event) => void handleCreateInvite(event)} className="performance-form">
          <section className="performance-form__section">
            <FormField label="Vervaldatum" hint="Optioneel">
              <Input
                type="datetime-local"
                value={expiresAt}
                onChange={(event) => setExpiresAt(event.target.value)}
                disabled={!canManageInvites}
              />
            </FormField>

            <FormField label="Maximaal aantal keer te gebruiken" hint="Leeg = onbeperkt">
              <Input
                type="number"
                min={1}
                step={1}
                value={maxUses}
                onChange={(event) => setMaxUses(event.target.value)}
                disabled={!canManageInvites}
                placeholder="Leeg = onbeperkt"
              />
            </FormField>
          </section>

          <Button type="submit" disabled={isSubmitting || !canManageInvites} fullWidth>
            {isSubmitting ? 'Bezig met aanmaken…' : 'Uitnodigingslink maken'}
          </Button>
        </form>

        {latestJoinUrl ? (
          <div className="invite-link-card">
            <FormField label="Laatst aangemaakte link">
              <Input type="text" value={latestJoinUrl} readOnly />
            </FormField>
          </div>
        ) : null}

        {message ? <Alert tone="success">{message}</Alert> : null}
        {error ? <Alert tone="error">{error}</Alert> : null}
      </PageCard>

      <PageCard
        title="Bestaande uitnodigingen"
        description="Actieve en ingetrokken links voor huidige kapel."
      >
        {invitesQuery.isLoading ? <LoadingState>Uitnodigingen worden geladen…</LoadingState> : null}
        {invitesQuery.error instanceof Error ? <Alert tone="error">{invitesQuery.error.message}</Alert> : null}

        {!invitesQuery.isLoading && !invitesQuery.data?.length ? (
          <EmptyState>Nog geen uitnodigingen aangemaakt.</EmptyState>
        ) : null}

        <div className="invite-list">
          {invitesQuery.data?.map((invite) => (
            <div key={invite.id} className="invite-card invite-card--enhanced">
              <div className="invite-card__content">
                <div className="invite-card__topline">
                  <strong>{invite.is_active ? 'Actieve link' : 'Ingetrokken link'}</strong>
                  <Badge tone={invite.is_active ? 'success' : 'neutral'}>
                    {invite.is_active ? 'Actief' : 'Ingetrokken'}
                  </Badge>
                </div>

                <div className="invite-card__details">
                  <div>
                    <span className="member-card__label">Gebruik</span>
                    <p>
                      {invite.use_count}
                      {invite.max_uses ? ` / ${invite.max_uses}` : ' · onbeperkt'}
                    </p>
                  </div>
                  <div>
                    <span className="member-card__label">Vervalt</span>
                    <p>{invite.expires_at ? new Date(invite.expires_at).toLocaleString() : 'Nooit'}</p>
                  </div>
                  <div>
                    <span className="member-card__label">Laatst gebruikt</span>
                    <p>{invite.last_used_at ? new Date(invite.last_used_at).toLocaleString() : 'Nog niet'}</p>
                  </div>
                  <div>
                    <span className="member-card__label">Gemaakt</span>
                    <p>{new Date(invite.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                variant="secondary"
                disabled={!invite.is_active || !canManageInvites}
                onClick={() => void handleRevokeInvite(invite.id)}
                fullWidth
              >
                Intrekken
              </Button>
            </div>
          ))}
        </div>
      </PageCard>
    </div>
  )
}
