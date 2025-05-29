"use client"

import React from "react"

import { useState, useEffect } from "react"
import { useChildContext } from "@/contexts/child-context"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { format } from "date-fns"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  type TooltipProps,
} from "recharts"

interface GrowthData {
  date: string
  formattedDate: string
  weight: number | null
  height: number | null
  headCircumference: number | null
}

export function GrowthChart() {
  const { selectedChild, lastUpdated } = useChildContext()
  const [data, setData] = useState<GrowthData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        console.log(`Fetching growth data for child ID: ${selectedChild.id}`)

        const response = await fetch(`/api/children/${selectedChild.id}/events?eventType=growth`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch growth data: ${response.status}`)
        }

        const events = await response.json()
        console.log(`Received ${events.length} growth events`)

        // Process and sort events by date
        const growthData: GrowthData[] = events
          .map((event) => {
            const date = new Date(event.timestamp)
            const details = event.details || ""

            // Extract measurements from details
            let weight = null
            let height = null
            let headCircumference = null

            if (event.value) {
              weight = event.value
            }

            const heightMatch = details.match(/Height: (\d+(\.\d+)?)/)
            if (heightMatch) {
              height = Number.parseFloat(heightMatch[1])
            }

            const headMatch = details.match(/Head Circumference: (\d+(\.\d+)?)/)
            if (headMatch) {
              headCircumference = Number.parseFloat(headMatch[1])
            }

            return {
              date: format(date, "yyyy-MM-dd"),
              formattedDate: format(date, "MM/dd/yyyy"),
              weight,
              height,
              headCircumference,
            }
          })
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        setData(growthData)
      } catch (error) {
        console.error("Error fetching growth data:", error)
        setError("Failed to fetch growth data")
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
            {payload.map(
              (entry, index) =>
                entry.value !== null && (
                  <React.Fragment key={`tooltip-${index}`}>
                    <span className="custom-tooltip-key">{entry.name}:</span>
                    <span className="custom-tooltip-value">
                      {entry.name === "Weight"
                        ? `${entry.value} kg`
                        : entry.name === "Height"
                          ? `${entry.value} cm`
                          : `${entry.value} cm`}
                    </span>
                  </React.Fragment>
                ),
            )}
          </div>
        </div>
      )
    }
    return null
  }

  if (!selectedChild) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed">
        <p className="text-sm text-muted-foreground">Select a child to view growth data</p>
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
        <p className="text-sm text-muted-foreground">No growth data available for {selectedChild.name}</p>
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
            right: 30,
            left: 0,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="formattedDate" />
          <YAxis yAxisId="left" orientation="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="weight"
            name="Weight"
            stroke="hsl(var(--chart-1))"
            activeDot={{ r: 8 }}
            connectNulls
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="height"
            name="Height"
            stroke="hsl(var(--chart-2))"
            connectNulls
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="headCircumference"
            name="Head"
            stroke="hsl(var(--chart-3))"
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

