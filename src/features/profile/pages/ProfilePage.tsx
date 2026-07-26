import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../auth/hooks/useAuth'
import { PageCard } from '../../../components/PageCard'

export function ProfilePage() {
  const { profile, saveProfile, user } = useAuth()
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setDisplayName(profile?.display_name ?? '')
  }, [profile?.display_name])

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

  return (
    <PageCard
      title="Persoonlijk profiel"
      description="Beheer je weergavenaam en bekijk basisaccountgegevens."
    >
      <form onSubmit={(event) => void handleSubmit(event)}>
        <label>
          Weergavenaam
          <input
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            required
            minLength={2}
            maxLength={80}
          />
        </label>

        <button type="submit" disabled={isSaving}>
          {isSaving ? 'Bezig met opslaan…' : 'Opslaan'}
        </button>
      </form>

      {message ? <p>{message}</p> : null}
      {error ? <p role="alert">{error}</p> : null}

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
    </PageCard>
  )
}
