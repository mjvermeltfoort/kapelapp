import { useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert } from '../../../components/Alert'
import { Button } from '../../../components/Button'
import { FormField, Textarea } from '../../../components/FormField'
import { LoadingState } from '../../../components/LoadingState'
import {
  createPerformanceMessage,
  deletePerformanceMessage,
  listPerformanceMessages,
} from '../api/messages'

type PerformanceMessagesProps = {
  performanceId: string
  userId: string
  canModerate: boolean
}

export function PerformanceMessages({ performanceId, userId, canModerate }: PerformanceMessagesProps) {
  const queryClient = useQueryClient()
  const [body, setBody] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null)

  const messagesQuery = useQuery({
    queryKey: ['performance-messages', performanceId],
    queryFn: async () => listPerformanceMessages(performanceId),
  })

  async function refreshMessages() {
    await queryClient.invalidateQueries({ queryKey: ['performance-messages', performanceId] })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)

    const trimmedBody = body.trim()
    if (!trimmedBody) {
      setSubmitError('Schrijf eerst een bericht.')
      return
    }

    setIsSubmitting(true)
    try {
      await createPerformanceMessage({ performanceId, body: trimmedBody })
      setBody('')
      await refreshMessages()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Bericht plaatsen mislukt.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(messageId: string) {
    setSubmitError(null)
    setDeletingMessageId(messageId)
    try {
      await deletePerformanceMessage(messageId)
      await refreshMessages()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Bericht verwijderen mislukt.')
    } finally {
      setDeletingMessageId(null)
    }
  }

  return (
    <section className="performance-messages" aria-label="Berichten">
      <div className="performance-messages__header">
        <p className="muted-text">Deel iets met je kapelgenoten.</p>
      </div>

      {messagesQuery.isLoading ? <LoadingState>Berichten worden geladen…</LoadingState> : null}
      {messagesQuery.error instanceof Error ? <Alert tone="error">{messagesQuery.error.message}</Alert> : null}

      {!messagesQuery.isLoading && !messagesQuery.error ? (
        messagesQuery.data?.length ? (
          <ol className="performance-messages__list">
            {messagesQuery.data.map((message) => {
              const canDelete = message.user_id === userId || canModerate

              return (
                <li key={message.id} className="performance-message">
                  <div className="performance-message__meta">
                    <strong>{message.author_name}</strong>
                    <time dateTime={message.created_at}>{formatMessageDate(message.created_at)}</time>
                  </div>
                  <p>{message.body}</p>
                  {canDelete ? (
                    <Button
                      variant="ghost"
                      onClick={() => void handleDelete(message.id)}
                      disabled={deletingMessageId === message.id}
                      aria-label={`Verwijder bericht van ${message.author_name}`}
                    >
                      {deletingMessageId === message.id ? 'Verwijderen…' : 'Verwijderen'}
                    </Button>
                  ) : null}
                </li>
              )
            })}
          </ol>
        ) : (
          <p className="muted-text">Nog geen berichten. Plaats het eerste bericht.</p>
        )
      ) : null}

      <form className="performance-messages__form" onSubmit={(event) => void handleSubmit(event)}>
        <FormField label="Nieuw bericht">
          <Textarea
            rows={3}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={1000}
            placeholder="Schrijf een bericht…"
          />
        </FormField>
        <Button type="submit" disabled={isSubmitting} fullWidth>
          {isSubmitting ? 'Bericht plaatsen…' : 'Bericht plaatsen'}
        </Button>
      </form>

      {submitError ? <Alert tone="error">{submitError}</Alert> : null}
    </section>
  )
}

function formatMessageDate(value: string) {
  return new Date(value).toLocaleString('nl-NL', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
