import { supabase } from '../../../lib/supabase/client'
import type { Tables } from '../../../lib/supabase/database.types'

export type PerformanceStatus = 'draft' | 'published' | 'cancelled' | 'completed' | 'archived'

export type Performance = Omit<Tables<'performances'>, 'status'> & { status: PerformanceStatus }

const PERFORMANCE_STATUSES: readonly string[] = ['draft', 'published', 'cancelled', 'completed', 'archived']

function toPerformance(row: Tables<'performances'>): Performance {
  const status = PERFORMANCE_STATUSES.includes(row.status) ? (row.status as PerformanceStatus) : 'draft'
  return { ...row, status }
}

export type PerformanceInput = {
  bandId: string
  title: string
  description: string
  performanceDate: string
  startTime: string
  endTime: string
  gatherTime: string
  location: string
  mapUrl: string
  responseDeadline: string
  status: PerformanceStatus
}

export type PerformanceOverviewPerson = {
  user_id: string
  display_name: string
  instrument: string | null
  reason?: string | null
  responded_at?: string
}

export type PerformanceOverviewInstrumentCount = {
  instrument: string
  yes: number
  maybe: number
  no: number
  no_response: number
  total: number
}

export type PerformanceOverview = {
  performance: Pick<
    Performance,
    'id' | 'title' | 'performance_date' | 'start_time' | 'location' | 'status' | 'response_deadline'
  >
  counts: {
    yes: number
    maybe: number
    no: number
    no_response: number
    total_members: number
  }
  yes: PerformanceOverviewPerson[]
  maybe: PerformanceOverviewPerson[]
  no: PerformanceOverviewPerson[]
  no_response: PerformanceOverviewPerson[]
  instrument_counts: PerformanceOverviewInstrumentCount[]
}

const PERFORMANCE_SELECT =
  'id, band_id, title, description, performance_date, start_time, end_time, gather_time, location, map_url, response_deadline, status, cancelled_at, archived_at, created_by, updated_by, created_at, updated_at'

export async function listBandPerformances(bandId: string): Promise<Performance[]> {
  const { data, error } = await supabase
    .from('performances')
    .select(PERFORMANCE_SELECT)
    .eq('band_id', bandId)
    .order('performance_date', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []).map(toPerformance)
}

export async function getPerformance(performanceId: string): Promise<Performance> {
  const { data, error } = await supabase
    .from('performances')
    .select(PERFORMANCE_SELECT)
    .eq('id', performanceId)
    .single()

  if (error) {
    throw error
  }

  return toPerformance(data)
}

export async function createPerformance(input: PerformanceInput): Promise<Performance> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    throw new Error('Geen actieve sessie.')
  }

  const { data, error } = await supabase
    .from('performances')
    .insert({
      band_id: input.bandId,
      title: input.title.trim(),
      description: input.description.trim() || null,
      performance_date: input.performanceDate,
      start_time: input.startTime,
      end_time: input.endTime || null,
      gather_time: input.gatherTime || null,
      location: input.location.trim(),
      map_url: input.mapUrl.trim() || null,
      response_deadline: input.responseDeadline || null,
      status: input.status,
      cancelled_at: input.status === 'cancelled' ? new Date().toISOString() : null,
      archived_at: input.status === 'archived' ? new Date().toISOString() : null,
      created_by: session.user.id,
      updated_by: session.user.id,
    })
    .select(PERFORMANCE_SELECT)
    .single()

  if (error) {
    throw error
  }

  return toPerformance(data)
}

export async function updatePerformance(
  performanceId: string,
  input: PerformanceInput,
): Promise<Performance> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    throw new Error('Geen actieve sessie.')
  }

  const { data, error } = await supabase
    .from('performances')
    .update({
      title: input.title.trim(),
      description: input.description.trim() || null,
      performance_date: input.performanceDate,
      start_time: input.startTime,
      end_time: input.endTime || null,
      gather_time: input.gatherTime || null,
      location: input.location.trim(),
      map_url: input.mapUrl.trim() || null,
      response_deadline: input.responseDeadline || null,
      status: input.status,
      cancelled_at: input.status === 'cancelled' ? new Date().toISOString() : null,
      archived_at: input.status === 'archived' ? new Date().toISOString() : null,
      updated_by: session.user.id,
    })
    .eq('id', performanceId)
    .select(PERFORMANCE_SELECT)
    .single()

  if (error) {
    throw error
  }

  return toPerformance(data)
}

export async function deletePerformance(performanceId: string): Promise<void> {
  const { error } = await supabase.from('performances').delete().eq('id', performanceId)

  if (error) {
    throw error
  }
}

export async function getPerformanceResponseOverview(
  performanceId: string,
): Promise<PerformanceOverview> {
  const { data, error } = await supabase.rpc('get_performance_response_overview', {
    p_performance_id: performanceId,
  })

  if (error) {
    throw error
  }

  return data as PerformanceOverview
}
