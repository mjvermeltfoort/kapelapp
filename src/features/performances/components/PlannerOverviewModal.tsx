import { useQuery } from '@tanstack/react-query'
import { useMemo, useRef, useState } from 'react'
import { Alert } from '../../../components/Alert'
import { Button } from '../../../components/Button'
import { LoadingState } from '../../../components/LoadingState'
import { getPerformanceResponseOverview, type Performance } from '../api/performances'
import { InstrumentCard } from './InstrumentCard'
import { ResponseAccordion } from './ResponseAccordion'
import { StatCard } from './StatCard'
import { getErrorMessage } from '../../../lib/errors'
import { performanceKeys } from '../queryKeys'
import { useCopyReminder } from '../hooks/useCopyReminder'
import { useModalDialog } from '../hooks/useModalDialog'
import { useSwipeToClose } from '../hooks/useSwipeToClose'
import {
  buildReminderText,
  formatOverviewDate,
  formatStatusLabel,
  groupPeopleByInstrument,
  RESPONSE_GROUPS,
  type ResponseTone,
} from '../plannerOverview'
import './PlannerOverviewModal.css'

type PlannerOverviewModalProps = {
  performanceId: string
  performance: Performance
  canViewOverview: boolean
  isOpen: boolean
  onClose: () => void
}

export function PlannerOverviewModal({
  performanceId,
  performance,
  canViewOverview,
  isOpen,
  onClose,
}: PlannerOverviewModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const accordionSectionRefs = useRef<Partial<Record<ResponseTone, HTMLElement | null>>>({})
  const accordionTriggerRefs = useRef<Partial<Record<ResponseTone, HTMLButtonElement | null>>>({})
  const [openAccordion, setOpenAccordion] = useState<ResponseTone>('none')

  const overviewQuery = useQuery({
    queryKey: performanceKeys.overview(performanceId),
    queryFn: async () => getPerformanceResponseOverview(performanceId),
    enabled: isOpen && canViewOverview,
  })

  const overview = overviewQuery.data
  const reminder = useCopyReminder(overview ? buildReminderText(overview) : '')
  const instrumentGroups = useMemo(() => (overview ? groupPeopleByInstrument(overview) : []), [overview])
  const swipe = useSwipeToClose(onClose)

  useModalDialog(isOpen, onClose, panelRef, closeButtonRef)

  function handleAccordionToggle(tone: ResponseTone) {
    setOpenAccordion((current) => (current === tone ? 'none' : tone))
  }

  function handleStatCardClick(tone: ResponseTone) {
    setOpenAccordion(tone)

    requestAnimationFrame(() => {
      const section = accordionSectionRefs.current[tone]
      const trigger = accordionTriggerRefs.current[tone]

      section?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      window.setTimeout(() => trigger?.focus(), 180)
    })
  }

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="planner-modal-backdrop"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        ref={panelRef}
        className="planner-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="planner-modal-title"
        style={{ transform: swipe.dragOffset ? `translateY(${swipe.dragOffset}px)` : undefined }}
      >
        <div className="planner-modal__handle" aria-hidden="true" {...swipe.handlers} />

        <button
          ref={closeButtonRef}
          type="button"
          className="planner-modal__close"
          aria-label="Sluit planner-overzicht"
          onClick={onClose}
        >
          ×
        </button>

        <div className="planner-modal__body">
          <header className="planner-modal__header">
            <p className="planner-modal__eyebrow">Planner-overzicht</p>
            <h2 id="planner-modal-title">{performance.title}</h2>
            <div className="planner-modal__badges" aria-label="Optreden details">
              <span className="planner-modal__badge">📅 {formatOverviewDate(performance.performance_date)}</span>
              {performance.location ? <span className="planner-modal__badge">📍 {performance.location}</span> : null}
              <span className="planner-modal__badge">🟣 {formatStatusLabel(performance.status)}</span>
            </div>
          </header>

          {!canViewOverview ? (
            <Alert tone="error">Alleen planners, beheerders en eigenaren hebben toegang.</Alert>
          ) : null}

          {canViewOverview && overviewQuery.isLoading ? <LoadingState>Overzicht wordt geladen…</LoadingState> : null}
          {canViewOverview && overviewQuery.error ? (
            <Alert tone="error">{getErrorMessage(overviewQuery.error)}</Alert>
          ) : null}

          {canViewOverview && overview ? (
            <>
              <section className="planner-modal__section">
                <div className="planner-stats-grid">
                  {RESPONSE_GROUPS.map((group) => (
                    <StatCard
                      key={group.tone}
                      icon={group.icon}
                      label={group.label}
                      value={overview.counts[group.key]}
                      tone={group.tone}
                      onClick={() => handleStatCardClick(group.tone)}
                    />
                  ))}
                </div>
              </section>

              <section className="planner-modal__section">
                <div className="planner-modal__section-head">
                  <div>
                    <h3>Reacties</h3>
                    <p>Bekijk per antwoordgroep wie al heeft gereageerd.</p>
                  </div>
                </div>

                <div className="planner-accordion-list">
                  {RESPONSE_GROUPS.map((group) => (
                    <ResponseAccordion
                      key={group.tone}
                      icon={group.icon}
                      title={group.title}
                      description={group.description}
                      count={overview.counts[group.key]}
                      people={overview[group.key]}
                      emptyText={group.emptyText}
                      tone={group.tone}
                      showReason={group.showReason}
                      action={
                        group.tone === 'none' && overview.counts.no_response > 0 ? (
                          <Button type="button" variant="ghost" onClick={() => void reminder.copy()}>
                            {reminder.label}
                          </Button>
                        ) : null
                      }
                      isOpen={openAccordion === group.tone}
                      onToggle={() => handleAccordionToggle(group.tone)}
                      sectionRef={(element) => {
                        accordionSectionRefs.current[group.tone] = element
                      }}
                      triggerRef={(element) => {
                        accordionTriggerRefs.current[group.tone] = element
                      }}
                    />
                  ))}
                </div>

                {reminder.error ? <Alert tone="error">{reminder.error}</Alert> : null}
              </section>

              <section className="planner-modal__section planner-modal__section--last">
                <div className="planner-modal__section-head">
                  <div>
                    <h3>Verdeling per instrument</h3>
                    <p>Responsverdeling per instrumentgroep.</p>
                  </div>
                </div>

                {overview.instrument_counts.length ? (
                  <div className="planner-instrument-scroll" aria-label="Verdeling per instrument">
                    {instrumentGroups.map(({ item, people }) => (
                      <InstrumentCard key={item.instrument} item={item} people={people} />
                    ))}
                  </div>
                ) : (
                  <Alert tone="info">Geen instrumentgegevens beschikbaar.</Alert>
                )}
              </section>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
