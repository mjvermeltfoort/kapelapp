import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageCard } from '../../../components/PageCard'
import { useAuth } from '../../auth/hooks/useAuth'

export function ProfileSetupPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { profile, saveProfile } = useAuth()
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setDisplayName(profile?.display_name ?? '')
  }, [profile?.display_name])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSaving(true)

    try {
      await saveProfile({ displayName })
      navigate(searchParams.get('next') || '/bands', { replace: true })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Opslaan mislukt.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="auth-page">
      <PageCard
        title="Eerste profielinstelling"
        description="Kies weergavenaam waarmee andere leden je zien."
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
              placeholder="Bijvoorbeeld: Mark Vermeltfoort"
            />
          </label>

          <button type="submit" disabled={isSaving}>
            {isSaving ? 'Bezig met opslaan…' : 'Profiel opslaan'}
          </button>
        </form>

        {error ? <p role="alert">{error}</p> : null}
      </PageCard>
    </main>
  )
}
