"use client"

import type { ReactNode } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Provider as ReduxProvider } from "react-redux"
import { store } from "@/lib/redux/store"
import { SidebarProvider } from "@/contexts/sidebar-context"
import { ChildProvider } from "@/contexts/child-context"
import { Toaster } from "@/components/ui/toaster"
import { QueryProvider } from "@/components/providers/query-provider"

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ReduxProvider store={store}>
      <QueryProvider>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} forcedTheme="dark">
          <SidebarProvider>
            <ChildProvider>
              {children}
              <Toaster />
            </ChildProvider>
          </SidebarProvider>
        </ThemeProvider>
      </QueryProvider>
    </ReduxProvider>
  )
}

