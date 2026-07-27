type StatCardProps = {
  icon: string
  label: string
  value: number
  tone: 'yes' | 'maybe' | 'no' | 'none'
}

export function StatCard({ icon, label, value, tone }: StatCardProps) {
  return (
    <div className={`planner-stat-card planner-stat-card--${tone}`}>
      <div className="planner-stat-card__icon" aria-hidden="true">
        {icon}
      </div>
      <strong className="planner-stat-card__value">{value}</strong>
      <span className="planner-stat-card__label">{label}</span>
      <span className="planner-stat-card__accent" aria-hidden="true" />
    </div>
  )
}
