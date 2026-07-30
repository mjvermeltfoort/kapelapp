import type { RegisterSWOptions } from 'virtual:pwa-register'

const UPDATE_TIMEOUT_MS = 3_000

type ServiceWorkerRegistrar = (options: RegisterSWOptions) => unknown

function waitForWorker(worker: ServiceWorker): Promise<void> {
  if (worker.state === 'activated' || worker.state === 'redundant') {
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    const handleStateChange = () => {
      if (worker.state !== 'activated' && worker.state !== 'redundant') {
        return
      }

      worker.removeEventListener('statechange', handleStateChange)
      resolve()
    }

    worker.addEventListener('statechange', handleStateChange)
  })
}

export function waitForLatestAppVersion(
  register: ServiceWorkerRegistrar,
  timeoutMs = UPDATE_TIMEOUT_MS,
): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    let finished = false
    const finish = () => {
      if (finished) {
        return
      }

      finished = true
      window.clearTimeout(timeout)
      resolve()
    }
    const timeout = window.setTimeout(finish, timeoutMs)

    try {
      register({
        immediate: true,
        onRegisteredSW(_swScriptUrl, registration) {
          if (!registration) {
            finish()
            return
          }

          void registration
            .update()
            .then((updatedRegistration) => {
              const worker = updatedRegistration.installing ?? updatedRegistration.waiting
              return worker ? waitForWorker(worker) : undefined
            })
            .then(finish, finish)
        },
        onRegisterError: finish,
      })
    } catch {
      finish()
    }
  })
}
