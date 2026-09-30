import type { User } from '@supabase/supabase-js'
import { supabase } from '../../../lib/supabase/client'

export type Profile = {
  id: string
  email: string
  display_name: string | null
  is_superadmin: boolean
  created_at: string
  updated_at: string
}

const PROFILE_COLUMNS = 'id, email, display_name, is_superadmin, created_at, updated_at'

export async function ensureProfile(user: Pick<User, 'id' | 'email'>): Promise<Profile> {
  const email = user.email?.trim()

  if (!email) {
    throw new Error('Ingelogde gebruiker heeft geen e-mailadres.')
  }

  const { data: existing, error: selectError } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', user.id)
    .maybeSingle()

  if (selectError) {
    throw selectError
  }

  if (existing && existing.email === email) {
    return existing satisfies Profile
  }

  const query = existing
    ? supabase.from('profiles').update({ email }).eq('id', user.id)
    : supabase.from('profiles').insert({ id: user.id, email })

  const { data, error } = await query.select(PROFILE_COLUMNS).single()

  if (error) {
    throw error
  }

  return data satisfies Profile
}

export async function updateMyProfile(input: { displayName: string }): Promise<Profile> {
  const displayName = input.displayName.trim()

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
    .from('profiles')
    .update({ display_name: displayName })
    .eq('id', user.id)
    .select(PROFILE_COLUMNS)
    .single()

  if (error) {
    throw error
  }

  return data satisfies Profile
}
