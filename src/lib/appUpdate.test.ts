import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RegisterSWOptions } from 'virtual:pwa-register'
import { waitForLatestAppVersion } from './appUpdate'

function enableServiceWorkerSupport() {
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: {},
  })
}

function registration(update: () => Promise<ServiceWorkerRegistration>) {
  return { update } as ServiceWorkerRegistration
}

afterEach(() => {
  Reflect.deleteProperty(navigator, 'serviceWorker')
  vi.useRealTimers()
})

describe('waitForLatestAppVersion', () => {
  it('finishes immediately when service workers are unsupported', async () => {
    const register = vi.fn()

    await waitForLatestAppVersion(register)

    expect(register).not.toHaveBeenCalled()
  })

  it('checks for an update before finishing', async () => {
    enableServiceWorkerSupport()
    const update = vi.fn(async () => registration(update))
    const register = vi.fn((options: RegisterSWOptions) => {
      options.onRegisteredSW?.('/sw.js', registration(update))
    })

    await waitForLatestAppVersion(register)

    expect(update).toHaveBeenCalledOnce()
    expect(register).toHaveBeenCalledWith(expect.objectContaining({ immediate: true }))
  })

  it('waits for an updated worker to activate', async () => {
    enableServiceWorkerSupport()
    const worker = new EventTarget() as ServiceWorker
    Object.defineProperty(worker, 'state', { configurable: true, value: 'installing' })
    const updatedRegistration = { installing: worker } as ServiceWorkerRegistration
    const register = vi.fn((options: RegisterSWOptions) => {
      options.onRegisteredSW?.(
        '/sw.js',
        registration(async () => updatedRegistration),
      )
    })
    let finished = false
    const result = waitForLatestAppVersion(register).then(() => {
      finished = true
    })

    await Promise.resolve()
    expect(finished).toBe(false)

    Object.defineProperty(worker, 'state', { configurable: true, value: 'activated' })
    worker.dispatchEvent(new Event('statechange'))
    await result

    expect(finished).toBe(true)
  })

  it('finishes when registration or update fails', async () => {
    enableServiceWorkerSupport()
    const registerError = vi.fn((options: RegisterSWOptions) => {
      options.onRegisterError?.(new Error('offline'))
    })
    const updateError = vi.fn((options: RegisterSWOptions) => {
      options.onRegisteredSW?.(
        '/sw.js',
        registration(async () => {
          throw new Error('offline')
        }),
      )
    })

    await expect(waitForLatestAppVersion(registerError)).resolves.toBeUndefined()
    await expect(waitForLatestAppVersion(updateError)).resolves.toBeUndefined()
  })

  it('stops waiting after the timeout', async () => {
    enableServiceWorkerSupport()
    vi.useFakeTimers()
    const register = vi.fn()
    const result = waitForLatestAppVersion(register, 3_000)

    await vi.advanceTimersByTimeAsync(3_000)

    await expect(result).resolves.toBeUndefined()
  })
})
