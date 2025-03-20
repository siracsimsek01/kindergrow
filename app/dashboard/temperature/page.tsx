"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { format, subDays } from "date-fns"
import { Plus, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useChildContext } from "@/contexts/child-context"
import { TemperatureChart } from "@/components/charts/temperature-chart"
import { TemperatureEntriesTable } from "@/components/temperature-entries-table"
import { GraphLoader } from "@/components/ui/graph-loader"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { TemperatureFormModal } from "@/components/temperature-form-modal"

export default function TemperaturePage() {
  const { selectedChild } = useChildContext()
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 14),
    to: new Date(),
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const {
    data: temperatureEvents,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["events", selectedChild?.id, "temperature", dateRange],
    queryFn: async () => {
      if (!selectedChild) return []

      const startDate = dateRange.from.toISOString()
      const endDate = dateRange.to.toISOString()

      const response = await fetch(
        `/api/events?childId=${selectedChild.id}&eventType=temperature&startDate=${startDate}&endDate=${endDate}`,
      )

      if (!response.ok) {
        throw new Error("Failed to fetch temperature data")
      }

      return response.json()
    },
    enabled: !!selectedChild,
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refetch()
    setIsRefreshing(false)
  }

  // Get latest temperature reading
  const latestReading = temperatureEvents && temperatureEvents.length > 0 ? temperatureEvents[0] : null
  const latestTemperature = latestReading?.value || 0
  const latestDate = latestReading ? format(new Date(latestReading.timestamp), "MMM d, HH:mm a") : "N/A"

  // Calculate average, highest, and lowest temperatures
  const validTemperatures = temperatureEvents
    ? temperatureEvents.filter((event) => event.value !== undefined && event.value !== null).map((event) => event.value)
    : []

  const averageTemperature =
    validTemperatures.length > 0
      ? (validTemperatures.reduce((sum, temp) => sum + temp, 0) / validTemperatures.length).toFixed(1)
      : "0.0"

  const highestTemperature = validTemperatures.length > 0 ? Math.max(...validTemperatures).toFixed(1) : "0.0"
  const lowestTemperature = validTemperatures.length > 0 ? Math.min(...validTemperatures).toFixed(1) : "0.0"

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Temperature Tracking</h1>
          <p className="text-muted-foreground">Monitor your child's temperature and fever history</p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker date={dateRange} setDate={setDateRange} align="end" className="w-auto" />
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="sr-only">Refresh</span>
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 cursor-pointer">
            <Plus className="h-4 w-4" /> Add Temperature
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Latest Reading</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestTemperature.toFixed(1)}°C</div>
            <p className="text-xs text-muted-foreground">Last reading: {latestDate}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageTemperature}°C</div>
            <p className="text-xs text-muted-foreground">Average temperature</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Highest</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highestTemperature}°C</div>
            <p className="text-xs text-muted-foreground">Highest temperature</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lowest</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowestTemperature}°C</div>
            <p className="text-xs text-muted-foreground">Lowest temperature</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview" className="cursor-pointer">
            Overview
          </TabsTrigger>
          <TabsTrigger value="history" className="cursor-pointer">
            History
          </TabsTrigger>
          <TabsTrigger value="fever-analysis" className="cursor-pointer">
            Fever Analysis
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardContent>
              {isLoading ? (
                <GraphLoader />
              ) : !temperatureEvents || temperatureEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-center">
                  <p className="text-muted-foreground mb-4">No temperature data available for this period</p>
                  <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 cursor-pointer">
                    <Plus className="h-4 w-4" /> Add Temperature
                  </Button>
                </div>
              ) : (
                <div className="h-[300px]">
                  <TemperatureChart data={temperatureEvents} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Temperature Readings</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <GraphLoader />
                </div>
              ) : !temperatureEvents || temperatureEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-center">
                  <p className="text-muted-foreground mb-4">No temperature data available for this period</p>
                  <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 cursor-pointer">
                    <Plus className="h-4 w-4" /> Add Temperature
                  </Button>
                </div>
              ) : (
                <TemperatureEntriesTable events={temperatureEvents} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="fever-analysis">
          <Card>
            <CardHeader>
              <CardTitle>Fever Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <GraphLoader />
                </div>
              ) : !temperatureEvents || temperatureEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-center">
                  <p className="text-muted-foreground mb-4">No temperature data available for analysis</p>
                  <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 cursor-pointer">
                    <Plus className="h-4 w-4" /> Add Temperature
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Fever Occurrences</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {temperatureEvents.filter((e) => e.value >= 38).length}
                        </div>
                        <p className="text-xs text-muted-foreground">Times temperature was 38°C or higher</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Highest Fever</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {temperatureEvents.filter((e) => e.value >= 38).length > 0
                            ? Math.max(...temperatureEvents.filter((e) => e.value >= 38).map((e) => e.value)).toFixed(1)
                            : "N/A"}
                          °C
                        </div>
                        <p className="text-xs text-muted-foreground">Highest fever recorded</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Last Fever</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {temperatureEvents.filter((e) => e.value >= 38).length > 0
                            ? format(
                                new Date(temperatureEvents.filter((e) => e.value >= 38)[0].timestamp),
                                "MMM d, yyyy",
                              )
                            : "N/A"}
                        </div>
                        <p className="text-xs text-muted-foreground">Date of most recent fever</p>
                      </CardContent>
                    </Card>
                  </div>
                  <TemperatureEntriesTable events={temperatureEvents.filter((e) => e.value >= 38)} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <TemperatureFormModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  )
}

