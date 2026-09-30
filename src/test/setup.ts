import '@testing-library/jest-dom/vitest'

function installStorageFallback() {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const probeKey = '__kapelapp_probe__'
    window.localStorage.setItem(probeKey, '1')
    window.localStorage.removeItem(probeKey)
    return
  } catch {
    const store = new Map<string, string>()
    const storage: Storage = {
      get length() {
        return store.size
      },
      clear() {
        store.clear()
      },
      getItem(key) {
        return store.get(key) ?? null
      },
      key(index) {
        return Array.from(store.keys())[index] ?? null
      },
      removeItem(key) {
        store.delete(key)
      },
      setItem(key, value) {
        store.set(key, value)
      },
    }

    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: storage,
    })
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: storage,
    })
  }
}

function alignFetchAndAbortApis() {
  if (typeof window === 'undefined') {
    return
  }

  Object.assign(globalThis, {
    AbortController: window.AbortController,
    AbortSignal: window.AbortSignal,
    Headers: window.Headers,
    Request: window.Request,
    Response: window.Response,
    fetch: window.fetch.bind(window),
  })
}

installStorageFallback()
alignFetchAndAbortApis()
