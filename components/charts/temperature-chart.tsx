"use client"

import { useState, useEffect } from "react"
import { useChildContext } from "@/contexts/child-context"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { format, subDays, startOfDay, endOfDay } from "date-fns"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  type TooltipProps,
} from "recharts"

interface TemperatureData {
  date: string
  formattedDate: string
  temperature: number
}

export function TemperatureChart() {
  const { selectedChild, lastUpdated } = useChildContext()
  const [data, setData] = useState<TemperatureData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedChild) {
        setData([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        console.log(`Fetching temperature data for child ID: ${selectedChild.id}`)

        // Get data for the last 14 days
        const endDate = new Date()
        const startDate = subDays(endDate, 13) // 14 days including today

        const response = await fetch(
          `/api/children/${selectedChild.id}/events?eventType=temperature&startDate=${startOfDay(
            startDate,
          ).toISOString()}&endDate=${endOfDay(endDate).toISOString()}`,
          {
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache",
            },
          },
        )

        if (!response.ok) {
          throw new Error(`Failed to fetch temperature data: ${response.status}`)
        }

        const events = await response.json()
        console.log(`Received ${events.length} temperature events`)

        // Initialize data for the last 14 days
        const temperatureData: TemperatureData[] = []
        for (let i = 0; i < 14; i++) {
          const date = subDays(endDate, 13 - i)
          temperatureData.push({
            date: format(date, "yyyy-MM-dd"),
            formattedDate: format(date, "MM/dd"),
            temperature: 0,
          })
        }

        // Process events
        events.forEach((event) => {
          const eventDate = format(new Date(event.timestamp), "yyyy-MM-dd")
          const dayData = temperatureData.find((d) => d.date === eventDate)

          if (dayData && event.value) {
            // If multiple readings in a day, use the highest
            if (dayData.temperature === 0 || event.value > dayData.temperature) {
              dayData.temperature = event.value
            }
          }
        })

        // Remove days with no readings
        const filteredData = temperatureData.filter((d) => d.temperature > 0)

        setData(filteredData)
      } catch (error) {
        console.error("Error fetching temperature data:", error)
        setError("Failed to fetch temperature data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [selectedChild, lastUpdated])

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="custom-tooltip-label">{label}</p>
          <div className="custom-tooltip-data">
            <span className="custom-tooltip-key">Temperature:</span>
            <span className="custom-tooltip-value">{payload[0]?.value?.toFixed(1)}°C</span>
          </div>
        </div>
      )
    }
    return null
  }

  if (!selectedChild) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed">
        <p className="text-sm text-muted-foreground">Select a child to view temperature data</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed">
        <p className="text-sm text-muted-foreground">No temperature data available for {selectedChild?.name}</p>
      </div>
    )
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 20,
            right: 20,
            left: isMobile ? 0 : 20,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="formattedDate" tick={{ fontSize: isMobile ? 10 : 12 }} interval={isMobile ? 1 : 0} />
          <YAxis domain={[35, 41]} tick={{ fontSize: isMobile ? 10 : 12 }} width={isMobile ? 25 : 35} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <ReferenceLine
            y={38}
            stroke="red"
            strokeDasharray="3 3"
            label={{ value: "Fever", position: "right", fill: "red", fontSize: 12 }}
          />
          <Line
            type="monotone"
            dataKey="temperature"
            name="Temperature (°C)"
            stroke="hsl(var(--chart-1))"
            activeDot={{ r: 8 }}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

