import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MembersPage } from './MembersPage'

const { deactivateBandMember, listBandMembers } = vi.hoisted(() => ({
  deactivateBandMember: vi.fn(),
  listBandMembers: vi.fn(),
}))

vi.mock('../../auth/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: { is_superadmin: true },
    user: { id: 'admin-user' },
  }),
}))

vi.mock('../../bands/hooks/useBand', () => ({
  useBand: () => ({
    activeMembership: {
      role: 'owner',
      band: {
        id: 'active-band',
        name: 'Actieve kapel',
      },
    },
  }),
}))

vi.mock('../api/members', () => ({
  deactivateBandMember,
  deleteBandMember: vi.fn(),
  listBandMembers,
  reactivateBandMember: vi.fn(),
  setBandMemberRole: vi.fn(),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('MembersPage', () => {
  it('loads only members of the active band for a superadmin', async () => {
    listBandMembers.mockResolvedValue([
      {
        membership_id: 'membership-1',
        band_id: 'active-band',
        band_name: 'Actieve kapel',
        user_id: 'member-1',
        email: 'lid@example.com',
        display_name: 'Lid',
        role: 'member',
        instrument: null,
        is_active: true,
        joined_at: '2026-01-01T00:00:00.000Z',
        left_at: null,
      },
    ])
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <MembersPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    await waitFor(() => expect(listBandMembers).toHaveBeenCalledWith('active-band'))
    expect(screen.getByText('Kapel: Actieve kapel')).toBeInTheDocument()
    expect(await screen.findByText('lid@example.com')).toBeInTheDocument()
  })

  it('asks for confirmation before deactivating a member', async () => {
    listBandMembers.mockResolvedValue([
      {
        membership_id: 'membership-1',
        band_id: 'active-band',
        band_name: 'Actieve kapel',
        user_id: 'member-1',
        email: 'lid@example.com',
        display_name: 'Lid',
        role: 'member',
        instrument: null,
        is_active: true,
        joined_at: '2026-01-01T00:00:00.000Z',
        left_at: null,
      },
    ])
    deactivateBandMember.mockResolvedValue(undefined)

    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter>
          <MembersPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Deactiveren' }))
    expect(deactivateBandMember).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Ja, deactiveren' }))

    await waitFor(() =>
      expect(deactivateBandMember).toHaveBeenCalledWith({ bandId: 'active-band', userId: 'member-1' }),
    )
    expect(await screen.findByText('Lid gedeactiveerd.')).toBeVisible()
  })
})
