"use client"

import { useState, useEffect } from "react"
import { format, parseISO } from "date-fns"
import { useChildContext } from "@/contexts/child-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GraphLoader } from "@/components/ui/graph-loader"
import { Button } from "@/components/ui/button"
import { RefreshCw, Plus } from "lucide-react"
import { DeleteEventButton } from "@/components/delete-event-button"
import { Badge } from "@/components/ui/badge"

interface TemperatureEntry {
  id: string
  date: string
  value: number
  unit: string
  notes: string
}

export function TemperatureEntriesTable() {
  const { selectedChild, lastUpdated, triggerRefresh, setIsAddEventModalOpen } = useChildContext()
  const [entries, setEntries] = useState<TemperatureEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [unit, setUnit] = useState<"celsius" | "fahrenheit">("celsius")

  useEffect(() => {
    if (selectedChild) {
      fetchEntries()
    } else {
      setEntries([])
    }
  }, [selectedChild, lastUpdated])

  const fetchEntries = async () => {
    if (!selectedChild) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/events?childId=${selectedChild.id}&eventType=temperature`)

      if (!response.ok) {
        throw new Error(`Failed to fetch temperature entries: ${response.status}`)
      }

      const events = await response.json()

      // Process the events
      const processedEntries = events.map((event) => {
        // Extract temperature details
        const details = event.details || ""
        const valueMatch = details.match(/Temperature: (.+)/)
        const unitMatch = details.match(/Unit: (.+)/)
        const notesMatch = details.match(/Notes: (.+)/)

        const value = event.value || (valueMatch ? Number.parseFloat(valueMatch[1]) : 0)
        const tempUnit = unitMatch ? unitMatch[1].toLowerCase() : "celsius"
        const notes = notesMatch ? notesMatch[1] : ""

        return {
          id: event.id,
          date: event.timestamp,
          value,
          unit: tempUnit,
          notes,
        }
      })

      // Sort by date (newest first)
      processedEntries.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      })

      setEntries(processedEntries)
    } catch (error) {
      console.error("Error fetching temperature entries:", error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    triggerRefresh()
    await fetchEntries()
  }

  const handleDelete = () => {
    triggerRefresh()
    fetchEntries()
  }

  const getConvertedValue = (value: number, fromUnit: string) => {
    if (fromUnit === unit) return value

    if (unit === "fahrenheit" && fromUnit === "celsius") {
      return (value * 9) / 5 + 32
    } else if (unit === "celsius" && fromUnit === "fahrenheit") {
      return ((value - 32) * 5) / 9
    }

    return value
  }

  const getFeverStatus = (value: number, fromUnit: string) => {
    const convertedValue = getConvertedValue(value, fromUnit)
    const threshold = unit === "celsius" ? 38 : 100.4

    return convertedValue >= threshold
  }

  if (!selectedChild) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground">Select a child to view temperature entries</p>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Temperature Entries</CardTitle>
          <CardDescription>All recorded temperature readings</CardDescription>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-md border">
            <Button
              variant={unit === "celsius" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setUnit("celsius")}
              className="rounded-r-none"
            >
              °C
            </Button>
            <Button
              variant={unit === "fahrenheit" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setUnit("fahrenheit")}
              className="rounded-l-none"
            >
              °F
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1"
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Refresh
              </>
            )}
          </Button>
          <Button size="sm" onClick={() => setIsAddEventModalOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Temperature
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <GraphLoader variant="shimmer" message="Loading temperature entries..." />
        ) : entries.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed">
            <p className="text-muted-foreground">No temperature entries found</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <div className="grid grid-cols-5 bg-muted/50 p-3 text-sm font-medium">
              <div>Date</div>
              <div>Time</div>
              <div>Temperature</div>
              <div>Status</div>
              <div className="text-right">Actions</div>
            </div>
            <div className="divide-y">
              {entries.map((entry) => {
                const convertedValue = getConvertedValue(entry.value, entry.unit)
                const isFever = getFeverStatus(entry.value, entry.unit)

                return (
                  <div key={entry.id} className="grid grid-cols-5 p-3 text-sm">
                    <div>{format(parseISO(entry.date), "MMM d, yyyy")}</div>
                    <div>{format(parseISO(entry.date), "h:mm a")}</div>
                    <div>
                      {convertedValue.toFixed(1)} {unit === "celsius" ? "°C" : "°F"}
                    </div>
                    <div>
                      <Badge variant={isFever ? "destructive" : "outline"}>{isFever ? "Fever" : "Normal"}</Badge>
                    </div>
                    <div className="flex justify-end">
                      <DeleteEventButton eventId={entry.id} eventType="temperature" onDelete={handleDelete} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

