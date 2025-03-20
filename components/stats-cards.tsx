"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useChildContext } from "@/contexts/child-context"
import { Baby, Moon, Utensils, LineChart } from "lucide-react"

export function StatsCards() {
  const { children } = useChildContext()
  const [stats, setStats] = useState({
    totalChildren: 0,
    totalEvents: 0,
    sleepEvents: 0,
    feedingEvents: 0,
    diaperEvents: 0,
    growthEvents: 0,
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (children.length > 0) {
      fetchStats()
    } else {
      setStats({
        totalChildren: 0,
        totalEvents: 0,
        sleepEvents: 0,
        feedingEvents: 0,
        diaperEvents: 0,
        growthEvents: 0,
      })
    }
  }, [children])

  const fetchStats = async () => {
    try {
      setIsLoading(true)

      let totalEvents = 0
      let sleepEvents = 0
      let feedingEvents = 0
      let diaperEvents = 0
      let growthEvents = 0

      // Fetch events for each child
      for (const child of children) {
        const response = await fetch(`/api/events?childId=${child.id}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch events for child ${child.id}`)
        }

        const events = await response.json()
        totalEvents += events.length

        // Count by event type
        events.forEach((event) => {
          if (event.eventType === "sleeping") sleepEvents++
          if (event.eventType === "feeding") feedingEvents++
          if (event.eventType === "diaper") diaperEvents++
          if (event.eventType === "growth") growthEvents++
        })
      }

      setStats({
        totalChildren: children.length,
        totalEvents,
        sleepEvents,
        feedingEvents,
        diaperEvents,
        growthEvents,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Children</CardTitle>
          <Baby className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{isLoading ? "..." : stats.totalChildren}</div>
          <p className="text-xs text-muted-foreground">
            {stats.totalChildren === 1 ? "1 child" : `${stats.totalChildren} children`} registered
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sleep Events</CardTitle>
          <Moon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{isLoading ? "..." : stats.sleepEvents}</div>
          <p className="text-xs text-muted-foreground">
            {stats.sleepEvents === 1 ? "1 sleep record" : `${stats.sleepEvents} sleep records`}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Feeding Events</CardTitle>
          <Utensils className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{isLoading ? "..." : stats.feedingEvents}</div>
          <p className="text-xs text-muted-foreground">
            {stats.feedingEvents === 1 ? "1 feeding record" : `${stats.feedingEvents} feeding records`}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Growth Events</CardTitle>
          <LineChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{isLoading ? "..." : stats.growthEvents}</div>
          <p className="text-xs text-muted-foreground">
            {stats.growthEvents === 1 ? "1 growth record" : `${stats.growthEvents} growth records`}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

