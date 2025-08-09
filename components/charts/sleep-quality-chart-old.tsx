"use client"

import { useState, useEffect } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { subDays, subMonths, subYears, isWithinInterval } from "date-fns"
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

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

const chartConfig = {
  excellent: {
    label: "Excellent",
    color: "hsl(var(--chart-1))",
  },
  good: {
    label: "Good", 
    color: "hsl(var(--chart-2))",
  },
  fair: {
    label: "Fair",
    color: "hsl(var(--chart-3))",
  },
  poor: {
    label: "Poor",
    color: "hsl(var(--chart-4))",
  },
  verypoor: {
    label: "Very Poor",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig

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
      setData([])
      return
    }

    // Count sleep quality
    const qualityCounts = {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0,
      verypoor: 0,
    }

    filteredEvents.forEach((event) => {
      const quality = event.quality || "good"
      if (quality.toLowerCase().includes("excellent")) qualityCounts.excellent++
      else if (quality.toLowerCase().includes("good")) qualityCounts.good++
      else if (quality.toLowerCase().includes("fair")) qualityCounts.fair++
      else if (quality.toLowerCase().includes("poor") && !quality.toLowerCase().includes("very")) qualityCounts.poor++
      else if (quality.toLowerCase().includes("very poor")) qualityCounts.verypoor++
      else qualityCounts.good++ // Default case
    })

    // Create chart data
    const chartData = [
      { quality: "excellent", count: qualityCounts.excellent, fill: "var(--color-excellent)" },
      { quality: "good", count: qualityCounts.good, fill: "var(--color-good)" },
      { quality: "fair", count: qualityCounts.fair, fill: "var(--color-fair)" },
      { quality: "poor", count: qualityCounts.poor, fill: "var(--color-poor)" },
      { quality: "verypoor", count: qualityCounts.verypoor, fill: "var(--color-verypoor)" },
    ]

    // Only include qualities with values > 0 for the actual chart
    setData(chartData.filter((item) => item.count > 0))
  }, [events, timeFrame])

  // Check if we have any data to display
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No sleep quality data available for {selectedChild?.name}</p>
      </div>
    )
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square max-h-[250px]"
    >
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="quality"
          cx="50%"
          cy="50%"
          innerRadius={simplified ? 0 : 60}
          outerRadius={simplified ? 80 : 90}
          paddingAngle={2}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltipContent />} />
        <Legend 
          verticalAlign="bottom" 
          height={36}
          formatter={(value) => chartConfig[value as keyof typeof chartConfig]?.label || value}
        />
      </PieChart>
    </ChartContainer>
  )
}
