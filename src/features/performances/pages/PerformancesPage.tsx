import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Alert } from '../../../components/Alert'
import { Badge } from '../../../components/Badge'
import { Button } from '../../../components/Button'
import { EmptyState } from '../../../components/EmptyState'
import { Icon } from '../../../components/Icon'
import { LoadingState } from '../../../components/LoadingState'
import { PageCard } from '../../../components/PageCard'
import { useAuth } from '../../auth/hooks/useAuth'
import { useBand } from '../../bands/hooks/useBand'
import { listMyPerformanceResponses } from '../../responses/api/responses'
import { listBandPerformances, type Performance } from '../api/performances'

export function PerformancesPage() {
  const { profile } = useAuth()
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

  const upcomingPerformances = useMemo(() => {
    const today = new Date()
    const todayKey = [
      today.getFullYear(),
      `${today.getMonth() + 1}`.padStart(2, '0'),
      `${today.getDate()}`.padStart(2, '0'),
    ].join('-')

    return (performancesQuery.data ?? []).filter((performance) => performance.performance_date >= todayKey)
  }, [performancesQuery.data])

  const featuredPerformances = upcomingPerformances.slice(0, 3)
  const firstName = profile?.display_name?.trim().split(/\s+/)[0] ?? 'daar'

  if (!activeMembership) {
    return (
      <PageCard title="Optredens" description="Kies eerst een actieve kapel.">
        <p>Ga eerst naar kapellenkiezer en selecteer een kapel.</p>
      </PageCard>
    )
  }

  return (
    <div className="page-grid">
      <PageCard
        title={`Welkom terug, ${firstName}!`}
        description="Hieronder je aankomende optredens."
        headerAction={
          featuredPerformances.length ? (
            <a href="#optredens-agenda" className="home-link-action">
              Bekijk alles
            </a>
          ) : null
        }
      >
        {performancesQuery.isLoading ? <LoadingState>Optredens worden geladen…</LoadingState> : null}
        {responsesQuery.isLoading && performancesQuery.data?.length ? (
          <LoadingState>Jouw reacties worden bijgewerkt…</LoadingState>
        ) : null}
        {performancesQuery.error instanceof Error ? (
          <Alert tone="error">{performancesQuery.error.message}</Alert>
        ) : null}
        {responsesQuery.error instanceof Error ? (
          <Alert tone="error">{responsesQuery.error.message}</Alert>
        ) : null}

        {!performancesQuery.isLoading && !performancesQuery.data?.length ? (
          <EmptyState>Nog geen optredens voor deze kapel.</EmptyState>
        ) : null}

        {featuredPerformances.length ? (
          <div className="home-performance-list">
            {featuredPerformances.map((performance) => {
              const response = responsesQuery.data?.find((item) => item.performance_id === performance.id)

              return (
                <Link
                  key={performance.id}
                  to={`/performances/${performance.id}`}
                  className="home-performance-card"
                >
                  <div className="home-performance-card__date">
                    <span>{formatShortWeekday(performance.performance_date)}</span>
                    <strong>{new Date(performance.performance_date).getDate()}</strong>
                    <span>{formatShortMonth(performance.performance_date)}</span>
                  </div>

                  <div className="home-performance-card__content">
                    <div className="home-performance-card__topline">
                      <strong>{performance.title}</strong>
                      <Badge tone={mapResponseTone(response?.response)}>
                        {formatResponseLabel(response?.response)}
                      </Badge>
                    </div>

                    <div className="home-performance-card__meta">
                      <span>
                        {performance.start_time.slice(0, 5)}
                        {performance.end_time ? ` - ${performance.end_time.slice(0, 5)}` : ''}
                      </span>
                      <span>{performance.location}</span>
                    </div>

                    {performance.response_deadline ? (
                      <span className="home-performance-card__deadline">
                        Reageren voor {formatDeadlineLabel(performance.response_deadline)}
                      </span>
                    ) : null}
                  </div>
                </Link>
              )
            })}
          </div>
        ) : null}

        {canManagePerformances ? (
          <Link to="/performances/new" className="home-create-button">
            <Icon name="add" className="nav-icon" />
            <span>Optreden toevoegen</span>
          </Link>
        ) : null}
      </PageCard>

      {performancesQuery.data?.length ? (
        <PageCard
          title="Kalender"
          description={calendarMonth.toLocaleDateString('nl-NL', {
            month: 'long',
            year: 'numeric',
          })}
        >
          <section className="calendar-card" aria-label="Optredenskalender">
            <div className="calendar-card__header">
              <div className="calendar-card__actions">
                <Button
                  type="button"
                  variant="ghost"
                  className="ghost-button ghost-button--icon"
                  onClick={() => setMonthOffset((current) => current - 1)}
                  aria-label="Vorige maand"
                  title="Vorige maand"
                >
                  ‹
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="ghost-button ghost-button--today"
                  onClick={() => setMonthOffset(0)}
                >
                  Vandaag
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="ghost-button ghost-button--icon"
                  onClick={() => setMonthOffset((current) => current + 1)}
                  aria-label="Volgende maand"
                  title="Volgende maand"
                >
                  ›
                </Button>
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
                      <Badge tone={mapResponseTone(response?.response)}>
                        Jouw reactie: {formatResponseLabel(response?.response)}
                      </Badge>
                    </Link>
                  )
                })}
              </div>
            </section>
          ) : (
            <p className="muted-text">Selecteer een dag met een markering om optredens te bekijken.</p>
          )}
        </PageCard>
      ) : null}

      <section id="optredens-agenda">
        <PageCard title="Alle optredens" description="Volledig overzicht van je planning.">
          {!performancesQuery.isLoading && !performancesQuery.data?.length ? (
            <EmptyState>Nog geen optredens ingepland.</EmptyState>
          ) : null}

          <div className="stack-sm">
            {performancesQuery.data?.map((performance) => {
              const response = responsesQuery.data?.find((item) => item.performance_id === performance.id)

              return (
                <Link key={performance.id} to={`/performances/${performance.id}`} className="list-card-link">
                  <strong>{performance.title}</strong>
                  <span>
                    {new Date(performance.performance_date).toLocaleDateString()} · {performance.start_time.slice(0, 5)}
                  </span>
                  <span>{performance.location}</span>
                  <span>Status: {formatStatusLabel(performance.status)}</span>
                  <Badge tone={mapResponseTone(response?.response)}>
                    Jouw reactie: {formatResponseLabel(response?.response)}
                  </Badge>
                </Link>
              )
            })}
          </div>
        </PageCard>
      </section>
    </div>
  )
}

function formatShortWeekday(date: string) {
  return new Date(date).toLocaleDateString('nl-NL', { weekday: 'short' }).replace('.', '').toUpperCase()
}

function formatShortMonth(date: string) {
  return new Date(date).toLocaleDateString('nl-NL', { month: 'short' }).replace('.', '').toUpperCase()
}

function formatDeadlineLabel(dateTime: string) {
  const date = new Date(dateTime)

  return date.toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
  })
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

function mapResponseTone(response?: 'yes' | 'maybe' | 'no') {
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
