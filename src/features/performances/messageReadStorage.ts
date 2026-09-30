const STORAGE_PREFIX = 'kapelapp.messagesSeen.'

export function readMessagesSeenAt(performanceId: string): string | null {
  try {
    return window.localStorage.getItem(STORAGE_PREFIX + performanceId)
  } catch {
    return null
  }
}

export function storeMessagesSeenAt(performanceId: string, seenAt: string) {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + performanceId, seenAt)
  } catch {
    // Storage can be unavailable in private mode.
  }
}
