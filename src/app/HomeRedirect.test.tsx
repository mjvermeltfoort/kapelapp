import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { HomeRedirect } from './HomeRedirect'

const mockUseBand = vi.fn()

vi.mock('../features/bands/hooks/useBand', () => ({
  useBand: () => mockUseBand(),
}))

afterEach(() => {
  cleanup()
  mockUseBand.mockReset()
})

describe('HomeRedirect', () => {
  it('shows loading state while memberships load', () => {
    mockUseBand.mockReturnValue({
      activeMembership: null,
      isLoading: true,
      memberships: [],
    })

    render(
      <MemoryRouter>
        <HomeRedirect />
      </MemoryRouter>,
    )

    expect(screen.getByText('Startpagina wordt geladen…')).toBeInTheDocument()
  })

  it('redirects to performances when active membership exists', () => {
    mockUseBand.mockReturnValue({
      activeMembership: { band: { id: 'band-1' } },
      isLoading: false,
      memberships: [{ band_id: 'band-1' }],
    })

    render(
      <MemoryRouter>
        <HomeRedirect />
      </MemoryRouter>,
    )

    expect(screen.queryByText('Startpagina wordt geladen…')).not.toBeInTheDocument()
  })

  it('redirects to bands when no memberships exist', () => {
    mockUseBand.mockReturnValue({
      activeMembership: null,
      isLoading: false,
      memberships: [],
    })

    render(
      <MemoryRouter>
        <HomeRedirect />
      </MemoryRouter>,
    )

    expect(screen.queryByText('Startpagina wordt geladen…')).not.toBeInTheDocument()
  })
})
