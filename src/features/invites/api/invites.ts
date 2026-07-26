import { supabase } from '../../../lib/supabase/client'

export type BandInvite = {
  id: string
  band_id: string
  created_by: string
  role: 'member'
  is_active: boolean
  expires_at: string | null
  max_uses: number | null
  use_count: number
  last_used_at: string | null
  revoked_at: string | null
  created_at: string
  updated_at: string
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

export type CreateInviteResult = {
  id: string
  token: string
  role: 'member'
  expires_at: string | null
  max_uses: number | null
}

export async function listBandInvites(bandId: string): Promise<BandInvite[]> {
  const { data, error } = await supabase.rpc('get_band_invites', {
    p_band_id: bandId,
  })

  if (error) {
    throw error
  }

  return (data ?? []) as BandInvite[]
}

export async function createBandInvite(input: {
  bandId: string
  expiresAt: string
  maxUses: string
}): Promise<CreateInviteResult> {
  const maxUses = input.maxUses.trim()

  const { data, error } = await supabase.rpc('create_band_invite', {
    p_band_id: input.bandId,
    p_expires_at: input.expiresAt || null,
    p_max_uses: maxUses ? Number(maxUses) : null,
    p_role: 'member',
  })

  if (error) {
    throw error
  }

  return data as CreateInviteResult
}

export async function revokeBandInvite(inviteId: string): Promise<void> {
  const { error } = await supabase.rpc('revoke_band_invite', {
    p_invite_id: inviteId,
  })

  if (error) {
    throw error
  }
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
