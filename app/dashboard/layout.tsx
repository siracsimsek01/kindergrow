import type React from "react"
import type { Metadata } from "next"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Sidebar } from "@/components/sidebar"
import { MobileSidebar } from "@/components/mobile-sidebar"
import { NotificationCenter } from "@/components/notification-center"
import { ChildProvider } from "@/contexts/child-context"
import { RemoveSeededData } from "@/components/remove-seeded-data"
import { StoreUser } from "@/components/store-user"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: "Dashboard | KinderGrow",
  description: "Track your child's development, sleep patterns, feeding schedules, and more.",
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ChildProvider>
      <StoreUser />
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen bg-background ml-64 w-screen">
          <Sidebar className="hidden lg:flex" />
          <div className="flex flex-col flex-1">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
              <MobileSidebar />
              <div className="flex-1" />
              <div className="flex items-center gap-2">
                <RemoveSeededData />
                <NotificationCenter />
              </div>
            </header>
            <main className="flex-1 p-4 sm:p-6">{children}</main>
          </div>
        </div>
      </SidebarProvider>
      <Toaster />
    </ChildProvider>
  )
}

