import { describe, expect, it } from 'vitest'
import type { PerformanceOverview } from './api/performances'
import { buildReminderText, groupPeopleByInstrument } from './plannerOverview'

function overview(overrides: Partial<PerformanceOverview> = {}): PerformanceOverview {
  return {
    performance: {
      id: 'p1',
      title: 'Kermis',
      performance_date: '2026-10-03',
      start_time: '20:00:00',
      location: 'Plein',
      status: 'published',
      response_deadline: null,
    },
    counts: { yes: 0, maybe: 0, no: 0, no_response: 0, total_members: 0 },
    yes: [],
    maybe: [],
    no: [],
    no_response: [],
    instrument_counts: [],
    ...overrides,
  }
}

describe('groupPeopleByInstrument', () => {
  it('groups people per instrument case-insensitively and keeps the count order', () => {
    const groups = groupPeopleByInstrument(
      overview({
        yes: [{ user_id: 'a', display_name: 'Anna', instrument: 'Trompet' }],
        no_response: [
          { user_id: 'b', display_name: 'Bram', instrument: 'trompet ' },
          { user_id: 'c', display_name: 'Cor', instrument: null },
        ],
        instrument_counts: [
          { instrument: 'Onbekend', yes: 0, maybe: 0, no: 0, no_response: 1, total: 1 },
          { instrument: 'Trompet', yes: 1, maybe: 0, no: 0, no_response: 1, total: 2 },
          { instrument: 'Tuba', yes: 0, maybe: 0, no: 0, no_response: 0, total: 0 },
        ],
      }),
    )

    expect(groups.map((group) => group.item.instrument)).toEqual(['Onbekend', 'Trompet', 'Tuba'])
    expect(groups[0].people.no_response.map((person) => person.display_name)).toEqual(['Cor'])
    expect(groups[1].people.yes.map((person) => person.display_name)).toEqual(['Anna'])
    expect(groups[1].people.no_response.map((person) => person.display_name)).toEqual(['Bram'])
    expect(groups[2].people).toEqual({ yes: [], maybe: [], no: [], no_response: [] })
  })
})

describe('buildReminderText', () => {
  it('lists members without a response', () => {
    const text = buildReminderText(
      overview({ no_response: [{ user_id: 'b', display_name: 'Bram', instrument: null }] }),
    )

    expect(text).toBe('Herinnering: reageer alsjeblieft op Kermis van 3-10-2026. Nog geen reactie van: Bram.')
  })

  it('says everyone responded when nobody is missing', () => {
    expect(buildReminderText(overview())).toBe('Iedereen heeft al gereageerd op Kermis.')
  })
})
