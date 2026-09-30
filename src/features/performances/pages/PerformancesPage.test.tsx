import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { toDateKey } from '../../../lib/dates'
import { PerformancesPage } from './PerformancesPage'

const { listBandPerformances, listMyPerformanceResponses, upsertMyPerformanceResponse } = vi.hoisted(() => ({
  listBandPerformances: vi.fn(),
  listMyPerformanceResponses: vi.fn(),
  upsertMyPerformanceResponse: vi.fn(),
}))

vi.mock('../../auth/hooks/useAuth', () => ({
  useAuth: () => ({ profile: { display_name: 'Anna de Vries' } }),
}))

vi.mock('../../bands/hooks/useBand', () => ({
  useBand: () => ({
    activeMembership: { role: 'member', band: { id: 'band-1', name: 'Kapel' } },
  }),
}))

vi.mock('../api/performances', () => ({ listBandPerformances }))

vi.mock('../../responses/api/responses', () => ({ listMyPerformanceResponses, upsertMyPerformanceResponse }))

function dateOffset(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return toDateKey(date)
}

function performance(id: string, title: string, days: number) {
  return {
    id,
    band_id: 'band-1',
    title,
    performance_date: dateOffset(days),
    start_time: '20:00:00',
    end_time: null,
    location: 'Zaal',
    response_deadline: null,
    status: 'published',
  }
}

function renderPage(path = '/performances') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <PerformancesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('PerformancesPage', () => {
  it('lists unanswered upcoming performances first and hides past ones', async () => {
    listBandPerformances.mockResolvedValue([
      performance('past', 'Vorige week', -7),
      performance('answered', 'Morgen', 1),
      performance('open', 'Volgende week', 7),
    ])
    listMyPerformanceResponses.mockResolvedValue([{ performance_id: 'answered', response: 'yes' }])

    renderPage()

    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(2))
    await waitFor(() => expect(screen.getAllByText('Nog niet gereageerd')).toHaveLength(1))
    const titles = screen.getAllByRole('article').map((article) => within(article).getByRole('link', { name: /zaal/i }).textContent)

    expect(titles[0]).toContain('Volgende week')
    expect(titles[1]).toContain('Morgen')
    expect(screen.queryByText('Vorige week')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Optreden toevoegen' })).not.toBeInTheDocument()
  })

  it('shows past performances on the past tab', async () => {
    listBandPerformances.mockResolvedValue([performance('past', 'Vorige week', -7), performance('open', 'Volgende week', 7)])
    listMyPerformanceResponses.mockResolvedValue([])

    renderPage('/performances?view=past')

    expect(await screen.findByText('Vorige week')).toBeInTheDocument()
    expect(screen.queryByText('Volgende week')).not.toBeInTheDocument()
  })

  it('saves a quick yes reply from the card', async () => {
    listBandPerformances.mockResolvedValue([performance('open', 'Volgende week', 7)])
    listMyPerformanceResponses.mockResolvedValue([])
    upsertMyPerformanceResponse.mockResolvedValue({})

    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Ja' }))

    await waitFor(() =>
      expect(upsertMyPerformanceResponse).toHaveBeenCalledWith({ performanceId: 'open', response: 'yes', reason: '' }),
    )
  })
})
