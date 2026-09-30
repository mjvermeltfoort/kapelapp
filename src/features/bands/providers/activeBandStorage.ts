const ACTIVE_BAND_STORAGE_KEY = 'kapelapp.activeBandId'

export function readStoredActiveBandId(): string | null {
  try {
    return window.localStorage.getItem(ACTIVE_BAND_STORAGE_KEY)
  } catch {
    return null
  }
}

export function storeActiveBandId(bandId: string | null) {
  try {
    if (bandId) {
      window.localStorage.setItem(ACTIVE_BAND_STORAGE_KEY, bandId)
    } else {
      window.localStorage.removeItem(ACTIVE_BAND_STORAGE_KEY)
    }
  } catch {
    // Storage can be unavailable in private mode.
  }
}

export function clearStoredActiveBandId() {
  storeActiveBandId(null)
}
