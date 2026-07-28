import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageCard } from '../../../components/PageCard'
import { useAuth } from '../../auth/hooks/useAuth'
import { useBand } from '../../bands/hooks/useBand'
import { acceptBandInvite, getJoinInvitePreview } from '../api/invites'

export function JoinInvitePage() {
  const navigate = useNavigate()
  const { token } = useParams()
  const { user } = useAuth()
  const { refreshBands, setActiveBandId } = useBand()
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isAccepting, setIsAccepting] = useState(false)

  const previewQuery = useQuery({
    queryKey: ['join-invite-preview', token],
    queryFn: async () => getJoinInvitePreview(token ?? ''),
    enabled: Boolean(token),
  })

  const loginUrl = useMemo(() => {
    const redirectTo = `/join/${token ?? ''}`
    return `/login?redirectTo=${encodeURIComponent(redirectTo)}`
  }, [token])

  async function handleAcceptInvite() {
    if (!token) {
      return
    }

    setError(null)
    setMessage(null)
    setIsAccepting(true)

    try {
      const result = await acceptBandInvite(token)
      await refreshBands()
      setActiveBandId(result.band_id)
      setMessage(
        result.membership_status === 'already_active'
          ? `Je bent al lid van ${result.band_name}.`
          : `Je bent toegevoegd aan ${result.band_name}.`,
      )
      navigate('/bands', { replace: true })
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Uitnodiging accepteren mislukt.',
      )
    } finally {
      setIsAccepting(false)
    }
  }

  return (
    <main className="auth-page">
      <PageCard
        title="Uitnodiging accepteren"
        description="Controleer uitnodiging en meld je daarna aan bij kapel."
        backTo="/login"
      >
        {previewQuery.isLoading ? <p>Uitnodiging wordt gecontroleerd…</p> : null}
        {previewQuery.error instanceof Error ? <p role="alert">{previewQuery.error.message}</p> : null}

        {previewQuery.data ? (
          <>
            <p>Kapel: {previewQuery.data.band_name ?? 'Onbekend'}</p>
            <p>Status: {statusLabel(previewQuery.data.status)}</p>
          </>
        ) : null}

        {!user ? (
          <a href={loginUrl}>Log in om deze uitnodiging te accepteren</a>
        ) : null}

        {user && previewQuery.data?.status === 'valid' ? (
          <button type="button" disabled={isAccepting} onClick={() => void handleAcceptInvite()}>
            {isAccepting ? 'Bezig met accepteren…' : 'Word lid van deze kapel'}
          </button>
        ) : null}

        {message ? <p>{message}</p> : null}
        {error ? <p role="alert">{error}</p> : null}
      </PageCard>
    </main>
  )
}

function statusLabel(status: 'valid' | 'invalid' | 'expired' | 'revoked' | 'exhausted') {
  switch (status) {
    case 'valid':
      return 'Geldig'
    case 'expired':
      return 'Verlopen'
    case 'revoked':
      return 'Ingetrokken'
    case 'exhausted':
      return 'Maximum bereikt'
    default:
      return 'Ongeldig'
  }
}
