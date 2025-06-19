"use client"

import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { useMediaQuery } from "@/hooks/use-media-query"
import { format, subDays, subMonths, subYears, startOfDay, endOfDay } from "date-fns"

interface DiaperEvent {
  id: string
  timestamp: string
  type: string
  date: Date
}

interface DiaperChartProps {
  events: DiaperEvent[]
  selectedChild?: any
  timeFrame: "week" | "month" | "6months" | "year"
}

export function DiaperChart({ events, selectedChild, timeFrame }: DiaperChartProps) {
  const isMobile = useMediaQuery("(max-width: 640px)")
  const [chartData, setChartData] = useState<any[]>([])

  // Generate chart data based on selected time frame
  useEffect(() => {
    if (!events || events.length === 0) {
      setChartData([])
      return
    }

    const today = new Date()
    let startDate: Date
    let dateFormat: string
    let aggregateBy: "day" | "week" | "month"

    // Set parameters based on time frame
    switch (timeFrame) {
      case "week":
        startDate = subDays(today, 6)
        dateFormat = "MMM d"
        aggregateBy = "day"
        break
      case "month":
        startDate = subMonths(today, 1)
        dateFormat = "MMM d"
        aggregateBy = "day"
        break
      case "6months":
        startDate = subMonths(today, 6)
        dateFormat = "MMM yyyy"
        aggregateBy = "month"
        break
      case "year":
        startDate = subYears(today, 1)
        dateFormat = "MMM yyyy"
        aggregateBy = "month"
        break
      default:
        startDate = subDays(today, 6)
        dateFormat = "MMM d"
        aggregateBy = "day"
    }

    // Filter events within the selected time frame
    const filteredEvents = events.filter(
      (event) => new Date(event.timestamp) >= startOfDay(startDate) && new Date(event.timestamp) <= endOfDay(today),
    )

    // Aggregate data based on the selected time frame
    if (aggregateBy === "day") {
      // For daily aggregation (week or month view)
      const dailyData: Record<string, any> = {}

      // Initialize all days in the range
      let currentDate = new Date(startDate)
      while (currentDate <= today) {
        const dateKey = format(currentDate, "yyyy-MM-dd")
        const formattedDate = format(currentDate, dateFormat)

        dailyData[dateKey] = {
          date: formattedDate,
          timestamp: new Date(currentDate).toISOString(),
          count: 0,
          wet: 0,
          dirty: 0,
          mixed: 0,
          dry: 0,
        }

        currentDate = new Date(currentDate)
        currentDate.setDate(currentDate.getDate() + 1)
      }

      // Count events by day and type
      filteredEvents.forEach((event) => {
        const dateKey = format(new Date(event.timestamp), "yyyy-MM-dd")
        if (dailyData[dateKey]) {
          dailyData[dateKey].count++

          // Count by type
          const type = event.type.toLowerCase()
          if (type.includes("wet")) dailyData[dateKey].wet++
          else if (type.includes("dirty")) dailyData[dateKey].dirty++
          else if (type.includes("mixed")) dailyData[dateKey].mixed++
          else if (type.includes("dry")) dailyData[dateKey].dry++
        }
      })

      setChartData(Object.values(dailyData))
    } else {
      // For monthly aggregation (6 months or year view)
      const monthlyData: Record<string, any> = {}

      // Initialize all months in the range
      let currentDate = new Date(startDate)
      while (currentDate <= today) {
        const monthKey = format(currentDate, "yyyy-MM")
        const formattedDate = format(currentDate, dateFormat)

        monthlyData[monthKey] = {
          date: formattedDate,
          timestamp: new Date(currentDate).toISOString(),
          count: 0,
          wet: 0,
          dirty: 0,
          mixed: 0,
          dry: 0,
        }

        currentDate = new Date(currentDate)
        currentDate.setMonth(currentDate.getMonth() + 1)
      }

      // Count events by month and type
      filteredEvents.forEach((event) => {
        const monthKey = format(new Date(event.timestamp), "yyyy-MM")
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].count++

          // Count by type
          const type = event.type.toLowerCase()
          if (type.includes("wet")) monthlyData[monthKey].wet++
          else if (type.includes("dirty")) monthlyData[monthKey].dirty++
          else if (type.includes("mixed")) monthlyData[monthKey].mixed++
          else if (type.includes("dry")) monthlyData[monthKey].dry++
        }
      })

      setChartData(Object.values(monthlyData))
    }
  }, [events, timeFrame])

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Calculate total for this day/month
      const total = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0)

      return (
        <div className="bg-card border border-border p-4 rounded-lg shadow-md max-w-[200px]">
          <p className="font-semibold text-sm mb-2 pb-1 border-b border-border">{label}</p>

          {payload.map(
            (entry: any) =>
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

          {total > 0 && (
            <div className="flex justify-between pt-2 mt-1 border-t border-border">
              <span className="text-sm font-medium">Total:</span>
              <span className="text-sm font-semibold">{total}</span>
            </div>
          )}
        </div>
      )
    }
    return null
  }

  // Ensure the bar chart shows empty state only if no data exists
  if (!events || events.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-md border border-dashed">
        <p className="text-sm text-muted-foreground">No diaper data available for {selectedChild?.name}</p>
      </div>
    )
  }

  // If we have events but no chart data, it means the events are outside the timeframe
  if (chartData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-md border border-dashed">
        <p className="text-sm text-muted-foreground">No diaper data for this time period</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 5,
            right: isMobile ? 10 : 30,
            left: isMobile ? 0 : 20,
            bottom: isMobile ? 40 : 20,
          }}
          barGap={0}
          barCategoryGap={timeFrame === "week" ? 15 : 8}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: isMobile ? 10 : 12 }}
            angle={isMobile ? -45 : 0}
            textAnchor={isMobile ? "end" : "middle"}
            height={isMobile ? 60 : 30}
          />
          <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} domain={[0, "auto"]} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
          <Bar dataKey="wet" name="Wet" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} isAnimationActive={true} />
          <Bar dataKey="dirty" name="Dirty" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} isAnimationActive={true} />
          <Bar dataKey="mixed" name="Mixed" stackId="a" fill="#8b5cf6" radius={[0, 0, 0, 0]} isAnimationActive={true} />
          <Bar dataKey="dry" name="Dry" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} isAnimationActive={true} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

