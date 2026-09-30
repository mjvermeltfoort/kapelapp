import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RequireAuth } from '../../../app/router/RequireAuth'
import type { Profile } from '../../profile/api/profiles'
import { profileKeys } from '../../profile/queryKeys'
import { useAuth } from '../hooks/useAuth'
import { AuthProvider } from './AuthProvider'

const api = vi.hoisted(() => ({
  ensureProfile: vi.fn(),
  updateMyProfile: vi.fn(),
}))

vi.mock('../../profile/api/profiles', () => api)
vi.mock('../../../lib/supabase/client', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: { user: { id: 'u1', email: 'member@example.com' } } } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}))

const completeProfile: Profile = {
  id: 'u1', email: 'member@example.com', display_name: 'Mark', is_superadmin: false,
  created_at: '2026-09-30T12:00:00Z', updated_at: '2026-09-30T12:00:00Z',
}
const incompleteProfile = { ...completeProfile, display_name: null }
const key = profileKeys.mineWithEmail('u1', 'member@example.com')
let client: QueryClient

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => { resolve = done })
  return { promise, resolve }
}

function ProfileEditor() {
  const { profile, saveProfile } = useAuth()
  return <>
    <p>{profile?.display_name ?? 'Geen naam'}</p>
    <button onClick={() => void saveProfile({ displayName: 'Mark' })}>Naam opslaan</button>
  </>
}

function renderApp(guarded = true) {
  return render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/performances']}>
          {guarded ? <Routes>
            <Route path="/performances" element={<RequireAuth><p>Optredens</p></RequireAuth>} />
            <Route path="/profile/setup" element={<p>Profiel instellen</p>} />
          </Routes> : <ProfileEditor />}
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  onlineManager.setOnline(true)
  client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 30_000, gcTime: Infinity } } })
})

afterEach(() => {
  cleanup()
  client.clear()
  onlineManager.setOnline(true)
})

describe('profile restoration', () => {
  it('checks a cached incomplete profile before opening setup', async () => {
    const read = deferred<Profile>()
    client.setQueryData(key, incompleteProfile)
    api.ensureProfile.mockReturnValue(read.promise)
    renderApp()

    await waitFor(() => expect(api.ensureProfile).toHaveBeenCalled())
    expect(screen.queryByText('Profiel instellen')).not.toBeInTheDocument()
    await act(async () => { read.resolve(completeProfile) })
    expect(await screen.findByText('Optredens')).toBeInTheDocument()
    expect(screen.queryByText('Profiel instellen')).not.toBeInTheDocument()
  })

  it('opens setup when the server confirms the profile is incomplete', async () => {
    api.ensureProfile.mockResolvedValue(incompleteProfile)
    renderApp()
    expect(await screen.findByText('Profiel instellen')).toBeInTheDocument()
  })

  it('offers retry when a cached incomplete profile cannot be checked', async () => {
    client.setQueryData(key, incompleteProfile, { updatedAt: 1 })
    api.ensureProfile.mockRejectedValue(new Error('Network unavailable'))
    renderApp()
    expect(await screen.findByRole('button', { name: 'Opnieuw proberen' })).toBeInTheDocument()
    expect(screen.queryByText('Profiel instellen')).not.toBeInTheDocument()
  })

  it('keeps a complete cached profile available offline', async () => {
    client.setQueryData(key, completeProfile, { updatedAt: 1 })
    onlineManager.setOnline(false)
    renderApp()
    expect(await screen.findByText('Optredens')).toBeInTheDocument()
    expect(api.ensureProfile).not.toHaveBeenCalled()
  })

  it('does not treat an incomplete offline cache as confirmed setup', async () => {
    client.setQueryData(key, incompleteProfile, { updatedAt: 1 })
    onlineManager.setOnline(false)
    renderApp()
    expect(await screen.findByRole('button', { name: 'Opnieuw proberen' })).toBeInTheDocument()
    expect(screen.queryByText('Profiel instellen')).not.toBeInTheDocument()
  })

  it('does not overwrite a saved name with an older in-flight profile read', async () => {
    const read = deferred<Profile>()
    client.setQueryData(key, incompleteProfile, { updatedAt: 1 })
    api.ensureProfile.mockReturnValue(read.promise)
    api.updateMyProfile.mockResolvedValue(completeProfile)
    renderApp(false)
    await waitFor(() => expect(api.ensureProfile).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: 'Naam opslaan' }))
    expect(await screen.findByText('Mark')).toBeInTheDocument()
    await act(async () => { read.resolve(incompleteProfile) })
    await waitFor(() => expect(client.isFetching()).toBe(0))
    expect(client.getQueryData<Profile>(key)?.display_name).toBe('Mark')
  })
})
