"use client"

import { useState, useEffect } from "react"
import { useChildContext } from "@/contexts/child-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { TemperatureChart } from "@/components/charts/temperature-chart"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Plus, Thermometer, AlertTriangle } from "lucide-react"
import { TemperatureLog } from "@/components/temperature-log"
import { ChartSkeleton, StatCardSkeleton, TableSkeleton } from "@/components/ui/skeleton-loader"

interface TemperatureEvent {
  id: string
  timestamp: string
  details: string
  value: number
  notes: string
  date: Date
}

export default function TemperatureTrackingPage() {
  const { selectedChild, isLoading: isChildLoading, setIsAddEventModalOpen } = useChildContext()
  const [temperatureEvents, setTemperatureEvents] = useState<TemperatureEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    const fetchTemperatureEvents = async () => {
      if (!selectedChild) {
        setTemperatureEvents([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        console.log(`Fetching temperature events for child ID: ${selectedChild.id}`)

        const response = await fetch(`/api/children/${selectedChild.id}/temperature`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch temperature events: ${response.status}`)
        }

        const events = await response.json()
        console.log(`Received ${events.length} temperature events`)

        // Process events
        const processedEvents = events.map((event) => {
          const details = event.details || ""

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
            value: event.value || 0,
            notes,
            date: new Date(event.timestamp),
          }
        })

        setTemperatureEvents(processedEvents)
      } catch (error) {
        console.error("Error fetching temperature events:", error)
        setError("Failed to fetch temperature events")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTemperatureEvents()
  }, [selectedChild])

  const getDayEvents = (day: Date) => {
    return temperatureEvents.filter(
      (event) =>
        event.date.getDate() === day.getDate() &&
        event.date.getMonth() === day.getMonth() &&
        event.date.getFullYear() === day.getFullYear(),
    )
  }

  const selectedDateEvents = date ? getDayEvents(date) : []

  const getLatestTemperature = () => {
    if (temperatureEvents.length === 0) return null
    return temperatureEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
  }

  const getAverageTemperature = () => {
    if (temperatureEvents.length === 0) return 0
    const sum = temperatureEvents.reduce((total, event) => total + event.value, 0)
    return sum / temperatureEvents.length
  }

  const getHighestTemperature = () => {
    if (temperatureEvents.length === 0) return 0
    return Math.max(...temperatureEvents.map((event) => event.value))
  }

  const getLowestTemperature = () => {
    if (temperatureEvents.length === 0) return 0
    return Math.min(...temperatureEvents.map((event) => event.value))
  }

  const hasFever = (temp: number) => {
    return temp >= 38.0
  }

  const latestTemperature = getLatestTemperature()
  const averageTemperature = getAverageTemperature()
  const highestTemperature = getHighestTemperature()
  const lowestTemperature = getLowestTemperature()

  const isLoaded = !isChildLoading && !isLoading

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Temperature Tracking</h1>
          <p className="text-muted-foreground">Monitor your child's temperature and fever history</p>
        </div>
        <Button onClick={() => setIsAddEventModalOpen(true, "temperature")} disabled={!selectedChild}>
          <Plus className="mr-2 h-4 w-4" />
          Add Temperature
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
            <p className="text-muted-foreground">Select a child to view temperature records</p>
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Latest Reading</CardTitle>
                <Thermometer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {latestTemperature ? (
                  <>
                    <div className="flex items-center">
                      <div
                        className={`text-2xl font-bold ${hasFever(latestTemperature.value) ? "text-destructive" : ""}`}
                      >
                        {latestTemperature.value.toFixed(1)}°C
                      </div>
                      {hasFever(latestTemperature.value) && <AlertTriangle className="ml-2 h-5 w-5 text-destructive" />}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Last reading: {format(new Date(latestTemperature.timestamp), "MMM d, h:mm a")}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold">--°C</div>
                    <p className="text-xs text-muted-foreground">No readings recorded</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average</CardTitle>
                <Thermometer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${hasFever(averageTemperature) ? "text-destructive" : ""}`}>
                  {temperatureEvents.length > 0 ? `${averageTemperature.toFixed(1)}°C` : "--°C"}
                </div>
                <p className="text-xs text-muted-foreground">Average temperature</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Highest</CardTitle>
                <Thermometer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${hasFever(highestTemperature) ? "text-destructive" : ""}`}>
                  {temperatureEvents.length > 0 ? `${highestTemperature.toFixed(1)}°C` : "--°C"}
                </div>
                <p className="text-xs text-muted-foreground">Highest temperature</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lowest</CardTitle>
                <Thermometer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {temperatureEvents.length > 0 ? `${lowestTemperature.toFixed(1)}°C` : "--°C"}
                </div>
                <p className="text-xs text-muted-foreground">Lowest temperature</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="fever-analysis">Fever Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Temperature Readings</CardTitle>
                  <CardDescription>Last 14 days of temperature readings</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <TemperatureChart />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Readings</CardTitle>
                  <CardDescription>Latest temperature readings</CardDescription>
                </CardHeader>
                <CardContent>
                  {temperatureEvents.length === 0 ? (
                    <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
                      <p className="text-sm text-muted-foreground">No temperature readings recorded yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {temperatureEvents
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                        .slice(0, 5)
                        .map((event) => (
                          <div key={event.id} className="flex items-start space-x-4 py-3 border-b last:border-0">
                            <div className={`text-3xl ${hasFever(event.value) ? "text-destructive" : ""}`}>🌡️</div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center">
                                <p className={`text-sm font-medium ${hasFever(event.value) ? "text-destructive" : ""}`}>
                                  {event.value.toFixed(1)}°C
                                </p>
                                {hasFever(event.value) && (
                                  <Badge variant="destructive" className="ml-2">
                                    Fever
                                  </Badge>
                                )}
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
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Temperature Log</CardTitle>
                  <CardDescription>Complete history of temperature readings</CardDescription>
                </CardHeader>
                <CardContent>
                  <TemperatureLog events={temperatureEvents} hasFever={hasFever} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fever-analysis" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Fever Analysis</CardTitle>
                  <CardDescription>Analysis of fever patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  {temperatureEvents.length === 0 ? (
                    <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
                      <p className="text-sm text-muted-foreground">No temperature readings recorded yet</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-md border p-4">
                          <h3 className="mb-2 font-medium">Fever Occurrences</h3>
                          <p className="text-2xl font-bold">
                            {temperatureEvents.filter((e) => hasFever(e.value)).length}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Out of {temperatureEvents.length} total readings
                          </p>
                        </div>
                        <div className="rounded-md border p-4">
                          <h3 className="mb-2 font-medium">Highest Fever</h3>
                          <p className="text-2xl font-bold text-destructive">
                            {temperatureEvents.filter((e) => hasFever(e.value)).length > 0
                              ? `${Math.max(
                                  ...temperatureEvents.filter((e) => hasFever(e.value)).map((e) => e.value),
                                ).toFixed(1)}°C`
                              : "None"}
                          </p>
                          <p className="text-xs text-muted-foreground">Highest recorded fever</p>
                        </div>
                      </div>

                      <div className="rounded-md border p-4">
                        <h3 className="mb-2 font-medium">Fever Readings</h3>
                        {temperatureEvents.filter((e) => hasFever(e.value)).length === 0 ? (
                          <p className="text-sm text-muted-foreground">No fever readings recorded</p>
                        ) : (
                          <div className="space-y-4">
                            {temperatureEvents
                              .filter((e) => hasFever(e.value))
                              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                              .map((event) => (
                                <div key={event.id} className="flex items-start space-x-4 py-3 border-b last:border-0">
                                  <div className="text-3xl text-destructive">🌡️</div>
                                  <div className="flex-1 space-y-1">
                                    <div className="flex items-center">
                                      <p className="text-sm font-medium text-destructive">{event.value.toFixed(1)}°C</p>
                                      <Badge variant="outline" className="ml-2 text-xs">
                                        {format(new Date(event.timestamp), "MMM d, yyyy")}
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
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}

