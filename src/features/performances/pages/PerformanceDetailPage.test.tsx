import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PerformanceDetailPage } from './PerformanceDetailPage'

const state = vi.hoisted(() => ({
  role: 'member', sharing: false, status: 'published', bandId: 'band-1', superadmin: false,
}))
vi.mock('../../auth/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' }, profile: { is_superadmin: state.superadmin } }),
}))
vi.mock('../../bands/hooks/useBand', () => ({
  useBand: () => {
    const membership = {
      band_id: state.bandId, role: state.role,
      band: { id: state.bandId, show_member_responses: state.sharing },
    }
    return { activeMembership: membership, memberships: [membership] }
  },
}))
vi.mock('../api/performances', () => ({
  getPerformance: async () => ({
    id: 'performance-1', band_id: 'band-1', title: 'Concert', performance_date: '2026-10-10',
    start_time: '20:00', location: 'Zaal', status: state.status,
  }),
}))
vi.mock('../../responses/api/responses', () => ({ getMyPerformanceResponse: async () => null }))
vi.mock('../components/PerformanceMessages', () => ({ PerformanceMessages: () => null }))
vi.mock('../components/PlannerOverviewModal', () => ({
  PlannerOverviewModal: ({ canViewOverview }: { canViewOverview: boolean }) =>
    <p>{canViewOverview ? 'Overzicht toegestaan' : 'Overzicht afgeschermd'}</p>,
}))

let client: QueryClient
beforeEach(() => {
  Object.assign(state, { role: 'member', sharing: false, status: 'published', bandId: 'band-1', superadmin: false })
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })
})
afterEach(() => { cleanup(); client.clear() })

async function renderPage(path = '/performances/performance-1') {
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/performances/:performanceId/*" element={<PerformanceDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  await screen.findByRole('heading', { name: 'Concert' })
}

describe('response overview visibility', () => {
  it('hides the overview link when member sharing is disabled', async () => {
    await renderPage()
    expect(screen.queryByRole('link', { name: 'Planner-overzicht' })).not.toBeInTheDocument()
  })

  it('shows the link for a member when sharing is enabled', async () => {
    state.sharing = true
    await renderPage()
    expect(screen.getByRole('link', { name: 'Planner-overzicht' })).toBeInTheDocument()
  })

  it.each(['planner', 'admin', 'owner'])('allows %s to see a draft overview with sharing disabled', async (role) => {
    state.role = role
    state.status = 'draft'
    await renderPage()
    expect(screen.getByRole('link', { name: 'Planner-overzicht' })).toBeInTheDocument()
  })

  it('does not expose a cached draft to a member through the overview', async () => {
    state.sharing = true
    state.status = 'draft'
    await renderPage()
    expect(screen.queryByRole('link', { name: 'Planner-overzicht' })).not.toBeInTheDocument()
  })

  it('does not use planner permissions from a different band', async () => {
    state.role = 'planner'
    state.bandId = 'band-2'
    await renderPage()
    expect(screen.queryByRole('link', { name: 'Planner-overzicht' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Wijzigen' })).not.toBeInTheDocument()
  })

  it('blocks the overview even when a member opens the URL directly', async () => {
    await renderPage('/performances/performance-1/planner-overview')
    expect(await screen.findByText('Overzicht afgeschermd')).toBeInTheDocument()
  })
})
