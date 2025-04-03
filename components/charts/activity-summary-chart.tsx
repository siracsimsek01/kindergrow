"use client"

import { useState, useEffect } from "react"
import { useChildContext } from "@/contexts/child-context"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface ActivityData {
  name: string
  feeding: number
  sleeping: number
  diaper: number
  growth: number
  medication: number
  temperature: number
}

export function ActivitySummaryChart() {
  const { selectedChild, children, lastUpdated } = useChildContext()
  const [data, setData] = useState<ActivityData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedChild && children.length === 0) {
        setData([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Create sample data for demonstration
        const sampleData: ActivityData[] = [
          {
            name: selectedChild ? selectedChild.name : "Child",
            feeding: 12,
            sleeping: 8,
            diaper: 15,
            growth: 3,
            medication: 2,
            temperature: 4,
          },
        ]

        setData(sampleData)
      } catch (error) {
        console.error("Error creating activity summary data:", error)
        setError("Failed to create activity summary")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [selectedChild, children, lastUpdated])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center rounded-md border border-dashed">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-md border border-dashed">
        <p className="text-sm text-muted-foreground">No activity data available</p>
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" width={80} />
          <Tooltip />
          <Legend />
          <Bar dataKey="feeding" name="Feeding" fill="#3b82f6" />
          <Bar dataKey="sleeping" name="Sleep" fill="#8b5cf6" />
          <Bar dataKey="diaper" name="Diaper" fill="#10b981" />
          <Bar dataKey="growth" name="Growth" fill="#f59e0b" />
          <Bar dataKey="medication" name="Medication" fill="#ef4444" />
          <Bar dataKey="temperature" name="Temperature" fill="#06b6d4" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

