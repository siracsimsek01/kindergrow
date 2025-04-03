"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import { useSidebar } from "@/contexts/sidebar-context"
import { useEffect, useState } from "react"

interface MainContentProps {
  children: React.ReactNode
}

// Dummy components to resolve the undeclared variable errors
const RemoveSeededData = () => {
  return null
}

const NotificationCenter = () => {
  return null
}

export function MainContent({ children }: MainContentProps) {
  const { isOpen } = useSidebar()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="flex-1">{children}</div>
  }

  return (
    <div className={cn("flex-1 transition-all duration-300", isOpen ? "md:ml-64" : "md:ml-16")}>
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <RemoveSeededData />
            <NotificationCenter />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}

