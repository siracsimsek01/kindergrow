"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useChildContext } from "@/contexts/child-context"

export function Overview() {
  const { selectedChild } = useChildContext()
  const [recentEvents, setRecentEvents] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (selectedChild) {
      fetchRecentEvents()
    } else {
      setRecentEvents([])
    }
  }, [selectedChild])

  const fetchRecentEvents = async () => {
    if (!selectedChild) return

    try {
      setIsLoading(true)
      console.log(`Fetching recent events for child ${selectedChild.id}`)
      const response = await fetch(`/api/events?childId=${selectedChild.id}&limit=5`)

      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log(`Received ${data.length} recent events`)
      setRecentEvents(data)
    } catch (error) {
      console.error("Error fetching recent events:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!selectedChild) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>Select a child to view their overview</CardDescription>
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
        <CardTitle>Overview for {selectedChild.name}</CardTitle>
        <CardDescription>Summary of recent activities and stats</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-4 text-center">
            <p className="text-muted-foreground">Loading recent activities...</p>
          </div>
        ) : recentEvents.length > 0 ? (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Recent Activities</h3>
              <ul className="mt-2 space-y-2">
                {recentEvents.map((event, index) => (
                  <li key={index} className="flex items-center justify-between text-sm">
                    <span>{event.eventType}</span>
                    <span className="text-muted-foreground">{new Date(event.timestamp).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-muted-foreground">No recent activities found</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

