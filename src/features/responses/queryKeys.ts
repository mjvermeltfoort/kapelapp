export const responseKeys = {
  mine: (performanceId: string | undefined) => ['my-performance-response', performanceId] as const,
  mineForBand: (bandId: string | undefined) => ['my-performance-responses', bandId] as const,
  mineForPerformances: (bandId: string | undefined, performanceIds: string[]) =>
    ['my-performance-responses', bandId, performanceIds.join(',')] as const,
}
