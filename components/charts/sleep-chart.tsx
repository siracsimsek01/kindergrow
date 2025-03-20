"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useChildContext } from "@/contexts/child-context"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { format, parseISO, subDays } from "date-fns"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export function SleepChart() {
  const { selectedChild } = useChildContext()
  const [sleepData, setSleepData] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (selectedChild) {
      fetchSleepData()
    } else {
      setSleepData([])
    }
  }, [selectedChild])

  const fetchSleepData = async () => {
    if (!selectedChild) return

    try {
      setIsLoading(true)

      // Get data for the last 7 days
      const endDate = new Date()
      const startDate = subDays(endDate, 7)

      const response = await fetch(
        `/api/events?childId=${selectedChild.id}&eventType=sleeping&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch sleep data: ${response.status} ${response.statusText}`)
      }

      const events = await response.json()

      // Calculate sleep duration in hours for each event
      const sleepByDay = events.reduce((acc, event) => {
        const date = format(parseISO(event.timestamp), "MM/dd")
        const startTime = new Date(event.startTime || event.timestamp)
        const endTime = new Date(event.endTime || event.timestamp)
        const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)

        if (!acc[date]) {
          acc[date] = { date, hours: 0 }
        }

        acc[date].hours += durationHours
        return acc
      }, {})

      // Convert to array and sort by date
      const formattedData = Object.values(sleepByDay)
      formattedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      setSleepData(formattedData)
    } catch (error) {
      console.error("Error fetching sleep data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!selectedChild) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sleep Chart</CardTitle>
          <CardDescription>Select a child to view sleep data</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No child selected</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sleep Chart</CardTitle>
        <CardDescription>Sleep hours for {selectedChild.name} (last 7 days)</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">Loading sleep data...</p>
          </div>
        ) : sleepData.length > 0 ? (
          <ChartContainer
            config={{
              hours: {
                label: "Hours",
                color: "hsl(var(--chart-2))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sleepData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="hours" fill="var(--color-hours)" name="Sleep Hours" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">No sleep data found</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

