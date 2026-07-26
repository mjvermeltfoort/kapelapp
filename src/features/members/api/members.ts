import { supabase } from '../../../lib/supabase/client'
import type { BandMembership } from '../../bands/api/bands'

export type BandMemberRecord = {
  membership_id: string
  band_id: string
  band_name: string
  user_id: string
  email: string
  display_name: string | null
  role: BandMembership['role']
  instrument: string | null
  is_active: boolean
  joined_at: string
  left_at: string | null
}

export async function listBandMembers(bandId: string): Promise<BandMemberRecord[]> {
  const { data, error } = await supabase.rpc('get_band_members', {
    p_band_id: bandId,
  })

  if (error) {
    throw error
  }

  return (data ?? []) as BandMemberRecord[]
}

export async function listAllMembers(): Promise<BandMemberRecord[]> {
  const { data, error } = await supabase.rpc('get_all_members')

  if (error) {
    throw error
  }

  return (data ?? []) as BandMemberRecord[]
}

export async function setBandMemberRole(input: {
  bandId: string
  userId: string
  role: BandMembership['role']
}): Promise<void> {
  const { error } = await supabase.rpc('set_band_member_role', {
    p_band_id: input.bandId,
    p_user_id: input.userId,
    p_role: input.role,
  })

  if (error) {
    throw error
  }
}

export async function deactivateBandMember(input: {
  bandId: string
  userId: string
}): Promise<void> {
  const { error } = await supabase.rpc('deactivate_band_member', {
    p_band_id: input.bandId,
    p_user_id: input.userId,
  })

  if (error) {
    throw error
  }
}

export async function reactivateBandMember(input: {
  bandId: string
  userId: string
}): Promise<void> {
  const { error } = await supabase.rpc('reactivate_band_member', {
    p_band_id: input.bandId,
    p_user_id: input.userId,
  })

  if (error) {
    throw error
  }
}
