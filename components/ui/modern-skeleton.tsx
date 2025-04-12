"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

// Dashboard Skeletons
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <div className="p-6 space-y-2">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
              <Skeleton className="h-8 w-16 mt-2" />
              <Skeleton className="h-3 w-24 mt-1" />
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="p-6 space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
          <div className="grid gap-4 mt-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-md" />
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="p-6 space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
            <div className="space-y-3 mt-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-6 space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-[200px] w-full mt-4" />
          </div>
        </Card>
      </div>
    </div>
  )
}

// Sleep Page Skeleton
export function SleepPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <div className="p-6 space-y-2">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
              <Skeleton className="h-8 w-16 mt-2" />
              <Skeleton className="h-3 w-24 mt-1" />
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="p-6 space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64 mt-1" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
          <Skeleton className="h-[350px] w-full mt-4" />
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="p-6 space-y-3">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-[250px] w-full mt-4" />
          </div>
        </Card>

        <Card>
          <div className="p-6 space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
            <div className="space-y-3 mt-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

// Diaper Page Skeleton
export function DiaperPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <div className="p-6 space-y-2">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
              <Skeleton className="h-8 w-16 mt-2" />
              <Skeleton className="h-3 w-24 mt-1" />
            </div>
          </Card>
        ))}
      </div>

      <div className="flex">
        <Skeleton className="h-10 w-[300px]" />
      </div>

      <Card>
        <div className="p-6 space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64 mt-1" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
          <Skeleton className="h-[350px] w-full mt-4" />
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="p-6 space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-[250px] w-full mt-4" />
          </div>
        </Card>

        <Card>
          <div className="p-6 space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
            <div className="space-y-3 mt-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

// Medication Page Skeleton
export function MedicationPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <div className="p-6 space-y-2">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
              <Skeleton className="h-8 w-16 mt-2" />
              <Skeleton className="h-3 w-24 mt-1" />
            </div>
          </Card>
        ))}
      </div>

      <div className="flex">
        <Skeleton className="h-10 w-[400px]" />
      </div>

      <Card>
        <div className="p-6 space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-[350px] w-full mt-4" />
        </div>
      </Card>
    </div>
  )
}

// Temperature Page Skeleton
export function TemperaturePageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <div className="p-6 space-y-2">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
              <Skeleton className="h-8 w-16 mt-2" />
              <Skeleton className="h-3 w-24 mt-1" />
            </div>
          </Card>
        ))}
      </div>

      <div className="flex">
        <Skeleton className="h-10 w-[300px]" />
      </div>

      <Card>
        <div className="p-6 space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-[300px] w-full mt-4" />
        </div>
      </Card>
    </div>
  )
}

// Reports Page Skeleton
export function ReportsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      <div className="flex">
        <Skeleton className="h-10 w-[200px]" />
      </div>

      <Card>
        <div className="p-6 space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
          <div className="grid gap-4 mt-4 grid-cols-1 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-md" />
            ))}
          </div>
          <Skeleton className="h-10 w-full mt-4" />
          <div className="flex flex-wrap gap-2 mt-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24" />
            ))}
          </div>
          <Skeleton className="h-10 w-full mt-4" />
        </div>
      </Card>

      <Card>
        <div className="p-6 space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-[200px] w-full mt-4" />
        </div>
      </Card>
    </div>
  )
}

