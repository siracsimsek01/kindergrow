"use client"

import { useState, useEffect } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { useMediaQuery } from "@/hooks/use-media-query"
import { format, subDays, subMonths, subYears, startOfDay, endOfDay, addDays, isWithinInterval } from "date-fns"

interface SleepEvent {
  id: string
  timestamp: string
  quality: string
  duration: number
  date: Date
  startTime?: string
  endTime?: string
}

interface SleepTrendsChartProps {
  events: SleepEvent[]
  selectedChild?: any
  timeFrame: "week" | "month" | "6months" | "year"
}

export function SleepTrendsChart({ events, selectedChild, timeFrame }: SleepTrendsChartProps) {
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
    let interval: number // Days between data points

    // Set parameters based on time frame
    switch (timeFrame) {
      case "week":
        startDate = subDays(today, 6)
        dateFormat = "EEE" // Mon, Tue, etc.
        aggregateBy = "day"
        interval = 1
        break
      case "month":
        startDate = subDays(today, 29) // Last 30 days
        dateFormat = "MMM d"
        aggregateBy = "day"
        interval = 3 // Every 3 days for readability
        break
      case "6months":
        startDate = subMonths(today, 6)
        dateFormat = "MMM yyyy"
        aggregateBy = "month"
        interval = 30 // Approximately monthly
        break
      case "year":
        startDate = subYears(today, 1)
        dateFormat = "MMM yyyy"
        aggregateBy = "month"
        interval = 30 // Monthly
        break
      default:
        startDate = subDays(today, 6)
        dateFormat = "EEE"
        aggregateBy = "day"
        interval = 1
    }

    // Filter events within the selected time frame
    const filteredEvents = events.filter((event) =>
      isWithinInterval(new Date(event.timestamp), {
        start: startOfDay(startDate),
        end: endOfDay(today),
      }),
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
          avgDuration: 0,
          totalDuration: 0,
          count: 0,
          excellent: 0,
          good: 0,
          fair: 0,
          poor: 0,
          veryPoor: 0,
        }

        currentDate = addDays(currentDate, 1)
      }

      // Sum durations and count events by day and quality
      filteredEvents.forEach((event) => {
        const eventDate = new Date(event.timestamp)
        const dateKey = format(eventDate, "yyyy-MM-dd")

        if (dailyData[dateKey]) {
          dailyData[dateKey].totalDuration += event.duration
          dailyData[dateKey].count++

          // Count by quality
          const quality = event.quality.toLowerCase()
          if (quality.includes("excellent")) dailyData[dateKey].excellent++
          else if (quality.includes("good")) dailyData[dateKey].good++
          else if (quality.includes("fair")) dailyData[dateKey].fair++
          else if (quality.includes("poor") && !quality.includes("very")) dailyData[dateKey].poor++
          else if (quality.includes("very poor")) dailyData[dateKey].veryPoor++
        }
      })

      // Calculate average duration
      Object.keys(dailyData).forEach((key) => {
        if (dailyData[key].count > 0) {
          dailyData[key].avgDuration = dailyData[key].totalDuration / dailyData[key].count
        }
      })

      // Convert to array and filter by interval for readability
      const result = Object.values(dailyData)

      // For week and month views, we may want to filter points to avoid overcrowding
      if (timeFrame === "month") {
        // For month view, show every few days
        const filteredResult = result.filter((_, index) => index % interval === 0 || index === result.length - 1)
        setChartData(filteredResult)
      } else {
        // For week view, show all days
        setChartData(result)
      }
    } else {
      // For monthly aggregation (6 months or year view)
      const monthlyData: Record<string, any> = {}

      // Initialize all months in the range
      const currentDate = new Date(startDate)
      currentDate.setDate(1) // Start at beginning of month

      while (currentDate <= today) {
        const monthKey = format(currentDate, "yyyy-MM")
        const formattedDate = format(currentDate, dateFormat)

        monthlyData[monthKey] = {
          date: formattedDate,
          timestamp: new Date(currentDate).toISOString(),
          avgDuration: 0,
          totalDuration: 0,
          count: 0,
          excellent: 0,
          good: 0,
          fair: 0,
          poor: 0,
          veryPoor: 0,
        }

        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1)
      }

      // Sum durations and count events by month and quality
      filteredEvents.forEach((event) => {
        const eventDate = new Date(event.timestamp)
        const monthKey = format(eventDate, "yyyy-MM")

        if (monthlyData[monthKey]) {
          monthlyData[monthKey].totalDuration += event.duration
          monthlyData[monthKey].count++

          // Count by quality
          const quality = event.quality.toLowerCase()
          if (quality.includes("excellent")) monthlyData[monthKey].excellent++
          else if (quality.includes("good")) monthlyData[monthKey].good++
          else if (quality.includes("fair")) monthlyData[monthKey].fair++
          else if (quality.includes("poor") && !quality.includes("very")) monthlyData[monthKey].poor++
          else if (quality.includes("very poor")) monthlyData[monthKey].veryPoor++
        }
      })

      // Calculate average duration
      Object.keys(monthlyData).forEach((key) => {
        if (monthlyData[key].count > 0) {
          monthlyData[key].avgDuration = monthlyData[key].totalDuration / monthlyData[key].count
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
          <p className="font-semibold text-sm mb-2 pb-1 border-b border-border text-white">{label}</p>

          {payload.map(
            (entry: any) =>
              entry.value > 0 && (
                <div key={entry.name} className="flex items-center justify-between py-1">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
                    <span className="text-sm text-white">{entry.name}:</span>
                  </div>
                  <span className="text-sm font-medium text-white">{entry.value.toFixed(1)}</span>
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
        <p className="text-muted-foreground">No sleep data available for this time period</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 20,
            right: isMobile ? 10 : 30,
            left: isMobile ? 0 : 20,
            bottom: isMobile ? 40 : 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: isMobile ? 10 : 12, fill: "#ffffff" }}
            angle={isMobile ? -45 : 0}
            textAnchor={isMobile ? "end" : "middle"}
            height={isMobile ? 60 : 30}
            stroke="#666"
          />
          <YAxis tick={{ fontSize: isMobile ? 10 : 12, fill: "#ffffff" }} domain={[0, "auto"]} stroke="#666" />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: isMobile ? 10 : 12 }}
            formatter={(value) => <span style={{ color: "#ffffff" }}>{value}</span>}
          />
          <Line
            type="monotone"
            dataKey="avgDuration"
            name="Avg Duration (hrs)"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="count"
            name="Sleep Sessions"
            stroke="#3b82f6"
            strokeWidth={1.5}
            dot={{ r: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

