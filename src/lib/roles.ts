import type { BandRole } from './supabase/types'

export function canManagePerformances(role?: string | null): boolean {
  return ['planner', 'admin', 'owner'].includes(role ?? '')
}

export function isAdminRole(role?: string | null): boolean {
  return ['admin', 'owner'].includes(role ?? '')
}

const ROLE_LABELS: Record<BandRole, string> = {
  member: 'Lid',
  planner: 'Planner',
  admin: 'Beheerder',
  owner: 'Eigenaar',
}

export function formatRoleLabel(role: BandRole): string {
  return ROLE_LABELS[role]
}
