"use client"

import { useEffect, useState } from "react"
import { format, parseISO, differenceInMonths } from "date-fns"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from "recharts"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { GraphLoader } from "@/components/ui/graph-loader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { fetchEvents, triggerRefresh } from "@/lib/redux/slices/eventsSlice"

export function GrowthChart() {
  const dispatch = useAppDispatch()
  const { selectedChild } = useAppSelector((state) => state.children)
  const { items: events, loading: isLoading, lastUpdated } = useAppSelector((state) => state.events)

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [growthData, setGrowthData] = useState<any[]>([])
  const [bmiData, setBmiData] = useState<any[]>([])
  const [growthRateData, setGrowthRateData] = useState<any[]>([])

  useEffect(() => {
    if (selectedChild) {
      dispatch(
        fetchEvents({
          childId: selectedChild.id,
          eventType: "growth",
        }),
      )
    }
  }, [selectedChild, lastUpdated, dispatch])

  useEffect(() => {
    if (!selectedChild || events.length === 0) {
      setGrowthData([])
      setBmiData([])
      setGrowthRateData([])
      return
    }

    // Filter growth events
    const growthEvents = events.filter((event) => event.eventType === "growth")

    // Sort by date
    const sortedEvents = [...growthEvents].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    )

    // Process growth data
    const processedData = sortedEvents.map((event) => {
      // Extract weight and height from details or use value fields
      const details = event.details || ""
      const weightMatch = details.match(/Weight: ([\d.]+)/)
      const heightMatch = details.match(/Height: ([\d.]+)/)

      const weight = weightMatch ? Number.parseFloat(weightMatch[1]) : event.weight || 0
      const height = heightMatch ? Number.parseFloat(heightMatch[1]) : event.height || 0

      // Calculate BMI (weight in kg / (height in m)²)
      const heightInMeters = height / 100
      const bmi = heightInMeters > 0 ? Number.parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1)) : 0

      return {
        date: format(parseISO(event.timestamp), "MMM d, yyyy"),
        timestamp: event.timestamp,
        weight,
        height,
        bmi,
      }
    })

    setGrowthData(processedData)

    // Create BMI data with reference lines
    setBmiData(
      processedData.map((item) => ({
        ...item,
        underweight: 18.5, // Reference line for underweight
        normal: 24.9, // Reference line for normal weight
        overweight: 29.9, // Reference line for overweight
      })),
    )

    // Calculate growth rate
    if (processedData.length >= 2) {
      const rateData = []

      for (let i = 1; i < processedData.length; i++) {
        const current = processedData[i]
        const previous = processedData[i - 1]

        const weightDiff = current.weight - previous.weight
        const heightDiff = current.height - previous.height

        const monthsDiff = differenceInMonths(parseISO(current.timestamp), parseISO(previous.timestamp)) || 1 // Avoid division by zero

        // Growth rate formula: (Height Difference + Weight Difference) / Time Difference in Months
        const growthRate = Number.parseFloat(((heightDiff + weightDiff) / monthsDiff).toFixed(2))

        rateData.push({
          date: current.date,
          growthRate,
        })
      }

      setGrowthRateData(rateData)
    }
  }, [selectedChild, events])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    dispatch(triggerRefresh())
    setTimeout(() => {
      setIsRefreshing(false)
    }, 800)
  }

  if (!selectedChild) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground">Select a child to view growth data</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">Growth Tracking</h3>
          <p className="text-sm text-muted-foreground">Monitor your child's growth over time</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
          className="flex items-center gap-1"
        >
          {isRefreshing ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Refresh
            </>
          )}
        </Button>
      </div>

      {isLoading ? (
        <GraphLoader variant="pulse" message="Loading growth data..." />
      ) : growthData.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed">
          <p className="text-muted-foreground">No growth data available</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-1">
          <Card>
            <CardHeader>
              <CardTitle>Growth Over Time</CardTitle>
              <CardDescription>Height and weight measurements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={growthData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      yAxisId="left"
                      orientation="left"
                      stroke="#10b981" // green for weight
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      label={{
                        value: "Weight (kg)",
                        angle: -90,
                        position: "insideLeft",
                        style: { textAnchor: "middle", fill: "#10b981" },
                      }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#3b82f6" // blue for height
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      label={{
                        value: "Height (cm)",
                        angle: 90,
                        position: "insideRight",
                        style: { textAnchor: "middle", fill: "#3b82f6" },
                      }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="font-medium">{label}</div>
                                <div className="font-medium text-right">Value</div>
                                <div className="flex items-center">
                                  <div className="mr-2 h-2 w-2 rounded-full bg-[#10b981]"></div>
                                  Weight
                                </div>
                                <div className="text-right">{payload[0].value} kg</div>
                                <div className="flex items-center">
                                  <div className="mr-2 h-2 w-2 rounded-full bg-[#3b82f6]"></div>
                                  Height
                                </div>
                                <div className="text-right">{payload[1].value} cm</div>
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="weight"
                      name="Weight (kg)"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6, strokeWidth: 2 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="height"
                      name="Height (cm)"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6, strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>BMI Trend</CardTitle>
              <CardDescription>Body Mass Index with reference ranges</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bmiData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                      domain={[0, 35]}
                      label={{ value: "BMI", angle: -90, position: "insideLeft", style: { textAnchor: "middle" } }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const bmi = payload[0].value
                          let category = "Unknown"
                          if (bmi < 18.5) category = "Underweight"
                          else if (bmi < 25) category = "Normal weight"
                          else if (bmi < 30) category = "Overweight"
                          else category = "Obese"

                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="font-medium">{label}</div>
                                <div className="font-medium text-right">Value</div>
                                <div>BMI</div>
                                <div className="text-right">{bmi}</div>
                                <div>Category</div>
                                <div className="text-right">{category}</div>
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Legend />
                    <ReferenceLine
                      y={18.5}
                      stroke="#f59e0b"
                      strokeDasharray="3 3"
                      label={{ value: "Underweight", position: "insideBottomLeft", fill: "#f59e0b" }}
                    />
                    <ReferenceLine
                      y={24.9}
                      stroke="#10b981"
                      strokeDasharray="3 3"
                      label={{ value: "Normal", position: "insideBottomLeft", fill: "#10b981" }}
                    />
                    <ReferenceLine
                      y={29.9}
                      stroke="#ef4444"
                      strokeDasharray="3 3"
                      label={{ value: "Overweight", position: "insideBottomLeft", fill: "#ef4444" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="bmi"
                      name="BMI"
                      stroke="#8884d8"
                      strokeWidth={2}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6, strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {growthRateData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Growth Rate</CardTitle>
                <CardDescription>Combined height and weight growth rate per month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={growthRateData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                        label={{
                          value: "Growth Rate",
                          angle: -90,
                          position: "insideLeft",
                          style: { textAnchor: "middle" },
                        }}
                      />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="growthRate"
                        name="Growth Rate"
                        stroke="#8884d8"
                        strokeWidth={2}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

