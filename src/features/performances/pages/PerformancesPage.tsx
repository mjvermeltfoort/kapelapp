import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageCard } from '../../../components/PageCard'
import { useBand } from '../../bands/hooks/useBand'
import { listMyPerformanceResponses } from '../../responses/api/responses'
import { listBandPerformances, type Performance } from '../api/performances'

export function PerformancesPage() {
  const { activeMembership } = useBand()
  const canManagePerformances = ['planner', 'admin', 'owner'].includes(activeMembership?.role ?? '')
  const [monthOffset, setMonthOffset] = useState(0)
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null)

  const performancesQuery = useQuery({
    queryKey: ['performances', activeMembership?.band.id],
    queryFn: async () => listBandPerformances(activeMembership!.band.id),
    enabled: Boolean(activeMembership?.band.id),
  })

  const responsesQuery = useQuery({
    queryKey: [
      'my-performance-responses',
      activeMembership?.band.id,
      performancesQuery.data?.length ?? 0,
    ],
    queryFn: async () =>
      listMyPerformanceResponses((performancesQuery.data ?? []).map((performance) => performance.id)),
    enabled: Boolean(activeMembership?.band.id && performancesQuery.data?.length),
  })

  const calendarMonth = useMemo(() => {
    const baseDate = new Date()
    return new Date(baseDate.getFullYear(), baseDate.getMonth() + monthOffset, 1)
  }, [monthOffset])

  const calendarDays = useMemo(
    () => buildCalendarDays(calendarMonth, performancesQuery.data ?? []),
    [calendarMonth, performancesQuery.data],
  )

  const selectedDay = useMemo(() => {
    if (selectedDateKey) {
      return calendarDays.find((day) => day.dateKey === selectedDateKey) ?? null
    }

    return calendarDays.find((day) => day.performances.length > 0 && day.isCurrentMonth) ?? null
  }, [calendarDays, selectedDateKey])

  if (!activeMembership) {
    return (
      <PageCard title="Optredens" description="Kies eerst een actieve kapel.">
        <p>Ga eerst naar kapellenkiezer en selecteer een kapel.</p>
      </PageCard>
    )
  }

  return (
    <PageCard
      title="Overzicht aankomende optredens"
      description={`Optredens voor ${activeMembership.band.name}. Concepten zijn alleen zichtbaar voor planner, admin en owner.`}
    >
      <div className="inline-links">
        {canManagePerformances ? <Link to="/performances/new">Nieuw optreden</Link> : null}
      </div>

      {performancesQuery.isLoading ? <p>Optredens worden geladen…</p> : null}
      {responsesQuery.isLoading && performancesQuery.data?.length ? (
        <p className="muted-text">Jouw reacties worden bijgewerkt…</p>
      ) : null}
      {performancesQuery.error instanceof Error ? (
        <p role="alert" className="alert alert--error">
          {performancesQuery.error.message}
        </p>
      ) : null}
      {responsesQuery.error instanceof Error ? (
        <p role="alert" className="alert alert--error">
          {responsesQuery.error.message}
        </p>
      ) : null}

      {!performancesQuery.isLoading && !performancesQuery.data?.length ? (
        <p className="empty-state">Nog geen optredens voor deze kapel.</p>
      ) : null}

      {performancesQuery.data?.length ? (
        <section className="calendar-card" aria-label="Optredenskalender">
          <div className="calendar-card__header">
            <div>
              <h3 className="section-title">Kalender</h3>
              <p className="muted-text">
                {calendarMonth.toLocaleDateString('nl-NL', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>

            <div className="calendar-card__actions">
              <button
                type="button"
                className="ghost-button ghost-button--icon"
                onClick={() => setMonthOffset((current) => current - 1)}
                aria-label="Vorige maand"
                title="Vorige maand"
              >
                ‹
              </button>
              <button
                type="button"
                className="ghost-button ghost-button--today"
                onClick={() => setMonthOffset(0)}
              >
                Vandaag
              </button>
              <button
                type="button"
                className="ghost-button ghost-button--icon"
                onClick={() => setMonthOffset((current) => current + 1)}
                aria-label="Volgende maand"
                title="Volgende maand"
              >
                ›
              </button>
            </div>
          </div>

          <div className="calendar-weekdays" aria-hidden="true">
            {['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="calendar-grid">
            {calendarDays.map((day) => (
              <div
                key={day.dateKey}
                className={day.isCurrentMonth ? 'calendar-day' : 'calendar-day calendar-day--muted'}
              >
                <span className="calendar-day__number">{day.dayNumber}</span>
                <div className="calendar-day__items">
                  <button
                    type="button"
                    className={
                      day.performances.length
                        ? day.dateKey === selectedDay?.dateKey
                          ? 'calendar-day__button calendar-day__button--selected'
                          : 'calendar-day__button calendar-day__button--has-events'
                        : 'calendar-day__button'
                    }
                    onClick={() => setSelectedDateKey(day.dateKey)}
                    aria-pressed={day.dateKey === selectedDay?.dateKey}
                  >
                    {day.performances.length ? (
                      <span className="calendar-indicators" aria-hidden="true">
                        {day.performances.slice(0, 3).map((performance) => {
                          const response = responsesQuery.data?.find(
                            (item) => item.performance_id === performance.id,
                          )

                          return (
                            <span
                              key={performance.id}
                              className={`calendar-indicator calendar-indicator--${response?.response ?? 'none'}`}
                            />
                          )
                        })}
                      </span>
                    ) : (
                      <span className="calendar-empty-indicator" aria-hidden="true" />
                    )}
                    {day.performances.length ? (
                      <span className="calendar-day__count">
                        {day.performances.length} optreden{day.performances.length === 1 ? '' : 's'}
                      </span>
                    ) : null}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {selectedDay ? (
        <section className="calendar-selected-day">
          <div className="calendar-selected-day__header">
            <h3 className="section-title">
              Optredens op {new Date(selectedDay.dateKey).toLocaleDateString('nl-NL', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </h3>
            <p className="muted-text">
              {selectedDay.performances.length} optreden{selectedDay.performances.length === 1 ? '' : 's'}
            </p>
          </div>

          <div className="stack-sm">
            {selectedDay.performances.map((performance) => {
              const response = responsesQuery.data?.find((item) => item.performance_id === performance.id)

              return (
                <Link
                  key={performance.id}
                  to={`/performances/${performance.id}`}
                  className="list-card-link"
                >
                  <strong>{performance.title}</strong>
                  <span>
                    {performance.start_time.slice(0, 5)}
                    {performance.end_time ? ` - ${performance.end_time.slice(0, 5)}` : ''}
                  </span>
                  <span>{performance.location}</span>
                  <span className={`response-badge response-badge--${response?.response ?? 'none'}`}>
                    Jouw reactie: {formatResponseLabel(response?.response)}
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      ) : (
        performancesQuery.data?.length ? (
          <p className="muted-text">Selecteer een dag met een markering om optredens te bekijken.</p>
        ) : null
      )}

      <div className="stack-sm">
        {performancesQuery.data?.map((performance) => {
          const response = responsesQuery.data?.find((item) => item.performance_id === performance.id)

          return (
            <Link key={performance.id} to={`/performances/${performance.id}`} className="list-card-link">
              <strong>{performance.title}</strong>
              <span>
                {new Date(performance.performance_date).toLocaleDateString()} ·{' '}
                {performance.start_time.slice(0, 5)}
              </span>
              <span>{performance.location}</span>
              <span>Status: {formatStatusLabel(performance.status)}</span>
              <span className={`response-badge response-badge--${response?.response ?? 'none'}`}>
                Jouw reactie: {formatResponseLabel(response?.response)}
              </span>
            </Link>
          )
        })}
      </div>
    </PageCard>
  )
}

function formatResponseLabel(response?: 'yes' | 'maybe' | 'no') {
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

function formatStatusLabel(status: Performance['status']) {
  switch (status) {
    case 'draft':
      return 'Concept'
    case 'published':
      return 'Gepubliceerd'
    case 'cancelled':
      return 'Geannuleerd'
    case 'completed':
      return 'Afgerond'
    case 'archived':
      return 'Gearchiveerd'
  }
}

type CalendarDay = {
  dateKey: string
  dayNumber: number
  isCurrentMonth: boolean
  performances: Performance[]
}

function buildCalendarDays(month: Date, performances: Performance[]): CalendarDay[] {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1)
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0)
  const startOffset = (firstDay.getDay() + 6) % 7
  const startDate = new Date(firstDay)
  startDate.setDate(firstDay.getDate() - startOffset)

  const endOffset = 6 - ((lastDay.getDay() + 6) % 7)
  const endDate = new Date(lastDay)
  endDate.setDate(lastDay.getDate() + endOffset)

  const performanceMap = new Map<string, Performance[]>()

  for (const performance of performances) {
    const items = performanceMap.get(performance.performance_date) ?? []
    items.push(performance)
    performanceMap.set(performance.performance_date, items)
  }

  const days: CalendarDay[] = []
  const cursor = new Date(startDate)

  while (cursor <= endDate) {
    const year = cursor.getFullYear()
    const monthNumber = `${cursor.getMonth() + 1}`.padStart(2, '0')
    const dayNumber = `${cursor.getDate()}`.padStart(2, '0')
    const dateKey = `${year}-${monthNumber}-${dayNumber}`

    days.push({
      dateKey,
      dayNumber: cursor.getDate(),
      isCurrentMonth: cursor.getMonth() === month.getMonth(),
      performances: performanceMap.get(dateKey) ?? [],
    })

    cursor.setDate(cursor.getDate() + 1)
  }

  return days
}
