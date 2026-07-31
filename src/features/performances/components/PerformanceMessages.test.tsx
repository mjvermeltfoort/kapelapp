import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PerformanceMessages } from './PerformanceMessages'

const listPerformanceMessages = vi.fn()
const createPerformanceMessage = vi.fn()
const deletePerformanceMessage = vi.fn()

vi.mock('../api/messages', () => ({
  listPerformanceMessages: (...args: unknown[]) => listPerformanceMessages(...args),
  createPerformanceMessage: (...args: unknown[]) => createPerformanceMessage(...args),
  deletePerformanceMessage: (...args: unknown[]) => deletePerformanceMessage(...args),
}))

afterEach(() => {
  cleanup()
  vi.resetAllMocks()
})

function renderMessages(props: Partial<React.ComponentProps<typeof PerformanceMessages>> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={queryClient}>
      <PerformanceMessages performanceId="performance-1" userId="user-1" canModerate={false} {...props} />
    </QueryClientProvider>,
  )
}

describe('PerformanceMessages', () => {
  it('shows messages and only exposes deletion to the author', async () => {
    listPerformanceMessages.mockResolvedValue([
      {
        id: 'message-1',
        user_id: 'user-1',
        author_name: 'Anne',
        body: 'Ik neem bladmuziek mee.',
        created_at: '2026-08-01T10:00:00.000Z',
      },
      {
        id: 'message-2',
        user_id: 'user-2',
        author_name: 'Bram',
        body: 'Ik ben er iets later.',
        created_at: '2026-08-01T10:05:00.000Z',
      },
    ])

    renderMessages()

    expect(await screen.findByText('Ik neem bladmuziek mee.')).toBeVisible()
    expect(screen.getByText('Ik ben er iets later.')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Verwijder bericht van Anne' })).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Verwijder bericht van Bram' })).not.toBeInTheDocument()
  })

  it('allows a moderator to delete every message', async () => {
    listPerformanceMessages.mockResolvedValue([
      {
        id: 'message-2',
        user_id: 'user-2',
        author_name: 'Bram',
        body: 'Ik ben er iets later.',
        created_at: '2026-08-01T10:05:00.000Z',
      },
    ])

    renderMessages({ canModerate: true })

    expect(await screen.findByRole('button', { name: 'Verwijder bericht van Bram' })).toBeVisible()
  })

  it('places a message and refreshes the list', async () => {
    listPerformanceMessages.mockResolvedValue([])
    createPerformanceMessage.mockResolvedValue({})

    renderMessages()

    await screen.findByText(/nog geen berichten/i)
    fireEvent.change(screen.getByRole('textbox', { name: 'Nieuw bericht' }), {
      target: { value: '  Tot zondag!  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Bericht plaatsen' }))

    await waitFor(() => {
      expect(createPerformanceMessage).toHaveBeenCalledWith({
        performanceId: 'performance-1',
        body: 'Tot zondag!',
      })
    })
    expect(listPerformanceMessages).toHaveBeenCalledTimes(2)
  })

  it('rejects an empty message before sending it', async () => {
    listPerformanceMessages.mockResolvedValue([])
    renderMessages()

    await screen.findByText(/nog geen berichten/i)
    fireEvent.click(screen.getByRole('button', { name: 'Bericht plaatsen' }))

    expect(screen.getByText('Schrijf eerst een bericht.')).toBeVisible()
    expect(createPerformanceMessage).not.toHaveBeenCalled()
  })
})
