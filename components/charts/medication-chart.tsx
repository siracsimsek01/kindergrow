"use client"

import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { format, subDays, subMonths, subYears, eachDayOfInterval } from "date-fns"
import { useMediaQuery } from "@/hooks/use-media-query"

interface MedicationChartProps {
  medications: any[]
  administrations: any[]
  timeFrame: "week" | "month" | "3months" | "year"
}

export function MedicationChart({ medications, administrations, timeFrame }: MedicationChartProps) {
  const [chartData, setChartData] = useState<any[]>([])
  const isMobile = useMediaQuery("(max-width: 640px)")

  // Generate chart data based on timeFrame
  useEffect(() => {
    const today = new Date()
    let startDate: Date
    let dateFormat: string

    switch (timeFrame) {
      case "week":
        startDate = subDays(today, 6)
        dateFormat = "MMM d"
        break
      case "month":
        startDate = subMonths(today, 1)
        dateFormat = "MMM d"
        break
      case "3months":
        startDate = subMonths(today, 3)
        dateFormat = "MMM yyyy"
        break
      case "year":
        startDate = subYears(today, 1)
        dateFormat = "MMM yyyy"
        break
      default:
        startDate = subDays(today, 6)
        dateFormat = "MMM d"
    }

    // Get all days in the range
    const days = eachDayOfInterval({ start: startDate, end: today })

    // Initialize data for each day
    const data = days.map((day) => ({
      date: format(day, dateFormat),
      formattedDate: format(day, dateFormat),
      timestamp: day.toISOString(),
      taken: 0,
      skipped: 0,
      total: 0,
    }))

    // Count administrations for each day
    administrations.forEach((admin) => {
      const adminDate = new Date(admin.timestamp)

      // Find the corresponding day in our data
      const dayIndex = data.findIndex(
        (d) => format(new Date(d.timestamp), dateFormat) === format(adminDate, dateFormat),
      )

      if (dayIndex !== -1) {
        if (admin.skipped) {
          data[dayIndex].skipped++
        } else {
          data[dayIndex].taken++
        }
        data[dayIndex].total++
      }
    })

    // If no data, generate sample data
    if (administrations.length === 0) {
      data.forEach((day, index) => {
        // Generate random data
        const taken = Math.floor(Math.random() * 3) + 1
        const skipped = Math.floor(Math.random() * 2)

        day.taken = taken
        day.skipped = skipped
        day.total = taken + skipped
      })
    }

    setChartData(data)
  }, [timeFrame, medications, administrations])

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-md">
          <p className="font-medium mb-1">{label}</p>
          {payload.map(
            (entry: any) =>
              entry.value > 0 && (
                <div key={entry.name} className="flex justify-between text-sm">
                  <span className="text-muted-foreground mr-4">{entry.name}:</span>
                  <span className="font-medium">{entry.value}</span>
                </div>
              ),
          )}
        </div>
      )
    }
    return null
  }

  if (chartData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No medication data to display</p>
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: isMobile ? 10 : 30,
            left: isMobile ? 0 : 20,
            bottom: isMobile ? 40 : 20,
          }}
          barGap={0}
          barCategoryGap={timeFrame === "week" ? 15 : 8}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="formattedDate"
            tick={{ fontSize: isMobile ? 10 : 12 }}
            angle={isMobile ? -45 : 0}
            textAnchor={isMobile ? "end" : "middle"}
            height={isMobile ? 60 : 30}
          />
          <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
          <Bar dataKey="taken" name="Taken" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="skipped" name="Skipped" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

