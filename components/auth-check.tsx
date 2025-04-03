"use client"

import type React from "react"

import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function AuthCheck({ children }: { children: React.ReactNode }) {
  const { isLoaded, userId } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push("/sign-in")
    }
  }, [isLoaded, userId, router])

  // Don't render anything until auth is loaded
  if (!isLoaded) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  // If user is authenticated, render children
  if (userId) {
    return <>{children}</>
  }

  // Otherwise, render nothing (will redirect in useEffect)
  return <div className="flex min-h-screen items-center justify-center">Redirecting to sign in...</div>
}

