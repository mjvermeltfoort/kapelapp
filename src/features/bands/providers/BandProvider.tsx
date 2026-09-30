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
import { getErrorMessage } from '../../../lib/errors'
import { bandKeys } from '../queryKeys'
import { readStoredActiveBandId, storeActiveBandId } from './activeBandStorage'

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

const BandContext = createContext<BandContextValue | null>(null)

export function BandProvider({ children }: PropsWithChildren) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id ?? null
  const [selection, setSelection] = useState(() => ({ userId, bandId: readStoredActiveBandId() }))
  const selectedBandId = selection.userId === userId ? selection.bandId : readStoredActiveBandId()

  const membershipsQuery = useQuery({
    queryKey: bandKeys.memberships(userId),
    queryFn: listMyBandMemberships,
    enabled: Boolean(user),
  })
  const { data: membershipsData, isLoading, error: membershipsError, refetch } = membershipsQuery

  const activeBandId = useMemo(() => {
    if (!membershipsData) {
      return null
    }

    const hasSelection = membershipsData.some((membership) => membership.band_id === selectedBandId)
    return hasSelection ? selectedBandId : (membershipsData[0]?.band_id ?? null)
  }, [membershipsData, selectedBandId])

  useEffect(() => {
    if (membershipsData) {
      storeActiveBandId(activeBandId)
    }
  }, [activeBandId, membershipsData])

  const value = useMemo<BandContextValue>(() => {
    const memberships = membershipsData ?? []
    const activeMembership = memberships.find((membership) => membership.band_id === activeBandId) ?? null
    const membershipsKey = bandKeys.memberships(userId)

    return {
      activeBandId,
      activeMembership,
      memberships,
      isLoading,
      error: membershipsError ? getErrorMessage(membershipsError, 'Kapellen laden mislukt.') : null,
      setActiveBandId: (bandId: string) => {
        setSelection({ userId, bandId })
        storeActiveBandId(bandId)
      },
      refreshBands: async () => {
        await refetch()
      },
      createOwnedBand: async (input) => {
        const bandId = await createBand(input)
        setSelection({ userId, bandId })
        storeActiveBandId(bandId)
        await queryClient.invalidateQueries({ queryKey: membershipsKey })
        return bandId
      },
      saveMyInstrument: async (input) => {
        await updateMyInstrument(input)
        await queryClient.invalidateQueries({ queryKey: membershipsKey })
      },
      leaveActiveBand: async () => {
        if (!activeBandId) {
          return
        }

        await leaveBand({ bandId: activeBandId })
        await queryClient.invalidateQueries({ queryKey: membershipsKey })
      },
    }
  }, [activeBandId, isLoading, membershipsData, membershipsError, queryClient, refetch, userId])

  return <BandContext.Provider value={value}>{children}</BandContext.Provider>
}

export { BandContext }
