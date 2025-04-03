"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

interface LoadingScreenProps {
  message?: string
}

export function LoadingScreen({ message = "Loading..." }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [hasShown, setHasShown] = useState(false)

  // Use localStorage to track if we've shown the loading screen in this session
  useEffect(() => {
    const hasShownBefore = localStorage.getItem("loadingScreenShown")
    if (hasShownBefore === "true") {
      setHasShown(true)
      return
    }

    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(timer)
          localStorage.setItem("loadingScreenShown", "true")
          return 100
        }
        return prevProgress + 5
      })
    }, 50)

    return () => {
      clearInterval(timer)
    }
  }, [])

  // Don't show if we've already shown it once
  if (hasShown) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#1e293b] backdrop-blur-sm">
      <div className="relative w-[120px] h-[120px]">
        <div
          className="absolute inset-0 logo-placeholder animate-pulse"
          style={{ clipPath: `inset(0 ${100 - progress}% 0 0)` }}
        />
        <Image src="/logo.png" alt="KinderGrow Logo" fill className="object-contain" priority />
      </div>
      <p className="text-lg font-medium text-[#cbd5e1] mt-4">{message}</p>
    </div>
  )
}

