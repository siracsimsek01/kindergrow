"use client"

import { useEffect, useState } from "react"
import { useChildContext } from "@/contexts/child-context"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"

export function ActivitySummaryChart() {
  const { children } = useChildContext()
  const [activityData, setActivityData] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (children.length > 0) {
      fetchActivitySummary()
    }
  }, [children])

  const fetchActivitySummary = async () => {
    try {
      setIsLoading(true)

      // Fetch activity counts for all children
      const activityPromises = children.map(async (child) => {
        const response = await fetch(`/api/events?childId=${child.id}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch activities for child ${child.id}`)
        }
        const events = await response.json()

        // Count events by type
        const eventCounts = events.reduce((counts, event) => {
          counts[event.eventType] = (counts[event.eventType] || 0) + 1
          return counts
        }, {})

        return {
          name: child.name,
          ...eventCounts,
        }
      })

      const results = await Promise.all(activityPromises)
      setActivityData(results)
    } catch (error) {
      console.error("Error fetching activity summary:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (children.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground">Add children to see activity summary</p>
      </div>
    )
  }

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />
  }

  if (activityData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground">No activity data found</p>
      </div>
    )
  }

  return (
    <ChartContainer
      config={{
        feeding: {
          label: "Feeding",
          color: "hsl(var(--chart-1))",
        },
        sleeping: {
          label: "Sleep",
          color: "hsl(var(--chart-2))",
        },
        diaper: {
          label: "Diaper",
          color: "hsl(var(--chart-3))",
        },
        growth: {
          label: "Growth",
          color: "hsl(var(--chart-4))",
        },
        medication: {
          label: "Medication",
          color: "hsl(var(--chart-5))",
        },
        temperature: {
          label: "Temperature",
          color: "hsl(var(--chart-6, 280 100% 60%))",
        },
      }}
      className="h-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={activityData} 
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis 
            dataKey="name" 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend />
          <Bar 
            dataKey="feeding" 
            fill="var(--color-feeding)" 
            name="Feeding" 
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="sleeping" 
            fill="var(--color-sleeping)" 
            name="Sleep" 
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="diaper" 
            fill="var(--color-diaper)" 
            name="Diaper" 
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="growth" 
            fill="var(--color-growth)" 
            name="Growth" 
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="medication" 
            fill="var(--color-medication)" 
            name="Medication" 
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="temperature" 
            fill="var(--color-temperature)" 
            name="Temperature" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
