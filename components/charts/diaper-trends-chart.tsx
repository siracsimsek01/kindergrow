"use client"

import { useState, useEffect } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { useMediaQuery } from "@/hooks/use-media-query"
import { format, subDays, subMonths, subYears, startOfDay, endOfDay } from "date-fns"

interface DiaperEvent {
  id: string
  timestamp: string
  type: string
  date: Date
}

interface DiaperTrendsChartProps {
  events: DiaperEvent[]
  selectedChild?: any
  timeFrame: "week" | "month" | "6months" | "year"
}

export function DiaperTrendsChart({ events, selectedChild, timeFrame }: DiaperTrendsChartProps) {
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
          total: 0,
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
          dailyData[dateKey].total++

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
          total: 0,
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
          monthlyData[monthKey].total++

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
        </div>
      )
    }
    return null
  }

  if (!events || events.length === 0 || chartData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No diaper data available</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: isMobile ? 10 : 30,
            left: isMobile ? 0 : 20,
            bottom: isMobile ? 40 : 20,
          }}
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
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: "var(--border)", strokeWidth: 1, strokeDasharray: "5 5" }}
          />
          <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
          <Line
            type="monotone"
            dataKey="total"
            name="Total"
            stroke="#64748b"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line type="monotone" dataKey="wet" name="Wet" stroke="#3b82f6" strokeWidth={1.5} dot={{ r: 2 }} />
          <Line type="monotone" dataKey="dirty" name="Dirty" stroke="#f59e0b" strokeWidth={1.5} dot={{ r: 2 }} />
          <Line type="monotone" dataKey="mixed" name="Mixed" stroke="#8b5cf6" strokeWidth={1.5} dot={{ r: 2 }} />
          <Line type="monotone" dataKey="dry" name="Dry" stroke="#10b981" strokeWidth={1.5} dot={{ r: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

