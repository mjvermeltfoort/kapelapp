import { supabase } from '../../../lib/supabase/client'

export type CurrentBandInvite = {
  id: string
  token: string
  role: 'member'
  expires_at: string | null
  max_uses: number | null
  use_count: number
  created_at: string
}

export type InvitePreview = {
  status: 'valid' | 'invalid' | 'expired' | 'revoked' | 'exhausted'
  band_id?: string
  band_name?: string
}

export type AcceptInviteResult = {
  band_id: string
  band_name: string
  membership_status: 'created' | 'reactivated' | 'already_active'
}

export async function getCurrentBandInvite(bandId: string): Promise<CurrentBandInvite> {
  const { data, error } = await supabase.rpc('get_current_band_invite', {
    p_band_id: bandId,
  })

  if (error) {
    throw error
  }

  return data as CurrentBandInvite
}

export async function regenerateBandInvite(bandId: string): Promise<CurrentBandInvite> {
  const { data, error } = await supabase.rpc('regenerate_band_invite', {
    p_band_id: bandId,
  })

  if (error) {
    throw error
  }

  return data as CurrentBandInvite
}

export async function getJoinInvitePreview(token: string): Promise<InvitePreview> {
  const { data, error } = await supabase.rpc('get_join_invite_preview', {
    p_token: token,
  })

  if (error) {
    throw error
  }

  return data as InvitePreview
}

export async function acceptBandInvite(token: string): Promise<AcceptInviteResult> {
  const { data, error } = await supabase.rpc('accept_band_invite', {
    p_token: token,
  })

  if (error) {
    throw error
  }

  return data as AcceptInviteResult
}
