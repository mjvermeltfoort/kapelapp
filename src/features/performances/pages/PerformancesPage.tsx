import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { Alert } from '../../../components/Alert'
import { Button } from '../../../components/Button'
import { EmptyState } from '../../../components/EmptyState'
import { Icon } from '../../../components/Icon'
import { LoadingState } from '../../../components/LoadingState'
import { PageCard } from '../../../components/PageCard'
import { TabLink, Tabs } from '../../../components/Tabs'
import { todayKey } from '../../../lib/dates'
import { getErrorMessage } from '../../../lib/errors'
import { canManagePerformances as canManage } from '../../../lib/roles'
import { useAuth } from '../../auth/hooks/useAuth'
import { useBand } from '../../bands/hooks/useBand'
import { listMyPerformanceResponses, upsertMyPerformanceResponse } from '../../responses/api/responses'
import { responseKeys } from '../../responses/queryKeys'
import { listBandPerformances, type Performance } from '../api/performances'
import { PerformanceListCard } from '../components/PerformanceListCard'
import { performanceKeys } from '../queryKeys'

const PAGE_SIZE = 5

export function PerformancesPage() {
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const view = searchParams.get('view') === 'past' ? 'past' : 'upcoming'
  const { profile } = useAuth()
  const { activeMembership } = useBand()
  const bandId = activeMembership?.band.id
  const canManagePerformances = canManage(activeMembership?.role)
  const [paging, setPaging] = useState({ view, count: PAGE_SIZE })
  const visibleCount = paging.view === view ? paging.count : PAGE_SIZE
  const [replyingId, setReplyingId] = useState<string | null>(null)
  const [replyError, setReplyError] = useState<string | null>(null)

  const performancesQuery = useQuery({
    queryKey: performanceKeys.list(bandId),
    queryFn: async () => listBandPerformances(bandId!),
    enabled: Boolean(bandId),
  })

  const performanceIds = useMemo(
    () => (performancesQuery.data ?? []).map((performance) => performance.id),
    [performancesQuery.data],
  )

  const responsesQuery = useQuery({
    queryKey: responseKeys.mineForPerformances(bandId, performanceIds),
    queryFn: async () => listMyPerformanceResponses(performanceIds),
    enabled: Boolean(bandId && performanceIds.length),
  })

  const responsesByPerformance = useMemo(
    () => new Map((responsesQuery.data ?? []).map((response) => [response.performance_id, response])),
    [responsesQuery.data],
  )

  const visiblePerformances = useMemo(() => {
    const today = todayKey()
    const performances = performancesQuery.data ?? []

    if (view === 'past') {
      return performances.filter((performance) => performance.performance_date < today).reverse()
    }

    const upcoming = performances.filter((performance) => performance.performance_date >= today)
    const needsResponse = (performance: Performance) =>
      isRespondable(performance) && !responsesByPerformance.has(performance.id)

    return [...upcoming.filter(needsResponse), ...upcoming.filter((performance) => !needsResponse(performance))]
  }, [performancesQuery.data, responsesByPerformance, view])

  const shownPerformances = visiblePerformances.slice(0, visibleCount)
  const hasMorePerformances = visiblePerformances.length > shownPerformances.length
  const firstName = profile?.display_name?.trim().split(/\s+/)[0] ?? 'daar'

  async function handleQuickReply(performanceId: string, response: 'yes' | 'no') {
    setReplyingId(performanceId)
    setReplyError(null)

    try {
      await upsertMyPerformanceResponse({ performanceId, response, reason: '' })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: responseKeys.mineForBand(bandId) }),
        queryClient.invalidateQueries({ queryKey: responseKeys.mine(performanceId) }),
        queryClient.invalidateQueries({ queryKey: performanceKeys.overview(performanceId) }),
      ])
    } catch (error) {
      setReplyError(getErrorMessage(error, 'Reactie opslaan mislukt.'))
    } finally {
      setReplyingId(null)
    }
  }

  if (!activeMembership) {
    return (
      <PageCard title="Optredens" description="Je hebt nog geen actieve kapel.">
        <EmptyState
          action={
            <Link to="/bands" className="performance-secondary-link">
              Naar mijn kapellen
            </Link>
          }
        >
          Kies een kapel of open de uitnodigingslink die je van je kapel hebt gekregen.
        </EmptyState>
      </PageCard>
    )
  }

  return (
    <div className="page-grid">
      <PageCard
        title={`Welkom terug, ${firstName}!`}
        description={view === 'past' ? 'Eerdere optredens van je kapel.' : 'Hieronder je aankomende optredens.'}
      >
        <Tabs aria-label="Optredens filteren">
          <TabLink to="/performances" isActive={view === 'upcoming'} replace>
            Komend
          </TabLink>
          <TabLink to="/performances?view=past" isActive={view === 'past'} replace>
            Afgelopen
          </TabLink>
        </Tabs>

        {performancesQuery.isLoading ? <LoadingState>Optredens worden geladen…</LoadingState> : null}
        {performancesQuery.error ? <Alert tone="error">{getErrorMessage(performancesQuery.error)}</Alert> : null}
        {responsesQuery.error ? <Alert tone="error">{getErrorMessage(responsesQuery.error)}</Alert> : null}
        {replyError ? <Alert tone="error">{replyError}</Alert> : null}

        {!performancesQuery.isLoading && !performancesQuery.error && !visiblePerformances.length ? (
          <EmptyState
            action={
              view === 'upcoming' && canManagePerformances ? (
                <Link to="/performances/new" className="performance-secondary-link">
                  Eerste optreden toevoegen
                </Link>
              ) : view === 'upcoming' ? (
                <Link to="/performances?view=past" className="performance-secondary-link" replace>
                  Bekijk afgelopen optredens
                </Link>
              ) : undefined
            }
          >
            {view === 'past' ? 'Nog geen afgelopen optredens.' : 'Geen aankomende optredens voor deze kapel.'}
          </EmptyState>
        ) : null}

        {shownPerformances.length ? (
          <div className="home-performance-list">
            {shownPerformances.map((performance) => (
              <PerformanceListCard
                key={performance.id}
                performance={performance}
                response={responsesByPerformance.get(performance.id)}
                canQuickReply={view === 'upcoming' && isRespondable(performance) && !responsesQuery.isLoading}
                isReplying={replyingId === performance.id}
                onQuickReply={(response) => void handleQuickReply(performance.id, response)}
              />
            ))}
          </div>
        ) : null}

        {hasMorePerformances ? (
          <Button type="button" variant="secondary" onClick={() => setPaging({ view, count: visibleCount + PAGE_SIZE })} fullWidth>
            Meer tonen
          </Button>
        ) : null}
      </PageCard>

      {canManagePerformances ? (
        <Link to="/performances/new" className="fab" aria-label="Optreden toevoegen" title="Optreden toevoegen">
          <Icon name="add" className="nav-icon" />
        </Link>
      ) : null}
    </div>
  )
}

function isRespondable(performance: Performance) {
  return performance.status === 'published'
}
