import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type PropsWithChildren, useState } from 'react'
import { AuthProvider } from '../../features/auth/providers/AuthProvider'
import { BandProvider } from '../../features/bands/providers/BandProvider'

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BandProvider>{children}</BandProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
