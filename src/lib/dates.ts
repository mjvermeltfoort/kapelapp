const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

export function parseDateOnly(value: string): Date {
  const match = DATE_ONLY_PATTERN.exec(value)

  if (!match) {
    return new Date(value)
  }

  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

export function toDateKey(date: Date): string {
  return [
    date.getFullYear(),
    `${date.getMonth() + 1}`.padStart(2, '0'),
    `${date.getDate()}`.padStart(2, '0'),
  ].join('-')
}

export function todayKey(now = new Date()): string {
  return toDateKey(now)
}

export function toDateTimeLocal(value: string | null): string {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  return `${toDateKey(date)}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export function dateTimeLocalToISOString(value: string): string | null {
  if (!value) {
    return null
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime()) || toDateTimeLocal(date.toISOString()) !== value) {
    throw new Error('Kies een geldige datum en tijd voor de reactiedeadline.')
  }

  return date.toISOString()
}

export function daysUntil(value: string | Date, now = new Date()): number {
  const target = typeof value === 'string' ? parseDateOnly(value) : value
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((startOfTarget.getTime() - startOfToday.getTime()) / 86_400_000)
}
