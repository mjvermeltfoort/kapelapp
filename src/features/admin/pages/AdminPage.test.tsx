import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AdminPage } from './AdminPage'

vi.mock('../../auth/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: { is_superadmin: true },
  }),
}))

vi.mock('../../bands/hooks/useBand', () => ({
  useBand: () => ({
    activeMembership: {
      role: 'owner',
    },
  }),
}))

vi.mock('../../bands/pages/BandSettingsPage', () => ({
  BandSettingsPage: () => <p>Kapelinstellingen</p>,
}))

vi.mock('../../members/pages/MembersPage', () => ({
  MembersPage: () => <p>Ledenbeheer</p>,
}))

afterEach(cleanup)

describe('AdminPage', () => {
  it('returns directly to performances', () => {
    const router = createMemoryRouter(
      [
        { path: '/admin', element: <AdminPage /> },
        { path: '/performances', element: <p>Optredens</p> },
      ],
      {
        initialEntries: ['/other-page', '/admin?tab=band'],
        initialIndex: 1,
      },
    )
    render(<RouterProvider router={router} />)

    fireEvent.click(screen.getByRole('button', { name: 'Terug' }))

    expect(router.state.location.pathname).toBe('/performances')
  })
})
