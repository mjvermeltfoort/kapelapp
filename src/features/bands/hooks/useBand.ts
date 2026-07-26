import { useContext } from 'react'
import { BandContext } from '../providers/BandProvider'

export function useBand() {
  const context = useContext(BandContext)

  if (!context) {
    throw new Error('useBand must be used within BandProvider')
  }

  return context
}
