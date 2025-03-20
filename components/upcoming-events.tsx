"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useChildContext } from "@/contexts/child-context"

export function UpcomingEvents() {
  const { selectedChild } = useChildContext()
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (selectedChild) {
      fetchUpcomingEvents()
    } else {
      setEvents([])
    }
  }, [selectedChild])

  const fetchUpcomingEvents = async () => {
    if (!selectedChild) return

    try {
      setIsLoading(true)
      console.log(`Fetching upcoming events for child ${selectedChild.id}`)
      const response = await fetch(`/api/events/upcoming?childId=${selectedChild.id}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch upcoming events: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log(`Received ${data.length} upcoming events`)
      setEvents(data)
    } catch (error) {
      console.error("Error fetching upcoming events:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!selectedChild) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>Select a child to view their upcoming events</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No child selected</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Events</CardTitle>
        <CardDescription>Scheduled events for {selectedChild.name}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-4 text-center">
            <p className="text-muted-foreground">Loading events...</p>
          </div>
        ) : events.length > 0 ? (
          <div className="space-y-4">
            {events.map((event, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{event.eventType}</p>
                  <p className="text-sm text-muted-foreground">{event.details || "No details"}</p>
                </div>
                <div className="text-sm text-muted-foreground">{new Date(event.timestamp).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-muted-foreground">No upcoming events</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

