import { useMemo, useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert } from '../../../components/Alert'
import { Badge } from '../../../components/Badge'
import { Button } from '../../../components/Button'
import { FormField, Input } from '../../../components/FormField'
import { getErrorMessage } from '../../../lib/errors'
import { listBandMembers } from '../../members/api/members'
import { createBandInstrument, deactivateBandInstrument, listBandInstruments, updateBandInstrument } from '../api/instruments'
import { bandKeys } from '../queryKeys'

export function BandInstrumentsSection({ bandId }: { bandId: string }) {
  const queryClient = useQueryClient()
  const [newInstrumentName, setNewInstrumentName] = useState('')
  const [editingInstrumentId, setEditingInstrumentId] = useState<string | null>(null)
  const [editingInstrumentName, setEditingInstrumentName] = useState('')
  const [instrumentMessage, setInstrumentMessage] = useState<string | null>(null)
  const [instrumentError, setInstrumentError] = useState<string | null>(null)
  const [isSavingInstrument, setIsSavingInstrument] = useState(false)
  const instrumentQueryKey = bandKeys.instruments(bandId, true)

  const instrumentsQuery = useQuery({
    queryKey: instrumentQueryKey,
    queryFn: async () => listBandInstruments(bandId, true),
  })

  const membersQuery = useQuery({
    queryKey: bandKeys.members(bandId),
    queryFn: async () => listBandMembers(bandId),
  })

  const missingMemberInstruments = useMemo(() => {
    const existing = new Set((instrumentsQuery.data ?? []).map((instrument) => normalizeInstrumentName(instrument.name)))

    return (membersQuery.data ?? [])
      .filter((member) => member.is_active && member.instrument?.trim())
      .map((member) => member.instrument!.trim())
      .filter((instrument) => {
        const normalized = normalizeInstrumentName(instrument)
        if (existing.has(normalized)) {
          return false
        }

        existing.add(normalized)
        return true
      })
  }, [instrumentsQuery.data, membersQuery.data])

  async function runInstrumentAction(action: () => Promise<unknown>, successMessage: string, fallback: string) {
    setInstrumentMessage(null)
    setInstrumentError(null)
    setIsSavingInstrument(true)

    try {
      await action()
      await queryClient.invalidateQueries({ queryKey: instrumentQueryKey })
      setInstrumentMessage(successMessage)
      return true
    } catch (submitError) {
      setInstrumentError(getErrorMessage(submitError, fallback))
      return false
    } finally {
      setIsSavingInstrument(false)
    }
  }

  async function addInstrument(instrumentName: string) {
    return runInstrumentAction(
      () => createBandInstrument(bandId, instrumentName),
      'Instrument toegevoegd.',
      'Instrument toevoegen mislukt.',
    )
  }

  async function handleAddInstrument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (await addInstrument(newInstrumentName)) {
      setNewInstrumentName('')
    }
  }

  async function handleAddMissingInstrument(instrumentName: string) {
    await addInstrument(instrumentName)
  }

  async function handleSaveInstrument(instrumentId: string) {
    const saved = await runInstrumentAction(
      () => updateBandInstrument(instrumentId, editingInstrumentName),
      'Instrument bijgewerkt.',
      'Instrument bijwerken mislukt.',
    )

    if (saved) {
      setEditingInstrumentId(null)
      setEditingInstrumentName('')
    }
  }

  async function handleDeactivateInstrument(instrumentId: string) {
    await runInstrumentAction(
      () => deactivateBandInstrument(instrumentId),
      'Instrument gedeactiveerd.',
      'Instrument deactiveren mislukt.',
    )
  }

  return (
    <section className="performance-form__section">
      <div className="invite-header">
        <Badge tone="brand">Instrumenten</Badge>
        <p className="muted-text">Beheer actieve instrumenten voor deze kapel.</p>
      </div>

      <form onSubmit={(event) => void handleAddInstrument(event)} className="performance-form">
        <FormField label="Nieuw instrument">
          <Input
            type="text"
            value={newInstrumentName}
            onChange={(event) => setNewInstrumentName(event.target.value)}
            maxLength={80}
            placeholder="Bijvoorbeeld: Trompet"
          />
        </FormField>
        <Button type="submit" disabled={isSavingInstrument} fullWidth>
          Instrument toevoegen
        </Button>
      </form>

      {instrumentMessage ? <Alert tone="success">{instrumentMessage}</Alert> : null}
      {instrumentError ? <Alert tone="error">{instrumentError}</Alert> : null}
      {membersQuery.error ? <Alert tone="error">{getErrorMessage(membersQuery.error)}</Alert> : null}

      {missingMemberInstruments.length ? (
        <div className="members-list">
          {missingMemberInstruments.map((instrumentName) => (
            <div key={instrumentName} className="member-card member-card--enhanced">
              <div className="member-card__topline">
                <strong>{instrumentName}</strong>
                <Badge tone="warning">Nog niet in lijst</Badge>
              </div>
              <p className="muted-text">Gebruikt door leden, maar nog niet toegevoegd aan instrumentenlijst.</p>
              <Button
                type="button"
                variant="secondary"
                disabled={isSavingInstrument}
                onClick={() => void handleAddMissingInstrument(instrumentName)}
                fullWidth
              >
                Toevoegen aan lijst
              </Button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="members-list">
        {instrumentsQuery.data?.map((instrument) => (
          <div key={instrument.id} className="member-card member-card--enhanced">
            <div className="member-card__topline">
              <strong>{instrument.name}</strong>
              <Badge tone={instrument.is_active ? 'success' : 'neutral'}>
                {instrument.is_active ? 'Actief' : 'Inactief'}
              </Badge>
            </div>

            {editingInstrumentId === instrument.id ? (
              <div className="member-card__button-stack">
                <FormField label="Instrumentnaam">
                  <Input
                    type="text"
                    value={editingInstrumentName}
                    onChange={(event) => setEditingInstrumentName(event.target.value)}
                    maxLength={80}
                  />
                </FormField>
                <Button type="button" disabled={isSavingInstrument} onClick={() => void handleSaveInstrument(instrument.id)} fullWidth>
                  Opslaan
                </Button>
                <Button type="button" variant="ghost" disabled={isSavingInstrument} onClick={() => setEditingInstrumentId(null)} fullWidth>
                  Annuleren
                </Button>
              </div>
            ) : (
              <div className="member-card__button-stack" role="group" aria-label={`Acties voor instrument ${instrument.name}`}>
                {instrument.is_active ? (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isSavingInstrument}
                    onClick={() => {
                      setEditingInstrumentId(instrument.id)
                      setEditingInstrumentName(instrument.name)
                    }}
                    fullWidth
                  >
                    Naam wijzigen
                  </Button>
                ) : null}
                {instrument.is_active ? (
                  <Button
                    type="button"
                    variant="danger"
                    disabled={isSavingInstrument}
                    onClick={() => void handleDeactivateInstrument(instrument.id)}
                    fullWidth
                  >
                    Deactiveren
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

function normalizeInstrumentName(name: string) {
  return name.trim().toLowerCase()
}
