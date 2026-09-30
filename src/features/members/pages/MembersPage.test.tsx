import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MembersPage } from './MembersPage'

const { listBandMembers } = vi.hoisted(() => ({
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
  deactivateBandMember: vi.fn(),
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
        <MembersPage />
      </QueryClientProvider>,
    )

    await waitFor(() => expect(listBandMembers).toHaveBeenCalledWith('active-band'))
    expect(screen.getByText('Kapel: Actieve kapel')).toBeInTheDocument()
    expect(screen.getByText('Lid')).toBeInTheDocument()
  })
})
