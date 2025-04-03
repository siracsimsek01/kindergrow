import type React from "react"
import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
  children?: React.ReactNode
  isLoading: boolean
}

export function Skeleton({ className, children, isLoading }: SkeletonProps) {
  if (!isLoading) return <>{children}</>

  return <div className={cn("animate-pulse rounded-md bg-muted/40", className)} />
}

interface CardSkeletonProps {
  isLoading: boolean
  children: React.ReactNode
}

export function CardSkeleton({ isLoading, children }: CardSkeletonProps) {
  if (!isLoading) return <>{children}</>

  return (
    <div className="space-y-4 p-4">
      <Skeleton isLoading={true} className="h-8 w-3/4" />
      <Skeleton isLoading={true} className="h-4 w-1/2" />
      <div className="space-y-2 pt-4">
        <Skeleton isLoading={true} className="h-24 w-full" />
        <Skeleton isLoading={true} className="h-24 w-full" />
        <Skeleton isLoading={true} className="h-24 w-full" />
      </div>
    </div>
  )
}

interface ChartSkeletonProps {
  isLoading: boolean
  children: React.ReactNode
  height?: string
}

export function ChartSkeleton({ isLoading, children, height = "h-[300px]" }: ChartSkeletonProps) {
  if (!isLoading) return <>{children}</>

  return (
    <div className={`${height} flex flex-col space-y-3 p-4`}>
      <div className="flex justify-between">
        <Skeleton isLoading={true} className="h-4 w-1/4" />
        <Skeleton isLoading={true} className="h-4 w-1/4" />
      </div>
      <Skeleton isLoading={true} className="flex-grow" />
      <div className="flex justify-center space-x-2">
        <Skeleton isLoading={true} className="h-3 w-12" />
        <Skeleton isLoading={true} className="h-3 w-12" />
        <Skeleton isLoading={true} className="h-3 w-12" />
      </div>
    </div>
  )
}

interface StatCardSkeletonProps {
  isLoading: boolean
  children: React.ReactNode
}

export function StatCardSkeleton({ isLoading, children }: StatCardSkeletonProps) {
  if (!isLoading) return <>{children}</>

  return (
    <div className="p-4 space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton isLoading={true} className="h-4 w-1/2" />
        <Skeleton isLoading={true} className="h-4 w-4 rounded-full" />
      </div>
      <Skeleton isLoading={true} className="h-8 w-1/3" />
      <Skeleton isLoading={true} className="h-3 w-2/3" />
    </div>
  )
}

interface TableSkeletonProps {
  isLoading: boolean
  children: React.ReactNode
  rows?: number
}

export function TableSkeleton({ isLoading, children, rows = 5 }: TableSkeletonProps) {
  if (!isLoading) return <>{children}</>

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Skeleton isLoading={true} className="h-8 w-1/3" />
        <Skeleton isLoading={true} className="h-8 w-1/4" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-2 border-b last:border-0">
            <Skeleton isLoading={true} className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton isLoading={true} className="h-4 w-3/4" />
              <Skeleton isLoading={true} className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

