"use client"

import { useState, useEffect } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { subDays, subMonths, subYears, isWithinInterval } from "date-fns"

interface SleepEvent {
  id: string
  timestamp: string
  quality: string
  duration: number
  date: Date
}

interface SleepQualityChartProps {
  events: SleepEvent[]
  selectedChild?: any
  simplified?: boolean
  timeFrame?: "week" | "month" | "6months" | "year"
}

export function SleepQualityChart({
  events,
  selectedChild,
  simplified = false,
  timeFrame = "week",
}: SleepQualityChartProps) {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    // Filter events based on selected time frame
    const today = new Date()
    let startDate: Date

    switch (timeFrame) {
      case "week":
        startDate = subDays(today, 7)
        break
      case "month":
        startDate = subDays(today, 30)
        break
      case "6months":
        startDate = subMonths(today, 6)
        break
      case "year":
        startDate = subYears(today, 1)
        break
      default:
        startDate = subDays(today, 7)
    }

    const filteredEvents = events.filter((event) =>
      isWithinInterval(new Date(event.timestamp), { start: startDate, end: today }),
    )

    if (!filteredEvents || filteredEvents.length === 0) {
      // Create sample data for demonstration
      const sampleData = [
        { name: "Excellent", value: 35, color: "#10b981" },
        { name: "Good", value: 40, color: "#3b82f6" },
        { name: "Fair", value: 15, color: "#8b5cf6" },
        { name: "Poor", value: 7, color: "#f59e0b" },
        { name: "Very Poor", value: 3, color: "#ef4444" },
      ]
      setData(sampleData)
      return
    }

    // Count sleep quality
    const qualityCounts = {
      Excellent: 0,
      Good: 0,
      Fair: 0,
      Poor: 0,
      "Very Poor": 0,
    }

    filteredEvents.forEach((event) => {
      const quality = event.quality || "Good"
      if (quality.toLowerCase().includes("excellent")) qualityCounts.Excellent++
      else if (quality.toLowerCase().includes("good")) qualityCounts.Good++
      else if (quality.toLowerCase().includes("fair")) qualityCounts.Fair++
      else if (quality.toLowerCase().includes("poor") && !quality.toLowerCase().includes("very")) qualityCounts.Poor++
      else if (quality.toLowerCase().includes("very poor")) qualityCounts["Very Poor"]++
      else qualityCounts.Good++ // Default case
    })

    // Create chart data - include all qualities even if count is 0
    const chartData = [
      { name: "Excellent", value: Math.max(0.1, qualityCounts.Excellent), color: "#10b981" },
      { name: "Good", value: Math.max(0.1, qualityCounts.Good), color: "#3b82f6" },
      { name: "Fair", value: Math.max(0.1, qualityCounts.Fair), color: "#8b5cf6" },
      { name: "Poor", value: Math.max(0.1, qualityCounts.Poor), color: "#f59e0b" },
      { name: "Very Poor", value: Math.max(0.1, qualityCounts["Very Poor"]), color: "#ef4444" },
    ]

    // If all values are minimal, use sample data
    if (chartData.every((item) => item.value <= 0.1)) {
      const sampleData = [
        { name: "Excellent", value: 35, color: "#10b981" },
        { name: "Good", value: 40, color: "#3b82f6" },
        { name: "Fair", value: 15, color: "#8b5cf6" },
        { name: "Poor", value: 7, color: "#f59e0b" },
        { name: "Very Poor", value: 3, color: "#ef4444" },
      ]
      setData(sampleData)
    } else {
      // Only include qualities with values > 0.1 for the actual chart
      setData(chartData.filter((item) => item.value > 0.1))
    }
  }, [events, timeFrame])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const total = events.length > 0 ? events.length : 100 // Avoid division by zero
      const percentage =
        events.length > 0 ? ((data.value / events.length) * 100).toFixed(1) : ((data.value / total) * 100).toFixed(1)

      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-md">
          <div className="flex items-center mb-1">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: data.color }} />
            <span className="font-medium text-white">{data.name}</span>
          </div>
          <div className="text-sm text-white">
            <div>
              Count: <span className="font-medium">{Math.round(data.value)}</span>
            </div>
            <div>
              Percentage: <span className="font-medium">{percentage}%</span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  // Custom legend that uses white text
  const CustomLegend = ({ payload }: any) => {
    return (
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
        {payload.map((entry: any, index: number) => (
          <li key={`legend-${index}`} className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
            <span className="text-xs text-white">{entry.value}</span>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={simplified ? 0 : 60}
            outerRadius={simplified ? 80 : 90}
            paddingAngle={2}
            dataKey="value"
            label={simplified ? false : { fill: "#ffffff", fontSize: 12 }} // White text
            labelLine={simplified ? false : { stroke: "#ffffff" }} // White lines
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
