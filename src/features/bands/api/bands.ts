import { supabase } from '../../../lib/supabase/client'
import type { Tables } from '../../../lib/supabase/database.types'
import { type BandRole, toBandRole } from '../../../lib/supabase/types'

export type Band = Pick<
  Tables<'bands'>,
  'id' | 'name' | 'description' | 'show_member_responses' | 'is_archived' | 'created_by' | 'created_at' | 'updated_at'
>

export type BandMembership = Omit<
  Pick<Tables<'band_members'>, 'id' | 'band_id' | 'user_id' | 'role' | 'instrument' | 'is_active' | 'joined_at' | 'left_at'>,
  'role'
> & {
  role: BandRole
  band: Band
}

export async function listMyBandMemberships(): Promise<BandMembership[]> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    throw authError
  }

  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('band_members')
    .select(
      `
        id,
        band_id,
        user_id,
        role,
        instrument,
        is_active,
        joined_at,
        left_at,
        band:bands (
          id,
          name,
          description,
          show_member_responses,
          is_archived,
          created_by,
          created_at,
          updated_at
        )
      `,
    )
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('joined_at', { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => ({ ...row, role: toBandRole(row.role) }))
}

export async function createBand(input: {
  name: string
  description: string
}): Promise<string> {
  const { data, error } = await supabase.rpc('create_band', {
    p_name: input.name.trim(),
    p_description: input.description.trim() || undefined,
  })

  if (error) {
    throw error
  }

  return data
}

export async function updateBand(input: {
  bandId: string
  name: string
  description: string
  showMemberResponses: boolean
}): Promise<Band> {
  const { data, error } = await supabase
    .from('bands')
    .update({
      name: input.name.trim(),
      description: input.description.trim() || null,
      show_member_responses: input.showMemberResponses,
    })
    .eq('id', input.bandId)
    .select(
      'id, name, description, show_member_responses, is_archived, created_by, created_at, updated_at',
    )
    .single()

  if (error) {
    throw error
  }

  return data satisfies Band
}

export async function updateMyInstrument(input: {
  bandId: string
  instrument: string
}): Promise<void> {
  const { error } = await supabase.rpc('update_my_membership_instrument', {
    p_band_id: input.bandId,
    p_instrument: input.instrument,
  })

  if (error) {
    throw error
  }
}

export async function leaveBand(input: { bandId: string }): Promise<void> {
  const { error } = await supabase.rpc('leave_band', {
    p_band_id: input.bandId,
  })

  if (error) {
    throw error
  }
}
