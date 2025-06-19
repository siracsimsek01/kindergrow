"use client"

import { useState, useEffect } from "react"
import { useChildContext } from "@/contexts/child-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { format, subDays, subMonths, subYears } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Plus, Filter, ArrowUpDown, Search, CalendarIcon, BarChart3, PieChart } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DiaperChart } from "@/components/charts/diaper-chart"
import { DiaperTypesChart } from "@/components/charts/diaper-types-chart"
import { DiaperTrendsChart } from "@/components/charts/diaper-trends-chart"
import { DiaperCalendarHeatmap } from "@/components/diaper-calendar-heatmap"
import { ChartSkeleton, StatCardSkeleton, TableSkeleton } from "@/components/ui/skeleton-loader"

interface DiaperEvent {
  id: string
  timestamp: string
  details: string
  type: string
  contents: string[]
  notes: string
  date: Date
}

export default function DiaperTrackingPage() {
  const { selectedChild, isLoading: isChildLoading, setIsAddEventModalOpen } = useChildContext()
  const [diaperEvents, setDiaperEvents] = useState<DiaperEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "wet" | "dirty" | "mixed" | "dry">("all")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [timeFrame, setTimeFrame] = useState<"week" | "month" | "6months" | "year">("week")
  const [chartView, setChartView] = useState<"bar" | "pie" | "trend" | "heatmap">("bar")

  useEffect(() => {
    const fetchDiaperEvents = async () => {
      if (!selectedChild) {
        setDiaperEvents([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        console.log(`Fetching diaper events for child ID: ${selectedChild.id}`)

        const response = await fetch(`/api/children/${selectedChild.id}/diaper`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch diaper events: ${response.status}`)
        }

        const events = await response.json()
        console.log(`Received ${events.length} diaper events`)

        // Process events
        const processedEvents = events.map((event) => {
          const details = event.details || ""

          // Extract type
          let type = "Unknown"
          const typeMatch = details.match(/Type: (.*?)(?:\n|$)/)
          if (typeMatch) {
            type = typeMatch[1]
          }

          // Extract contents
          let contents: string[] = []
          const contentsMatch = details.match(/Contents: (.*?)(?:\n|$)/)
          if (contentsMatch) {
            contents = contentsMatch[1].split(",").map((item) => item.trim())
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
            type,
            contents,
            notes,
            date: new Date(event.timestamp),
          }
        })

        setDiaperEvents(processedEvents)
      } catch (error) {
        console.error("Error fetching diaper events:", error)
        setError("Failed to fetch diaper events")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDiaperEvents()
  }, [selectedChild])

  // No sample data generation - show empty state when no real data exists

  const getDayEvents = (day: Date) => {
    return diaperEvents.filter(
      (event) =>
        event.date.getDate() === day.getDate() &&
        event.date.getMonth() === day.getMonth() &&
        event.date.getFullYear() === day.getFullYear(),
    )
  }

  const selectedDateEvents = date ? getDayEvents(date) : []

  const getDiaperTypeCount = (type: string) => {
    return diaperEvents.filter((event) => event.type === type).length
  }

  const getFilteredEvents = () => {
    return diaperEvents
      .filter((event) => {
        // Apply search filter
        const matchesSearch =
          event.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          format(event.date, "MMM d, yyyy").toLowerCase().includes(searchTerm.toLowerCase())

        // Apply type filter
        const matchesType = filterType === "all" || event.type.toLowerCase() === filterType.toLowerCase()

        return matchesSearch && matchesType
      })
      .sort((a, b) => {
        // Apply sort order
        return sortOrder === "asc"
          ? new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          : new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      })
  }

  const getTimeFrameLabel = () => {
    switch (timeFrame) {
      case "week":
        return "Past Week"
      case "month":
        return "Past Month"
      case "6months":
        return "Past 6 Months"
      case "year":
        return "Past Year"
      default:
        return "Past Week"
    }
  }

  const getStartDate = () => {
    const today = new Date()
    switch (timeFrame) {
      case "week":
        return subDays(today, 6)
      case "month":
        return subMonths(today, 1)
      case "6months":
        return subMonths(today, 6)
      case "year":
        return subYears(today, 1)
      default:
        return subDays(today, 6)
    }
  }

  const isLoaded = !isChildLoading && !isLoading

  const totalDiapers = diaperEvents.length
  const wetDiapers = getDiaperTypeCount("Wet")
  const dirtyDiapers = getDiaperTypeCount("Dirty")
  const mixedDiapers = getDiaperTypeCount("Mixed")
  const dryDiapers = getDiaperTypeCount("Dry")

  const filteredEvents = getFilteredEvents()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Diaper Tracking</h1>
          <p className="text-muted-foreground">Monitor your child's diaper changes and patterns</p>
        </div>
        <Button onClick={() => setIsAddEventModalOpen(true, "diaper")} disabled={!selectedChild}>
          <Plus className="mr-2 h-4 w-4" />
          Add Diaper Change
        </Button>
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
            <p className="text-muted-foreground">Select a child to view diaper data</p>
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
                <CardTitle className="text-sm font-medium">Total Changes</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalDiapers}</div>
                <p className="text-xs text-muted-foreground">Diaper changes recorded</p>
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Wet Diapers</CardTitle>
                <span className="text-lg">💧</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{wetDiapers}</div>
                <p className="text-xs text-muted-foreground">
                  {((wetDiapers / totalDiapers) * 100).toFixed(1)}% of total
                </p>
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dirty Diapers</CardTitle>
                <span className="text-lg">💩</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dirtyDiapers}</div>
                <p className="text-xs text-muted-foreground">
                  {((dirtyDiapers / totalDiapers) * 100).toFixed(1)}% of total
                </p>
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mixed Diapers</CardTitle>
                <span className="text-lg">🔄</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mixedDiapers}</div>
                <p className="text-xs text-muted-foreground">
                  {((mixedDiapers / totalDiapers) * 100).toFixed(1)}% of total
                </p>
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dry Diapers</CardTitle>
                <span className="text-lg">✅</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dryDiapers}</div>
                <p className="text-xs text-muted-foreground">
                  {((dryDiapers / totalDiapers) * 100).toFixed(1)}% of total
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <CardTitle>Diaper Changes</CardTitle>
                      <CardDescription>
                        {getTimeFrameLabel()} ({format(getStartDate(), "MMM d")} - {format(new Date(), "MMM d")})
                      </CardDescription>
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
                          variant={chartView === "bar" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setChartView("bar")}
                          className="text-xs h-7 w-7 px-0"
                          title="Bar Chart"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Button>
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
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 3v18h18" />
                            <path d="m19 9-5 5-4-4-3 3" />
                          </svg>
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
                <CardContent className="pt-2">
                  <div className="h-[350px]">
                    {chartView === "bar" && (
                      <DiaperChart events={diaperEvents} selectedChild={selectedChild} timeFrame={timeFrame} />
                    )}
                    {chartView === "pie" && <DiaperTypesChart events={diaperEvents} selectedChild={selectedChild} />}
                    {chartView === "trend" && (
                      <DiaperTrendsChart events={diaperEvents} selectedChild={selectedChild} timeFrame={timeFrame} />
                    )}
                    {chartView === "heatmap" && (
                      <DiaperCalendarHeatmap events={diaperEvents} selectedChild={selectedChild} />
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Diaper Type Distribution</CardTitle>
                    <CardDescription>Breakdown of diaper types</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <DiaperTypesChart events={diaperEvents} selectedChild={selectedChild} simplified={true} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Diaper Changes</CardTitle>
                    <CardDescription>Latest recorded diaper changes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {diaperEvents.length === 0 ? (
                      <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
                        <p className="text-sm text-muted-foreground">No diaper changes recorded yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[300px] overflow-auto pr-2">
                        {diaperEvents
                          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                          .slice(0, 5)
                          .map((event) => (
                            <div key={event.id} className="flex items-start space-x-4 py-3 border-b last:border-0">
                              <div className="text-3xl">
                                {event.type === "Wet"
                                  ? "💧"
                                  : event.type === "Dirty"
                                    ? "💩"
                                    : event.type === "Mixed"
                                      ? "🔄"
                                      : "✅"}
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center">
                                  <p className="text-sm font-medium">{event.type} Diaper</p>
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    {format(new Date(event.timestamp), "MMM d")}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(event.timestamp), "h:mm a")}
                                </p>
                                {event.notes && <p className="text-xs">{event.notes}</p>}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Diaper Change Patterns</CardTitle>
                  <CardDescription>Analysis of diaper change frequency and types</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Daily Average</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-md border p-4">
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Past Week</h4>
                          <p className="text-2xl font-bold">
                            {(diaperEvents.filter((e) => e.date >= subDays(new Date(), 7)).length / 7).toFixed(1)}
                          </p>
                          <p className="text-xs text-muted-foreground">changes per day</p>
                        </div>
                        <div className="rounded-md border p-4">
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Past Month</h4>
                          <p className="text-2xl font-bold">
                            {(diaperEvents.filter((e) => e.date >= subDays(new Date(), 30)).length / 30).toFixed(1)}
                          </p>
                          <p className="text-xs text-muted-foreground">changes per day</p>
                        </div>
                      </div>

                      <h3 className="text-lg font-medium mt-6">Type Distribution</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="flex items-center">
                            <span className="text-lg mr-2">💧</span>
                            <span>Wet</span>
                          </span>
                          <span className="font-medium">{((wetDiapers / totalDiapers) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5">
                          <div
                            className="bg-blue-500 h-2.5 rounded-full"
                            style={{ width: `${(wetDiapers / totalDiapers) * 100}%` }}
                          ></div>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="flex items-center">
                            <span className="text-lg mr-2">💩</span>
                            <span>Dirty</span>
                          </span>
                          <span className="font-medium">{((dirtyDiapers / totalDiapers) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5">
                          <div
                            className="bg-amber-500 h-2.5 rounded-full"
                            style={{ width: `${(dirtyDiapers / totalDiapers) * 100}%` }}
                          ></div>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="flex items-center">
                            <span className="text-lg mr-2">🔄</span>
                            <span>Mixed</span>
                          </span>
                          <span className="font-medium">{((mixedDiapers / totalDiapers) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5">
                          <div
                            className="bg-purple-500 h-2.5 rounded-full"
                            style={{ width: `${(mixedDiapers / totalDiapers) * 100}%` }}
                          ></div>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="flex items-center">
                            <span className="text-lg mr-2">✅</span>
                            <span>Dry</span>
                          </span>
                          <span className="font-medium">{((dryDiapers / totalDiapers) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5">
                          <div
                            className="bg-green-500 h-2.5 rounded-full"
                            style={{ width: `${(dryDiapers / totalDiapers) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="h-[300px]">
                      <DiaperTrendsChart events={diaperEvents} selectedChild={selectedChild} timeFrame="month" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Time of Day Analysis</CardTitle>
                  <CardDescription>When diaper changes typically occur</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <div className="h-full">
                    {/* This would be a custom chart showing diaper changes by hour of day */}
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">Time of day analysis chart would go here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <CardTitle>Diaper Change History</CardTitle>
                      <CardDescription>Complete history of recorded diaper changes</CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search diaper changes..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8 w-full sm:w-[200px]"
                        />
                      </div>
                      <Select value={filterType} onValueChange={(value) => setFilterType(value as any)}>
                        <SelectTrigger className="w-full sm:w-[130px]">
                          <Filter className="mr-2 h-4 w-4" />
                          <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="wet">Wet Only</SelectItem>
                          <SelectItem value="dirty">Dirty Only</SelectItem>
                          <SelectItem value="mixed">Mixed Only</SelectItem>
                          <SelectItem value="dry">Dry Only</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                        title={sortOrder === "asc" ? "Sort Descending" : "Sort Ascending"}
                      >
                        <ArrowUpDown
                          className={`h-4 w-4 ${sortOrder === "asc" ? "rotate-180" : ""} transition-transform`}
                        />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredEvents.length === 0 ? (
                    <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
                      <p className="text-sm text-muted-foreground">No diaper changes found matching your criteria</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-md border">
                        <div className="grid grid-cols-12 gap-2 p-4 font-medium border-b text-sm">
                          <div className="col-span-1">Type</div>
                          <div className="col-span-3 sm:col-span-2">Date</div>
                          <div className="col-span-3 sm:col-span-2">Time</div>
                          <div className="hidden sm:block sm:col-span-7">Notes</div>
                          <div className="col-span-5 sm:hidden">Details</div>
                        </div>

                        <div className="divide-y max-h-[500px] overflow-auto">
                          {filteredEvents.map((event) => (
                            <div key={event.id} className="grid grid-cols-12 gap-2 p-4 text-sm items-center">
                              <div className="col-span-1 text-xl">
                                {event.type === "Wet"
                                  ? "💧"
                                  : event.type === "Dirty"
                                    ? "💩"
                                    : event.type === "Mixed"
                                      ? "🔄"
                                      : "✅"}
                              </div>
                              <div className="col-span-3 sm:col-span-2">
                                {format(new Date(event.timestamp), "MMM d, yyyy")}
                              </div>
                              <div className="col-span-3 sm:col-span-2">
                                {format(new Date(event.timestamp), "h:mm a")}
                              </div>
                              <div className="hidden sm:block sm:col-span-7">
                                {event.notes || <span className="text-muted-foreground text-xs">No notes</span>}
                              </div>
                              <div className="col-span-5 sm:hidden">
                                <Badge variant="outline">{event.type}</Badge>
                                {event.notes && <p className="text-xs mt-1">{event.notes}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        Showing {filteredEvents.length} of {diaperEvents.length} diaper changes
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="calendar" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Diaper Calendar</CardTitle>
                    <CardDescription>View diaper changes by date</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      className="rounded-md border"
                      modifiers={{
                        hasDiaper: diaperEvents.map((event) => event.date),
                      }}
                      modifiersStyles={{
                        hasDiaper: {
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
                      {selectedDateEvents.length} diaper {selectedDateEvents.length === 1 ? "change" : "changes"}{" "}
                      recorded
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!date ? (
                      <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed">
                        <p className="text-sm text-muted-foreground">Select a date to view diaper changes</p>
                      </div>
                    ) : selectedDateEvents.length === 0 ? (
                      <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed">
                        <p className="text-sm text-muted-foreground">No diaper changes recorded for this date</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-4 gap-4">
                          <div className="rounded-md border p-4 text-center">
                            <h3 className="mb-2 font-medium">Total</h3>
                            <p className="text-2xl font-bold">{selectedDateEvents.length}</p>
                          </div>
                          <div className="rounded-md border p-4 text-center">
                            <h3 className="mb-2 font-medium">Wet</h3>
                            <p className="text-2xl font-bold">
                              {selectedDateEvents.filter((e) => e.type === "Wet").length}
                            </p>
                          </div>
                          <div className="rounded-md border p-4 text-center">
                            <h3 className="mb-2 font-medium">Dirty</h3>
                            <p className="text-2xl font-bold">
                              {selectedDateEvents.filter((e) => e.type === "Dirty").length}
                            </p>
                          </div>
                          <div className="rounded-md border p-4 text-center">
                            <h3 className="mb-2 font-medium">Mixed</h3>
                            <p className="text-2xl font-bold">
                              {selectedDateEvents.filter((e) => e.type === "Mixed").length}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4 max-h-[300px] overflow-auto pr-2">
                          {selectedDateEvents
                            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                            .map((event) => (
                              <div key={event.id} className="flex items-start space-x-4 py-3 border-b last:border-0">
                                <div className="text-3xl">
                                  {event.type === "Wet"
                                    ? "💧"
                                    : event.type === "Dirty"
                                      ? "💩"
                                      : event.type === "Mixed"
                                        ? "🔄"
                                        : "✅"}
                                </div>
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center">
                                    <p className="text-sm font-medium">{event.type} Diaper</p>
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      {format(new Date(event.timestamp), "h:mm a")}
                                    </Badge>
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
          </Tabs>
        </>
      )}
    </div>
  )
}

