import { useQueryClient } from '@tanstack/react-query'
import { type PropsWithChildren, createContext, useEffect, useMemo, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../../../lib/supabase/client'
import { ensureProfile, type Profile, updateMyProfile } from '../../profile/api/profiles'
import { clearStoredActiveBandId } from '../../bands/providers/activeBandStorage'

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
  const queryClient = useQueryClient()
  const [isSessionKnown, setIsSessionKnown] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [profileState, setProfileState] = useState<{ userId: string; profile: Profile | null } | null>(null)
  const user = session?.user ?? null
  const userId = user?.id ?? null
  const userEmail = user?.email

  useEffect(() => {
    let isMounted = true

    void supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        setSession(data.session)
        setIsSessionKnown(true)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession)
      setIsSessionKnown(true)

      if (event === 'SIGNED_OUT') {
        queryClient.clear()
        clearStoredActiveBandId()
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [queryClient])

  useEffect(() => {
    if (!userId) {
      return
    }

    let isCancelled = false

    ensureProfile({ id: userId, email: userEmail })
      .then((profile) => {
        if (!isCancelled) {
          setProfileState({ userId, profile })
        }
      })
      .catch((error: unknown) => {
        console.error('Profile sync failed', error)
        if (!isCancelled) {
          setProfileState({ userId, profile: null })
        }
      })

    return () => {
      isCancelled = true
    }
  }, [userId, userEmail])

  const profile = profileState && profileState.userId === userId ? profileState.profile : null
  const isLoading = !isSessionKnown || (Boolean(userId) && profileState?.userId !== userId)

  const value = useMemo<AuthContextValue>(
    () => ({
      isConfigured: isSupabaseConfigured,
      isLoading,
      session,
      user,
      profile,
      refreshProfile: async () => {
        if (!user) {
          return
        }

        const nextProfile = await ensureProfile(user)
        setProfileState({ userId: user.id, profile: nextProfile })
      },
      saveProfile: async ({ displayName }) => {
        const nextProfile = await updateMyProfile({ displayName })
        setProfileState({ userId: nextProfile.id, profile: nextProfile })
        return nextProfile
      },
      signOut: async () => {
        await supabase.auth.signOut()
        queryClient.clear()
        clearStoredActiveBandId()
      },
    }),
    [isLoading, profile, queryClient, session, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { AuthContext }
