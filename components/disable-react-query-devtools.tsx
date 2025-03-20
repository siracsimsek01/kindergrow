"use client"

import { useEffect } from "react"

export function DisableReactQueryDevtools() {
  useEffect(() => {
    // Find and remove any React Query DevTools elements
    const removeDevTools = () => {
      const devToolsElements = document.querySelectorAll("[data-rq-devtools]")
      devToolsElements.forEach((element) => {
        element.remove()
      })
    }

    // Run immediately
    removeDevTools()

    // Also set up an interval to keep checking
    const interval = setInterval(removeDevTools, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  return null
}

