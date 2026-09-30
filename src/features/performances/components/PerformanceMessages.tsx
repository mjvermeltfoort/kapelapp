import { useEffect, useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert } from '../../../components/Alert'
import { Badge } from '../../../components/Badge'
import { Button } from '../../../components/Button'
import { FormField, Textarea } from '../../../components/FormField'
import { LoadingState } from '../../../components/LoadingState'
import {
  createPerformanceMessage,
  deletePerformanceMessage,
  listPerformanceMessages,
} from '../api/messages'
import { getErrorMessage } from '../../../lib/errors'
import { readMessagesSeenAt, storeMessagesSeenAt } from '../messageReadStorage'
import { performanceKeys } from '../queryKeys'

const MESSAGES_REFRESH_INTERVAL_MS = 30_000

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
  const [seenAt] = useState(() => readMessagesSeenAt(performanceId))

  const messagesQuery = useQuery({
    queryKey: performanceKeys.messages(performanceId),
    queryFn: async () => listPerformanceMessages(performanceId),
    refetchInterval: MESSAGES_REFRESH_INTERVAL_MS,
    refetchOnWindowFocus: true,
  })

  const messages = messagesQuery.data
  const latestMessageAt = messages?.at(-1)?.created_at
  const isUnread = (message: { user_id: string; created_at: string }) =>
    message.user_id !== userId && (!seenAt || message.created_at > seenAt)
  const unreadCount = messages?.filter(isUnread).length ?? 0

  useEffect(() => {
    if (latestMessageAt) {
      storeMessagesSeenAt(performanceId, latestMessageAt)
    }
  }, [performanceId, latestMessageAt])

  async function refreshMessages() {
    await queryClient.invalidateQueries({ queryKey: performanceKeys.messages(performanceId) })
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
      setSubmitError(getErrorMessage(error, 'Bericht plaatsen mislukt.'))
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
      setSubmitError(getErrorMessage(error, 'Bericht verwijderen mislukt.'))
    } finally {
      setDeletingMessageId(null)
    }
  }

  return (
    <section className="performance-messages" aria-label="Berichten">
      <div className="performance-messages__header">
        <p className="muted-text">Deel iets met je kapelgenoten.</p>
        {unreadCount ? (
          <Badge tone="brand" className="performance-messages__unread" role="status">
            {unreadCount === 1 ? '1 nieuw bericht' : `${unreadCount} nieuwe berichten`}
          </Badge>
        ) : null}
      </div>

      {messagesQuery.isLoading ? <LoadingState>Berichten worden geladen…</LoadingState> : null}
      {messagesQuery.error ? <Alert tone="error">{getErrorMessage(messagesQuery.error)}</Alert> : null}

      {!messagesQuery.isLoading && !messagesQuery.error ? (
        messagesQuery.data?.length ? (
          <ol className="performance-messages__list">
            {messagesQuery.data.map((message) => {
              const canDelete = message.user_id === userId || canModerate

              return (
                <li
                  key={message.id}
                  className={isUnread(message) ? 'performance-message performance-message--unread' : 'performance-message'}
                >
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
