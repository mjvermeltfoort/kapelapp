import { useMemo, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
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
        title="Nieuwe uitnodigingslink"
        description="Admins en owners kunnen leden met een veilige link laten deelnemen. Nieuwe links geven standaard rol member."
      >
        {!canManageInvites ? <p className="alert alert--info">Alleen admins en owners kunnen uitnodigingen beheren.</p> : null}

        <form onSubmit={(event) => void handleCreateInvite(event)}>
          <label>
            Vervaldatum
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
              disabled={!canManageInvites}
            />
          </label>

          <label>
            Maximaal aantal keer te gebruiken
            <input
              type="number"
              min={1}
              step={1}
              value={maxUses}
              onChange={(event) => setMaxUses(event.target.value)}
              disabled={!canManageInvites}
              placeholder="Leeg = onbeperkt"
            />
          </label>

          <button type="submit" disabled={isSubmitting || !canManageInvites}>
            {isSubmitting ? 'Bezig met aanmaken…' : 'Uitnodigingslink maken'}
          </button>
        </form>

        {latestJoinUrl ? (
          <label>
            Laatst aangemaakte link
            <input type="text" value={latestJoinUrl} readOnly />
          </label>
        ) : null}

        {message ? <p className="alert alert--success">{message}</p> : null}
        {error ? <p role="alert" className="alert alert--error">{error}</p> : null}
      </PageCard>

      <PageCard
        title="Bestaande uitnodigingen"
        description="Actieve en ingetrokken links voor huidige kapel. Token zelf wordt niet opnieuw getoond."
      >
        {invitesQuery.isLoading ? <p>Uitnodigingen worden geladen…</p> : null}
        {invitesQuery.error instanceof Error ? <p role="alert" className="alert alert--error">{invitesQuery.error.message}</p> : null}

        {!invitesQuery.isLoading && !invitesQuery.data?.length ? (
          <p>Nog geen uitnodigingen aangemaakt.</p>
        ) : null}

        <div className="stack-sm">
          {invitesQuery.data?.map((invite) => (
            <div key={invite.id} className="invite-card">
              <div>
                <strong>{invite.is_active ? 'Actief' : 'Ingetrokken'}</strong>
                <p>Gebruik: {invite.use_count}{invite.max_uses ? ` / ${invite.max_uses}` : ''}</p>
                <p>Vervalt: {invite.expires_at ? new Date(invite.expires_at).toLocaleString() : 'Niet'}</p>
                <p>
                  Laatst gebruikt:{' '}
                  {invite.last_used_at ? new Date(invite.last_used_at).toLocaleString() : 'Nog niet'}
                </p>
              </div>

              <button
                type="button"
                disabled={!invite.is_active || !canManageInvites}
                onClick={() => void handleRevokeInvite(invite.id)}
              >
                Intrekken
              </button>
            </div>
          ))}
        </div>
      </PageCard>
    </div>
  )
}
