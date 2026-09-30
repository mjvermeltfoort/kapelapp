import { parseDateOnly } from '../../lib/dates'
import type { Performance, PerformanceOverview, PerformanceOverviewPerson } from './api/performances'

export type ResponseTone = 'yes' | 'maybe' | 'no' | 'none'

type OverviewGroupKey = 'yes' | 'maybe' | 'no' | 'no_response'

export const RESPONSE_GROUPS: {
  tone: ResponseTone
  key: OverviewGroupKey
  icon: string
  label: string
  title: string
  description: string
  emptyText: string
  showReason: boolean
}[] = [
  {
    tone: 'yes',
    key: 'yes',
    icon: '✅',
    label: 'Ja',
    title: 'Ja',
    description: 'Leden die aanwezig zijn.',
    emptyText: 'Nog geen ja-reacties.',
    showReason: false,
  },
  {
    tone: 'maybe',
    key: 'maybe',
    icon: '❓',
    label: 'Misschien',
    title: 'Misschien',
    description: 'Leden met reden voor twijfel.',
    emptyText: 'Nog geen misschien-reacties.',
    showReason: true,
  },
  {
    tone: 'no',
    key: 'no',
    icon: '❌',
    label: 'Nee',
    title: 'Nee',
    description: 'Leden die niet aanwezig zijn.',
    emptyText: 'Nog geen nee-reacties.',
    showReason: true,
  },
  {
    tone: 'none',
    key: 'no_response',
    icon: '🕒',
    label: 'Nog niet',
    title: 'Nog niet gereageerd',
    description: 'Leden die nog herinnerd moeten worden.',
    emptyText: 'Iedereen heeft gereageerd.',
    showReason: false,
  },
]

export type InstrumentPeople = Record<OverviewGroupKey, PerformanceOverviewPerson[]>

export function groupPeopleByInstrument(overview: PerformanceOverview) {
  const grouped = new Map<string, InstrumentPeople>()

  for (const { key } of RESPONSE_GROUPS) {
    for (const person of overview[key]) {
      const instrumentKey = normalizeInstrumentName(person.instrument ?? 'Onbekend')
      const group = grouped.get(instrumentKey) ?? { yes: [], maybe: [], no: [], no_response: [] }
      group[key].push(person)
      grouped.set(instrumentKey, group)
    }
  }

  return overview.instrument_counts.map((item) => ({
    item,
    people: grouped.get(normalizeInstrumentName(item.instrument)) ?? { yes: [], maybe: [], no: [], no_response: [] },
  }))
}

export function buildReminderText(overview: PerformanceOverview) {
  const names = overview.no_response.map((person) => person.display_name).join(', ')

  if (!names) {
    return `Iedereen heeft al gereageerd op ${overview.performance.title}.`
  }

  return `Herinnering: reageer alsjeblieft op ${overview.performance.title} van ${parseDateOnly(
    overview.performance.performance_date,
  ).toLocaleDateString('nl-NL')}. Nog geen reactie van: ${names}.`
}

export function formatOverviewDate(value: string) {
  return parseDateOnly(value).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatStatusLabel(status: Performance['status']) {
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

function normalizeInstrumentName(name: string) {
  return name.trim().toLowerCase()
}
