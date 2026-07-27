import { type ReactNode, useId } from 'react'
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
  action?: ReactNode
  showReason?: boolean
  isOpen: boolean
  onToggle: () => void
  triggerRef?: (element: HTMLButtonElement | null) => void
  sectionRef?: (element: HTMLElement | null) => void
}

export function ResponseAccordion({
  icon,
  title,
  description,
  count,
  people,
  emptyText,
  tone,
  action,
  showReason = false,
  isOpen,
  onToggle,
  triggerRef,
  sectionRef,
}: ResponseAccordionProps) {
  const panelId = useId()

  return (
    <section
      ref={sectionRef}
      className={`planner-accordion planner-accordion--${tone} ${isOpen ? 'planner-accordion--open' : ''}`}
    >
      <div className="planner-accordion__header">
        <button
          ref={triggerRef}
          type="button"
          className="planner-accordion__trigger"
          onClick={onToggle}
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

        {action ? <div className="planner-accordion__action">{action}</div> : null}
      </div>

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
