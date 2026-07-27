import type { ReactNode } from 'react'

type StatCardProps = {
  label: ReactNode
  value: ReactNode
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="stat-card">
      <span className="stat-card__label">{label}</span>
      <strong className="stat-card__value">{value}</strong>
    </div>
  )
}
