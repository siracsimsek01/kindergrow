"use client"

import { useUser } from "@clerk/nextjs"
import { useEffect } from "react"

export function StoreUser() {
  const { isLoaded, isSignedIn, user } = useUser()

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      // Store comprehensive user info in localStorage
      localStorage.setItem(
        "lastSignedInUser",
        JSON.stringify({
          id: user.id,
          name: user.firstName || user.lastName || user.username || "User",
          email: user.primaryEmailAddress?.emailAddress,
          imageUrl: user.imageUrl,
          lastSignIn: new Date().toISOString(),
          fullName: user.fullName,
        }),
      )
    }
  }, [isLoaded, isSignedIn, user])

  return null
}

