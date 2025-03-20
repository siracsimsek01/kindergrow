"use client"

import { useEffect, useState } from "react"
import { format, parseISO, subDays, differenceInMinutes } from "date-fns"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { GraphLoader } from "@/components/ui/graph-loader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { fetchEvents, triggerRefresh } from "@/lib/redux/slices/eventsSlice"

interface SleepData {
  date: string
  formattedDate: string
  hours: number
  quality: string
}

const COLORS = {
  good: "#10b981", // green
  fair: "#f59e0b", // yellow
  poor: "#ef4444", // red
  unknown: "#6b7280", // gray
}

export function SleepChart() {
  const dispatch = useAppDispatch()
  const { selectedChild } = useAppSelector((state) => state.children)
  const { items: events, loading: isLoading, lastUpdated } = useAppSelector((state) => state.events)

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [sleepData, setSleepData] = useState<SleepData[]>([])
  const [qualityDistribution, setQualityDistribution] = useState<any[]>([])
  const [averageByQuality, setAverageByQuality] = useState<any[]>([])
  const [averages, setAverages] = useState({
    daily: 0,
    monthly: 0,
    yearly: 0,
  })
  const [activeTab, setActiveTab] = useState("daily")

  useEffect(() => {
    if (selectedChild) {
      // Get data for the last 30 days to calculate averages
      const endDate = new Date()
      const startDate = subDays(endDate, 30)

      dispatch(
        fetchEvents({
          childId: selectedChild.id,
          eventType: "sleeping",
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      )
    }
  }, [selectedChild, lastUpdated, dispatch])

  useEffect(() => {
    if (!selectedChild || events.length === 0) {
      setSleepData([])
      setQualityDistribution([])
      setAverageByQuality([])
      setAverages({
        daily: 0,
        monthly: 0,
        yearly: 0,
      })
      return
    }

    // Filter sleep events
    const sleepEvents = events.filter((event) => event.eventType === "sleeping")

    // Prepare data for the last 7 days
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i)
      last7Days.push({
        date: format(date, "MM/dd"),
        formattedDate: format(date, "MMM d"),
        hours: 0,
        quality: "unknown",
        goodHours: 0,
        fairHours: 0,
        poorHours: 0,
      })
    }

    // Calculate sleep duration in hours for each day
    sleepEvents.forEach((event) => {
      const startTime = parseISO(event.startTime || event.timestamp)
      const endTime = parseISO(event.endTime || event.timestamp)
      const durationMinutes = differenceInMinutes(endTime, startTime)
      const durationHours = durationMinutes / 60

      const eventDate = format(startTime, "MM/dd")
      const dayData = last7Days.find((day) => day.date === eventDate)

      if (dayData) {
        dayData.hours += durationHours

        // Extract quality from details if available
        const details = event.details || ""
        const qualityMatch = details.match(/Quality: (.+)/)
        const quality = qualityMatch && qualityMatch[1] !== "Not specified" ? qualityMatch[1].toLowerCase() : "unknown"

        // Add hours to the specific quality category
        if (quality === "good") dayData.goodHours += durationHours
        else if (quality === "fair") dayData.fairHours += durationHours
        else if (quality === "poor") dayData.poorHours += durationHours
      }
    })

    // Round hours to 1 decimal place
    last7Days.forEach((day) => {
      day.hours = Math.round(day.hours * 10) / 10
      day.goodHours = Math.round(day.goodHours * 10) / 10
      day.fairHours = Math.round(day.fairHours * 10) / 10
      day.poorHours = Math.round(day.poorHours * 10) / 10
    })

    setSleepData(last7Days)

    // Calculate quality distribution
    const qualityCounts = { good: 0, fair: 0, poor: 0, unknown: 0 }
    sleepEvents.forEach((event) => {
      const details = event.details || ""
      const qualityMatch = details.match(/Quality: (.+)/)
      const quality = qualityMatch && qualityMatch[1] !== "Not specified" ? qualityMatch[1].toLowerCase() : "unknown"
      qualityCounts[quality] = (qualityCounts[quality] || 0) + 1
    })

    const totalEvents = sleepEvents.length
    const distribution = Object.entries(qualityCounts).map(([name, value]) => ({
      name,
      value,
      percentage: totalEvents > 0 ? Math.round((value / totalEvents) * 100) : 0,
    }))

    setQualityDistribution(distribution)

    // Calculate average by quality
    const qualityTotals = { good: 0, fair: 0, poor: 0, unknown: 0 }
    const qualityEvents = { good: 0, fair: 0, poor: 0, unknown: 0 }

    sleepEvents.forEach((event) => {
      const startTime = parseISO(event.startTime || event.timestamp)
      const endTime = parseISO(event.endTime || event.timestamp)
      const durationHours = differenceInMinutes(endTime, startTime) / 60

      const details = event.details || ""
      const qualityMatch = details.match(/Quality: (.+)/)
      const quality = qualityMatch && qualityMatch[1] !== "Not specified" ? qualityMatch[1].toLowerCase() : "unknown"

      qualityTotals[quality] += durationHours
      qualityEvents[quality]++
    })

    const averagesByQuality = Object.entries(qualityTotals).map(([name, total]) => ({
      name,
      hours: qualityEvents[name] > 0 ? Math.round((total / qualityEvents[name]) * 10) / 10 : 0,
    }))

    setAverageByQuality(averagesByQuality)

    // Calculate overall averages
    const totalHours = sleepEvents.reduce((sum, event) => {
      const startTime = parseISO(event.startTime || event.timestamp)
      const endTime = parseISO(event.endTime || event.timestamp)
      return sum + differenceInMinutes(endTime, startTime) / 60
    }, 0)

    // Group by day
    const dailyHours = {}
    sleepEvents.forEach((event) => {
      const day = format(parseISO(event.timestamp), "yyyy-MM-dd")
      const startTime = parseISO(event.startTime || event.timestamp)
      const endTime = parseISO(event.endTime || event.timestamp)
      const hours = differenceInMinutes(endTime, startTime) / 60

      dailyHours[day] = (dailyHours[day] || 0) + hours
    })

    const dailyAverage =
      Object.values(dailyHours).length > 0
        ? Math.round(
            (Object.values(dailyHours).reduce((a: any, b: any) => a + b, 0) / Object.values(dailyHours).length) * 10,
          ) / 10
        : 0

    setAverages({
      daily: dailyAverage,
      monthly: Math.round((totalHours / 30) * 10) / 10, // Assuming 30 days of data
      yearly: Math.round((totalHours / 365) * 10) / 10, // Extrapolated yearly average
    })
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
        <p className="text-muted-foreground">Select a child to view sleep data</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">Sleep Tracking</h3>
          <p className="text-sm text-muted-foreground">Analyze your child's sleep patterns</p>
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
        <GraphLoader variant="bars" message="Loading sleep data..." />
      ) : sleepData.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed">
          <p className="text-muted-foreground">No sleep data available for the last 7 days</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averages.daily} hrs</div>
                <p className="text-xs text-muted-foreground">Average sleep per day</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Monthly Average</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averages.monthly} hrs</div>
                <p className="text-xs text-muted-foreground">Average sleep per day (30 days)</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Yearly Projection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averages.yearly} hrs</div>
                <p className="text-xs text-muted-foreground">Projected daily average for the year</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Sleep Duration Over Time</CardTitle>
                <CardDescription>Stacked bars showing sleep quality distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sleepData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis
                        dataKey="formattedDate"
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
                        domain={[0, "dataMax + 2"]}
                        label={{ value: "Hours", angle: -90, position: "insideLeft", style: { textAnchor: "middle" } }}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="font-medium">{label}</div>
                                  <div className="font-medium text-right">Hours</div>
                                  {payload[0].payload.goodHours > 0 && (
                                    <>
                                      <div className="flex items-center">
                                        <div
                                          className="mr-2 h-2 w-2 rounded-full"
                                          style={{ backgroundColor: COLORS.good }}
                                        ></div>
                                        Good
                                      </div>
                                      <div className="text-right">{payload[0].payload.goodHours}</div>
                                    </>
                                  )}
                                  {payload[0].payload.fairHours > 0 && (
                                    <>
                                      <div className="flex items-center">
                                        <div
                                          className="mr-2 h-2 w-2 rounded-full"
                                          style={{ backgroundColor: COLORS.fair }}
                                        ></div>
                                        Fair
                                      </div>
                                      <div className="text-right">{payload[0].payload.fairHours}</div>
                                    </>
                                  )}
                                  {payload[0].payload.poorHours > 0 && (
                                    <>
                                      <div className="flex items-center">
                                        <div
                                          className="mr-2 h-2 w-2 rounded-full"
                                          style={{ backgroundColor: COLORS.poor }}
                                        ></div>
                                        Poor
                                      </div>
                                      <div className="text-right">{payload[0].payload.poorHours}</div>
                                    </>
                                  )}
                                  <div className="font-medium">Total</div>
                                  <div className="font-medium text-right">{payload[0].payload.hours}</div>
                                </div>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Legend />
                      <Bar dataKey="goodHours" stackId="a" name="Good Sleep" fill={COLORS.good} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="fairHours" stackId="a" name="Fair Sleep" fill={COLORS.fair} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="poorHours" stackId="a" name="Poor Sleep" fill={COLORS.poor} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sleep Quality Distribution</CardTitle>
                <CardDescription>Percentage of sleep by quality</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={qualityDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                      >
                        {qualityDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[entry.name] || COLORS.unknown} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => {
                          const entry = qualityDistribution.find((item) => item.name === name)
                          return [`${value} (${entry?.percentage}%)`, name]
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Average Sleep Duration by Quality</CardTitle>
                <CardDescription>How quality affects sleep duration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={averageByQuality} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis
                        dataKey="name"
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
                        domain={[0, "dataMax + 2"]}
                        label={{ value: "Hours", angle: -90, position: "insideLeft", style: { textAnchor: "middle" } }}
                      />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="hours" name="Average Hours" radius={[4, 4, 0, 0]} barSize={60}>
                        {averageByQuality.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[entry.name] || COLORS.unknown} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

