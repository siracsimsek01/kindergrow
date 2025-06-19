"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useChildContext } from "@/contexts/child-context"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip } from "recharts"
import { format, parseISO, subDays } from "date-fns"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"

export function FeedingChart() {
  const { selectedChild } = useChildContext()
  const [feedingData, setFeedingData] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (selectedChild) {
      fetchFeedingData()
    } else {
      setFeedingData([])
    }
  }, [selectedChild])

  const fetchFeedingData = async () => {
    if (!selectedChild) return

    try {
      setIsLoading(true)

      // Get data for the last 7 days
      const endDate = new Date()
      const startDate = subDays(endDate, 7)

      const response = await fetch(
        `/api/events?childId=${selectedChild.id}&eventType=feeding&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch feeding data: ${response.status} ${response.statusText}`)
      }

      const events = await response.json()

      // Count feedings by day
      const feedingByDay = events.reduce((acc, event) => {
        const date = format(parseISO(event.timestamp), "MM/dd")

        if (!acc[date]) {
          acc[date] = { date, count: 0, amount: 0 }
        }

        acc[date].count += 1
        acc[date].amount += event.value || 0
        return acc
      }, {})

      // Convert to array and sort by date
      const formattedData = Object.values(feedingByDay) as Array<{date: string, count: number, amount: number}>
      formattedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      setFeedingData(formattedData)
    } catch (error) {
      console.error("Error fetching feeding data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!selectedChild) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Feeding Chart</CardTitle>
          <CardDescription>Select a child to view feeding data</CardDescription>
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
        <CardTitle>Feeding Chart</CardTitle>
        <CardDescription>Feeding data for {selectedChild.name} (last 7 days)</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">Loading feeding data...</p>
          </div>
        ) : feedingData.length > 0 ? (
          <ChartContainer
            config={{
              count: {
                label: "Count",
                color: "hsl(var(--chart-1))",
              },
              amount: {
                label: "Amount",
                color: "hsl(var(--chart-3))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={feedingData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar yAxisId="left" dataKey="count" fill="var(--color-count)" name="Feeding Count" />
                <Bar yAxisId="right" dataKey="amount" fill="var(--color-amount)" name="Amount (oz/ml)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">No feeding data found</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

