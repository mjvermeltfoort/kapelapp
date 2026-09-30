import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { type PropsWithChildren, useState } from 'react'
import { AuthProvider } from '../../features/auth/providers/AuthProvider'
import { BandProvider } from '../../features/bands/providers/BandProvider'
import { PERSIST_MAX_AGE_MS, queryPersister, shouldPersistQuery } from '../../lib/queryPersistence'

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 30_000,
            gcTime: PERSIST_MAX_AGE_MS,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: queryPersister,
        maxAge: PERSIST_MAX_AGE_MS,
        buster: __APP_VERSION__,
        dehydrateOptions: { shouldDehydrateQuery: shouldPersistQuery },
      }}
    >
      <AuthProvider>
        <BandProvider>{children}</BandProvider>
      </AuthProvider>
    </PersistQueryClientProvider>
  )
}
