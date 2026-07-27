import type { PerformanceOverviewInstrumentCount } from '../api/performances'

type InstrumentCardProps = {
  item: PerformanceOverviewInstrumentCount
}

export function InstrumentCard({ item }: InstrumentCardProps) {
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
        <span className="planner-count-badge planner-count-badge--yes">✅ {item.yes}</span>
        <span className="planner-count-badge planner-count-badge--maybe">❓ {item.maybe}</span>
        <span className="planner-count-badge planner-count-badge--no">❌ {item.no}</span>
        <span className="planner-count-badge planner-count-badge--none">🕒 {item.no_response}</span>
      </div>
    </article>
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
