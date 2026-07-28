import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert } from '../../../components/Alert'
import { Button } from '../../../components/Button'
import { LoadingState } from '../../../components/LoadingState'
import { getPerformanceResponseOverview, type Performance } from '../api/performances'
import { InstrumentCard } from './InstrumentCard'
import { ResponseAccordion } from './ResponseAccordion'
import { StatCard } from './StatCard'

type PlannerOverviewModalProps = {
  performanceId: string
  performance: Performance
  canViewOverview: boolean
  isOpen: boolean
  onClose: () => void
}

type AccordionKey = 'yes' | 'maybe' | 'no' | 'none'

export function PlannerOverviewModal({
  performanceId,
  performance,
  canViewOverview,
  isOpen,
  onClose,
}: PlannerOverviewModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const accordionSectionRefs = useRef<Record<AccordionKey, HTMLElement | null>>({
    yes: null,
    maybe: null,
    no: null,
    none: null,
  })
  const accordionTriggerRefs = useRef<Record<AccordionKey, HTMLButtonElement | null>>({
    yes: null,
    maybe: null,
    no: null,
    none: null,
  })
  const touchStartY = useRef<number | null>(null)
  const touchStartX = useRef<number | null>(null)
  const [dragOffset, setDragOffset] = useState(0)
  const [openAccordion, setOpenAccordion] = useState<AccordionKey>('none')
  const [copyReminderLabel, setCopyReminderLabel] = useState('Kopieer herinnering')
  const [copyReminderError, setCopyReminderError] = useState<string | null>(null)
  const copyReminderTimeoutRef = useRef<number | null>(null)

  const overviewQuery = useQuery({
    queryKey: ['performance-overview', performanceId],
    queryFn: async () => getPerformanceResponseOverview(performanceId),
    enabled: isOpen && canViewOverview,
  })

  const reminderText = useMemo(() => {
    if (!overviewQuery.data) {
      return ''
    }

    const names = overviewQuery.data.no_response.map((person) => person.display_name).join(', ')

    if (!names) {
      return `Iedereen heeft al gereageerd op ${overviewQuery.data.performance.title}.`
    }

    return `Herinnering: reageer alsjeblieft op ${overviewQuery.data.performance.title} van ${new Date(
      overviewQuery.data.performance.performance_date,
    ).toLocaleDateString('nl-NL')}. Nog geen reactie van: ${names}.`
  }, [overviewQuery.data])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setOpenAccordion('none')
    setCopyReminderLabel('Kopieer herinnering')
    setCopyReminderError(null)
    closeButtonRef.current?.focus()

    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow

    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab' || !panelRef.current) {
        return
      }

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      )

      if (!focusable.length) {
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const activeElement = document.activeElement

      if (event.shiftKey && activeElement === first) {
        event.preventDefault()
        last.focus()
      }

      if (!event.shiftKey && activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
    }
  }, [isOpen, onClose])

  useEffect(() => {
    return () => {
      if (copyReminderTimeoutRef.current) {
        window.clearTimeout(copyReminderTimeoutRef.current)
      }
    }
  }, [])

  if (!isOpen) {
    return null
  }

  async function handleCopyReminder() {
    if (!reminderText) {
      return
    }

    setCopyReminderError(null)

    try {
      await navigator.clipboard.writeText(reminderText)
      setCopyReminderLabel('Herinnering gekopieerd')

      if (copyReminderTimeoutRef.current) {
        window.clearTimeout(copyReminderTimeoutRef.current)
      }

      copyReminderTimeoutRef.current = window.setTimeout(() => {
        setCopyReminderLabel('Kopieer herinnering')
      }, 2000)
    } catch {
      setCopyReminderError('Kopiëren van herinnering mislukt.')
    }
  }

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    touchStartY.current = event.touches[0]?.clientY ?? null
    touchStartX.current = event.touches[0]?.clientX ?? null
  }

  function handleTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    if (touchStartY.current === null || touchStartX.current === null) {
      return
    }

    const currentY = event.touches[0]?.clientY ?? touchStartY.current
    const currentX = event.touches[0]?.clientX ?? touchStartX.current
    const deltaY = currentY - touchStartY.current
    const deltaX = Math.abs(currentX - touchStartX.current)

    if (deltaY > 0 && deltaY > deltaX) {
      setDragOffset(Math.min(deltaY, 160))
    }
  }

  function handleTouchEnd() {
    if (dragOffset > 90) {
      onClose()
      return
    }

    touchStartY.current = null
    touchStartX.current = null
    setDragOffset(0)
  }

  function handleAccordionToggle(key: AccordionKey) {
    setOpenAccordion((current) => (current === key ? 'none' : key))
  }

  function handleStatCardClick(key: AccordionKey) {
    setOpenAccordion(key)

    requestAnimationFrame(() => {
      const section = accordionSectionRefs.current[key]
      const trigger = accordionTriggerRefs.current[key]

      section?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      window.setTimeout(() => trigger?.focus(), 180)
    })
  }

  const overview = overviewQuery.data

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
        style={{ transform: dragOffset ? `translateY(${dragOffset}px)` : undefined }}
      >
        <div
          className="planner-modal__handle"
          aria-hidden="true"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />

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
              <span className="planner-modal__badge">📅 {formatDate(performance.performance_date)}</span>
              {performance.location ? <span className="planner-modal__badge">📍 {performance.location}</span> : null}
              <span className="planner-modal__badge">🟣 {formatStatusLabel(performance.status)}</span>
            </div>
          </header>

          {!canViewOverview ? (
            <Alert tone="error">Alleen planners, admins en owners hebben toegang.</Alert>
          ) : null}

          {canViewOverview && overviewQuery.isLoading ? <LoadingState>Overzicht wordt geladen…</LoadingState> : null}
          {canViewOverview && overviewQuery.error instanceof Error ? (
            <Alert tone="error">{overviewQuery.error.message}</Alert>
          ) : null}

          {canViewOverview && overview ? (
            <>
              <section className="planner-modal__section">
                <div className="planner-stats-grid">
                  <StatCard icon="✅" label="Ja" value={overview.counts.yes} tone="yes" onClick={() => handleStatCardClick('yes')} />
                  <StatCard
                    icon="❓"
                    label="Misschien"
                    value={overview.counts.maybe}
                    tone="maybe"
                    onClick={() => handleStatCardClick('maybe')}
                  />
                  <StatCard icon="❌" label="Nee" value={overview.counts.no} tone="no" onClick={() => handleStatCardClick('no')} />
                  <StatCard
                    icon="🕒"
                    label="Nog niet"
                    value={overview.counts.no_response}
                    tone="none"
                    onClick={() => handleStatCardClick('none')}
                  />
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
                  <ResponseAccordion
                    icon="✅"
                    title="Ja"
                    description="Leden die aanwezig zijn."
                    count={overview.counts.yes}
                    people={overview.yes}
                    emptyText="Nog geen ja-reacties."
                    tone="yes"
                    isOpen={openAccordion === 'yes'}
                    onToggle={() => handleAccordionToggle('yes')}
                    sectionRef={(element) => {
                      accordionSectionRefs.current.yes = element
                    }}
                    triggerRef={(element) => {
                      accordionTriggerRefs.current.yes = element
                    }}
                  />
                  <ResponseAccordion
                    icon="❓"
                    title="Misschien"
                    description="Leden met reden voor twijfel."
                    count={overview.counts.maybe}
                    people={overview.maybe}
                    emptyText="Nog geen misschien-reacties."
                    tone="maybe"
                    showReason
                    isOpen={openAccordion === 'maybe'}
                    onToggle={() => handleAccordionToggle('maybe')}
                    sectionRef={(element) => {
                      accordionSectionRefs.current.maybe = element
                    }}
                    triggerRef={(element) => {
                      accordionTriggerRefs.current.maybe = element
                    }}
                  />
                  <ResponseAccordion
                    icon="❌"
                    title="Nee"
                    description="Leden die niet aanwezig zijn."
                    count={overview.counts.no}
                    people={overview.no}
                    emptyText="Nog geen nee-reacties."
                    tone="no"
                    showReason
                    isOpen={openAccordion === 'no'}
                    onToggle={() => handleAccordionToggle('no')}
                    sectionRef={(element) => {
                      accordionSectionRefs.current.no = element
                    }}
                    triggerRef={(element) => {
                      accordionTriggerRefs.current.no = element
                    }}
                  />
                  <ResponseAccordion
                    icon="🕒"
                    title="Nog niet gereageerd"
                    description="Leden die nog herinnerd moeten worden."
                    count={overview.counts.no_response}
                    people={overview.no_response}
                    emptyText="Iedereen heeft gereageerd."
                    tone="none"
                    action={overview.counts.no_response > 0 ? (
                      <Button type="button" variant="ghost" onClick={() => void handleCopyReminder()}>
                        {copyReminderLabel}
                      </Button>
                    ) : null}
                    isOpen={openAccordion === 'none'}
                    onToggle={() => handleAccordionToggle('none')}
                    sectionRef={(element) => {
                      accordionSectionRefs.current.none = element
                    }}
                    triggerRef={(element) => {
                      accordionTriggerRefs.current.none = element
                    }}
                  />
                </div>

                {copyReminderError ? <Alert tone="error">{copyReminderError}</Alert> : null}
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
                    {overview.instrument_counts.map((item) => (
                      <InstrumentCard key={item.instrument} item={item} />
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

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatStatusLabel(status: Performance['status']) {
  switch (status) {
    case 'draft':
      return 'Concept'
    case 'published':
      return 'Gepubliceerd'
    case 'cancelled':
      return 'Geannuleerd'
    case 'completed':
      return 'Afgerond'
    case 'archived':
      return 'Gearchiveerd'
  }
}
