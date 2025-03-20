"use client"

import { useEffect, useState, useMemo } from "react"
import { format, parseISO, subDays } from "date-fns"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const COLORS = {
  wet: "#3b82f6", // blue
  dirty: "#f59e0b", // amber
  both: "#10b981", // green
  unknown: "#6b7280", // gray
}

export function DiaperChart() {
  const dispatch = useAppDispatch()
  const { selectedChild } = useAppSelector((state) => state.children)
  const { items: events, loading: isLoading, lastUpdated } = useAppSelector((state) => state.events)

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("daily")
  const [timeRange, setTimeRange] = useState<"7days" | "30days" | "90days">("7days")

  // Fetch events when selectedChild changes or lastUpdated changes
  useEffect(() => {
    if (selectedChild) {
      // Get data for the selected time range
      const endDate = new Date()
      let startDate: Date

      switch (timeRange) {
        case "30days":
          startDate = subDays(endDate, 30)
          break
        case "90days":
          startDate = subDays(endDate, 90)
          break
        default:
          startDate = subDays(endDate, 7)
      }

      dispatch(
        fetchEvents({
          childId: selectedChild.id,
          eventType: "diaper",
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      )
    }
  }, [selectedChild, lastUpdated, timeRange, dispatch])

  // Process diaper data
  const { dailyData, typeDistribution, weeklyTotals } = useMemo(() => {
    if (!selectedChild || events.length === 0) {
      return {
        dailyData: [],
        typeDistribution: [],
        weeklyTotals: { total: 0, wet: 0, dirty: 0, both: 0, unknown: 0 },
      }
    }

    // Filter diaper events
    const diaperEvents = events.filter((event) => event.eventType === "diaper")

    // Prepare data for the selected time range
    const days = timeRange === "7days" ? 7 : timeRange === "30days" ? 30 : 90
    const dailyData = []

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i)
      dailyData.push({
        date: format(date, "MM/dd"),
        formattedDate: format(date, "MMM d"),
        wet: 0,
        dirty: 0,
        both: 0,
        unknown: 0,
        total: 0,
      })
    }

    // Count diaper types for each day
    diaperEvents.forEach((event) => {
      const eventDate = format(parseISO(event.timestamp), "MM/dd")
      const dayData = dailyData.find((day) => day.date === eventDate)

      if (dayData) {
        // Extract diaper type from details
        const details = event.details || ""
        const typeMatch = details.match(/Type: (.+)/)
        const type = typeMatch ? typeMatch[1].toLowerCase() : "unknown"

        // Increment the appropriate counter
        if (type === "wet" || type === "dirty" || type === "both") {
          dayData[type]++
        } else {
          dayData.unknown++
        }

        dayData.total++
      }
    })

    // Calculate type distribution
    const typeCounts = { wet: 0, dirty: 0, both: 0, unknown: 0 }
    diaperEvents.forEach((event) => {
      const details = event.details || ""
      const typeMatch = details.match(/Type: (.+)/)
      const type = typeMatch ? typeMatch[1].toLowerCase() : "unknown"

      if (type === "wet" || type === "dirty" || type === "both") {
        typeCounts[type]++
      } else {
        typeCounts.unknown++
      }
    })

    const totalEvents = diaperEvents.length
    const distribution = Object.entries(typeCounts).map(([name, value]) => ({
      name,
      value,
      percentage: totalEvents > 0 ? Math.round((value / totalEvents) * 100) : 0,
    }))

    // Calculate weekly totals
    const weeklyTotals = {
      total: diaperEvents.length,
      wet: typeCounts.wet,
      dirty: typeCounts.dirty,
      both: typeCounts.both,
      unknown: typeCounts.unknown,
    }

    return {
      dailyData,
      typeDistribution: distribution,
      weeklyTotals,
    }
  }, [selectedChild, events, timeRange])

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
        <p className="text-muted-foreground">Select a child to view diaper data</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">Diaper Tracking</h3>
          <p className="text-sm text-muted-foreground">Analyze your child's diaper patterns</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as any)} className="mr-2">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="7days">7 Days</TabsTrigger>
              <TabsTrigger value="30days">30 Days</TabsTrigger>
              <TabsTrigger value="90days">90 Days</TabsTrigger>
            </TabsList>
          </Tabs>
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
      </div>

      {isLoading ? (
        <GraphLoader variant="bars" message="Loading diaper data..." />
      ) : dailyData.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed">
          <p className="text-muted-foreground">No diaper data available for the selected time range</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Changes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{weeklyTotals.total}</div>
                <p className="text-xs text-muted-foreground">
                  Total diaper changes in the last {timeRange === "7days" ? "7" : timeRange === "30days" ? "30" : "90"}{" "}
                  days
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {weeklyTotals.total > 0
                    ? Math.round(
                        (weeklyTotals.total / (timeRange === "7days" ? 7 : timeRange === "30days" ? 30 : 90)) * 10,
                      ) / 10
                    : 0}
                </div>
                <p className="text-xs text-muted-foreground">Average changes per day</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Most Common Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">
                  {
                    Object.entries(weeklyTotals)
                      .filter(([key]) => key !== "total")
                      .sort(([, a], [, b]) => (b as number) - (a as number))[0][0]
                  }
                </div>
                <p className="text-xs text-muted-foreground">Most frequent diaper type</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Diaper Changes Over Time</CardTitle>
                <CardDescription>Stacked bars showing diaper type distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                        label={{
                          value: "Changes",
                          angle: -90,
                          position: "insideLeft",
                          style: { textAnchor: "middle" },
                        }}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="font-medium">{label}</div>
                                  <div className="font-medium text-right">Count</div>
                                  {payload[0].payload.wet > 0 && (
                                    <>
                                      <div className="flex items-center">
                                        <div
                                          className="mr-2 h-2 w-2 rounded-full"
                                          style={{ backgroundColor: COLORS.wet }}
                                        ></div>
                                        Wet
                                      </div>
                                      <div className="text-right">{payload[0].payload.wet}</div>
                                    </>
                                  )}
                                  {payload[0].payload.dirty > 0 && (
                                    <>
                                      <div className="flex items-center">
                                        <div
                                          className="mr-2 h-2 w-2 rounded-full"
                                          style={{ backgroundColor: COLORS.dirty }}
                                        ></div>
                                        Dirty
                                      </div>
                                      <div className="text-right">{payload[0].payload.dirty}</div>
                                    </>
                                  )}
                                  {payload[0].payload.both > 0 && (
                                    <>
                                      <div className="flex items-center">
                                        <div
                                          className="mr-2 h-2 w-2 rounded-full"
                                          style={{ backgroundColor: COLORS.both }}
                                        ></div>
                                        Both
                                      </div>
                                      <div className="text-right">{payload[0].payload.both}</div>
                                    </>
                                  )}
                                  {payload[0].payload.unknown > 0 && (
                                    <>
                                      <div className="flex items-center">
                                        <div
                                          className="mr-2 h-2 w-2 rounded-full"
                                          style={{ backgroundColor: COLORS.unknown }}
                                        ></div>
                                        Unknown
                                      </div>
                                      <div className="text-right">{payload[0].payload.unknown}</div>
                                    </>
                                  )}
                                  <div className="font-medium">Total</div>
                                  <div className="font-medium text-right">{payload[0].payload.total}</div>
                                </div>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Legend />
                      <Bar dataKey="wet" stackId="a" name="Wet" fill={COLORS.wet} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="dirty" stackId="a" name="Dirty" fill={COLORS.dirty} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="both" stackId="a" name="Both" fill={COLORS.both} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="unknown" stackId="a" name="Unknown" fill={COLORS.unknown} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Diaper Type Distribution</CardTitle>
                <CardDescription>Percentage of changes by type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={typeDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                      >
                        {typeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[entry.name] || COLORS.unknown} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => {
                          const entry = typeDistribution.find((item) => item.name === name)
                          return [`${value} (${entry?.percentage}%)`, name]
                        }}
                      />
                      <Legend />
                    </PieChart>
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

