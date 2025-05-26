import type React from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface PageSkeletonProps {
  title?: boolean
  description?: boolean
  cards?: number
  charts?: number
  tables?: number
}

export function PageSkeleton({
  title = true,
  description = true,
  cards = 4,
  charts = 1,
  tables = 1,
}: PageSkeletonProps) {
  return (
    <div className="space-y-6">
      {title && <Skeleton className="h-8 w-[250px]" />}
      {description && <Skeleton className="h-4 w-[350px]" />}

      {cards > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: cards }).map((_, i) => (
            <div key={i} className="rounded-lg border p-4">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
              <Skeleton className="mt-3 h-8 w-[80px]" />
              <Skeleton className="mt-2 h-3 w-[120px]" />
            </div>
          ))}
        </div>
      )}

      {charts > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: charts }).map((_, i) => (
            <div key={i} className="rounded-lg border p-4">
              <div className="flex justify-between mb-4">
                <Skeleton className="h-5 w-[150px]" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
              <Skeleton className="h-[300px] w-full" />
            </div>
          ))}
        </div>
      )}

      {tables > 0 && (
        <div className="rounded-lg border">
          <div className="p-4 border-b">
            <Skeleton className="h-5 w-[150px]" />
          </div>
          <div className="p-4">
            <div className="flex justify-between mb-4">
              <Skeleton className="h-10 w-[200px]" />
              <Skeleton className="h-10 w-[120px]" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-2 border-b last:border-0">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function DashboardSkeleton() {
  return <PageSkeleton cards={5} charts={2} tables={1} />
}

export function SleepPageSkeleton() {
  return <PageSkeleton cards={5} charts={1} tables={1} />
}

export function FeedingPageSkeleton() {
  return <PageSkeleton cards={4} charts={2} tables={1} />
}

export function DiaperPageSkeleton() {
  return <PageSkeleton cards={3} charts={2} tables={1} />
}

export function ReportsPageSkeleton() {
  return <PageSkeleton charts={3} tables={0} />
}

export function SettingsPageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-[150px]" />
      <Skeleton className="h-4 w-[250px]" />
      <div className="space-y-4">
        <div className="rounded-lg border p-4">
          <Skeleton className="h-5 w-[150px] mb-4" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <Skeleton className="h-5 w-[150px] mb-4" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function StatCardSkeleton({ isLoading, children }: { isLoading: boolean; children: React.ReactNode }) {
  if (!isLoading) return <>{children}</>

  return (
    <div className="p-4 space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  )
}

export function ChartSkeleton({
  isLoading,
  children,
  height = "h-[300px]",
}: { isLoading: boolean; children: React.ReactNode; height?: string }) {
  if (!isLoading) return <>{children}</>

  return (
    <div className={`${height} flex flex-col space-y-3 p-4`}>
      <div className="flex justify-between">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      <Skeleton className="flex-grow" />
      <div className="flex justify-center space-x-2">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  )
}

export function TableSkeleton({
  isLoading,
  children,
  rows = 5,
}: { isLoading: boolean; children: React.ReactNode; rows?: number }) {
  if (!isLoading) return <>{children}</>

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-8 w-1/4" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-2 border-b last:border-0">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
