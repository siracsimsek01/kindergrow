"use client"

import { useState, useEffect } from "react"
import { useChildContext } from "@/contexts/child-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { differenceInMonths, differenceInDays, differenceInYears } from "date-fns"
import { Progress } from "@/components/ui/progress"

interface ChildStats {
  totalEvents: number
  averageSleepHours: number
  feedingFrequency: number
  diaperFrequency: number
  latestWeight: number | null
  latestHeight: number | null
  weightPercentile: number | null
  heightPercentile: number | null
  ageInMonths: number
  ageInYears: number
  daysUntilNextBirthday: number
}

export function ChildStatsSummary() {
  const { selectedChild, lastUpdated } = useChildContext()
  const [stats, setStats] = useState<ChildStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      if (!selectedChild) {
        setStats(null)
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        // console.log(`Fetching comprehensive stats for child ID: ${selectedChild.id}`)

        // Fetch all events for the child
        const response = await fetch(`/api/children/${selectedChild.id}/events`, {
          method: 'GET',
          cache: "no-store", 
          headers: {
            "Cache-Control": "no-cache",
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch events: ${response.status}`)
        }

        const events = await response.json()
        // console.log(`Received ${events.length} events for stats calculation`)

        // Calculate age
        const birthDate = new Date(selectedChild.dateOfBirth)
        const today = new Date()
        const ageInMonths = differenceInMonths(today, birthDate)
        const ageInYears = differenceInYears(today, birthDate)

        // Calculate days until next birthday
        const nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())
        if (nextBirthday < today) {
          nextBirthday.setFullYear(nextBirthday.getFullYear() + 1)
        }
        const daysUntilNextBirthday = differenceInDays(nextBirthday, today)

        // Filter events by type
        const sleepEvents = events.filter((e) => e.eventType === "sleeping")
        const feedingEvents = events.filter((e) => e.eventType === "feeding")
        const diaperEvents = events.filter((e) => e.eventType === "diaper")
        const growthEvents = events
          .filter((e) => e.eventType === "growth")
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

        // Calculate average sleep hours (last 7 days)
        const last7DaysSleepEvents = sleepEvents.filter((e) => {
          const eventDate = new Date(e.timestamp)
          return differenceInDays(today, eventDate) <= 7
        })

        let totalSleepHours = 0
        last7DaysSleepEvents.forEach((event) => {
          const details = event.details || ""
          const durationMatch = details.match(/Duration: (\d+(\.\d+)?)/)
          if (durationMatch) {
            totalSleepHours += Number.parseFloat(durationMatch[1])
          }
        })

        const averageSleepHours =
          last7DaysSleepEvents.length > 0
            ? totalSleepHours / Math.min(7, Math.ceil(last7DaysSleepEvents.length / 2))
            : 0

        // Calculate feeding frequency (per day, last 7 days)
        const last7DaysFeedingEvents = feedingEvents.filter((e) => {
          const eventDate = new Date(e.timestamp)
          return differenceInDays(today, eventDate) <= 7
        })

        const feedingFrequency =
          last7DaysFeedingEvents.length > 0
            ? last7DaysFeedingEvents.length /
              Math.min(
                7,
                Math.ceil(
                  differenceInDays(
                    today,
                    new Date(last7DaysFeedingEvents[last7DaysFeedingEvents.length - 1].timestamp),
                  ) + 1,
                ),
              )
            : 0

        // Calculate diaper frequency (per day, last 7 days)
        const last7DaysDiaperEvents = diaperEvents.filter((e) => {
          const eventDate = new Date(e.timestamp)
          return differenceInDays(today, eventDate) <= 7
        })

        const diaperFrequency =
          last7DaysDiaperEvents.length > 0
            ? last7DaysDiaperEvents.length /
              Math.min(
                7,
                Math.ceil(
                  differenceInDays(today, new Date(last7DaysDiaperEvents[last7DaysDiaperEvents.length - 1].timestamp)) +
                    1,
                ),
              )
            : 0

        // Get latest growth measurements
        const latestGrowthEvent = growthEvents.length > 0 ? growthEvents[0] : null
        let latestWeight = null
        let latestHeight = null

        if (latestGrowthEvent) {
          if (latestGrowthEvent.value) {
            latestWeight = latestGrowthEvent.value
          }

          const details = latestGrowthEvent.details || ""
          const heightMatch = details.match(/Height: (\d+(\.\d+)?)/)
          if (heightMatch) {
            latestHeight = Number.parseFloat(heightMatch[1])
          }
        }

        // Mock percentiles (in a real app, these would be calculated based on growth charts)
        const weightPercentile = latestWeight ? Math.min(95, Math.max(5, Math.floor(Math.random() * 100))) : null
        const heightPercentile = latestHeight ? Math.min(95, Math.max(5, Math.floor(Math.random() * 100))) : null

        setStats({
          totalEvents: events.length,
          averageSleepHours,
          feedingFrequency,
          diaperFrequency,
          latestWeight,
          latestHeight,
          weightPercentile,
          heightPercentile,
          ageInMonths,
          ageInYears,
          daysUntilNextBirthday,
        })
      } catch (error) {
        console.error("Error fetching child stats:", error)
        setError("Failed to fetch child statistics")
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [selectedChild, lastUpdated])

  if (!selectedChild) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Child Statistics</CardTitle>
          <CardDescription>Select a child to view detailed statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed">
            <p className="text-sm text-muted-foreground">No child selected</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Child Statistics</CardTitle>
          <CardDescription>Loading statistics for {selectedChild.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Child Statistics</CardTitle>
          <CardDescription>Error loading statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Child Statistics</CardTitle>
          <CardDescription>No statistics available for {selectedChild.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed">
            <p className="text-sm text-muted-foreground">No data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistics for {selectedChild.name}</CardTitle>
        <CardDescription>Comprehensive overview of development and activities</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="growth">Growth</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Age</h3>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {stats.ageInYears} years {stats.ageInMonths % 12} months
                  </span>
                  <span className="text-sm text-muted-foreground">({stats.ageInMonths} months total)</span>
                </div>
                <p className="text-xs text-muted-foreground">Next birthday in {stats.daysUntilNextBirthday} days</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Total Records</h3>
                <div className="text-2xl font-bold">{stats.totalEvents}</div>
                <p className="text-xs text-muted-foreground">Events recorded for {selectedChild.name}</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Average Sleep</h3>
                <div className="text-2xl font-bold">{stats.averageSleepHours.toFixed(1)} hours</div>
                <p className="text-xs text-muted-foreground">Daily average over the past week</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Daily Feedings</h3>
                <div className="text-2xl font-bold">{stats.feedingFrequency.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">Average feedings per day (past week)</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="growth" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Current Weight</h3>
                <div className="text-2xl font-bold">
                  {stats.latestWeight ? `${stats.latestWeight.toFixed(2)} kg` : "Not recorded"}
                </div>
                {stats.weightPercentile && (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span>Percentile: {stats.weightPercentile}%</span>
                      <span>
                        {stats.weightPercentile < 50
                          ? "Below average"
                          : stats.weightPercentile > 75
                            ? "Above average"
                            : "Average"}
                      </span>
                    </div>
                    <Progress value={stats.weightPercentile} className="h-2" />
                  </>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Current Height</h3>
                <div className="text-2xl font-bold">
                  {stats.latestHeight ? `${stats.latestHeight.toFixed(1)} cm` : "Not recorded"}
                </div>
                {stats.heightPercentile && (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span>Percentile: {stats.heightPercentile}%</span>
                      <span>
                        {stats.heightPercentile < 50
                          ? "Below average"
                          : stats.heightPercentile > 75
                            ? "Above average"
                            : "Average"}
                      </span>
                    </div>
                    <Progress value={stats.heightPercentile} className="h-2" />
                  </>
                )}
              </div>

              <div className="col-span-2 space-y-2">
                <h3 className="text-sm font-medium">Growth Milestones</h3>
                <div className="rounded-md border p-3">
                  <p className="text-sm">
                    {stats.ageInMonths < 12
                      ? "Infants typically triple their birth weight by 12 months."
                      : stats.ageInMonths < 24
                        ? "Toddlers typically grow about 5 inches in their second year."
                        : stats.ageInMonths < 48
                          ? "Preschoolers typically gain about 4-5 pounds per year."
                          : "School-age children typically grow 2-3 inches per year."}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activities" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Sleep Pattern</h3>
                <div className="text-2xl font-bold">{stats.averageSleepHours.toFixed(1)} hours</div>
                <div className="flex items-center justify-between text-xs">
                  <span>
                    Recommended:{" "}
                    {stats.ageInMonths < 12
                      ? "14-17"
                      : stats.ageInMonths < 36
                        ? "12-14"
                        : stats.ageInMonths < 72
                          ? "10-13"
                          : "9-11"}{" "}
                    hours
                  </span>
                  <span>
                    {stats.averageSleepHours <
                    (stats.ageInMonths < 12 ? 14 : stats.ageInMonths < 36 ? 12 : stats.ageInMonths < 72 ? 10 : 9)
                      ? "Below recommended"
                      : "Within recommended range"}
                  </span>
                </div>
                <Progress
                  value={Math.min(
                    100,
                    (stats.averageSleepHours /
                      (stats.ageInMonths < 12 ? 17 : stats.ageInMonths < 36 ? 14 : stats.ageInMonths < 72 ? 13 : 11)) *
                      100,
                  )}
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Diaper Changes</h3>
                <div className="text-2xl font-bold">{stats.diaperFrequency.toFixed(1)} per day</div>
                <div className="flex items-center justify-between text-xs">
                  <span>
                    Typical:{" "}
                    {stats.ageInMonths < 1
                      ? "8-10"
                      : stats.ageInMonths < 6
                        ? "6-8"
                        : stats.ageInMonths < 12
                          ? "4-6"
                          : "3-5"}{" "}
                    per day
                  </span>
                  <span>
                    {stats.diaperFrequency <
                    (stats.ageInMonths < 1 ? 8 : stats.ageInMonths < 6 ? 6 : stats.ageInMonths < 12 ? 4 : 3)
                      ? "Below average"
                      : stats.diaperFrequency >
                          (stats.ageInMonths < 1 ? 10 : stats.ageInMonths < 6 ? 8 : stats.ageInMonths < 12 ? 6 : 5)
                        ? "Above average"
                        : "Within normal range"}
                  </span>
                </div>
                <Progress
                  value={Math.min(
                    100,
                    (stats.diaperFrequency /
                      (stats.ageInMonths < 1 ? 10 : stats.ageInMonths < 6 ? 8 : stats.ageInMonths < 12 ? 6 : 5)) *
                      100,
                  )}
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Feeding Frequency</h3>
                <div className="text-2xl font-bold">{stats.feedingFrequency.toFixed(1)} per day</div>
                <div className="flex items-center justify-between text-xs">
                  <span>
                    Typical:{" "}
                    {stats.ageInMonths < 1
                      ? "8-12"
                      : stats.ageInMonths < 6
                        ? "6-8"
                        : stats.ageInMonths < 12
                          ? "4-6"
                          : "3-5"}{" "}
                    per day
                  </span>
                  <span>
                    {stats.feedingFrequency <
                    (stats.ageInMonths < 1 ? 8 : stats.ageInMonths < 6 ? 6 : stats.ageInMonths < 12 ? 4 : 3)
                      ? "Below average"
                      : stats.feedingFrequency >
                          (stats.ageInMonths < 1 ? 12 : stats.ageInMonths < 6 ? 8 : stats.ageInMonths < 12 ? 6 : 5)
                        ? "Above average"
                        : "Within normal range"}
                  </span>
                </div>
                <Progress
                  value={Math.min(
                    100,
                    (stats.feedingFrequency /
                      (stats.ageInMonths < 1 ? 12 : stats.ageInMonths < 6 ? 8 : stats.ageInMonths < 12 ? 6 : 5)) *
                      100,
                  )}
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Activity Summary</h3>
                <div className="rounded-md border p-3">
                  <p className="text-sm">
                    {stats.averageSleepHours <
                    (stats.ageInMonths < 12 ? 14 : stats.ageInMonths < 36 ? 12 : stats.ageInMonths < 72 ? 10 : 9)
                      ? "Sleep is below recommended levels. Consider adjusting bedtime routines."
                      : "Sleep patterns are within healthy ranges."}{" "}
                    {stats.feedingFrequency <
                    (stats.ageInMonths < 1 ? 8 : stats.ageInMonths < 6 ? 6 : stats.ageInMonths < 12 ? 4 : 3)
                      ? "Feeding frequency is lower than typical. Consider consulting with a pediatrician."
                      : "Feeding frequency is appropriate for age."}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

