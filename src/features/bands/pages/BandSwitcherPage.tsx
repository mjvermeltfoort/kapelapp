import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '../../../components/Alert'
import { Badge } from '../../../components/Badge'
import { Button } from '../../../components/Button'
import { EmptyState } from '../../../components/EmptyState'
import { FormField, Input, Textarea } from '../../../components/FormField'
import { LoadingState } from '../../../components/LoadingState'
import { PageCard } from '../../../components/PageCard'
import { useBand } from '../hooks/useBand'

export function BandSwitcherPage() {
  const { activeBandId, memberships, isLoading, error, setActiveBandId, createOwnedBand } = useBand()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)
  const [createMessage, setCreateMessage] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCreateError(null)
    setCreateMessage(null)
    setIsCreating(true)

    try {
      await createOwnedBand({ name, description })
      setName('')
      setDescription('')
      setCreateMessage('Kapel aangemaakt en als actieve kapel geselecteerd.')
    } catch (submitError) {
      setCreateError(submitError instanceof Error ? submitError.message : 'Kapel aanmaken mislukt.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="page-grid">
      <PageCard title="Kapel" description="Kies je actieve kapel of maak een nieuwe aan.">
        <div className="band-overview-header">
          <Badge tone="brand">{memberships.length} kapel{memberships.length === 1 ? '' : 'len'}</Badge>
          <p className="muted-text">Je wisselt hier welke kapel actief is in app.</p>
        </div>

        {isLoading ? <LoadingState>Kapellen worden geladen…</LoadingState> : null}
        {error ? <Alert tone="error">{error}</Alert> : null}

        {!isLoading && !memberships.length ? (
          <EmptyState>Je bent nog geen lid van een kapel. Maak eerste kapel aan of gebruik later een uitnodigingslink.</EmptyState>
        ) : null}

        <div className="band-list">
          {memberships.map((membership) => {
            const isActive = membership.band_id === activeBandId

            return (
              <button
                key={membership.id}
                type="button"
                className={isActive ? 'band-tile band-tile--active band-tile--enhanced' : 'band-tile band-tile--enhanced'}
                onClick={() => setActiveBandId(membership.band_id)}
              >
                <div className="band-tile__topline">
                  <strong>{membership.band.name}</strong>
                  <Badge tone={isActive ? 'brand' : 'neutral'}>
                    {isActive ? 'Actief' : 'Selecteren'}
                  </Badge>
                </div>
                <span>{membership.band.description ?? 'Geen beschrijving toegevoegd'}</span>
                <div className="band-tile__meta-row">
                  <span>Rol: {membership.role}</span>
                  <span>Instrument: {membership.instrument ?? 'Niet ingevuld'}</span>
                </div>
              </button>
            )
          })}
        </div>

        {activeBandId ? (
          <div className="band-link-grid">
            <Link to="/performances" className="performance-secondary-link">
              Ga naar optredens
            </Link>
            <Link to="/settings/band" className="performance-secondary-link">
              Kapelinstellingen
            </Link>
          </div>
        ) : null}
      </PageCard>

      <PageCard
        title="Nieuwe kapel aanmaken"
        description="Handig als startpunt wanneer je nog geen uitnodigingslink hebt."
      >
        <form onSubmit={(event) => void handleSubmit(event)} className="performance-form">
          <FormField label="Naam">
            <Input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={2}
              maxLength={120}
              placeholder="Bijvoorbeeld: Kapel De Vooruitgang"
            />
          </FormField>

          <FormField label="Beschrijving" hint="Optioneel">
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              placeholder="Korte uitleg over kapel"
            />
          </FormField>

          <Button type="submit" disabled={isCreating} fullWidth>
            {isCreating ? 'Kapel wordt aangemaakt…' : 'Kapel aanmaken'}
          </Button>
        </form>

        {createMessage ? <Alert tone="success">{createMessage}</Alert> : null}
        {createError ? <Alert tone="error">{createError}</Alert> : null}
      </PageCard>
    </div>
  )
}
