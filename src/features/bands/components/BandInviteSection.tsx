import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert } from '../../../components/Alert'
import { Badge } from '../../../components/Badge'
import { Button } from '../../../components/Button'
import { FormField, Input } from '../../../components/FormField'
import { getErrorMessage } from '../../../lib/errors'
import { getCurrentBandInvite, regenerateBandInvite } from '../../invites/api/invites'
import { bandKeys } from '../queryKeys'

export function BandInviteSection({ bandId }: { bandId: string }) {
  const queryClient = useQueryClient()
  const [inviteMessage, setInviteMessage] = useState<string | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [isRegeneratingInvite, setIsRegeneratingInvite] = useState(false)
  const inviteQueryKey = bandKeys.currentInvite(bandId)

  const inviteQuery = useQuery({
    queryKey: inviteQueryKey,
    queryFn: async () => getCurrentBandInvite(bandId),
  })

  const joinUrl = inviteQuery.data ? `${window.location.origin}/join/${inviteQuery.data.token}` : ''

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
    setInviteMessage(null)
    setInviteError(null)
    setIsRegeneratingInvite(true)

    try {
      const invite = await regenerateBandInvite(bandId)
      const nextJoinUrl = `${window.location.origin}/join/${invite.token}`

      queryClient.setQueryData(inviteQueryKey, invite)

      try {
        await navigator.clipboard.writeText(nextJoinUrl)
        setInviteMessage('Nieuwe uitnodigingslink gemaakt, oude link ingetrokken en nieuwe link gekopieerd.')
      } catch {
        setInviteMessage('Nieuwe uitnodigingslink gemaakt en oude link ingetrokken.')
      }
    } catch (submitError) {
      setInviteError(getErrorMessage(submitError, 'Nieuwe link maken mislukt.'))
    } finally {
      setIsRegeneratingInvite(false)
    }
  }

  return (
    <section className="performance-form__section">
      <div className="invite-header">
        <Badge tone="brand">Nieuwe leden</Badge>
        <p className="muted-text">Deze link blijft geldig totdat je een nieuwe link genereert.</p>
      </div>

      {inviteQuery.error ? <Alert tone="error">{getErrorMessage(inviteQuery.error)}</Alert> : null}

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
  )
}
