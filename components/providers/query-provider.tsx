"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { type ReactNode, useRef } from "react"

interface QueryProviderProps {
  children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Use useRef instead of useState to prevent re-renders
  const queryClientRef = useRef<QueryClient>()

  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // 5 minutes
          refetchOnWindowFocus: false,
          retry: 1,
        },
      },
    })
  }

  return (
    <QueryClientProvider client={queryClientRef.current}>
      {children}
      {/* Set position to bottom-right and disable floating mode to prevent popup issues */}
      <ReactQueryDevtools initialIsOpen={false}  buttonPosition="bottom-right" />
    </QueryClientProvider>
  )
}

