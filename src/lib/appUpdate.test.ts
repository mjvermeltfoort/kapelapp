import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RegisterSWOptions } from 'virtual:pwa-register'
import { applyAppUpdate, isAppUpdateAvailable, startAppUpdates, subscribeToAppUpdate } from './appUpdate'

function enableServiceWorkerSupport() {
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: {},
  })
}

afterEach(() => {
  Reflect.deleteProperty(navigator, 'serviceWorker')
})

describe('app updates', () => {
  it('does nothing when service workers are unsupported', () => {
    const register = vi.fn()

    startAppUpdates(register)

    expect(register).not.toHaveBeenCalled()
  })

  it('flags an available update and applies it on request', async () => {
    enableServiceWorkerSupport()
    const updateServiceWorker = vi.fn(async () => undefined)
    let options: RegisterSWOptions | undefined
    const register = vi.fn((nextOptions: RegisterSWOptions) => {
      options = nextOptions
      return updateServiceWorker
    })
    const listener = vi.fn()
    const unsubscribe = subscribeToAppUpdate(listener)

    startAppUpdates(register)

    expect(register).toHaveBeenCalledWith(expect.objectContaining({ immediate: true }))
    expect(isAppUpdateAvailable()).toBe(false)

    options?.onNeedRefresh?.()

    expect(isAppUpdateAvailable()).toBe(true)
    expect(listener).toHaveBeenCalledOnce()

    await applyAppUpdate()

    expect(updateServiceWorker).toHaveBeenCalledWith(true)
    unsubscribe()
  })
})
