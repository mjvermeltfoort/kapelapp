import { supabase } from '../../../lib/supabase/client'

export type PerformanceMessage = {
  id: string
  performance_id: string
  band_id: string
  user_id: string
  author_name: string
  body: string
  created_at: string
}

const PERFORMANCE_MESSAGE_SELECT =
  'id, performance_id, band_id, user_id, author_name, body, created_at'

export async function listPerformanceMessages(performanceId: string): Promise<PerformanceMessage[]> {
  const { data, error } = await supabase
    .from('performance_messages')
    .select(PERFORMANCE_MESSAGE_SELECT)
    .eq('performance_id', performanceId)
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []) as PerformanceMessage[]
}

export async function createPerformanceMessage(input: {
  performanceId: string
  body: string
}): Promise<PerformanceMessage> {
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
    .from('performance_messages')
    .insert({
      performance_id: input.performanceId,
      user_id: user.id,
      body: input.body.trim(),
    })
    .select(PERFORMANCE_MESSAGE_SELECT)
    .single()

  if (error) {
    throw error
  }

  return data as PerformanceMessage
}

export async function deletePerformanceMessage(messageId: string): Promise<void> {
  const { error } = await supabase.from('performance_messages').delete().eq('id', messageId)

  if (error) {
    throw error
  }
}
