import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RequireAuth } from './RequireAuth'

const refreshProfile = vi.fn()
const authState = vi.hoisted(() => ({
  current: {} as Record<string, unknown>,
}))

vi.mock('../../features/auth/hooks/useAuth', () => ({
  useAuth: () => authState.current,
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

function renderGuarded() {
  render(
    <MemoryRouter initialEntries={['/performances']}>
      <Routes>
        <Route path="/performances" element={<RequireAuth><p>Optredens</p></RequireAuth>} />
        <Route path="/profile/setup" element={<p>Profiel instellen</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RequireAuth', () => {
  it('offers a retry instead of profile setup when the profile could not be loaded', () => {
    authState.current = { isLoading: false, user: { id: 'u1' }, profile: null, profileLoadFailed: true, refreshProfile }

    renderGuarded()

    expect(screen.queryByText('Profiel instellen')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Opnieuw proberen' }))
    expect(refreshProfile).toHaveBeenCalled()
  })

  it('sends users without a display name to profile setup', () => {
    authState.current = { isLoading: false, user: { id: 'u1' }, profile: { display_name: null }, profileLoadFailed: false, refreshProfile }

    renderGuarded()

    expect(screen.getByText('Profiel instellen')).toBeInTheDocument()
  })
})
