import type { PerformanceOverviewInstrumentCount, PerformanceOverviewPerson } from '../api/performances'

type InstrumentCardProps = {
  item: PerformanceOverviewInstrumentCount
  people: {
    yes: PerformanceOverviewPerson[]
    maybe: PerformanceOverviewPerson[]
    no: PerformanceOverviewPerson[]
    no_response: PerformanceOverviewPerson[]
  }
}

export function InstrumentCard({ item, people }: InstrumentCardProps) {
  return (
    <article className="planner-instrument-card">
      <div className="planner-instrument-card__top">
        <div>
          <span className="planner-instrument-card__icon" aria-hidden="true">
            {getInstrumentEmoji(item.instrument)}
          </span>
          <strong>{item.instrument}</strong>
        </div>
        <span className="planner-instrument-card__total">{item.total} totaal</span>
      </div>

      <div className="planner-instrument-card__badges" aria-label={`Verdeling voor ${item.instrument}`}>
        {item.yes > 0 ? <span className="planner-count-badge planner-count-badge--yes">✅ {item.yes}</span> : null}
        {item.maybe > 0 ? <span className="planner-count-badge planner-count-badge--maybe">❓ {item.maybe}</span> : null}
        {item.no > 0 ? <span className="planner-count-badge planner-count-badge--no">❌ {item.no}</span> : null}
        {item.no_response > 0 ? <span className="planner-count-badge planner-count-badge--none">🕒 {item.no_response}</span> : null}
      </div>

      <div className="planner-instrument-card__people">
        <PeopleLine tone="yes" label="Aanwezig" people={people.yes} />
        <PeopleLine tone="maybe" label="Misschien" people={people.maybe} />
        <PeopleLine tone="no" label="Afwezig" people={people.no} />
        <PeopleLine tone="none" label="Nog niet" people={people.no_response} />
      </div>
    </article>
  )
}

function PeopleLine({
  tone,
  label,
  people,
}: {
  tone: 'yes' | 'maybe' | 'no' | 'none'
  label: string
  people: PerformanceOverviewPerson[]
}) {
  if (!people.length) {
    return null
  }

  return (
    <div className="planner-instrument-card__people-line">
      <span className={['planner-instrument-card__people-label', `planner-instrument-card__people-label--${tone}`].join(' ')}>
        {label}
      </span>
      <div className="planner-instrument-card__names">
        {people.map((person) => (
          <span key={person.user_id} className="planner-instrument-card__name" title={person.display_name}>
            {person.display_name}
          </span>
        ))}
      </div>
    </div>
  )
}

function getInstrumentEmoji(instrument: string) {
  const value = instrument.toLowerCase()

  if (value.includes('slag')) return '🥁'
  if (value.includes('trom')) return '🎺'
  if (value.includes('saxo')) return '🎷'
  if (value.includes('klar')) return '🎶'
  if (value.includes('bas')) return '🎸'

  return '🎵'
}
