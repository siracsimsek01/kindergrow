"use client"

import { useState, useEffect } from "react"
import { useChildContext } from "@/contexts/child-context"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { format, subDays, startOfDay, endOfDay } from "date-fns"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

// Simplified data structure
interface FeedingData {
  date: string
  formattedDate: string
  Bottle: number
  Breast: number
  Solid: number
}

export function FeedingChart() {
  const { selectedChild, lastUpdated } = useChildContext()
  const [data, setData] = useState<FeedingData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedChild) {
        setData([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        console.log(`Fetching feeding data for child ID: ${selectedChild.id}`)

        // Get data for the last 7 days
        const endDate = new Date()
        const startDate = subDays(endDate, 6) // 7 days including today

        const response = await fetch(
          `/api/children/${selectedChild.id}/events?eventType=feeding&startDate=${startOfDay(
            startDate,
          ).toISOString()}&endDate=${endOfDay(endDate).toISOString()}`,
          {
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache",
            },
          },
        )

        if (!response.ok) {
          throw new Error(`Failed to fetch feeding data: ${response.status}`)
        }

        const events = await response.json()
        console.log(`Received ${events.length} feeding events`)

        // Initialize data for the last 7 days
        const feedingData: FeedingData[] = []
        for (let i = 0; i < 7; i++) {
          const date = subDays(endDate, 6 - i)
          feedingData.push({
            date: format(date, "yyyy-MM-dd"),
            formattedDate: format(date, "MM/dd"),
            Bottle: 0,
            Breast: 0,
            Solid: 0,
          })
        }

        // Process events
        events.forEach((event) => {
          const eventDate = format(new Date(event.timestamp), "yyyy-MM-dd")
          const dayData = feedingData.find((d) => d.date === eventDate)

          if (dayData) {
            const details = event.details || ""
            console.log(`Processing event on ${eventDate}:`, details)
            
            // Handle both old format and new format
            if (details.includes("Type: bottle") || details.includes("Type: formula") || details.includes("Type: Bottle")) {
              dayData.Bottle++
            } else if (details.includes("Type: breast") || details.includes("Type: Breast")) {
              dayData.Breast++
            } else if (details.includes("Type: solid") || details.includes("Type: Solid")) {
              dayData.Solid++
            }
          }
        })

        setData(feedingData)
      } catch (error) {
        console.error("Error fetching feeding data:", error)
        setError("Failed to fetch feeding data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [selectedChild, lastUpdated])

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<any>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      // Calculate total feedings for this day
      const totalFeedings = payload.reduce((sum, entry) => sum + (entry.value || 0), 0)

      return (
        <div className="bg-card border border-border p-4 rounded-lg shadow-md max-w-[200px]">
          <p className="font-semibold text-sm mb-2 pb-1 border-b border-border">{label}</p>

          {payload.map(
            (entry) =>
              entry.value > 0 && (
                <div key={entry.name} className="flex items-center justify-between py-1">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
                    <span className="text-sm text-muted-foreground">{entry.name}:</span>
                  </div>
                  <span className="text-sm font-medium">{entry.value}</span>
                </div>
              ),
          )}

          {totalFeedings > 0 && (
            <div className="flex justify-between pt-2 mt-1 border-t border-border">
              <span className="text-sm font-medium">Total:</span>
              <span className="text-sm font-semibold">{totalFeedings}</span>
            </div>
          )}
        </div>
      )
    }
    return null
  }

  // Debug log for feeding chart data
  console.log("Feeding chart data", data, selectedChild);
  console.log("Feeding chart data has values:", data.map(d => ({
    date: d.formattedDate,
    bottle: d.Bottle,
    breast: d.Breast,
    solid: d.Solid,
    total: d.Bottle + d.Breast + d.Solid
  })));

  if (!selectedChild) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed">
        <p className="text-sm text-muted-foreground">Select a child to view feeding data</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  // Check if we have any data at all
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed">
        <p className="text-sm text-muted-foreground">No feeding data available for {selectedChild.name}</p>
      </div>
    )
  }

  // Check if all values are zero
  const hasData = data.some((d) => d.Bottle > 0 || d.Breast > 0 || d.Solid > 0);
  
  if (!hasData) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed">
        <p className="text-sm text-muted-foreground">No feeding events recorded in the past 7 days</p>
      </div>
    )
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 0,
            bottom: 5,
          }}
          barGap={4}
          barCategoryGap={8}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="formattedDate" 
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            axisLine={{ stroke: "hsl(var(--border))" }}
            tickLine={{ stroke: "hsl(var(--border))" }}
          />
          <YAxis 
            allowDecimals={false} 
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            axisLine={{ stroke: "hsl(var(--border))" }}
            tickLine={{ stroke: "hsl(var(--border))" }}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "hsl(var(--muted) / 0.1)" }}
          />
          <Legend 
            wrapperStyle={{ fontSize: 12, paddingTop: 20 }}
            iconType="rect"
          />
          <Bar 
            dataKey="Bottle" 
            name="Bottle" 
            fill="#3b82f6" 
            radius={[2, 2, 0, 0]} 
            maxBarSize={40}
          />
          <Bar 
            dataKey="Breast" 
            name="Breast" 
            fill="#60a5fa" 
            radius={[2, 2, 0, 0]} 
            maxBarSize={40}
          />
          <Bar 
            dataKey="Solid" 
            name="Solid" 
            fill="#ec4899" 
            radius={[2, 2, 0, 0]} 
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

