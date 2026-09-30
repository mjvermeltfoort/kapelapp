import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BandInstrumentsSection } from './BandInstrumentsSection'

const { createBandInstrument, listBandInstruments, listBandMembers } = vi.hoisted(() => ({
  createBandInstrument: vi.fn(),
  listBandInstruments: vi.fn(),
  listBandMembers: vi.fn(),
}))

vi.mock('../api/instruments', () => ({
  createBandInstrument,
  deactivateBandInstrument: vi.fn(),
  listBandInstruments,
  updateBandInstrument: vi.fn(),
}))

vi.mock('../../members/api/members', () => ({ listBandMembers }))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('BandInstrumentsSection', () => {
  it('suggests member instruments that are missing from the list once', async () => {
    listBandInstruments.mockResolvedValue([{ id: 'i1', name: 'Trompet', is_active: true }])
    listBandMembers.mockResolvedValue([
      { user_id: 'a', is_active: true, instrument: 'trompet' },
      { user_id: 'b', is_active: true, instrument: 'Tuba' },
      { user_id: 'c', is_active: true, instrument: ' tuba ' },
      { user_id: 'd', is_active: false, instrument: 'Klarinet' },
    ])
    createBandInstrument.mockResolvedValue(undefined)

    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <BandInstrumentsSection bandId="band-1" />
      </QueryClientProvider>,
    )

    expect(await screen.findByText('Tuba')).toBeVisible()
    expect(screen.getAllByText('Nog niet in lijst')).toHaveLength(1)
    expect(screen.queryByText('Klarinet')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Toevoegen aan lijst' }))

    await waitFor(() => expect(createBandInstrument).toHaveBeenCalledWith('band-1', 'Tuba'))
    expect(await screen.findByText('Instrument toegevoegd.')).toBeVisible()
  })
})
