export const profileKeys = {
  mine: (userId: string | null) => ['my-profile', userId] as const,
  mineWithEmail: (userId: string | null, email: string | undefined) => ['my-profile', userId, email ?? null] as const,
}
