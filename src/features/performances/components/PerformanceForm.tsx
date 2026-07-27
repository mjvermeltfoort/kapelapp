import { type FormEvent, useState } from 'react'
import { Alert } from '../../../components/Alert'
import { Button } from '../../../components/Button'
import { FormField, Input, Select, Textarea } from '../../../components/FormField'
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
      <FormField label="Titel">
        <Input
          type="text"
          value={values.title}
          onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
          required
          minLength={2}
          maxLength={160}
        />
      </FormField>

      <FormField label="Omschrijving">
        <Textarea
          rows={4}
          value={values.description}
          onChange={(event) =>
            setValues((current) => ({ ...current, description: event.target.value }))
          }
        />
      </FormField>

      <div className="two-column-grid">
        <FormField label="Datum">
          <Input
            type="date"
            value={values.performanceDate}
            onChange={(event) =>
              setValues((current) => ({ ...current, performanceDate: event.target.value }))
            }
            required
          />
        </FormField>

        <FormField label="Status">
          <Select
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
          </Select>
        </FormField>
      </div>

      <div className="three-column-grid">
        <FormField label="Verzameltijd">
          <Input
            type="time"
            value={values.gatherTime}
            onChange={(event) =>
              setValues((current) => ({ ...current, gatherTime: event.target.value }))
            }
          />
        </FormField>

        <FormField label="Begintijd">
          <Input
            type="time"
            value={values.startTime}
            onChange={(event) => setValues((current) => ({ ...current, startTime: event.target.value }))}
            required
          />
        </FormField>

        <FormField label="Eindtijd">
          <Input
            type="time"
            value={values.endTime}
            onChange={(event) => setValues((current) => ({ ...current, endTime: event.target.value }))}
          />
        </FormField>
      </div>

      <FormField label="Locatie">
        <Input
          type="text"
          value={values.location}
          onChange={(event) => setValues((current) => ({ ...current, location: event.target.value }))}
          required
          minLength={2}
          maxLength={160}
        />
      </FormField>

      <FormField label="Kaartlink">
        <Input
          type="url"
          value={values.mapUrl}
          onChange={(event) => setValues((current) => ({ ...current, mapUrl: event.target.value }))}
          placeholder="https://..."
        />
      </FormField>

      <FormField label="Reactiedeadline">
        <Input
          type="datetime-local"
          value={values.responseDeadline}
          onChange={(event) =>
            setValues((current) => ({ ...current, responseDeadline: event.target.value }))
          }
        />
      </FormField>

      <Button type="submit" disabled={isSubmitting} fullWidth>
        {isSubmitting ? 'Bezig met opslaan…' : submitLabel}
      </Button>

      {error ? <Alert tone="error">{error}</Alert> : null}
    </form>
  )
}
