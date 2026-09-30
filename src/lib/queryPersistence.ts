import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import type { Query } from '@tanstack/react-query'

const PERSIST_STORAGE_KEY = 'kapelapp.queryCache'
const PERSISTED_QUERY_ROOTS = new Set([
  'my-band-memberships',
  'performances',
  'performance',
  'my-performance-responses',
  'my-performance-response',
])

export const PERSIST_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

export const queryPersister = createSyncStoragePersister({
  storage: typeof window === 'undefined' ? undefined : window.localStorage,
  key: PERSIST_STORAGE_KEY,
})

export function shouldPersistQuery(query: Query) {
  return query.state.status === 'success' && PERSISTED_QUERY_ROOTS.has(String(query.queryKey[0]))
}

export function clearPersistedQueries() {
  try {
    window.localStorage.removeItem(PERSIST_STORAGE_KEY)
  } catch {
    // Storage can be unavailable in private mode.
  }
}
