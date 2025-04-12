"use client"

import { useState, useEffect } from "react"
import { format, parseISO } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { useChildContext } from "@/contexts/child-context"
import { Skeleton } from "@/components/ui/skeleton"

export function GrowthChart() {
  const { selectedChild } = useChildContext()
  const [growthData, setGrowthData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchGrowthData = async () => {
      if (!selectedChild) {
        setGrowthData([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const response = await fetch(`/api/children/${selectedChild.id}/events?eventType=growth`)

        if (!response.ok) {
          throw new Error("Failed to fetch growth data")
        }

        const data = await response.json()

        // Format data for the chart
        const formattedData = data.map((entry: any) => ({
          date: format(parseISO(entry.timestamp), "MMM d"),
          weight: entry.value,
          timestamp: entry.timestamp,
        }))

        // Sort by date
        formattedData.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

        setGrowthData(formattedData)
      } catch (error) {
        console.error("Error fetching growth data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchGrowthData()
  }, [selectedChild])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (growthData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Growth Chart</CardTitle>
          <CardDescription>Track your child's growth over time</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[300px]">
          <p className="text-muted-foreground">No growth data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Growth Chart</CardTitle>
        <CardDescription>Track your child's weight over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={growthData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis
                label={{ value: "Weight (kg)", angle: -90, position: "insideLeft" }}
                domain={["dataMin - 0.5", "dataMax + 0.5"]}
              />
              <Tooltip formatter={(value) => [`${value} kg`, "Weight"]} labelFormatter={(label) => `Date: ${label}`} />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
