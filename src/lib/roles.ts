export function canManagePerformances(role?: string | null): boolean {
  return ['planner', 'admin', 'owner'].includes(role ?? '')
}

export function isAdminRole(role?: string | null): boolean {
  return ['admin', 'owner'].includes(role ?? '')
}
