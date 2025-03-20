"use client"

import { LoadingSpinner } from "./loading-spinner"

interface LoadingScreenProps {
  message?: string
}

export function LoadingScreen({ message = "Loading..." }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
      <LoadingSpinner size="lg" className="mb-4" />
      <p className="text-lg font-medium text-muted-foreground">{message}</p>
    </div>
  )
}
;