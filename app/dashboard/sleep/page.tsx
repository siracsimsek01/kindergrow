"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useChildContext } from "@/contexts/child-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { SleepQualityChart } from "@/components/charts/sleep-quality-chart"
import { SleepTrendsChart } from "@/components/charts/sleep-trends-chart"
import { SleepCalendarHeatmap } from "@/components/sleep-calendar-heatmap"
import { SleepLog } from "@/components/sleep-log"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Plus, Clock, Moon, Sun, PieChart, CalendarIcon, LineChart } from "lucide-react"
import { ChartSkeleton, StatCardSkeleton, TableSkeleton } from "@/components/ui/skeleton-loader"

interface SleepEvent {
  id: string
  timestamp: string
  details: string
  duration: number
  quality: string
  startTime: string
  endTime: string
  notes: string
  date: Date
}

export default function SleepTrackingPage() {
  const { selectedChild, isLoading: isChildLoading, setIsAddEventModalOpen } = useChildContext()
  const [sleepEvents, setSleepEvents] = useState<SleepEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [activeTab, setActiveTab] = useState("overview")
  const [timeFrame, setTimeFrame] = useState<"week" | "month" | "6months" | "year">("week")
  const [chartView, setChartView] = useState<"pie" | "trend" | "heatmap">("pie")

  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchSleepEvents = useCallback(async () => {
    if (!selectedChild) {
      setSleepEvents([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      console.log(`Fetching sleep events for child ID: ${selectedChild.id}`)

      const response = await fetch(`/api/children/${selectedChild.id}/sleep`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch sleep events: ${response.status}`)
      }

      const events = await response.json()
      console.log(`Received ${events.length} sleep events`)

      // Process events
      const processedEvents = events.map((event : any) => {
        const details = event.details || ""

        // Extract quality
        let quality = "Good" // Default to "Good" if not specified
        const qualityMatch = details.match(/Quality: (.*?)(?:\n|$)/)
        if (qualityMatch) {
          quality = qualityMatch[1]
        }

        // Extract duration
        let duration = 8 // Default to 8 hours if not specified
        const durationMatch = details.match(/Duration: (\d+(\.\d+)?)/)
        if (durationMatch) {
          duration = Number.parseFloat(durationMatch[1])
        }

        // Calculate duration from start and end times if available
        if (event.startTime && event.endTime) {
          const start = new Date(event.startTime)
          const end = new Date(event.endTime)
          const durationMs = end.getTime() - start.getTime()
          duration = durationMs / (1000 * 60 * 60) // Convert ms to hours
        }

        // Ensure duration is never zero for display purposes
        if (duration < 0.1) duration = 0.1

        // Extract start and end times
        let startTime = ""
        let endTime = ""
        const startMatch = details.match(/Start Time: (.*?)(?:\n|$)/)
        if (startMatch) {
          startTime = startMatch[1]
        }

        const endMatch = details.match(/End Time: (.*?)(?:\n|$)/)
        if (endMatch) {
          endTime = endMatch[1]
        }

        // Extract notes
        let notes = ""
        const notesMatch = details.match(/Notes: (.*?)(?:\n|$)/)
        if (notesMatch) {
          notes = notesMatch[1]
        }

        return {
          id: event.id,
          timestamp: event.timestamp,
          details,
          duration,
          quality,
          startTime,
          endTime,
          notes,
          date: new Date(event.timestamp),
        }
      })

      setSleepEvents(processedEvents)
    } catch (error) {
      console.error("Error fetching sleep events:", error)
      setError("Failed to fetch sleep events")
    } finally {
      setIsLoading(false)
    }
  }, [selectedChild])

  // Load sleep events when selectedChild changes
  useEffect(() => {
    fetchSleepEvents()
  }, [fetchSleepEvents])

  // Memoize the day events to prevent recalculation on every render
  const getDayEvents = useCallback(
    (day: Date) => {
      return sleepEvents.filter(
        (event) =>
          event.date.getDate() === day.getDate() &&
          event.date.getMonth() === day.getMonth() &&
          event.date.getFullYear() === day.getFullYear(),
      )
    },
    [sleepEvents],
  )

  const selectedDateEvents = useMemo(() => {
    return date ? getDayEvents(date) : []
  }, [date, getDayEvents])

  // Memoize these calculations to improve performance
  const totalSleepDuration = useMemo(() => {
    return (events: SleepEvent[]) => events.reduce((total, event) => total + event.duration, 0)
  }, [])

  const averageSleepQuality = useMemo(() => {
    return (events: SleepEvent[]) => {
      if (events.length === 0) return "N/A"

      const qualityMap = {
        Excellent: 5,
        Good: 4,
        Fair: 3,
        Poor: 2,
        "Very Poor": 1,
        Unknown: 0,
      }

      const sum = events.reduce((total, event) => {
        return total + (qualityMap[event.quality as keyof typeof qualityMap] || 0)
      }, 0)

      const avg = sum / events.length

      if (avg >= 4.5) return "Excellent"
      if (avg >= 3.5) return "Good"
      if (avg >= 2.5) return "Fair"
      if (avg >= 1.5) return "Poor"
      if (avg > 0) return "Very Poor"
      return "Unknown"
    }
  }, [])

  const qualityCounts = useMemo(() => {
    const counts = {
      Excellent: 0,
      Good: 0,
      Fair: 0,
      Poor: 0,
      "Very Poor": 0,
    }

    sleepEvents.forEach((event) => {
      if (counts.hasOwnProperty(event.quality)) {
        counts[event.quality as keyof typeof counts]++
      }
    })

    return counts
  }, [sleepEvents])

  const isLoaded = !isChildLoading && !isLoading

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sleep Tracking</h1>
          <p className="text-muted-foreground">Monitor your child's sleep patterns and duration</p>
        </div>
        <div className="flex">
          <Button onClick={() => setIsAddEventModalOpen(true, "sleeping")} disabled={!selectedChild}>
            <Plus className="mr-2 h-4 w-4" />
            Add Sleep Event
          </Button>
        </div>
      </div>

      {!isLoaded ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <StatCardSkeleton isLoading={true}>
                  {/* Content will never render */}
                  <div></div>
                </StatCardSkeleton>
              </Card>
            ))}
          </div>

          <Card>
            <ChartSkeleton isLoading={true} height="h-[350px]">
              <div></div>
            </ChartSkeleton>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <ChartSkeleton isLoading={true}>
                <div></div>
              </ChartSkeleton>
            </Card>

            <Card>
              <TableSkeleton isLoading={true}>
                <div></div>
              </TableSkeleton>
            </Card>
          </div>
        </>
      ) : !selectedChild ? (
        <Card>
          <CardContent className="flex h-[400px] items-center justify-center">
            <p className="text-muted-foreground">Select a child to view sleep data</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="flex h-[400px] items-center justify-center">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card className="lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sleep Records</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sleepEvents.length}</div>
                <p className="text-xs text-muted-foreground">Sleep events recorded</p>
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Sleep Duration</CardTitle>
                <Moon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {sleepEvents.length > 0
                    ? `${(totalSleepDuration(sleepEvents) / sleepEvents.length).toFixed(1)} hours`
                    : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">Per sleep session</p>
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Sleep Quality</CardTitle>
                <Sun className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averageSleepQuality(sleepEvents)}</div>
                <p className="text-xs text-muted-foreground">Based on recorded quality</p>
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Good/Excellent Sleep</CardTitle>
                <span className="text-lg">⭐</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{qualityCounts.Excellent + qualityCounts.Good}</div>
                <p className="text-xs text-muted-foreground">
                  {sleepEvents.length > 0
                    ? `${(((qualityCounts.Excellent + qualityCounts.Good) / sleepEvents.length) * 100).toFixed(
                        1,
                      )}% of total`
                    : "N/A"}
                </p>
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Poor Sleep</CardTitle>
                <span className="text-lg">😴</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{qualityCounts.Poor + qualityCounts["Very Poor"]}</div>
                <p className="text-xs text-muted-foreground">
                  {sleepEvents.length > 0
                    ? `${(((qualityCounts.Poor + qualityCounts["Very Poor"]) / sleepEvents.length) * 100).toFixed(
                        1,
                      )}% of total`
                    : "N/A"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Sleep Quality</CardTitle>
                      <CardDescription>Distribution of sleep quality</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <div className="flex space-x-1">
                        <Button
                          variant={timeFrame === "week" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTimeFrame("week")}
                          className="text-xs h-7 px-2"
                        >
                          Week
                        </Button>
                        <Button
                          variant={timeFrame === "month" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTimeFrame("month")}
                          className="text-xs h-7 px-2"
                        >
                          Month
                        </Button>
                        <Button
                          variant={timeFrame === "6months" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTimeFrame("6months")}
                          className="text-xs h-7 px-2"
                        >
                          6 Months
                        </Button>
                        <Button
                          variant={timeFrame === "year" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTimeFrame("year")}
                          className="text-xs h-7 px-2"
                        >
                          Year
                        </Button>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant={chartView === "pie" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setChartView("pie")}
                          className="text-xs h-7 w-7 px-0"
                          title="Pie Chart"
                        >
                          <PieChart className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={chartView === "trend" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setChartView("trend")}
                          className="text-xs h-7 w-7 px-0"
                          title="Trend Chart"
                        >
                          <LineChart className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={chartView === "heatmap" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setChartView("heatmap")}
                          className="text-xs h-7 w-7 px-0"
                          title="Calendar Heatmap"
                        >
                          <CalendarIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="h-[350px]">
                  {chartView === "pie" && (
                    <SleepQualityChart events={sleepEvents} selectedChild={selectedChild} timeFrame={timeFrame} />
                  )}
                  {chartView === "trend" && (
                    <SleepTrendsChart events={sleepEvents} selectedChild={selectedChild} timeFrame={timeFrame} />
                  )}
                  {chartView === "heatmap" && (
                    <SleepCalendarHeatmap events={sleepEvents} selectedChild={selectedChild} />
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Sleep Trends</CardTitle>
                    <CardDescription>Sleep duration over time</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <SleepTrendsChart events={sleepEvents} selectedChild={selectedChild} timeFrame={timeFrame} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Sleep Sessions</CardTitle>
                    <CardDescription>Latest recorded sleep sessions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {sleepEvents.length === 0 ? (
                      <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
                        <p className="text-sm text-muted-foreground">No sleep events recorded yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[300px] overflow-auto pr-2">
                        {sleepEvents
                          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                          .slice(0, 5)
                          .map((event) => (
                            <div key={event.id} className="flex items-start space-x-4 py-3 border-b last:border-0">
                              <div className="text-3xl">😴</div>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center">
                                  <p className="text-sm font-medium">Sleep Session</p>
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    {format(new Date(event.timestamp), "MMM d, yyyy")}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(event.timestamp), "h:mm a")}
                                </p>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Duration: </span>
                                    <span>{event.duration.toFixed(1)} hours</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Quality: </span>
                                    <span>{event.quality}</span>
                                  </div>
                                </div>
                                {event.notes && <p className="text-xs mt-1">{event.notes}</p>}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Only render the active tab content to improve performance */}
            {activeTab === "analysis" && (
              <TabsContent value="analysis" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Sleep Pattern Analysis</CardTitle>
                    <CardDescription>Analysis of sleep duration and quality</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Sleep Quality</h3>
                        <div className="space-y-3">
                          {["Excellent", "Good", "Fair", "Poor", "Very Poor"].map((quality) => {
                            const count = qualityCounts[quality as keyof typeof qualityCounts]
                            const maxCount = Math.max(...Object.values(qualityCounts))
                            const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0

                            let emoji = "😴"
                            if (quality === "Excellent") emoji = "⭐"
                            if (quality === "Good") emoji = "👍"
                            if (quality === "Fair") emoji = "👌"
                            if (quality === "Poor") emoji = "👎"
                            if (quality === "Very Poor") emoji = "😴"

                            let bgColor = "bg-green-500"
                            if (quality === "Good") bgColor = "bg-blue-500"
                            if (quality === "Fair") bgColor = "bg-purple-500"
                            if (quality === "Poor") bgColor = "bg-amber-500"
                            if (quality === "Very Poor") bgColor = "bg-red-500"

                            return (
                              <div key={quality} className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="flex items-center">
                                    <span className="text-lg mr-2">{emoji}</span>
                                    <span>{quality}</span>
                                  </span>
                                  <span className="font-medium">{count}</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2.5">
                                  <div
                                    className={`${bgColor} h-2.5 rounded-full`}
                                    style={{
                                      width: `${percentage}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      <div className="h-[300px]">
                        <SleepTrendsChart events={sleepEvents} selectedChild={selectedChild} timeFrame="month" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {activeTab === "history" && (
              <TabsContent value="history" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Sleep History</CardTitle>
                    <CardDescription>Complete history of recorded sleep sessions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SleepLog events={sleepEvents} />
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {activeTab === "calendar" && (
              <TabsContent value="calendar" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Sleep Calendar</CardTitle>
                      <CardDescription>View sleep events by date</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md border"
                        modifiers={{
                          hasSleep: sleepEvents.map((event) => event.date),
                        }}
                        modifiersStyles={{
                          hasSleep: {
                            backgroundColor: "hsl(var(--primary) / 0.1)",
                            fontWeight: "bold",
                            borderBottom: "2px solid hsl(var(--primary))",
                          },
                        }}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>{date ? format(date, "MMMM d, yyyy") : "Select a date"}</CardTitle>
                      <CardDescription>
                        {selectedDateEvents.length} sleep {selectedDateEvents.length === 1 ? "event" : "events"}{" "}
                        recorded
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!date ? (
                        <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed">
                          <p className="text-sm text-muted-foreground">Select a date to view sleep events</p>
                        </div>
                      ) : selectedDateEvents.length === 0 ? (
                        <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed">
                          <p className="text-sm text-muted-foreground">No sleep events recorded for this date</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-md border p-4">
                              <h3 className="mb-2 font-medium">Total Sleep</h3>
                              <p className="text-2xl font-bold">
                                {totalSleepDuration(selectedDateEvents).toFixed(1)} hours
                              </p>
                            </div>
                            <div className="rounded-md border p-4">
                              <h3 className="mb-2 font-medium">Average Quality</h3>
                              <p className="text-2xl font-bold">{averageSleepQuality(selectedDateEvents)}</p>
                            </div>
                          </div>

                          <div className="space-y-4 max-h-[300px] overflow-auto pr-2">
                            {selectedDateEvents
                              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                              .map((event) => (
                                <div key={event.id} className="flex items-start space-x-4 py-3 border-b last:border-0">
                                  <div className="text-3xl">😴</div>
                                  <div className="flex-1 space-y-1">
                                    <div className="flex items-center">
                                      <p className="text-sm font-medium">Sleep Session</p>
                                      <Badge variant="outline" className="ml-2 text-xs">
                                        {format(new Date(event.timestamp), "h:mm a")}
                                      </Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <div>
                                        <span className="text-muted-foreground">Duration: </span>
                                        <span>{event.duration.toFixed(1)} hours</span>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Quality: </span>
                                        <span>{event.quality}</span>
                                      </div>
                                      {event.startTime && (
                                        <div>
                                          <span className="text-muted-foreground">Start: </span>
                                          <span>{event.startTime}</span>
                                        </div>
                                      )}
                                      {event.endTime && (
                                        <div>
                                          <span className="text-muted-foreground">End: </span>
                                          <span>{event.endTime}</span>
                                        </div>
                                      )}
                                    </div>
                                    {event.notes && <p className="text-xs">{event.notes}</p>}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </>
      )}
    </div>
  )
}

