import type { User } from '@supabase/supabase-js'
import { supabase } from '../../../lib/supabase/client'

export type Profile = {
  id: string
  email: string
  display_name: string | null
  created_at: string
  updated_at: string
}

export async function ensureProfile(user: User): Promise<Profile> {
  const email = user.email?.trim()

  if (!email) {
    throw new Error('Ingelogde gebruiker heeft geen e-mailadres.')
  }

  const { error: upsertError } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      email,
    },
    {
      onConflict: 'id',
      ignoreDuplicates: false,
    },
  )

  if (upsertError) {
    throw upsertError
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, display_name, created_at, updated_at')
    .eq('id', user.id)
    .single()

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
    .select('id, email, display_name, created_at, updated_at')
    .single()

  if (error) {
    throw error
  }

  return data satisfies Profile
}
