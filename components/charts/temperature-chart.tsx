"use client"

import { useEffect, useState } from "react"
import { useChildContext } from "@/contexts/child-context"
import { format, parseISO, subDays } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
  Legend,
} from "recharts"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { RefreshCw } from 'lucide-react'
import { GraphLoader } from "@/components/ui/graph-loader"

interface TemperatureData {
  date: string
  formattedDate: string
  value: number
  unit: string
  timestamp: string
}

export function TemperatureChart() {
  const { selectedChild, lastUpdated, triggerRefresh } = useChildContext()
  const [temperatureData, setTemperatureData] = useState<TemperatureData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [unit, setUnit] = useState<"celsius" | "fahrenheit">("celsius")

  useEffect(() => {
    if (selectedChild) {
      fetchTemperatureData()
    } else {
      setTemperatureData([])
    }
  }, [selectedChild, lastUpdated])

  const fetchTemperatureData = async () => {
    if (!selectedChild) return

    try {
      setIsLoading(true)

      // Get data for the last 14 days
      const endDate = new Date()
      const startDate = subDays(endDate, 14)

      const response = await fetch(
        `/api/events?childId=${selectedChild.id}&eventType=temperature&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch temperature data: ${response.status} ${response.statusText}`)
      }

      const events = await response.json()

      // Parse temperature details from events
      const temperatureEntries = events.map((event) => {
        const details = event.details || ""
        const valueMatch = details.match(/Temperature: (.+)/)
        const unitMatch = details.match(/Unit: (.+)/)

        const value = event.value || (valueMatch ? Number.parseFloat(valueMatch[1]) : 0)
        const tempUnit = unitMatch ? unitMatch[1].toLowerCase() : "celsius"

        return {
          date: format(parseISO(event.timestamp), "MM/dd"),
          formattedDate: format(parseISO(event.timestamp), "MMM d, yyyy"),
          value: value,
          unit: tempUnit,
          timestamp: event.timestamp,
        }
      })

      // Sort by date
      temperatureEntries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

      // Add a small delay to show the loading animation
      setTimeout(() => {
        setTemperatureData(temperatureEntries)
        setIsLoading(false)
        setIsRefreshing(false)
      }, 800)
    } catch (error) {
      console.error("Error fetching temperature data:", error)
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const getConvertedData = () => {
    return temperatureData.map((entry) => {
      let displayValue = entry.value

      // Convert if needed
      if (entry.unit !== unit) {
        if (unit === "fahrenheit" && entry.unit === "celsius") {
          displayValue = (entry.value * 9) / 5 + 32
        } else if (unit === "celsius" && entry.unit === "fahrenheit") {
          displayValue = ((entry.value - 32) * 5) / 9
        }
      }

      return {
        ...entry,
        displayValue: Number.parseFloat(displayValue.toFixed(1)),
      }
    })
  }

  const getFeverThreshold = () => {
    return unit === "celsius" ? 38 : 100.4
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    triggerRefresh()
    await fetchTemperatureData()
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border rounded p-2 shadow-md">
          <p className="font-medium">{data.formattedDate}</p>
          <div className="flex justify-between gap-2">
            <span>Temperature:</span>
            <span className="font-medium">
              {data.displayValue} {unit === "celsius" ? "°C" : "°F"}
            </span>
          </div>
        </div>
      )
    }
    return null
  }

  if (!selectedChild) {
    return (
      <div className="flex h-[350px] items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground">Select a child to view temperature data</p>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Temperature History</CardTitle>
          <CardDescription>Last 14 days of temperature readings</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Tabs
            value={unit}
            onValueChange={(value) => setUnit(value as "celsius" | "fahrenheit")}
            className="w-[200px]"
          >
            <TabsList className="grid w-full grid-cols-2 cursor-pointer">
              <TabsTrigger value="celsius" className="cursor-pointer">°C</TabsTrigger>
              <TabsTrigger value="fahrenheit" className="cursor-pointer">°F</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={isRefreshing || isLoading}
            className="cursor-pointer"
          >
            {isRefreshing || isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <GraphLoader variant="spinner" message="Loading temperature data..." />
        ) : temperatureData.length === 0 ? (
          <div className="flex h-[350px] items-center justify-center rounded-lg border border-dashed">
            <p className="text-muted-foreground">No temperature data available for the last 14 days</p>
          </div>
        ) : (
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getConvertedData()} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={[unit === "celsius" ? 35 : 95, unit === "celsius" ? 41 : 106]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <ReferenceLine
                  y={getFeverThreshold()}
                  stroke="hsl(var(--destructive))"
                  strokeDasharray="3 3"
                  label={{
                    value: "Fever",
                    position: "right",
                    fill: "hsl(var(--destructive))",
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="displayValue"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={{
                    r: 4,
                    strokeWidth: 2,
                    fill: (entry) =>
                      entry.displayValue >= getFeverThreshold() ? "hsl(var(--destructive))" : "hsl(var(--chart-1))",
                  }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                  name={`Temperature (${unit === "celsius" ? "°C" : "°F"})`}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
