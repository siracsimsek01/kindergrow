"use client"

import { useState, useEffect } from "react"
import { format, parseISO } from "date-fns"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GraphLoader } from "@/components/ui/graph-loader"

interface FeedingDurationChartProps {
  events: any[]
  isLoading?: boolean
}

export function FeedingDurationChart({ events, isLoading = false }: FeedingDurationChartProps) {
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    if (events && events.length > 0) {
      // Group events by day
      const groupedByDay = events.reduce((acc, event) => {
        const date = format(parseISO(event.timestamp), "MMM dd")

        if (!acc[date]) {
          acc[date] = {
            date,
            totalDuration: 0,
            count: 0,
          }
        }

        // Calculate duration if available
        let duration = 0
        if (event.endTimestamp) {
          const startTime = parseISO(event.timestamp)
          const endTime = parseISO(event.endTimestamp)
          duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60) // in minutes
        } else if (event.value) {
          duration = event.value // assume value is duration in minutes
        }

        acc[date].totalDuration += duration
        acc[date].count += 1

        return acc
      }, {})

      // Convert to array and sort by date
      const data = Object.values(groupedByDay)
      data.sort((a: any, b: any) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      })

      setChartData(data)
    } else {
      setChartData([])
    }
  }, [events])

  if (isLoading) {
    return <GraphLoader message="Loading feeding data..." />
  }

  if (chartData.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground">No feeding data available</p>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feeding Duration</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis label={{ value: "Minutes", angle: -90, position: "insideLeft" }} />
              <Tooltip
                formatter={(value) => [`${value} min`, "Duration"]}
                labelFormatter={(label) => `Date: ${label}`}
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
              />
              <Bar dataKey="totalDuration" fill="#8884d8" name="Duration (min)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

