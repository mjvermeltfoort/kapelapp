import { useState } from 'react'
import type { PerformanceOverviewPerson } from '../api/performances'

type MemberCardProps = {
  person: PerformanceOverviewPerson
  showReason?: boolean
}

export function MemberCard({ person, showReason = false }: MemberCardProps) {
  const hasDetails = Boolean(showReason || person.responded_at)
  const [isOpen, setIsOpen] = useState(false)
  const initials = getInitials(person.display_name)

  return (
    <div className={isOpen ? 'planner-member planner-member--open' : 'planner-member'}>
      <button
        type="button"
        className="planner-member__trigger"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={hasDetails ? isOpen : undefined}
        disabled={!hasDetails}
      >
        <div className="planner-member__avatar" aria-hidden="true">
          {initials}
        </div>

        <div className="planner-member__body">
          <strong>{person.display_name}</strong>
          <span>{person.instrument ?? 'Onbekend'}</span>
          <span>{formatRespondedAt(person.responded_at)}</span>
        </div>

        <span className="planner-member__chevron" aria-hidden="true">
          ›
        </span>
      </button>

      {hasDetails && isOpen ? (
        <div className="planner-member__details">
          {showReason ? <p>Reden: {person.reason ?? 'Geen reden opgegeven'}</p> : null}
          {person.responded_at ? <p>Gereageerd: {formatRespondedAtLong(person.responded_at)}</p> : null}
        </div>
      ) : null}
    </div>
  )
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function formatRespondedAt(value?: string) {
  if (!value) {
    return 'Nog niet gereageerd'
  }

  return new Date(value).toLocaleString('nl-NL', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatRespondedAtLong(value: string) {
  return new Date(value).toLocaleString('nl-NL', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
