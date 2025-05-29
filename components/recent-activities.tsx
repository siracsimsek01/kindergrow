"use client"

import { useEffect, useState, useCallback } from "react"
import { useChildContext } from "@/contexts/child-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format, parseISO } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export function RecentActivities() {
  const { selectedChild, lastUpdated, isRefreshing } = useChildContext()
  const [activities, setActivities] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActivities = useCallback(async () => {
    if (!selectedChild) {
      setActivities([])
      setIsLoading(false)
      return
    }

    try {
      // Only set loading to true on initial fetch, not during refreshes
      if (!isRefreshing) {
        setIsLoading(true)
      }

      setError(null)
      console.log(`Fetching activities for child ID: ${selectedChild.id}`)

      const response = await fetch(`/api/children/${selectedChild.id}/events?limit=20&page=1`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status}`)
      }

      const events = await response.json()
      console.log(`Received ${events.length} events for child ID: ${selectedChild.id}`)

      // Sort by timestamp (newest first)
      const sortedEvents = events
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .map((event) => ({
          id: event.id,
          type: event.eventType,
          time: format(parseISO(event.timestamp), "MMM d, yyyy h:mm a"),
          details: event.details || "", // Ensure details is never undefined
          value: event.value,
          timestamp: event.timestamp,
        }))

      setActivities(sortedEvents)
    } catch (error) {
      console.error("Error fetching activities:", error)
      setError("Failed to fetch activities. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [selectedChild, isRefreshing])

  useEffect(() => {
    if (selectedChild) {
      console.log("Selected child changed or lastUpdated triggered, fetching activities")
      fetchActivities()
    }
  }, [fetchActivities, selectedChild, lastUpdated])

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case "feeding":
        return "🍼"
      case "sleeping":
        return "😴"
      case "diaper":
        return "🧷"
      case "growth":
        return "📏"
      case "medication":
        return "💊"
      case "temperature":
        return "🌡️"
      default:
        return "📝"
    }
  }

  const formatEventDetails = (type: string, details: string, value: number | null) => {
    // Guard against undefined details
    if (!details) {
      return type === "growth"
        ? `Weight: ${value ? value.toFixed(2) : "?"} kg`
        : type === "temperature"
          ? `Temp: ${value ? value.toFixed(1) : "?"}°C`
          : "No details"
    }

    if (type === "feeding") {
      const parts = details.split("\n")
      return parts.length > 0 ? parts[0].replace("Type: ", "") : "Feeding"
    } else if (type === "sleeping") {
      const parts = details.split("\n")
      const quality = parts.length > 0 ? parts[0].replace("Quality: ", "") : "Unknown"
      return `Sleep quality: ${quality}`
    } else if (type === "growth") {
      return `Weight: ${value ? value.toFixed(2) : "?"} kg`
    } else if (type === "temperature") {
      return `Temp: ${value ? value.toFixed(1) : "?"}°C`
    } else if (type === "medication") {
      const parts = details.split("\n")
      const med = parts.length > 0 ? parts[0].replace("Medication: ", "") : "Unknown"
      return `Med: ${med}`
    } else {
      const parts = details.split("\n")
      return parts.length > 0 ? parts[0] : "No details"
    }
  }

  if (!selectedChild) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>Select a child to view recent activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed">
            <p className="text-sm text-muted-foreground">No child selected</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activities for {selectedChild.name}</CardTitle>
        <CardDescription>Latest recorded events</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && !isRefreshing ? (
          <div className="flex h-[300px] items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed">
            <p className="text-sm text-muted-foreground">No activities found for {selectedChild.name}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {isRefreshing && (
              <div className="flex items-center justify-center py-2">
                <LoadingSpinner size="sm" className="mr-2" />
                <span className="text-sm text-muted-foreground">Refreshing...</span>
              </div>
            )}
            {activities.map((activity) => (
              <div
                key={activity.id || activity.timestamp}
                className="flex items-start space-x-4 py-4 border-b last:border-0"
              >
                <div className="text-3xl">{getEventTypeIcon(activity.type)}</div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <p className="text-sm font-medium capitalize">{activity.type}</p>
                      <Badge variant="outline" className="ml-2">
                        {format(new Date(activity.timestamp), "MMM d")}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{format(new Date(activity.timestamp), "h:mm a")}</p>
                  </div>
                  <p className="text-sm">{formatEventDetails(activity.type, activity.details, activity.value)}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.details ? activity.details.replace(/\n/g, " • ") : "No additional details"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

