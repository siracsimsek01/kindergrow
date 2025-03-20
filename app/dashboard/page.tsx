"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { SleepChart } from "@/components/charts/sleep-chart"
import { FeedingChart } from "@/components/feeding-chart"
import { GrowthChart } from "@/components/charts/growth-chart"
import { ActivitySummaryChart } from "@/components/charts/activity-summary-chart"
import { TemperatureChart } from "@/components/charts/temperature-chart"
import { DiaperChart } from "@/components/charts/diaper-chart"
import { Button } from "@/components/ui/button"
import { Plus, RefreshCw, ArrowRight, Clock, Activity, Edit, BarChart3, Users, History } from "lucide-react"
import { format, parseISO } from "date-fns"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { EditChildModal } from "@/components/edit-child-modal"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { fetchEvents } from "@/lib/redux/slices/eventsSlice"
import { setSelectedChild } from "@/lib/redux/slices/childrenSlice"
import { setAddChildModalOpen, setAddEventModalOpen } from "@/lib/redux/slices/uiSlice"
import { triggerRefresh } from "@/lib/redux/slices/eventsSlice"

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
  const dispatch = useAppDispatch()
  const { items: children, selectedChild, loading: childrenLoading } = useAppSelector((state) => state.children)
  const { items: events, loading: eventsLoading, lastUpdated } = useAppSelector((state) => state.events)

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
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

  // Fetch events when selectedChild changes or lastUpdated changes
  useEffect(() => {
    if (selectedChild) {
      dispatch(fetchEvents({ childId: selectedChild.id, limit: 100 }))
    }
  }, [selectedChild, lastUpdated, dispatch])

  // Memoize event counts to improve performance
  const eventCounts = useMemo(() => {
    if (!events.length)
      return {
        sleepEvents: 0,
        feedingEvents: 0,
        diaperEvents: 0,
        growthEvents: 0,
        medicationEvents: 0,
        temperatureEvents: 0,
      }

    return {
      sleepEvents: events.filter((e) => e.eventType === "sleeping").length,
      feedingEvents: events.filter((e) => e.eventType === "feeding").length,
      diaperEvents: events.filter((e) => e.eventType === "diaper").length,
      growthEvents: events.filter((e) => e.eventType === "growth").length,
      medicationEvents: events.filter((e) => e.eventType === "medication").length,
      temperatureEvents: events.filter((e) => e.eventType === "temperature").length,
    }
  }, [events])

  // Update stats when events or children change
  useEffect(() => {
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
      return
    }

    // Get recent activities (last 10)
    const recentActivities = [...events]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
      .map((event) => {
        // Format the event for display
        return {
          id: event.id,
          type: event.eventType,
          time: format(parseISO(event.timestamp), "MMM d, yyyy h:mm a"),
          details: event.details,
          value: event.value,
          timestamp: event.timestamp,
        }
      })

    setStats({
      totalChildren: children.length,
      ...eventCounts,
      recentActivities,
    })
  }, [selectedChild, events, children.length, eventCounts])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    dispatch(triggerRefresh())
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

  const handleAddChild = () => {
    dispatch(setAddChildModalOpen(true))
  }

  const handleAddEvent = () => {
    dispatch(setAddEventModalOpen(true))
  }

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
            disabled={isRefreshing}
            className="cursor-pointer"
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </>
            )}
          </Button>

          <Button onClick={handleAddEvent} className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Statistics Cards - Consistent Grid Layout */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border border-border hover:bg-card/90 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Children</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalChildren}</div>
            <p className="text-xs text-muted-foreground">Children registered</p>
            <Button
              variant={stats.totalChildren === 0 ? "default" : "outline"}
              size="sm"
              className="w-full mt-2 cursor-pointer"
              onClick={handleAddChild}
            >
              <Plus className="mr-2 h-4 w-4" />
              {stats.totalChildren === 0 ? "Add Your First Child" : "Add Another Child"}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border hover:bg-card/90 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sleep Events</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sleepEvents}</div>
            <p className="text-xs text-muted-foreground">Sleep records</p>
            {selectedChild && (
              <Button variant="link" size="sm" className="px-0 h-auto text-xs mt-2 cursor-pointer" asChild>
                <Link href="/dashboard/sleep">View details</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border border-border hover:bg-card/90 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feeding Events</CardTitle>
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
          <CardContent>
            <div className="text-2xl font-bold">{stats.feedingEvents}</div>
            <p className="text-xs text-muted-foreground">Feeding records</p>
            {selectedChild && (
              <Button variant="link" size="sm" className="px-0 h-auto text-xs mt-2 cursor-pointer" asChild>
                <Link href="/dashboard/feeding">View details</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border border-border hover:bg-card/90 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.growthEvents}</div>
            <p className="text-xs text-muted-foreground">Growth records</p>
            {selectedChild && (
              <Button variant="link" size="sm" className="px-0 h-auto text-xs mt-2 cursor-pointer" asChild>
                <Link href="/dashboard/growth">View details</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 sm:w-auto sm:inline-flex cursor-pointer">
          <TabsTrigger value="overview" className="flex items-center gap-2 cursor-pointer">
            <BarChart3 className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="children" className="flex items-center gap-2 cursor-pointer">
            <Users className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Children</span>
          </TabsTrigger>
          <TabsTrigger value="recent-activities" className="flex items-center gap-2 cursor-pointer">
            <History className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Recent Activities</span>
          </TabsTrigger>
          <TabsTrigger value="charts" className="flex items-center gap-2 cursor-pointer">
            <Activity className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Charts</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
            <Card className="lg:col-span-4 bg-card border border-border">
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
                        className="mt-4 cursor-pointer"
                        onClick={() => {
                          dispatch(setAddChildModalOpen(true))
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
                            className="mt-2 cursor-pointer"
                            onClick={() => {
                              dispatch(setAddEventModalOpen(true))
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
                          <div className="rounded-md border border-border p-4 bg-card/50 hover:bg-card/80 transition-colors">
                            <h3 className="mb-2 font-medium">Sleep</h3>
                            <p className="text-2xl font-bold">{stats.sleepEvents}</p>
                            <p className="text-xs text-muted-foreground">Total sleep records</p>
                            <Button
                              variant="link"
                              size="sm"
                              className="px-0 h-auto text-xs mt-2 cursor-pointer"
                              asChild
                            >
                              <Link href="/dashboard/sleep">View details</Link>
                            </Button>
                          </div>
                          <div className="rounded-md border border-border p-4 bg-card/50 hover:bg-card/80 transition-colors">
                            <h3 className="mb-2 font-medium">Feeding</h3>
                            <p className="text-2xl font-bold">{stats.feedingEvents}</p>
                            <p className="text-xs text-muted-foreground">Total feeding records</p>
                            <Button
                              variant="link"
                              size="sm"
                              className="px-0 h-auto text-xs mt-2 cursor-pointer"
                              asChild
                            >
                              <Link href="/dashboard/feeding">View details</Link>
                            </Button>
                          </div>
                          <div className="rounded-md border border-border p-4 bg-card/50 hover:bg-card/80 transition-colors">
                            <h3 className="mb-2 font-medium">Diaper</h3>
                            <p className="text-2xl font-bold">{stats.diaperEvents}</p>
                            <p className="text-xs text-muted-foreground">Total diaper records</p>
                            <Button
                              variant="link"
                              size="sm"
                              className="px-0 h-auto text-xs mt-2 cursor-pointer"
                              asChild
                            >
                              <Link href="/dashboard/diaper">View details</Link>
                            </Button>
                          </div>
                          <div className="rounded-md border border-border p-4 bg-card/50 hover:bg-card/80 transition-colors">
                            <h3 className="mb-2 font-medium">Growth</h3>
                            <p className="text-2xl font-bold">{stats.growthEvents}</p>
                            <p className="text-xs text-muted-foreground">Total growth records</p>
                            <Button
                              variant="link"
                              size="sm"
                              className="px-0 h-auto text-xs mt-2 cursor-pointer"
                              asChild
                            >
                              <Link href="/dashboard/growth">View details</Link>
                            </Button>
                          </div>
                          <div className="rounded-md border border-border p-4 bg-card/50 hover:bg-card/80 transition-colors">
                            <h3 className="mb-2 font-medium">Medication</h3>
                            <p className="text-2xl font-bold">{stats.medicationEvents}</p>
                            <p className="text-xs text-muted-foreground">Total medication records</p>
                            <Button
                              variant="link"
                              size="sm"
                              className="px-0 h-auto text-xs mt-2 cursor-pointer"
                              asChild
                            >
                              <Link href="/dashboard/medications">View details</Link>
                            </Button>
                          </div>
                          <div className="rounded-md border border-border p-4 bg-card/50 hover:bg-card/80 transition-colors">
                            <h3 className="mb-2 font-medium">Temperature</h3>
                            <p className="text-2xl font-bold">{stats.temperatureEvents}</p>
                            <p className="text-xs text-muted-foreground">Total temperature records</p>
                            <Button
                              variant="link"
                              size="sm"
                              className="px-0 h-auto text-xs mt-2 cursor-pointer"
                              asChild
                            >
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
            <Card className="lg:col-span-3 bg-card border border-border h-full">
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>Latest events for {selectedChild ? selectedChild.name : "your child"}</CardDescription>
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
                      <Button variant="ghost" size="sm" className="cursor-pointer" asChild>
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
                    className="mt-2 cursor-pointer"
                    onClick={() => {
                      dispatch(setAddChildModalOpen(true))
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Child
                  </Button>
                </div>
              </div>
            ) : (
              children.map((child) => (
                <Card
                  key={child.id}
                  className="overflow-hidden bg-card border border-border hover:bg-card/90 transition-colors"
                >
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
                          className="flex-1 cursor-pointer"
                          onClick={() => {
                            const selectedChild = children.find((c) => c.id === child.id)
                            if (selectedChild) {
                              dispatch(setSelectedChild(selectedChild))
                            }
                          }}
                        >
                          {child.id === selectedChild?.id ? "Currently Selected" : "Select Child"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-10 cursor-pointer"
                          onClick={() => handleEditChild(child)}
                        >
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
          {!selectedChild ? (
            <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed">
              <p className="text-sm text-muted-foreground">Select a child to view recent activities</p>
            </div>
          ) : stats.recentActivities.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed">
              <p className="text-sm text-muted-foreground">No recent activities found</p>
            </div>
          ) : (
            <Card className="bg-card border border-border">
              <CardHeader>
                <CardTitle>Recent Activities for {selectedChild.name}</CardTitle>
                <CardDescription>Latest recorded events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-4 py-4 border-b last:border-0">
                      <div className="text-3xl">{getEventTypeIcon(activity.type)}</div>
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between">
                          <div className="flex items-center">
                            <p className="text-sm font-medium capitalize">{activity.type}</p>
                            <Badge variant="outline" className="ml-2">
                              {format(new Date(activity.timestamp), "MMM d")}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(activity.timestamp), "h:mm a")}
                          </p>
                        </div>
                        <p className="text-sm">{formatEventDetails(activity.type, activity.details, activity.value)}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.details ? activity.details.replace(/\n/g, " • ") : "No additional details"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          {/* Chart Layout - Consistent and Responsive Grid */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {/* Sleep Chart */}
            <div className="md:col-span-2 lg:col-span-3">
              <Card className="bg-card border border-border h-full">
                <CardHeader>
                  <CardTitle>Sleep Chart</CardTitle>
                  <CardDescription>Daily sleep duration over the past week</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <SleepChart />
                </CardContent>
              </Card>
            </div>

            {/* Feeding Chart */}
            <div className="lg:col-span-2">
              <Card className="bg-card border border-border h-full">
                <CardHeader>
                  <CardTitle>Feeding Chart</CardTitle>
                  <CardDescription>Daily feeding data for the past week</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <FeedingChart />
                </CardContent>
              </Card>
            </div>

            {/* Growth Chart */}
            <div className="lg:col-span-1">
              <Card className="bg-card border border-border h-full">
                <CardHeader>
                  <CardTitle>Growth</CardTitle>
                  <CardDescription>Height and weight over time</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <GrowthChart />
                </CardContent>
              </Card>
            </div>

            {/* Temperature Chart */}
            <div className="lg:col-span-3">
              <Card className="bg-card border border-border h-full">
                <CardHeader>
                  <CardTitle>Temperature</CardTitle>
                  <CardDescription>Temperature readings over time</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <TemperatureChart />
                </CardContent>
              </Card>
            </div>

            {/* Diaper Chart */}
            <div className="lg:col-span-3">
              <Card className="bg-card border border-border h-full">
                <CardHeader>
                  <CardTitle>Diaper</CardTitle>
                  <CardDescription>Diaper changes over time</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <DiaperChart />
                </CardContent>
              </Card>
            </div>

            {/* Activity Summary */}
            <div className="md:col-span-2 lg:col-span-3">
              <Card className="bg-card border border-border h-full">
                <CardHeader>
                  <CardTitle>Activity Summary</CardTitle>
                  <CardDescription>Summary of all activities by child</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] p-4">
                  <ActivitySummaryChart />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      {childToEdit && (
        <EditChildModal open={editChildModalOpen} onOpenChange={setEditChildModalOpen} child={childToEdit} />
      )}
    </div>
  )
}

