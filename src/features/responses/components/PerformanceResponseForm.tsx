import { useEffect, useState, type FormEvent } from 'react'
import { Alert } from '../../../components/Alert'
import { Button } from '../../../components/Button'
import { FormField, Textarea } from '../../../components/FormField'
import type { PerformanceResponse, ResponseValue } from '../api/responses'

type PerformanceResponseFormProps = {
  currentResponse: PerformanceResponse | null
  onSubmit: (input: { response: ResponseValue; reason: string }) => Promise<void>
}

const options: Array<{ value: ResponseValue; label: string }> = [
  { value: 'yes', label: 'Ja' },
  { value: 'maybe', label: 'Misschien' },
  { value: 'no', label: 'Nee' },
]

export function PerformanceResponseForm({
  currentResponse,
  onSubmit,
}: PerformanceResponseFormProps) {
  const [response, setResponse] = useState<ResponseValue>(currentResponse?.response ?? 'yes')
  const [reason, setReason] = useState(currentResponse?.reason ?? '')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setResponse(currentResponse?.response ?? 'yes')
    setReason(currentResponse?.reason ?? '')
  }, [currentResponse?.reason, currentResponse?.response])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMessage(null)

    const trimmedReason = reason.trim()

    if (response === 'maybe' && !trimmedReason) {
      setError('Bij misschien is een reden verplicht.')
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit({ response, reason: trimmedReason })
      setMessage('Reactie opgeslagen.')
      if (response === 'yes') {
        setReason('')
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Opslaan mislukt.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)}>
      <fieldset className="radio-group">
        <legend>Jouw reactie</legend>

        {options.map((option) => (
          <label key={option.value} className="radio-option">
            <input
              type="radio"
              name="response"
              value={option.value}
              checked={response === option.value}
              onChange={() => setResponse(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </fieldset>

      {response !== 'yes' ? (
        <FormField label={`Reden ${response === 'maybe' ? '(verplicht)' : '(optioneel)'}`}>
          <Textarea
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            required={response === 'maybe'}
            placeholder={response === 'maybe' ? 'Waarom misschien?' : 'Eventuele toelichting'}
          />
        </FormField>
      ) : null}

      <Button type="submit" disabled={isSubmitting} fullWidth>
        {isSubmitting ? 'Bezig met opslaan…' : 'Reactie opslaan'}
      </Button>

      {currentResponse ? (
        <p className="muted-text">
          Laatste wijziging: {new Date(currentResponse.responded_at).toLocaleString()}
        </p>
      ) : null}

      {message ? <Alert tone="success">{message}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}
    </form>
  )
}
