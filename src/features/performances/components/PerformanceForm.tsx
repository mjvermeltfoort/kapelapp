import { type FormEvent, useState } from 'react'
import type { PerformanceInput, PerformanceStatus } from '../api/performances'

type PerformanceFormValues = Omit<PerformanceInput, 'bandId'>

type PerformanceFormProps = {
  submitLabel: string
  initialValues: PerformanceFormValues
  onSubmit: (values: PerformanceFormValues) => Promise<void>
}

const statuses: PerformanceStatus[] = ['draft', 'published', 'cancelled', 'completed', 'archived']

export function PerformanceForm({ submitLabel, initialValues, onSubmit }: PerformanceFormProps) {
  const [values, setValues] = useState(initialValues)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await onSubmit(values)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Opslaan mislukt.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)}>
      <label>
        Titel
        <input
          type="text"
          value={values.title}
          onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
          required
          minLength={2}
          maxLength={160}
        />
      </label>

      <label>
        Omschrijving
        <textarea
          rows={4}
          value={values.description}
          onChange={(event) =>
            setValues((current) => ({ ...current, description: event.target.value }))
          }
        />
      </label>

      <div className="two-column-grid">
        <label>
          Datum
          <input
            type="date"
            value={values.performanceDate}
            onChange={(event) =>
              setValues((current) => ({ ...current, performanceDate: event.target.value }))
            }
            required
          />
        </label>

        <label>
          Status
          <select
            value={values.status}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                status: event.target.value as PerformanceStatus,
              }))
            }
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="three-column-grid">
        <label>
          Verzameltijd
          <input
            type="time"
            value={values.gatherTime}
            onChange={(event) =>
              setValues((current) => ({ ...current, gatherTime: event.target.value }))
            }
          />
        </label>

        <label>
          Begintijd
          <input
            type="time"
            value={values.startTime}
            onChange={(event) => setValues((current) => ({ ...current, startTime: event.target.value }))}
            required
          />
        </label>

        <label>
          Eindtijd
          <input
            type="time"
            value={values.endTime}
            onChange={(event) => setValues((current) => ({ ...current, endTime: event.target.value }))}
          />
        </label>
      </div>

      <label>
        Locatie
        <input
          type="text"
          value={values.location}
          onChange={(event) => setValues((current) => ({ ...current, location: event.target.value }))}
          required
          minLength={2}
          maxLength={160}
        />
      </label>

      <label>
        Kaartlink
        <input
          type="url"
          value={values.mapUrl}
          onChange={(event) => setValues((current) => ({ ...current, mapUrl: event.target.value }))}
          placeholder="https://..."
        />
      </label>

      <label>
        Reactiedeadline
        <input
          type="datetime-local"
          value={values.responseDeadline}
          onChange={(event) =>
            setValues((current) => ({ ...current, responseDeadline: event.target.value }))
          }
        />
      </label>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Bezig met opslaan…' : submitLabel}
      </button>

      {error ? <p role="alert">{error}</p> : null}
    </form>
  )
}
