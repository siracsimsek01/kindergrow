"use client"

import type React from "react"

import { useEffect } from "react"
import { useAuth } from "@clerk/nextjs"

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, userId } = useAuth()

  useEffect(() => {
    if (isLoaded && userId) {
      // Sync user data
      fetch("/api/auth/sync", {
        method: "POST",
      }).catch(console.error)
    }
  }, [isLoaded, userId])

  return <>{children}</>
}

