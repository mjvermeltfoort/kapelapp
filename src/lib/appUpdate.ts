import type { RegisterSWOptions } from 'virtual:pwa-register'

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000

type ServiceWorkerRegistrar = (options: RegisterSWOptions) => (reloadPage?: boolean) => Promise<void>

let updateAvailable = false
let applyServiceWorkerUpdate: ((reloadPage?: boolean) => Promise<void>) | null = null
const listeners = new Set<() => void>()

function setUpdateAvailable(value: boolean) {
  updateAvailable = value
  listeners.forEach((listener) => listener())
}

export function subscribeToAppUpdate(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function isAppUpdateAvailable() {
  return updateAvailable
}

export async function applyAppUpdate() {
  if (applyServiceWorkerUpdate) {
    await applyServiceWorkerUpdate(true)
  } else {
    window.location.reload()
  }
}

export function startAppUpdates(register: ServiceWorkerRegistrar) {
  if (!('serviceWorker' in navigator)) {
    return
  }

  applyServiceWorkerUpdate = register({
    immediate: true,
    onNeedRefresh() {
      setUpdateAvailable(true)
    },
    onRegisteredSW(_swScriptUrl, registration) {
      if (!registration) {
        return
      }

      const checkForUpdate = () => {
        if (document.visibilityState === 'visible' && navigator.onLine) {
          void registration.update().catch(() => undefined)
        }
      }

      window.setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS)
      document.addEventListener('visibilitychange', checkForUpdate)
    },
  })
}
