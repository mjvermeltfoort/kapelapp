import { supabase } from '../../../lib/supabase/client'

export type ResponseValue = 'yes' | 'maybe' | 'no'

export type PerformanceResponse = {
  id: string
  performance_id: string
  band_id: string
  user_id: string
  response: ResponseValue
  reason: string | null
  responded_at: string
  created_at: string
  updated_at: string
}

const RESPONSE_SELECT =
  'id, performance_id, band_id, user_id, response, reason, responded_at, created_at, updated_at'

export async function getMyPerformanceResponse(
  performanceId: string,
): Promise<PerformanceResponse | null> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    throw authError
  }

  if (!user) {
    throw new Error('Geen actieve sessie.')
  }

  const { data, error } = await supabase
    .from('performance_responses')
    .select(RESPONSE_SELECT)
    .eq('performance_id', performanceId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    throw error
  }

  return (data ?? null) as PerformanceResponse | null
}

export async function listMyPerformanceResponses(
  performanceIds: string[],
): Promise<PerformanceResponse[]> {
  if (!performanceIds.length) {
    return []
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    throw authError
  }

  if (!user) {
    throw new Error('Geen actieve sessie.')
  }

  const { data, error } = await supabase
    .from('performance_responses')
    .select(RESPONSE_SELECT)
    .eq('user_id', user.id)
    .in('performance_id', performanceIds)

  if (error) {
    throw error
  }

  return (data ?? []) as PerformanceResponse[]
}

export async function upsertMyPerformanceResponse(input: {
  performanceId: string
  response: ResponseValue
  reason: string
}): Promise<PerformanceResponse> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    throw authError
  }

  if (!user) {
    throw new Error('Geen actieve sessie.')
  }

  const reason = input.response === 'yes' ? null : input.reason.trim() || null

  const { data, error } = await supabase
    .from('performance_responses')
    .upsert(
      {
        performance_id: input.performanceId,
        user_id: user.id,
        response: input.response,
        reason,
      },
      {
        onConflict: 'performance_id,user_id',
      },
    )
    .select(RESPONSE_SELECT)
    .single()

  if (error) {
    throw error
  }

  return data as PerformanceResponse
}
