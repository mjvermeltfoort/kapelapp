import { type PropsWithChildren, createContext, useEffect, useMemo, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../../../lib/supabase/client'
import { ensureProfile, type Profile, updateMyProfile } from '../../profile/api/profiles'

type AuthContextValue = {
  isConfigured: boolean
  isLoading: boolean
  session: Session | null
  user: User | null
  profile: Profile | null
  refreshProfile: () => Promise<void>
  saveProfile: (input: { displayName: string }) => Promise<Profile>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    let isMounted = true

    async function bootstrap() {
      try {
        const { data } = await supabase.auth.getSession()

        if (!isMounted) {
          return
        }

        setSession(data.session)

        if (!data.session?.user) {
          setProfile(null)
          return
        }

        const nextProfile = await ensureProfile(data.session.user)

        if (!isMounted) {
          return
        }

        setProfile(nextProfile)
      } catch (error) {
        console.error('Auth bootstrap failed', error)
        if (isMounted) {
          setProfile(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void bootstrap()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession)

      if (!nextSession?.user) {
        setProfile(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)

      try {
        const nextProfile = await ensureProfile(nextSession.user)

        if (!isMounted) {
          return
        }

        setProfile(nextProfile)
      } catch (error) {
        console.error('Profile sync failed', error)
        if (isMounted) {
          setProfile(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      isConfigured: isSupabaseConfigured,
      isLoading,
      session,
      user: session?.user ?? null,
      profile,
      refreshProfile: async () => {
        if (!session?.user) {
          setProfile(null)
          return
        }

        const nextProfile = await ensureProfile(session.user)
        setProfile(nextProfile)
      },
      saveProfile: async ({ displayName }) => {
        const nextProfile = await updateMyProfile({ displayName })
        setProfile(nextProfile)
        return nextProfile
      },
      signOut: async () => {
        await supabase.auth.signOut()
      },
    }),
    [isLoading, profile, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { AuthContext }
