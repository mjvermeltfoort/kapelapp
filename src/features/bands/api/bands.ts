import { supabase } from '../../../lib/supabase/client'

export type Band = {
  id: string
  name: string
  description: string | null
  show_member_responses: boolean
  is_archived: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export type BandMembership = {
  id: string
  band_id: string
  user_id: string
  role: 'member' | 'planner' | 'admin' | 'owner'
  instrument: string | null
  is_active: boolean
  joined_at: string
  left_at: string | null
  band: Band
}

function mapMembership(row: {
  id: string
  band_id: string
  user_id: string
  role: BandMembership['role']
  instrument: string | null
  is_active: boolean
  joined_at: string
  left_at: string | null
  band: Band
}): BandMembership {
  return {
    id: row.id,
    band_id: row.band_id,
    user_id: row.user_id,
    role: row.role,
    instrument: row.instrument,
    is_active: row.is_active,
    joined_at: row.joined_at,
    left_at: row.left_at,
    band: row.band,
  }
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

  return (data ?? []).map((row) => {
    const rawBand = row.band as Band | Band[]
    return mapMembership({
      ...row,
      band: Array.isArray(rawBand) ? rawBand[0] : rawBand,
    })
  })
}

export async function createBand(input: {
  name: string
  description: string
}): Promise<string> {
  const { data, error } = await supabase.rpc('create_band', {
    p_name: input.name.trim(),
    p_description: input.description.trim() || null,
  })

  if (error) {
    throw error
  }

  return data as string
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
}): Promise<BandMembership> {
  const { data, error } = await supabase.rpc('update_my_membership_instrument', {
    p_band_id: input.bandId,
    p_instrument: input.instrument,
  })

  if (error) {
    throw error
  }

  return data as BandMembership
}

export async function leaveBand(input: { bandId: string }): Promise<void> {
  const { error } = await supabase.rpc('leave_band', {
    p_band_id: input.bandId,
  })

  if (error) {
    throw error
  }
}
