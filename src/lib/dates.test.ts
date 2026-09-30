import { describe, expect, it } from 'vitest'
import { dateTimeLocalToISOString, daysUntil, parseDateOnly, todayKey, toDateTimeLocal } from './dates'

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

  it.each([0, 6, 9, 11])('round-trips a local deadline in month %i', (month) => {
    const local = `2026-${String(month + 1).padStart(2, '0')}-15T19:30`
    const instant = new Date(2026, month, 15, 19, 30).toISOString()

    expect(dateTimeLocalToISOString(local)).toBe(instant)
    expect(toDateTimeLocal(instant)).toBe(local)
    expect(dateTimeLocalToISOString(toDateTimeLocal(instant))).toBe(instant)
  })

  it('converts an explicit UTC offset to the browser local time', () => {
    const instant = '2026-09-30T19:30:00+02:00'
    const date = new Date(instant)
    const expected = `${todayKey(date)}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    expect(toDateTimeLocal(instant)).toBe(expected)
    expect(dateTimeLocalToISOString(expected)).toBe('2026-09-30T17:30:00.000Z')
  })

  it('keeps an optional deadline empty', () => {
    expect(toDateTimeLocal(null)).toBe('')
    expect(dateTimeLocalToISOString('')).toBeNull()
  })

  it('rejects invalid dates instead of normalizing them silently', () => {
    expect(() => dateTimeLocalToISOString('not-a-date')).toThrow()
    expect(() => dateTimeLocalToISOString('2026-02-30T12:00')).toThrow()
  })
})
