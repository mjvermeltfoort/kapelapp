import { supabase } from '../../../lib/supabase/client'

export type BandInstrument = {
  id: string
  band_id: string
  name: string
  normalized_name: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function listBandInstruments(bandId: string, includeInactive = false): Promise<BandInstrument[]> {
  const { data, error } = await supabase.rpc('get_band_instruments', {
    p_band_id: bandId,
    p_include_inactive: includeInactive,
  })

  if (error) {
    throw error
  }

  return (data ?? []) as BandInstrument[]
}

export async function createBandInstrument(bandId: string, name: string): Promise<BandInstrument> {
  const { data, error } = await supabase.rpc('create_band_instrument', {
    p_band_id: bandId,
    p_name: name,
  })

  if (error) {
    throw error
  }

  return data as BandInstrument
}

export async function updateBandInstrument(instrumentId: string, name: string): Promise<BandInstrument> {
  const { data, error } = await supabase.rpc('update_band_instrument', {
    p_instrument_id: instrumentId,
    p_name: name,
  })

  if (error) {
    throw error
  }

  return data as BandInstrument
}

export async function deactivateBandInstrument(instrumentId: string): Promise<BandInstrument> {
  const { data, error } = await supabase.rpc('deactivate_band_instrument', {
    p_instrument_id: instrumentId,
  })

  if (error) {
    throw error
  }

  return data as BandInstrument
}
