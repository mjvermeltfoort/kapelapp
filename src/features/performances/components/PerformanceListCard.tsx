import { Link } from 'react-router-dom'
import { Badge } from '../../../components/Badge'
import { daysUntil, parseDateOnly } from '../../../lib/dates'
import type { PerformanceResponse, ResponseValue } from '../../responses/api/responses'
import type { Performance } from '../api/performances'

type PerformanceListCardProps = {
  performance: Performance
  response?: PerformanceResponse
  canQuickReply: boolean
  isReplying: boolean
  onQuickReply: (response: Extract<ResponseValue, 'yes' | 'no'>) => void
}

export function PerformanceListCard({
  performance,
  response,
  canQuickReply,
  isReplying,
  onQuickReply,
}: PerformanceListCardProps) {
  const date = parseDateOnly(performance.performance_date)
  const deadlineLabel = !response && performance.response_deadline ? formatDeadline(performance.response_deadline) : null

  return (
    <article className="home-performance-card">
      <Link to={`/performances/${performance.id}`} className="home-performance-card__link">
        <div className="home-performance-card__date" aria-hidden="true">
          <span>{date.toLocaleDateString('nl-NL', { weekday: 'short' }).replace('.', '').toUpperCase()}</span>
          <strong>{date.getDate()}</strong>
          <span>{date.toLocaleDateString('nl-NL', { month: 'short' }).replace('.', '').toUpperCase()}</span>
        </div>

        <div className="home-performance-card__content">
          <div className="home-performance-card__topline">
            <strong>{performance.title}</strong>
            {performance.status === 'draft' ? <Badge tone="neutral">Concept</Badge> : null}
            {performance.status === 'cancelled' ? <Badge tone="danger">Geannuleerd</Badge> : null}
            {performance.status !== 'draft' && performance.status !== 'cancelled' ? (
              <Badge tone={mapResponseTone(response?.response)}>{formatResponseLabel(response?.response)}</Badge>
            ) : null}
          </div>

          <div className="home-performance-card__meta">
            <span className="sr-only">
              {date.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
            <span>
              {performance.start_time.slice(0, 5)}
              {performance.end_time ? ` - ${performance.end_time.slice(0, 5)}` : ''}
            </span>
            <span>{performance.location}</span>
          </div>

          {deadlineLabel ? (
            <span
              className={
                deadlineLabel.isUrgent
                  ? 'home-performance-card__deadline home-performance-card__deadline--urgent'
                  : 'home-performance-card__deadline'
              }
            >
              {deadlineLabel.text}
            </span>
          ) : null}
        </div>
      </Link>

      {canQuickReply ? (
        <div className="home-performance-card__actions" role="group" aria-label={`Snel reageren op ${performance.title}`}>
          <button
            type="button"
            className="quick-reply quick-reply--yes"
            aria-pressed={response?.response === 'yes'}
            disabled={isReplying}
            onClick={() => onQuickReply('yes')}
          >
            Ja
          </button>
          <Link to={`/performances/${performance.id}`} className="quick-reply quick-reply--maybe">
            Misschien…
          </Link>
          <button
            type="button"
            className="quick-reply quick-reply--no"
            aria-pressed={response?.response === 'no'}
            disabled={isReplying}
            onClick={() => onQuickReply('no')}
          >
            Nee
          </button>
        </div>
      ) : null}
    </article>
  )
}

function formatDeadline(deadline: string): { text: string; isUrgent: boolean } {
  const days = daysUntil(new Date(deadline))

  if (days < 0) {
    return { text: 'Reactietermijn verlopen', isUrgent: true }
  }

  if (days === 0) {
    return { text: 'Reageer vandaag', isUrgent: true }
  }

  return { text: `Nog ${days} ${days === 1 ? 'dag' : 'dagen'} om te reageren`, isUrgent: days <= 3 }
}

function formatResponseLabel(response?: ResponseValue) {
  switch (response) {
    case 'yes':
      return 'Ja'
    case 'maybe':
      return 'Misschien'
    case 'no':
      return 'Nee'
    default:
      return 'Nog niet gereageerd'
  }
}

function mapResponseTone(response?: ResponseValue) {
  switch (response) {
    case 'yes':
      return 'success' as const
    case 'maybe':
      return 'warning' as const
    case 'no':
      return 'danger' as const
    default:
      return 'neutral' as const
  }
}
