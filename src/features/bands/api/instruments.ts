import { supabase } from '../../../lib/supabase/client'
import type { Tables } from '../../../lib/supabase/database.types'

export type BandInstrument = Tables<'band_instruments'>

export async function listBandInstruments(bandId: string, includeInactive = false): Promise<BandInstrument[]> {
  const { data, error } = await supabase.rpc('get_band_instruments', {
    p_band_id: bandId,
    p_include_inactive: includeInactive,
  })

  if (error) {
    throw error
  }

  return data ?? []
}

export async function createBandInstrument(bandId: string, name: string): Promise<BandInstrument> {
  const { data, error } = await supabase.rpc('create_band_instrument', {
    p_band_id: bandId,
    p_name: name,
  })

  if (error) {
    throw error
  }

  return data
}

export async function updateBandInstrument(instrumentId: string, name: string): Promise<BandInstrument> {
  const { data, error } = await supabase.rpc('update_band_instrument', {
    p_instrument_id: instrumentId,
    p_name: name,
  })

  if (error) {
    throw error
  }

  return data
}

export async function deactivateBandInstrument(instrumentId: string): Promise<BandInstrument> {
  const { data, error } = await supabase.rpc('deactivate_band_instrument', {
    p_instrument_id: instrumentId,
  })

  if (error) {
    throw error
  }

  return data
}
