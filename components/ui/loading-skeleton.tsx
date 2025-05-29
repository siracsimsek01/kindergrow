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

export function DashboardPageSkeleton() {
  return <PageSkeleton cards={3} charts={2} tables={1} />
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
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-[150px] mb-2" />
          <Skeleton className="h-4 w-[400px]" />
        </div>
      </div>

      {/* Tabs */}
      <div className="space-y-4">
        <div className="flex space-x-1">
          <Skeleton className="h-10 w-[120px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>

        {/* Report Generation Form */}
        <div className="rounded-lg border p-6">
          <Skeleton className="h-6 w-[200px] mb-2" />
          <Skeleton className="h-4 w-[350px] mb-6" />
          
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-10 w-full" />
            </div>
            
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-[100px]" />
              ))}
            </div>
            
            <Skeleton className="h-10 w-[150px]" />
          </div>
        </div>

        {/* Reports List */}
        <div className="rounded-lg border p-6">
          <Skeleton className="h-6 w-[150px] mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[150px]" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function UserProfileSkeleton() {
  return (
    <div className="container mx-auto py-10 space-y-8">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-[200px] mb-2" />
        <Skeleton className="h-4 w-[300px]" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="md:col-span-1 rounded-lg border p-6">
          <div className="space-y-4">
            <Skeleton className="h-5 w-[100px] mb-2" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
          <div className="flex flex-col items-center space-y-4 mt-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="text-center space-y-2">
              <Skeleton className="h-5 w-[120px] mx-auto" />
              <Skeleton className="h-4 w-[180px] mx-auto" />
            </div>
            <Skeleton className="h-9 w-full" />
          </div>
        </div>

        {/* Settings Card */}
        <div className="md:col-span-2 rounded-lg border p-6">
          <div className="space-y-4">
            <Skeleton className="h-5 w-[150px] mb-2" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
          
          {/* Tabs */}
          <div className="mt-6">
            <div className="flex space-x-1 mb-4">
              <Skeleton className="h-9 w-[80px]" />
              <Skeleton className="h-9 w-[80px]" />
              <Skeleton className="h-9 w-[120px]" />
            </div>
            
            {/* Tab Content */}
            <div className="space-y-4">
              <div>
                <Skeleton className="h-4 w-[100px] mb-2" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
              <Skeleton className="h-px w-full" />
              <div>
                <Skeleton className="h-4 w-[80px] mb-2" />
                <Skeleton className="h-4 w-[120px]" />
              </div>
              <Skeleton className="h-px w-full" />
              <div>
                <Skeleton className="h-4 w-[90px] mb-2" />
                <Skeleton className="h-4 w-[150px]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
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
