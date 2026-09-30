import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPerformance, updatePerformance, type PerformanceInput } from './performances'

const db = vi.hoisted(() => ({ insert: vi.fn(), update: vi.fn() }))
vi.mock('../../../lib/supabase/client', () => ({
  supabase: {
    auth: { getSession: async () => ({ data: { session: { user: { id: 'user-1' } } } }) },
    from: () => db,
  },
}))

const input: PerformanceInput = {
  bandId: 'band-1', title: 'Optreden', description: '', performanceDate: '2026-08-12',
  startTime: '20:00', endTime: '', gatherTime: '', location: 'Zaal', mapUrl: '',
  responseDeadline: '2026-07-15T19:30', status: 'published',
}

beforeEach(() => {
  vi.clearAllMocks()
  const query = {
    select: () => query,
    eq: () => query,
    single: async () => ({ data: { status: 'published' }, error: null }),
  }
  db.insert.mockReturnValue(query)
  db.update.mockReturnValue(query)
})

describe('performance deadlines', () => {
  it('sends an explicit UTC timestamp when creating', async () => {
    await createPerformance(input)
    expect(db.insert).toHaveBeenCalledWith(expect.objectContaining({
      response_deadline: new Date(2026, 6, 15, 19, 30).toISOString(),
    }))
  })

  it('sends an explicit UTC timestamp when updating', async () => {
    await updatePerformance('performance-1', { ...input, responseDeadline: '2026-01-15T19:30' })
    expect(db.update).toHaveBeenCalledWith(expect.objectContaining({
      response_deadline: new Date(2026, 0, 15, 19, 30).toISOString(),
    }))
  })

  it('clears a removed deadline', async () => {
    await updatePerformance('performance-1', { ...input, responseDeadline: '' })
    expect(db.update).toHaveBeenCalledWith(expect.objectContaining({ response_deadline: null }))
  })
})
