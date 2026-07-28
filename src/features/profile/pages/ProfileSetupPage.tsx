import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageCard } from '../../../components/PageCard'
import { FormField, Input, Select } from '../../../components/FormField'
import { LoadingState } from '../../../components/LoadingState'
import { useAuth } from '../../auth/hooks/useAuth'
import { listBandInstruments } from '../../bands/api/instruments'
import { useBand } from '../../bands/hooks/useBand'

export function ProfileSetupPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { profile, saveProfile } = useAuth()
  const { activeMembership, refreshBands, saveMyInstrument } = useBand()
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [selectedInstrument, setSelectedInstrument] = useState('')
  const [customInstrument, setCustomInstrument] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const instrumentsQuery = useQuery({
    queryKey: ['band-instruments', activeMembership?.band.id, true],
    queryFn: async () => listBandInstruments(activeMembership!.band.id),
    enabled: Boolean(activeMembership?.band.id),
  })

  const activeInstrumentNames = useMemo(
    () => (instrumentsQuery.data ?? []).map((instrument) => instrument.name),
    [instrumentsQuery.data],
  )

  useEffect(() => {
    setDisplayName(profile?.display_name ?? '')
  }, [profile?.display_name])

  useEffect(() => {
    const instrument = activeMembership?.instrument ?? ''

    if (!instrument) {
      setSelectedInstrument('')
      setCustomInstrument('')
      return
    }

    const matchingInstrument = activeInstrumentNames.find(
      (name) => normalizeInstrumentName(name) === normalizeInstrumentName(instrument),
    )

    if (matchingInstrument) {
      setSelectedInstrument(matchingInstrument)
      setCustomInstrument('')
      return
    }

    setSelectedInstrument('anders')
    setCustomInstrument(instrument)
  }, [activeInstrumentNames, activeMembership?.instrument])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSaving(true)

    try {
      await saveProfile({ displayName })

      if (activeMembership) {
        const instrument = selectedInstrument === 'anders' ? customInstrument.trim() : selectedInstrument

        if (!instrument) {
          setError('Kies je instrument.')
          return
        }

        await saveMyInstrument({
          bandId: activeMembership.band.id,
          instrument,
        })
        await refreshBands()
      }

      navigate(searchParams.get('next') || '/', { replace: true })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Opslaan mislukt.')
    } finally {
      setIsSaving(false)
    }
  }

  const canAskInstrument = Boolean(activeMembership)
  const promptInstrument = searchParams.get('focus') === 'instrument' || location.hash === '#instrument'

  return (
    <main className="auth-page">
      <PageCard
        title="Eerste profielinstelling"
        description="Kies weergavenaam waarmee andere leden je zien."
        backTo="/profile"
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

          {canAskInstrument ? (
            <section id="instrument" className="performance-form__section">
              <h2>Instrument</h2>
              {promptInstrument ? <p className="muted-text">Kies hier je instrument om verder te gaan.</p> : null}
              {instrumentsQuery.isLoading ? <LoadingState>Instrumenten worden geladen…</LoadingState> : null}
              {instrumentsQuery.error instanceof Error ? <p role="alert">{instrumentsQuery.error.message}</p> : null}

              {!instrumentsQuery.isLoading ? (
                <>
                  <FormField label="Instrument">
                    <Select required value={selectedInstrument} onChange={(event) => setSelectedInstrument(event.target.value)}>
                      <option value="">Kies instrument</option>
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
                        required
                        maxLength={80}
                        placeholder="Bijvoorbeeld: trompet"
                      />
                    </FormField>
                  ) : null}
                </>
              ) : null}
            </section>
          ) : null}

          <button type="submit" disabled={isSaving || instrumentsQuery.isLoading}>
            {isSaving ? 'Bezig met opslaan…' : 'Profiel opslaan'}
          </button>
        </form>

        {error ? <p role="alert">{error}</p> : null}
      </PageCard>
    </main>
  )
}

function normalizeInstrumentName(name: string) {
  return name.trim().toLowerCase()
}
