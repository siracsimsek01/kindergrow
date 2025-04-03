"use client"

import { useEffect, useState, useCallback } from "react"
import { useChildContext } from "@/contexts/child-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { SleepChart } from "@/components/charts/sleep-chart"
import { FeedingChart } from "@/components/feeding-chart"
import { GrowthChart } from "@/components/charts/growth-chart"
import { ActivitySummaryChart } from "@/components/charts/activity-summary-chart"
import { TemperatureChart } from "@/components/charts/temperature-chart"
import { Button } from "@/components/ui/button"
import { Plus, RefreshCw, ArrowRight, Clock, Activity, Edit } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { format, parseISO } from "date-fns"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { EditChildModal } from "@/components/edit-child-modal"
import { RecentActivities } from "@/components/recent-activities"
import { ChildStatsSummary } from "@/components/child-stats-summary"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

interface DashboardStats {
  totalChildren: number
  sleepEvents: number
  feedingEvents: number
  diaperEvents: number
  growthEvents: number
  medicationEvents: number
  temperatureEvents: number
  recentActivities: any[]
}

export default function DashboardPage() {
  const {
    selectedChild,
    children = [],
    isLoading: isChildrenLoading,
    lastUpdated,
    triggerRefresh,
    setIsAddChildModalOpen,
    setIsAddEventModalOpen,
    setSelectedChild,
    enableAutoRefresh,
    autoRefreshEnabled,
    isRefreshing: isContextRefreshing,
  } = useChildContext()

  const { toast } = useToast()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isStatsLoading, setIsStatsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [isMobile, setIsMobile] = useState(false)
  const [stats, setStats] = useState<DashboardStats>({
    totalChildren: 0,
    sleepEvents: 0,
    feedingEvents: 0,
    diaperEvents: 0,
    growthEvents: 0,
    medicationEvents: 0,
    temperatureEvents: 0,
    recentActivities: [],
  })

  const [editChildModalOpen, setEditChildModalOpen] = useState(false)
  const [childToEdit, setChildToEdit] = useState<any>(null)

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Auto-refresh setup
  useEffect(() => {
    // Auto-refresh is disabled to prevent loading screen issues
    enableAutoRefresh(false)

    return () => {
      enableAutoRefresh(false)
    }
  }, [enableAutoRefresh])

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    if (!selectedChild) {
      setStats({
        totalChildren: children.length,
        sleepEvents: 0,
        feedingEvents: 0,
        diaperEvents: 0,
        growthEvents: 0,
        medicationEvents: 0,
        temperatureEvents: 0,
        recentActivities: [],
      })
      setIsStatsLoading(false)
      return
    }

    try {
      setIsStatsLoading(true)
      console.log(`Fetching stats for child ID: ${selectedChild.id}`)

      // Count events by type
      const response = await fetch(`/api/events?childId=${selectedChild.id}&limit=100`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status}`)
      }

      const events = await response.json()
      console.log(`Received ${events.length} events for stats`)

      // Count events by type
      const sleepEvents = events.filter((e) => e.eventType === "sleeping").length
      const feedingEvents = events.filter((e) => e.eventType === "feeding").length
      const diaperEvents = events.filter((e) => e.eventType === "diaper").length
      const growthEvents = events.filter((e) => e.eventType === "growth").length
      const medicationEvents = events.filter((e) => e.eventType === "medication").length
      const temperatureEvents = events.filter((e) => e.eventType === "temperature").length

      // Get recent activities (last 10)
      const recentActivities = events
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10)
        .map((event) => {
          // Format the event for display
          return {
            id: event.id,
            type: event.eventType,
            time: format(parseISO(event.timestamp), "MMM d, yyyy h:mm a"),
            details: event.details || "", // Ensure details is never undefined
            value: event.value,
            timestamp: event.timestamp,
          }
        })

      setStats({
        totalChildren: children.length,
        sleepEvents,
        feedingEvents,
        diaperEvents,
        growthEvents,
        medicationEvents,
        temperatureEvents,
        recentActivities,
      })
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
      toast({
        title: "Error",
        description: "Failed to fetch dashboard stats. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsStatsLoading(false)
    }
  }, [selectedChild, children.length, toast])

  // Only fetch stats when selectedChild changes or lastUpdated changes
  useEffect(() => {
    if (selectedChild) {
      console.log("Selected child changed or lastUpdated triggered, fetching stats")
      fetchStats()
    } else {
      setIsStatsLoading(false)
    }
  }, [selectedChild, lastUpdated, fetchStats])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    triggerRefresh()
    await fetchStats()
    setTimeout(() => {
      setIsRefreshing(false)
    }, 1000)
  }

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

  const handleEditChild = (child: any) => {
    setChildToEdit(child)
    setEditChildModalOpen(true)
  }

  const isLoading = isChildrenLoading || isStatsLoading

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {selectedChild ? `Managing ${selectedChild.name}'s activities` : "Add a child to get started"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="relative"
          >
            {isRefreshing || isContextRefreshing ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                <span className="hidden sm:inline">Refreshing...</span>
                <span className="sm:hidden">...</span>
              </>
            ) : (
              <>
                <RefreshCw className={`mr-2 h-4 w-4 ${lastUpdated % 10000 < 500 ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </>
            )}
          </Button>

          <Button onClick={() => setIsAddEventModalOpen(true)} disabled={!selectedChild}>
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Add Event</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-[400px] items-center justify-center">
          <LoadingSpinner size="lg" />
          <span className="ml-4 text-lg">Loading dashboard data...</span>
        </div>
      ) : (
        <>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 mobile-card-header">
                <CardTitle className="text-sm font-medium card-title-mobile">Total Children</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </CardHeader>
              <CardContent className="mobile-card-spacing">
                <div className="text-2xl font-bold card-value-mobile">{stats.totalChildren}</div>
                <p className="text-xs text-muted-foreground card-description-mobile">Children registered</p>
                <Button
                  variant={stats.totalChildren === 0 ? "default" : "outline"}
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => setIsAddChildModalOpen(true)}
                >
                  <Plus className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm">{stats.totalChildren === 0 ? "Add Child" : "Add Another"}</span>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 mobile-card-header">
                <CardTitle className="text-sm font-medium card-title-mobile">Sleep Events</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="mobile-card-spacing">
                <div className="text-2xl font-bold card-value-mobile">{stats.sleepEvents}</div>
                <p className="text-xs text-muted-foreground card-description-mobile">Sleep records</p>
                {selectedChild && (
                  <Button variant="link" size="sm" className="px-0 h-auto text-xs mt-2" asChild>
                    <Link href="/dashboard/sleep">View details</Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 mobile-card-header">
                <CardTitle className="text-sm font-medium card-title-mobile">Feeding Events</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M11 2a2 2 0 0 0-2 2v2h6v-2a2 2 0 0 0-2-2h-2Z" />
                </svg>
              </CardHeader>
              <CardContent className="mobile-card-spacing">
                <div className="text-2xl font-bold card-value-mobile">{stats.feedingEvents}</div>
                <p className="text-xs text-muted-foreground card-description-mobile">Feeding records</p>
                {selectedChild && (
                  <Button variant="link" size="sm" className="px-0 h-auto text-xs mt-2" asChild>
                    <Link href="/dashboard/feeding">View details</Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 mobile-card-header">
                <CardTitle className="text-sm font-medium card-title-mobile">Growth Events</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="mobile-card-spacing">
                <div className="text-2xl font-bold card-value-mobile">{stats.growthEvents}</div>
                <p className="text-xs text-muted-foreground card-description-mobile">Growth records</p>
                {selectedChild && (
                  <Button variant="link" size="sm" className="px-0 h-auto text-xs mt-2" asChild>
                    <Link href="/dashboard/growth">View details</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className={cn("grid w-full text-xs sm:text-sm", isMobile ? "grid-cols-3" : "grid-cols-5")}>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="children">Children</TabsTrigger>
              <TabsTrigger value="recent-activities">Activities</TabsTrigger>
              {!isMobile && (
                <>
                  <TabsTrigger value="charts">Charts</TabsTrigger>
                  <TabsTrigger value="stats">Statistics</TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-full md:col-span-4">
                  <CardHeader>
                    <CardTitle>Overview for {selectedChild ? selectedChild.name : "Your Child"}</CardTitle>
                    <CardDescription>Summary of recent activities and stats</CardDescription>
                  </CardHeader>
                  <CardContent className="pl-2">
                    {!selectedChild ? (
                      <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
                        <div className="flex flex-col items-center gap-1 text-center">
                          <p className="text-sm text-muted-foreground">No child selected</p>
                          <Button
                            variant="default"
                            size="lg"
                            className="mt-4"
                            onClick={() => {
                              setIsAddChildModalOpen(true)
                            }}
                          >
                            <Plus className="mr-2 h-5 w-5" />
                            Add Your First Child
                          </Button>
                          <p className="text-xs text-muted-foreground mt-2">
                            Add a child to start tracking their growth and activities
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {stats.sleepEvents === 0 && stats.feedingEvents === 0 && stats.growthEvents === 0 ? (
                          <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
                            <div className="flex flex-col items-center gap-1 text-center">
                              <p className="text-sm text-muted-foreground">No recent activities found</p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={() => {
                                  setIsAddEventModalOpen(true)
                                }}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Event
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <p className="text-sm">
                              You have recorded{" "}
                              <span className="font-medium">
                                {stats.sleepEvents +
                                  stats.feedingEvents +
                                  stats.growthEvents +
                                  stats.diaperEvents +
                                  stats.medicationEvents +
                                  stats.temperatureEvents}
                              </span>{" "}
                              events for {selectedChild.name}.
                            </p>
                            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                              <div className="rounded-md border p-4">
                                <h3 className="mb-2 font-medium">Sleep</h3>
                                <p className="text-2xl font-bold">{stats.sleepEvents}</p>
                                <p className="text-xs text-muted-foreground">Total sleep records</p>
                                <Button variant="link" size="sm" className="px-0 h-auto text-xs mt-2" asChild>
                                  <Link href="/dashboard/sleep">View details</Link>
                                </Button>
                              </div>
                              <div className="rounded-md border p-4">
                                <h3 className="mb-2 font-medium">Feeding</h3>
                                <p className="text-2xl font-bold">{stats.feedingEvents}</p>
                                <p className="text-xs text-muted-foreground">Total feeding records</p>
                                <Button variant="link" size="sm" className="px-0 h-auto text-xs mt-2" asChild>
                                  <Link href="/dashboard/feeding">View details</Link>
                                </Button>
                              </div>
                              <div className="rounded-md border p-4">
                                <h3 className="mb-2 font-medium">Diaper</h3>
                                <p className="text-2xl font-bold">{stats.diaperEvents}</p>
                                <p className="text-xs text-muted-foreground">Total diaper records</p>
                                <Button variant="link" size="sm" className="px-0 h-auto text-xs mt-2" asChild>
                                  <Link href="/dashboard/diaper">View details</Link>
                                </Button>
                              </div>
                              <div className="rounded-md border p-4">
                                <h3 className="mb-2 font-medium">Growth</h3>
                                <p className="text-2xl font-bold">{stats.growthEvents}</p>
                                <p className="text-xs text-muted-foreground">Total growth records</p>
                                <Button variant="link" size="sm" className="px-0 h-auto text-xs mt-2" asChild>
                                  <Link href="/dashboard/growth">View details</Link>
                                </Button>
                              </div>
                              <div className="rounded-md border p-4">
                                <h3 className="mb-2 font-medium">Medication</h3>
                                <p className="text-2xl font-bold">{stats.medicationEvents}</p>
                                <p className="text-xs text-muted-foreground">Total medication records</p>
                                <Button variant="link" size="sm" className="px-0 h-auto text-xs mt-2" asChild>
                                  <Link href="/dashboard/medications">View details</Link>
                                </Button>
                              </div>
                              <div className="rounded-md border p-4">
                                <h3 className="mb-2 font-medium">Temperature</h3>
                                <p className="text-2xl font-bold">{stats.temperatureEvents}</p>
                                <p className="text-xs text-muted-foreground">Total temperature records</p>
                                <Button variant="link" size="sm" className="px-0 h-auto text-xs mt-2" asChild>
                                  <Link href="/dashboard/temperature">View details</Link>
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card className="col-span-full md:col-span-3">
                  <CardHeader>
                    <CardTitle>Recent Activities</CardTitle>
                    <CardDescription>
                      Latest events for {selectedChild ? selectedChild.name : "your child"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!selectedChild ? (
                      <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
                        <p className="text-sm text-muted-foreground">Select a child to view recent activities</p>
                      </div>
                    ) : stats.recentActivities.length === 0 ? (
                      <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
                        <p className="text-sm text-muted-foreground">No recent activities found</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="max-h-[300px] overflow-auto pr-2">
                          {stats.recentActivities.map((activity, index) => (
                            <div
                              key={activity.id || index}
                              className="flex items-start space-x-4 py-3 border-b last:border-0"
                            >
                              <div className="text-2xl">{getEventTypeIcon(activity.type)}</div>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center">
                                  <p className="text-sm font-medium capitalize">{activity.type}</p>
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    {format(new Date(activity.timestamp), "MMM d")}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(activity.timestamp), "h:mm a")}
                                </p>
                                <p className="text-xs">
                                  {formatEventDetails(activity.type, activity.details, activity.value)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-end">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href="/dashboard/recent-activities">
                              View All <ArrowRight className="ml-1 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="children" className="space-y-4">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {children.length === 0 ? (
                  <div className="col-span-full flex h-[200px] items-center justify-center rounded-md border border-dashed">
                    <div className="flex flex-col items-center gap-1 text-center">
                      <p className="text-sm text-muted-foreground">No children added yet</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          setIsAddChildModalOpen(true)
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Child
                      </Button>
                    </div>
                  </div>
                ) : (
                  children.map((child) => (
                    <Card key={child.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {child.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle>{child.name}</CardTitle>
                            <CardDescription>
                              {format(new Date(child.dateOfBirth), "MMM d, yyyy")} • {child.sex}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Age:</span>
                            <span className="text-sm">
                              {Math.floor(
                                (new Date().getTime() - new Date(child.dateOfBirth).getTime()) /
                                  (1000 * 60 * 60 * 24 * 365),
                              )}{" "}
                              years
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Last activity:</span>
                            <span className="text-sm">
                              {child.id === selectedChild?.id && stats.recentActivities.length > 0
                                ? format(new Date(stats.recentActivities[0].timestamp), "MMM d, yyyy")
                                : "N/A"}
                            </span>
                          </div>
                          <div className="pt-2 flex gap-2">
                            <Button
                              variant={child.id === selectedChild?.id ? "default" : "outline"}
                              size="sm"
                              className="flex-1"
                              onClick={() => {
                                setSelectedChild(child)
                              }}
                            >
                              {child.id === selectedChild?.id ? "Currently Selected" : "Select Child"}
                            </Button>
                            <Button variant="outline" size="sm" className="w-10" onClick={() => handleEditChild(child)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="recent-activities" className="space-y-4">
              <RecentActivities />
            </TabsContent>

            <TabsContent value="charts" className="space-y-4">
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <div className="col-span-1 md:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Sleep Chart</CardTitle>
                      <CardDescription>Daily sleep duration over the past week</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <SleepChart />
                    </CardContent>
                  </Card>
                </div>
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Feeding Chart</CardTitle>
                      <CardDescription>Daily feeding data for the past week</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FeedingChart />
                    </CardContent>
                  </Card>
                </div>
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Temperature</CardTitle>
                      <CardDescription>Temperature readings over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <TemperatureChart />
                    </CardContent>
                  </Card>
                </div>
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Growth</CardTitle>
                      <CardDescription>Height and weight over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <GrowthChart />
                    </CardContent>
                  </Card>
                </div>
                <div className="col-span-1 md:col-span-2 lg:col-span-1">
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle>Activity Summary</CardTitle>
                      <CardDescription>Summary of all activities by child</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ActivitySummaryChart />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="stats" className="space-y-4">
              <ChildStatsSummary />
            </TabsContent>
          </Tabs>
          {editChildModalOpen && childToEdit && (
            <EditChildModal open={editChildModalOpen} onOpenChange={setEditChildModalOpen} child={childToEdit} />
          )}
        </>
      )}
    </div>
  )
}

