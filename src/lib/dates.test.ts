import { describe, expect, it } from 'vitest'
import { daysUntil, parseDateOnly, todayKey } from './dates'

describe('dates', () => {
  it('parses date-only strings as local dates', () => {
    const date = parseDateOnly('2026-03-01')

    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(2)
    expect(date.getDate()).toBe(1)
    expect(date.getHours()).toBe(0)
  })

  it('builds today key from local time', () => {
    expect(todayKey(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05')
  })

  it('counts calendar days until a date', () => {
    const now = new Date(2026, 0, 5, 23, 30)

    expect(daysUntil('2026-01-05', now)).toBe(0)
    expect(daysUntil('2026-01-07', now)).toBe(2)
    expect(daysUntil(new Date(2026, 0, 4, 8), now)).toBe(-1)
  })
})
