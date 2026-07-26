import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  type PropsWithChildren,
  createContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  createBand,
  leaveBand,
  listMyBandMemberships,
  type BandMembership,
  updateMyInstrument,
} from '../api/bands'
import { useAuth } from '../../auth/hooks/useAuth'

type BandContextValue = {
  activeBandId: string | null
  activeMembership: BandMembership | null
  memberships: BandMembership[]
  isLoading: boolean
  error: string | null
  setActiveBandId: (bandId: string) => void
  refreshBands: () => Promise<void>
  createOwnedBand: (input: { name: string; description: string }) => Promise<string>
  saveMyInstrument: (input: { bandId: string; instrument: string }) => Promise<void>
  leaveActiveBand: () => Promise<void>
}

const ACTIVE_BAND_STORAGE_KEY = 'kapelapp.activeBandId'

const BandContext = createContext<BandContextValue | null>(null)

export function BandProvider({ children }: PropsWithChildren) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [activeBandId, setActiveBandIdState] = useState<string | null>(null)

  const membershipsQuery = useQuery({
    queryKey: ['my-band-memberships', user?.id],
    queryFn: listMyBandMemberships,
    enabled: Boolean(user),
  })

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const storedBandId = window.localStorage.getItem(ACTIVE_BAND_STORAGE_KEY)
    if (storedBandId) {
      setActiveBandIdState(storedBandId)
    }
  }, [])

  useEffect(() => {
    const memberships = membershipsQuery.data ?? []

    if (!memberships.length) {
      setActiveBandIdState(null)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(ACTIVE_BAND_STORAGE_KEY)
      }
      return
    }

    const hasActiveSelection = activeBandId
      ? memberships.some((membership) => membership.band_id === activeBandId)
      : false

    if (hasActiveSelection) {
      return
    }

    const nextBandId = memberships[0]?.band_id ?? null
    setActiveBandIdState(nextBandId)

    if (typeof window !== 'undefined') {
      if (nextBandId) {
        window.localStorage.setItem(ACTIVE_BAND_STORAGE_KEY, nextBandId)
      } else {
        window.localStorage.removeItem(ACTIVE_BAND_STORAGE_KEY)
      }
    }
  }, [activeBandId, membershipsQuery.data])

  const value = useMemo<BandContextValue>(() => {
    const memberships = membershipsQuery.data ?? []
    const activeMembership = memberships.find((membership) => membership.band_id === activeBandId) ?? null

    return {
      activeBandId,
      activeMembership,
      memberships,
      isLoading: membershipsQuery.isLoading,
      error: membershipsQuery.error instanceof Error ? membershipsQuery.error.message : null,
      setActiveBandId: (bandId: string) => {
        setActiveBandIdState(bandId)
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(ACTIVE_BAND_STORAGE_KEY, bandId)
        }
      },
      refreshBands: async () => {
        await membershipsQuery.refetch()
      },
      createOwnedBand: async (input) => {
        const bandId = await createBand(input)
        await queryClient.invalidateQueries({ queryKey: ['my-band-memberships', user?.id] })
        setActiveBandIdState(bandId)
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(ACTIVE_BAND_STORAGE_KEY, bandId)
        }
        return bandId
      },
      saveMyInstrument: async (input) => {
        await updateMyInstrument(input)
        await queryClient.invalidateQueries({ queryKey: ['my-band-memberships', user?.id] })
      },
      leaveActiveBand: async () => {
        if (!activeBandId) {
          return
        }

        await leaveBand({ bandId: activeBandId })
        await queryClient.invalidateQueries({ queryKey: ['my-band-memberships', user?.id] })
      },
    }
  }, [activeBandId, membershipsQuery, queryClient, user?.id])

  return <BandContext.Provider value={value}>{children}</BandContext.Provider>
}

export { BandContext }
