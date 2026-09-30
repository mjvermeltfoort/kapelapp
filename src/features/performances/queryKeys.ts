export const performanceKeys = {
  list: (bandId: string | undefined) => ['performances', bandId] as const,
  detail: (performanceId: string | undefined) => ['performance', performanceId] as const,
  overview: (performanceId: string | undefined) => ['performance-overview', performanceId] as const,
  messages: (performanceId: string | undefined) => ['performance-messages', performanceId] as const,
}
