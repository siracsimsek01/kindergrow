"use client"

import { useState, useEffect } from "react"
import { useChildContext } from "@/contexts/child-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { FeedingChart } from "@/components/feeding-chart"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Plus, Utensils } from "lucide-react"

interface FeedingEvent {
  id: string
  timestamp: string
  details: string
  type: string
  amount: string
  duration: string
  notes: string
  date: Date
}

export default function FeedingTrackingPage() {
  const { selectedChild, isLoading: isChildLoading, setIsAddEventModalOpen } = useChildContext()
  const [feedingEvents, setFeedingEvents] = useState<FeedingEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    const fetchFeedingEvents = async () => {
      if (!selectedChild) {
        setFeedingEvents([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        console.log(`Fetching feeding events for child ID: ${selectedChild.id}`)

        const response = await fetch(`/api/events?childId=${selectedChild.id}&eventType=feeding`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch feeding events: ${response.status}`)
        }

        const events = await response.json()
        console.log(`Received ${events.length} feeding events`)

        // Process events
        const processedEvents = events.map((event) => {
          const details = event.details || ""

          // Extract type
          let type = "Unknown"
          const typeMatch = details.match(/Type: (.*?)(?:\n|$)/)
          if (typeMatch) {
            type = typeMatch[1]
          }

          // Extract amount
          let amount = ""
          const amountMatch = details.match(/Amount: (.*?)(?:\n|$)/)
          if (amountMatch) {
            amount = amountMatch[1]
          }

          // Extract duration
          let duration = ""
          const durationMatch = details.match(/Duration: (.*?)(?:\n|$)/)
          if (durationMatch) {
            duration = durationMatch[1]
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
            amount,
            duration,
            notes,
            date: new Date(event.timestamp),
          }
        })

        setFeedingEvents(processedEvents)
      } catch (error) {
        console.error("Error fetching feeding events:", error)
        setError("Failed to fetch feeding events")
      } finally {
        setIsLoading(false)
      }
    }

    fetchFeedingEvents()
  }, [selectedChild])

  const getDayEvents = (day: Date) => {
    return feedingEvents.filter(
      (event) =>
        event.date.getDate() === day.getDate() &&
        event.date.getMonth() === day.getMonth() &&
        event.date.getFullYear() === day.getFullYear(),
    )
  }

  const selectedDateEvents = date ? getDayEvents(date) : []

  const getFeedingTypeCount = (type: string) => {
    return feedingEvents.filter((event) => event.type.toLowerCase().includes(type.toLowerCase())).length
  }

  const getFeedingTypeIcon = (type: string) => {
    if (type.toLowerCase().includes("bottle")) return "🍼"
    if (type.toLowerCase().includes("breast")) return "👩‍🍼"
    if (type.toLowerCase().includes("solid")) return "🥣"
    return "🍽️"
  }

  const isLoaded = !isChildLoading && !isLoading

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Feeding Tracking</h1>
          <p className="text-muted-foreground">Monitor your child's feeding patterns</p>
        </div>
        <Button onClick={() => setIsAddEventModalOpen(true, "feeding")} disabled={!selectedChild}>
          <Plus className="mr-2 h-4 w-4" />
          Add Feeding
        </Button>
      </div>

      {!isLoaded ? (
        <div className="flex h-[400px] items-center justify-center">
          <LoadingSpinner size="lg" />
          <span className="ml-4 text-lg">Loading feeding data...</span>
        </div>
      ) : !selectedChild ? (
        <Card>
          <CardContent className="flex h-[400px] items-center justify-center">
            <p className="text-muted-foreground">Select a child to view feeding data</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="flex h-[400px] items-center justify-center">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="all-entries">All Entries</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Feedings</CardTitle>
                  <Utensils className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{feedingEvents.length}</div>
                  <p className="text-xs text-muted-foreground">Feeding events recorded</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Bottle Feedings</CardTitle>
                  <span className="text-lg">🍼</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{getFeedingTypeCount("bottle")}</div>
                  <p className="text-xs text-muted-foreground">Bottle feeding events</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Breast Feedings</CardTitle>
                  <span className="text-lg">👩‍🍼</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{getFeedingTypeCount("breast")}</div>
                  <p className="text-xs text-muted-foreground">Breast feeding events</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Solid Feedings</CardTitle>
                  <span className="text-lg">🥣</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{getFeedingTypeCount("solid")}</div>
                  <p className="text-xs text-muted-foreground">Solid food feedings</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Feeding Chart</CardTitle>
                <CardDescription>Daily feeding data for the past week</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <FeedingChart />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Feedings</CardTitle>
                <CardDescription>Latest recorded feeding sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {feedingEvents.length === 0 ? (
                  <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
                    <p className="text-sm text-muted-foreground">No feeding events recorded yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {feedingEvents
                      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .slice(0, 5)
                      .map((event) => (
                        <div key={event.id} className="flex items-start space-x-4 py-3 border-b last:border-0">
                          <div className="text-3xl">{getFeedingTypeIcon(event.type)}</div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center">
                              <p className="text-sm font-medium">{event.type} Feeding</p>
                              <Badge variant="outline" className="ml-2 text-xs">
                                {format(new Date(event.timestamp), "MMM d")}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(event.timestamp), "h:mm a")}
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {event.amount && (
                                <div>
                                  <span className="text-muted-foreground">Amount: </span>
                                  <span>{event.amount}</span>
                                </div>
                              )}
                              {event.duration && (
                                <div>
                                  <span className="text-muted-foreground">Duration: </span>
                                  <span>{event.duration}</span>
                                </div>
                              )}
                            </div>
                            {event.notes && <p className="text-xs">{event.notes}</p>}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all-entries" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Feedings</CardTitle>
                <CardDescription>Complete history of recorded feeding sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {feedingEvents.length === 0 ? (
                  <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
                    <p className="text-sm text-muted-foreground">No feeding events recorded yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {feedingEvents
                      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .map((event) => (
                        <div key={event.id} className="flex items-start space-x-4 py-3 border-b last:border-0">
                          <div className="text-3xl">{getFeedingTypeIcon(event.type)}</div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center">
                              <p className="text-sm font-medium">{event.type} Feeding</p>
                              <Badge variant="outline" className="ml-2 text-xs">
                                {format(new Date(event.timestamp), "MMM d, yyyy")}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(event.timestamp), "h:mm a")}
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {event.amount && (
                                <div>
                                  <span className="text-muted-foreground">Amount: </span>
                                  <span>{event.amount}</span>
                                </div>
                              )}
                              {event.duration && (
                                <div>
                                  <span className="text-muted-foreground">Duration: </span>
                                  <span>{event.duration}</span>
                                </div>
                              )}
                            </div>
                            {event.notes && <p className="text-xs">{event.notes}</p>}
                            <p className="text-xs text-muted-foreground mt-1">{event.details.replace(/\n/g, " • ")}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Feeding Calendar</CardTitle>
                  <CardDescription>View feedings by date</CardDescription>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border"
                    modifiers={{
                      hasFeeding: feedingEvents.map((event) => event.date),
                    }}
                    modifiersStyles={{
                      hasFeeding: {
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
                    {selectedDateEvents.length} feeding {selectedDateEvents.length === 1 ? "event" : "events"} recorded
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!date ? (
                    <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed">
                      <p className="text-sm text-muted-foreground">Select a date to view feedings</p>
                    </div>
                  ) : selectedDateEvents.length === 0 ? (
                    <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed">
                      <p className="text-sm text-muted-foreground">No feedings recorded for this date</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="rounded-md border p-4 text-center">
                          <h3 className="mb-2 font-medium">Bottle</h3>
                          <p className="text-2xl font-bold">
                            {selectedDateEvents.filter((e) => e.type.toLowerCase().includes("bottle")).length}
                          </p>
                        </div>
                        <div className="rounded-md border p-4 text-center">
                          <h3 className="mb-2 font-medium">Breast</h3>
                          <p className="text-2xl font-bold">
                            {selectedDateEvents.filter((e) => e.type.toLowerCase().includes("breast")).length}
                          </p>
                        </div>
                        <div className="rounded-md border p-4 text-center">
                          <h3 className="mb-2 font-medium">Solid</h3>
                          <p className="text-2xl font-bold">
                            {selectedDateEvents.filter((e) => e.type.toLowerCase().includes("solid")).length}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {selectedDateEvents
                          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                          .map((event) => (
                            <div key={event.id} className="flex items-start space-x-4 py-3 border-b last:border-0">
                              <div className="text-3xl">{getFeedingTypeIcon(event.type)}</div>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center">
                                  <p className="text-sm font-medium">{event.type} Feeding</p>
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    {format(new Date(event.timestamp), "h:mm a")}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  {event.amount && (
                                    <div>
                                      <span className="text-muted-foreground">Amount: </span>
                                      <span>{event.amount}</span>
                                    </div>
                                  )}
                                  {event.duration && (
                                    <div>
                                      <span className="text-muted-foreground">Duration: </span>
                                      <span>{event.duration}</span>
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
        </Tabs>
      )}
    </div>
  )
}

