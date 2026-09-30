import type { Database, TablesInsert } from './database.types'

type PublicTable = keyof Database['public']['Tables']

export type FilledByTrigger<T extends PublicTable, K extends keyof TablesInsert<T>> = Omit<TablesInsert<T>, K>

export type BandRole = 'member' | 'planner' | 'admin' | 'owner'

const BAND_ROLES: readonly string[] = ['member', 'planner', 'admin', 'owner']

export function toBandRole(role: string): BandRole {
  return BAND_ROLES.includes(role) ? (role as BandRole) : 'member'
}
