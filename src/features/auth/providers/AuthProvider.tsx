import { useQuery, useQueryClient } from '@tanstack/react-query'
import { type PropsWithChildren, createContext, useEffect, useMemo, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../../../lib/supabase/client'
import { ensureProfile, type Profile, updateMyProfile } from '../../profile/api/profiles'
import { clearStoredActiveBandId } from '../../bands/providers/activeBandStorage'
import { clearPersistedQueries } from '../../../lib/queryPersistence'
import { profileKeys } from '../../profile/queryKeys'

type AuthContextValue = {
  isConfigured: boolean
  isLoading: boolean
  session: Session | null
  user: User | null
  profile: Profile | null
  profileLoadFailed: boolean
  refreshProfile: () => Promise<void>
  saveProfile: (input: { displayName: string }) => Promise<Profile>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient()
  const [isSessionKnown, setIsSessionKnown] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
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
        clearPersistedQueries()
        clearStoredActiveBandId()
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [queryClient])

  const profileQuery = useQuery({
    queryKey: profileKeys.mineWithEmail(userId, userEmail),
    queryFn: async () => ensureProfile({ id: userId!, email: userEmail }),
    enabled: Boolean(userId),
    staleTime: 0,
  })

  const profile = userId ? (profileQuery.data ?? null) : null
  // An incomplete cached profile is not proof that onboarding is still needed.
  const needsProfileVerification = !profile?.display_name?.trim()
  const profileLoadFailed =
    Boolean(userId) && needsProfileVerification && (profileQuery.isError || profileQuery.fetchStatus === 'paused')
  const isLoading = !isSessionKnown || (
    Boolean(userId) && needsProfileVerification && !profileLoadFailed
    && (!profileQuery.isFetchedAfterMount || profileQuery.isFetching)
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      isConfigured: isSupabaseConfigured,
      isLoading,
      session,
      user,
      profile,
      profileLoadFailed,
      refreshProfile: async () => {
        if (!user) {
          return
        }

        await queryClient.refetchQueries({ queryKey: profileKeys.mine(user.id) })
      },
      saveProfile: async ({ displayName }) => {
        const nextProfile = await updateMyProfile({ displayName })
        await queryClient.cancelQueries({ queryKey: profileKeys.mine(nextProfile.id) })
        queryClient.setQueriesData({ queryKey: profileKeys.mine(nextProfile.id) }, nextProfile)
        return nextProfile
      },
      signOut: async () => {
        await supabase.auth.signOut()
        queryClient.clear()
        clearPersistedQueries()
        clearStoredActiveBandId()
      },
    }),
    [isLoading, profile, profileLoadFailed, queryClient, session, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { AuthContext }
