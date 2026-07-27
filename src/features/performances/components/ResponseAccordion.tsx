import { useId, useState } from 'react'
import { EmptyState } from '../../../components/EmptyState'
import type { PerformanceOverviewPerson } from '../api/performances'
import { MemberCard } from './MemberCard'

type ResponseAccordionProps = {
  icon: string
  title: string
  description: string
  count: number
  people: PerformanceOverviewPerson[]
  emptyText: string
  tone: 'yes' | 'maybe' | 'no' | 'none'
  showReason?: boolean
  defaultOpen?: boolean
}

export function ResponseAccordion({
  icon,
  title,
  description,
  count,
  people,
  emptyText,
  tone,
  showReason = false,
  defaultOpen = false,
}: ResponseAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const panelId = useId()

  return (
    <section className={`planner-accordion planner-accordion--${tone} ${isOpen ? 'planner-accordion--open' : ''}`}>
      <button
        type="button"
        className="planner-accordion__trigger"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span className="planner-accordion__icon" aria-hidden="true">
          {icon}
        </span>
        <span className="planner-accordion__heading">
          <strong>{title}</strong>
          <span>{description}</span>
        </span>
        <span className="planner-accordion__count">{count}</span>
        <span className="planner-accordion__chevron" aria-hidden="true">
          ⌄
        </span>
      </button>

      <div id={panelId} className="planner-accordion__panel" hidden={!isOpen}>
        {people.length ? (
          <div className="planner-accordion__list">
            {people.map((person) => (
              <MemberCard key={person.user_id} person={person} showReason={showReason} />
            ))}
          </div>
        ) : (
          <EmptyState>{emptyText}</EmptyState>
        )}
      </div>
    </section>
  )
}
