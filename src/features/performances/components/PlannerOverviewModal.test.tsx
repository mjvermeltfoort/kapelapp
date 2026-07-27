import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PlannerOverviewModal } from './PlannerOverviewModal'

const getPerformanceResponseOverview = vi.fn()

vi.mock('../api/performances', async () => {
  const actual = await vi.importActual<typeof import('../api/performances')>('../api/performances')

  return {
    ...actual,
    getPerformanceResponseOverview: (...args: Parameters<typeof actual.getPerformanceResponseOverview>) =>
      getPerformanceResponseOverview(...args),
  }
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('PlannerOverviewModal', () => {
  const performance = {
    id: 'perf-1',
    band_id: 'band-1',
    title: 'Kermisoptreden',
    description: null,
    performance_date: '2026-08-30',
    start_time: '14:00:00',
    end_time: null,
    gather_time: null,
    location: 'Schijndel',
    map_url: null,
    response_deadline: null,
    status: 'published' as const,
    cancelled_at: null,
    archived_at: null,
    created_by: 'user-1',
    updated_by: 'user-1',
    created_at: '2026-07-27T10:00:00.000Z',
    updated_at: '2026-07-27T10:00:00.000Z',
  }

  beforeEach(() => {
    getPerformanceResponseOverview.mockReset()
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0)
      return 1
    })
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  function renderModal(canViewOverview = true) {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })

    return render(
      <QueryClientProvider client={queryClient}>
        <PlannerOverviewModal
          performanceId="perf-1"
          performance={performance}
          canViewOverview={canViewOverview}
          isOpen
          onClose={vi.fn()}
        />
      </QueryClientProvider>,
    )
  }

  it('shows permission error when overview not allowed', () => {
    renderModal(false)

    expect(screen.getByText('Alleen planners, admins en owners hebben toegang.')).toBeInTheDocument()
  })

  it('loads overview and copies reminder only when no responders pending', async () => {
    getPerformanceResponseOverview.mockResolvedValue({
      performance: {
        id: 'perf-1',
        title: 'Kermisoptreden',
        performance_date: '2026-08-30',
        start_time: '14:00:00',
        location: 'Schijndel',
        status: 'published',
        response_deadline: null,
      },
      counts: {
        yes: 1,
        maybe: 1,
        no: 0,
        no_response: 1,
        total_members: 3,
      },
      yes: [{ user_id: '1', display_name: 'Anne', instrument: 'Trompet', responded_at: '2026-07-27T12:00:00.000Z' }],
      maybe: [{ user_id: '2', display_name: 'Bram', instrument: 'Slagwerk', reason: 'Werk', responded_at: '2026-07-27T13:00:00.000Z' }],
      no: [],
      no_response: [{ user_id: '3', display_name: 'Chris', instrument: 'Bas' }],
      instrument_counts: [{ instrument: 'Trompet', yes: 1, maybe: 0, no: 0, no_response: 0, total: 1 }],
    })

    renderModal(true)

    expect(await screen.findByText('Reacties')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '1Nog niet' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '1Nog niet' }))

    const copyButton = await screen.findByRole('button', { name: 'Kopieer herinnering' })
    fireEvent.click(copyButton)

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled()
    })

    expect(screen.getByText('Herinnering gekopieerd')).toBeInTheDocument()
    expect(screen.getByText('Verdeling per instrument')).toBeInTheDocument()
  })
})
