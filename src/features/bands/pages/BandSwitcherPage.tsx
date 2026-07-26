import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { PageCard } from '../../../components/PageCard'
import { useBand } from '../hooks/useBand'

export function BandSwitcherPage() {
  const { activeBandId, memberships, isLoading, error, setActiveBandId, createOwnedBand } = useBand()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCreateError(null)
    setIsCreating(true)

    try {
      await createOwnedBand({ name, description })
      setName('')
      setDescription('')
    } catch (submitError) {
      setCreateError(submitError instanceof Error ? submitError.message : 'Kapel aanmaken mislukt.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="page-grid">
      <PageCard
        title="Kapellenkiezer"
        description="Kies actieve kapel voor volgende schermen. Nieuwe kapel wordt automatisch met owner-rol aangemaakt."
      >
        {isLoading ? <p>Kapellen worden geladen…</p> : null}
        {error ? <p role="alert">{error}</p> : null}

        {!isLoading && !memberships.length ? (
          <p>Je bent nog geen lid van een kapel. Maak eerste kapel aan of gebruik later een uitnodigingslink.</p>
        ) : null}

        <div className="stack-sm">
          {memberships.map((membership) => {
            const isActive = membership.band_id === activeBandId

            return (
              <button
                key={membership.id}
                type="button"
                className={isActive ? 'band-tile band-tile--active' : 'band-tile'}
                onClick={() => setActiveBandId(membership.band_id)}
              >
                <strong>{membership.band.name}</strong>
                <span>Rol: {membership.role}</span>
                <span>Instrument: {membership.instrument ?? 'Nog niet ingevuld'}</span>
              </button>
            )
          })}
        </div>

        {activeBandId ? (
          <div className="inline-links">
            <Link to="/performances">Ga naar optredens</Link>
            <Link to="/settings/band">Kapelinstellingen</Link>
          </div>
        ) : null}
      </PageCard>

      <PageCard
        title="Nieuwe kapel aanmaken"
        description="Maakt band en owner-lidmaatschap in één stap aan via database-RPC."
      >
        <form onSubmit={(event) => void handleSubmit(event)}>
          <label>
            Naam
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={2}
              maxLength={120}
              placeholder="Bijvoorbeeld: Kapel De Vooruitgang"
            />
          </label>

          <label>
            Beschrijving
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              placeholder="Optioneel"
            />
          </label>

          <button type="submit" disabled={isCreating}>
            {isCreating ? 'Kapel wordt aangemaakt…' : 'Kapel aanmaken'}
          </button>
        </form>

        {createError ? <p role="alert">{createError}</p> : null}
      </PageCard>
    </div>
  )
}
