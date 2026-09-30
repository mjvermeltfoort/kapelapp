export const bandKeys = {
  memberships: (userId: string | null | undefined) => ['my-band-memberships', userId] as const,
  instruments: (bandId: string | undefined, includeInactive: boolean) =>
    ['band-instruments', bandId, includeInactive] as const,
  members: (bandId: string | undefined) => ['band-members', bandId] as const,
  currentInvite: (bandId: string | undefined) => ['current-band-invite', bandId] as const,
  invitePreview: (token: string | undefined) => ['join-invite-preview', token] as const,
}
