"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { LoadingSpinner } from "./loading-spinner"

interface GraphLoaderProps {
  className?: string
  height?: string | number
  message?: string
  variant?: "pulse" | "shimmer" | "spinner" | "bars"
}

export function GraphLoader({ 
  className, 
  height = "300px", 
  message = "Loading data...",
  variant = "shimmer" 
}: GraphLoaderProps) {
  const [progress, setProgress] = useState(0)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return prev
        }
        return prev + Math.random() * 10
      })
    }, 500)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-border bg-card/50",
        className
      )}
      style={{ height }}
    >
      {variant === "shimmer" && (
        <div className="w-full max-w-md space-y-4 px-4">
          <div className="h-4 w-full animate-pulse rounded-md bg-muted/60" />
          <div className="flex flex-col gap-2">
            <div className="h-24 w-full animate-pulse rounded-md bg-muted/60" />
            <div className="flex gap-2">
              <div className="h-4 w-1/3 animate-pulse rounded-md bg-muted/60" />
              <div className="h-4 w-1/4 animate-pulse rounded-md bg-muted/60" />
              <div className="h-4 w-1/5 animate-pulse rounded-md bg-muted/60" />
            </div>
          </div>
          <div className="h-4 w-3/4 animate-pulse rounded-md bg-muted/60" />
          <div className="h-4 w-1/2 animate-pulse rounded-md bg-muted/60" />
        </div>
      )}

      {variant === "pulse" && (
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-32 w-32">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20 opacity-75"></div>
            <div className="relative flex h-full w-full items-center justify-center rounded-full bg-primary/30">
              <LoadingSpinner size="lg" className="text-primary" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      )}

      {variant === "spinner" && (
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-muted-foreground">{message}</p>
          <div className="w-64 overflow-hidden rounded-full bg-muted">
            <div 
              className="h-2 rounded-full bg-primary transition-all duration-500 ease-in-out" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{Math.round(progress)}%</p>
        </div>
      )}

      {variant === "bars" && (
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 items-end gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div 
                key={i}
                className="w-3 bg-primary animate-bounce rounded-t-sm" 
                style={{ 
                  height: `${20 + Math.random() * 60}%`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      )}
    </div>
  )
}
