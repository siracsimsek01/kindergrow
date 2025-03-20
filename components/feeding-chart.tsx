"use client"

import { useEffect, useState } from "react"
import { format, parseISO, subDays, differenceInMinutes } from "date-fns"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { GraphLoader } from "@/components/ui/graph-loader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { fetchEvents, triggerRefresh } from "@/lib/redux/slices/eventsSlice"

const COLORS = {
  breast: "#10b981", // green
  bottle: "#3b82f6", // blue
  solid: "#f59e0b", // yellow
  unknown: "#6b7280", // gray
}

export function FeedingChart() {
  const dispatch = useAppDispatch()
  const { selectedChild } = useAppSelector((state) => state.children)
  const { items: events, loading: isLoading, lastUpdated } = useAppSelector((state) => state.events)

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [feedingData, setFeedingData] = useState<any[]>([])
  const [typeDistribution, setTypeDistribution] = useState<any[]>([])
  const [averageDuration, setAverageDuration] = useState<any[]>([])
  const [todayFeedings, setTodayFeedings] = useState(0)
  const [feedingInterval, setFeedingInterval] = useState("N/A")

  useEffect(() => {
    if (selectedChild) {
      // Get data for the last 30 days
      const endDate = new Date()
      const startDate = subDays(endDate, 30)

      dispatch(
        fetchEvents({
          childId: selectedChild.id,
          eventType: "feeding",
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      )
    }
  }, [selectedChild, lastUpdated, dispatch])

  useEffect(() => {
    if (!selectedChild || events.length === 0) {
      setFeedingData([])
      setTypeDistribution([])
      setAverageDuration([])
      setTodayFeedings(0)
      setFeedingInterval("N/A")
      return
    }

    // Filter feeding events
    const feedingEvents = events.filter((event) => event.eventType === "feeding")

    // Prepare data for the last 7 days
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i)
      last7Days.push({
        date: format(date, "MM/dd"),
        formattedDate: format(date, "MMM d"),
        breast: 0,
        bottle: 0,
        solid: 0,
        unknown: 0,
      })
    }

    // Calculate feeding amounts for each day by type
    feedingEvents.forEach((event) => {
      const eventDate = format(parseISO(event.timestamp), "MM/dd")
      const dayData = last7Days.find((day) => day.date === eventDate)

      if (dayData) {
        // Extract feeding type from details
        const details = event.details || ""
        const typeMatch = details.match(/Type: (.+)/)
        const type = typeMatch ? typeMatch[1].toLowerCase() : "unknown"

        // Extract amount from details
        const amountMatch = details.match(/Amount: (\d+)/)
        const amount = amountMatch ? Number.parseInt(amountMatch[1]) : event.amount || 0

        // Add amount to the specific type category
        if (type === "breast") dayData.breast += amount
        else if (type === "bottle") dayData.bottle += amount
        else if (type === "solid") dayData.solid += amount
        else dayData.unknown += amount
      }
    })

    setFeedingData(last7Days)

    // Calculate type distribution
    const typeTotals = { breast: 0, bottle: 0, solid: 0, unknown: 0 }
    feedingEvents.forEach((event) => {
      const details = event.details || ""
      const typeMatch = details.match(/Type: (.+)/)
      const type = typeMatch ? typeMatch[1].toLowerCase() : "unknown"

      const amountMatch = details.match(/Amount: (\d+)/)
      const amount = amountMatch ? Number.parseInt(amountMatch[1]) : event.amount || 0

      typeTotals[type] = (typeTotals[type] || 0) + amount
    })

    const totalAmount = Object.values(typeTotals).reduce((a: any, b: any) => a + b, 0)
    const distribution = Object.entries(typeTotals).map(([name, value]) => ({
      name,
      value,
      percentage: totalAmount > 0 ? Math.round((value / totalAmount) * 100) : 0,
    }))

    setTypeDistribution(distribution)

    // Calculate average duration by type
    const durationTotals = { breast: 0, bottle: 0, solid: 0, unknown: 0 }
    const typeEvents = { breast: 0, bottle: 0, solid: 0, unknown: 0 }

    feedingEvents.forEach((event) => {
      const details = event.details || ""
      const typeMatch = details.match(/Type: (.+)/)
      const type = typeMatch ? typeMatch[1].toLowerCase() : "unknown"

      const durationMatch = details.match(/Duration: (\d+)/)
      const duration = durationMatch ? Number.parseInt(durationMatch[1]) : event.duration || 0

      durationTotals[type] += duration
      typeEvents[type]++
    })

    const averagesByType = Object.entries(durationTotals).map(([name, total]) => ({
      name,
      minutes: typeEvents[name] > 0 ? Math.round(total / typeEvents[name]) : 0,
    }))

    setAverageDuration(averagesByType)

    // Calculate today's feedings
    const today = format(new Date(), "yyyy-MM-dd")
    const todayEvents = feedingEvents.filter((event) => format(parseISO(event.timestamp), "yyyy-MM-dd") === today)
    setTodayFeedings(todayEvents.length)

    // Calculate average feeding interval
    if (feedingEvents.length >= 2) {
      // Sort events by timestamp
      const sortedEvents = [...feedingEvents].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )

      // Calculate intervals between feedings
      let totalIntervalMinutes = 0
      let intervalCount = 0

      for (let i = 0; i < sortedEvents.length - 1; i++) {
        const current = parseISO(sortedEvents[i].timestamp)
        const next = parseISO(sortedEvents[i + 1].timestamp)

        // Only count intervals within the same day
        if (format(current, "yyyy-MM-dd") === format(next, "yyyy-MM-dd")) {
          const intervalMinutes = differenceInMinutes(current, next)
          totalIntervalMinutes += intervalMinutes
          intervalCount++
        }
      }

      if (intervalCount > 0) {
        const avgIntervalMinutes = Math.round(totalIntervalMinutes / intervalCount)
        const hours = Math.floor(avgIntervalMinutes / 60)
        const minutes = avgIntervalMinutes % 60
        setFeedingInterval(`${hours}h ${minutes}m`)
      } else {
        setFeedingInterval("N/A")
      }
    } else {
      setFeedingInterval("N/A")
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
        <p className="text-muted-foreground">Select a child to view feeding data</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">Feeding Tracking</h3>
          <p className="text-sm text-muted-foreground">Analyze your child's feeding patterns</p>
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
        <GraphLoader variant="bars" message="Loading feeding data..." />
      ) : feedingData.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed">
          <p className="text-muted-foreground">No feeding data available for the last 7 days</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Feedings Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayFeedings}</div>
                <p className="text-xs text-muted-foreground">Total feedings recorded today</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Feeding Interval</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{feedingInterval}</div>
                <p className="text-xs text-muted-foreground">Average time between feedings</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Feeding Quantity Over Time</CardTitle>
                <CardDescription>Amount consumed by food type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={feedingData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                        label={{
                          value: "Amount (ml/g)",
                          angle: -90,
                          position: "insideLeft",
                          style: { textAnchor: "middle" },
                        }}
                      />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="breast"
                        name="Breast"
                        stroke={COLORS.breast}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="bottle"
                        name="Bottle"
                        stroke={COLORS.bottle}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="solid"
                        name="Solid"
                        stroke={COLORS.solid}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Food Type Distribution</CardTitle>
                <CardDescription>Percentage of total volume by type</CardDescription>
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
                          return [`${value} ml/g (${entry?.percentage}%)`, name]
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
                <CardTitle>Average Feeding Session Duration</CardTitle>
                <CardDescription>Average minutes per feeding type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={averageDuration} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                        label={{
                          value: "Minutes",
                          angle: -90,
                          position: "insideLeft",
                          style: { textAnchor: "middle" },
                        }}
                      />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="minutes" name="Average Duration (minutes)" radius={[4, 4, 0, 0]} barSize={60}>
                        {averageDuration.map((entry, index) => (
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

