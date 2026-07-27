import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Alert } from '../../../components/Alert'
import { Button } from '../../../components/Button'
import { EmptyState } from '../../../components/EmptyState'
import { LoadingState } from '../../../components/LoadingState'
import { PageCard } from '../../../components/PageCard'
import { StatCard } from '../../../components/StatCard'
import { canManagePerformances as canManage } from '../../../lib/roles'
import { useBand } from '../../bands/hooks/useBand'
import { getPerformanceResponseOverview } from '../api/performances'
import type { PerformanceOverviewPerson } from '../api/performances'

export function PlannerOverviewPage() {
  const { performanceId } = useParams()
  const { activeMembership } = useBand()
  const canViewOverview = canManage(activeMembership?.role)

  const overviewQuery = useQuery({
    queryKey: ['performance-overview', performanceId],
    queryFn: async () => getPerformanceResponseOverview(performanceId ?? ''),
    enabled: Boolean(performanceId && activeMembership?.band.id && canViewOverview),
  })

  const reminderText = useMemo(() => {
    if (!overviewQuery.data) {
      return ''
    }

    const performance = overviewQuery.data.performance
    const names = overviewQuery.data.no_response.map((person) => person.display_name).join(', ')

    if (!names) {
      return `Iedereen heeft al gereageerd op ${performance.title}.`
    }

    return `Herinnering: reageer alsjeblieft op ${performance.title} van ${new Date(
      performance.performance_date,
    ).toLocaleDateString()}. Nog geen reactie van: ${names}.`
  }, [overviewQuery.data])

  async function handleCopyReminder() {
    if (!reminderText) {
      return
    }

    await navigator.clipboard.writeText(reminderText)
  }

  if (!activeMembership) {
    return (
      <PageCard title="Planner-overzicht" description="Kies eerst een actieve kapel.">
        <p>Ga eerst naar kapellenkiezer en selecteer een kapel.</p>
      </PageCard>
    )
  }

  if (!canViewOverview) {
    return (
      <PageCard
        title="Planner-overzicht"
        description="Alleen planners, admins en owners hebben toegang."
      >
        <p>Je huidige rol heeft geen toegang tot dit overzicht.</p>
      </PageCard>
    )
  }

  if (overviewQuery.isLoading) {
    return (
      <PageCard title="Planner-overzicht" description="Overzicht wordt geladen.">
        <LoadingState />
      </PageCard>
    )
  }

  if (overviewQuery.error instanceof Error || !overviewQuery.data) {
    return (
      <PageCard title="Planner-overzicht" description="Overzicht kon niet worden geladen.">
        <Alert tone="error">{overviewQuery.error instanceof Error ? overviewQuery.error.message : 'Niet gevonden.'}</Alert>
      </PageCard>
    )
  }

  const overview = overviewQuery.data

  return (
    <div className="page-grid">
      <PageCard
        title={`Planner-overzicht · ${overview.performance.title}`}
        description={`Status: ${overview.performance.status} · ${new Date(
          overview.performance.performance_date,
        ).toLocaleDateString()}`}
      >
        <div className="stats-grid">
          <StatCard label="Ja" value={overview.counts.yes} />
          <StatCard label="Misschien" value={overview.counts.maybe} />
          <StatCard label="Nee" value={overview.counts.no} />
          <StatCard label="Nog niet gereageerd" value={overview.counts.no_response} />
        </div>

        <Button type="button" onClick={() => void handleCopyReminder()} fullWidth>
          Herinneringstekst kopiëren
        </Button>

        <p className="muted-text">{reminderText}</p>
      </PageCard>

      <PageCard title="Ja" description="Leden die aanwezig zijn.">
        <PeopleList people={overview.yes} emptyText="Nog geen ja-reacties." />
      </PageCard>

      <PageCard title="Misschien" description="Leden met reden voor twijfel.">
        <PeopleList people={overview.maybe} emptyText="Nog geen misschien-reacties." showReason />
      </PageCard>

      <PageCard title="Nee" description="Leden die niet aanwezig zijn.">
        <PeopleList people={overview.no} emptyText="Nog geen nee-reacties." showReason />
      </PageCard>

      <PageCard title="Nog niet gereageerd" description="Leden die nog herinnerd moeten worden.">
        <PeopleList people={overview.no_response} emptyText="Iedereen heeft gereageerd." />
      </PageCard>

      <PageCard title="Verdeling per instrument" description="Responsverdeling per instrumentgroep.">
        {!overview.instrument_counts.length ? (
          <p>Geen instrumentgegevens beschikbaar.</p>
        ) : (
          <div className="stack-sm">
            {overview.instrument_counts.map((item) => (
              <div key={item.instrument} className="list-card-link">
                <strong>{item.instrument}</strong>
                <span>Totaal: {item.total}</span>
                <span>Ja: {item.yes}</span>
                <span>Misschien: {item.maybe}</span>
                <span>Nee: {item.no}</span>
                <span>Nog niet gereageerd: {item.no_response}</span>
              </div>
            ))}
          </div>
        )}
      </PageCard>
    </div>
  )
}

function PeopleList({
  people,
  emptyText,
  showReason = false,
}: {
  people: PerformanceOverviewPerson[]
  emptyText: string
  showReason?: boolean
}) {
  if (!people.length) {
    return <EmptyState>{emptyText}</EmptyState>
  }

  return (
    <div className="stack-sm">
      {people.map((person) => (
        <div key={person.user_id} className="list-card-link">
          <strong>{person.display_name}</strong>
          <span>Instrument: {person.instrument ?? 'Onbekend'}</span>
          {showReason ? <span>Reden: {person.reason ?? 'Geen reden opgegeven'}</span> : null}
          {person.responded_at ? (
            <span>Gereageerd: {new Date(person.responded_at).toLocaleString()}</span>
          ) : null}
        </div>
      ))}
    </div>
  )
}
