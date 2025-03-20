"use client"

import { useState, useEffect } from "react"
import { format, parseISO } from "date-fns"
import { useChildContext } from "@/contexts/child-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GraphLoader } from "@/components/ui/graph-loader"
import { Button } from "@/components/ui/button"
import { RefreshCw, Plus } from "lucide-react"
import { DeleteEventButton } from "@/components/delete-event-button"
import { GrowthForm } from "@/components/forms/growth-form"

interface GrowthEntry {
  id: string
  date: string
  weight: number
  height: number
  notes: string
}

export function GrowthEntriesTable() {
  const { selectedChild, lastUpdated, triggerRefresh } = useChildContext()
  const [entries, setEntries] = useState<GrowthEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

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
      const response = await fetch(`/api/events?childId=${selectedChild.id}&eventType=growth`)

      if (!response.ok) {
        throw new Error(`Failed to fetch growth entries: ${response.status}`)
      }

      const events = await response.json()

      // Process the events
      const processedEntries = events.map((event) => {
        // Extract weight and height from details
        const details = event.details || ""
        const weightMatch = details.match(/Weight: (.+)/)
        const heightMatch = details.match(/Height: (.+)/)
        const notesMatch = details.match(/Notes: (.+)/)

        const weight = event.value || (weightMatch ? Number.parseFloat(weightMatch[1]) : 0)
        const height = heightMatch ? Number.parseFloat(heightMatch[1]) : 0
        const notes = notesMatch ? notesMatch[1] : ""

        return {
          id: event.id,
          date: event.timestamp,
          weight,
          height,
          notes,
        }
      })

      // Sort by date (newest first)
      processedEntries.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      })

      setEntries(processedEntries)
    } catch (error) {
      console.error("Error fetching growth entries:", error)
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

  if (!selectedChild) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground">Select a child to view growth entries</p>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Growth Entries</CardTitle>
          <CardDescription>All recorded growth measurements</CardDescription>
        </div>
        <div className="flex gap-2">
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
          <GrowthForm>
            <Button size="sm">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Growth Data
            </Button>
          </GrowthForm>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <GraphLoader variant="shimmer" message="Loading growth entries..." />
        ) : entries.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed">
            <p className="text-muted-foreground">No growth entries found</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <div className="grid grid-cols-5 bg-muted/50 p-3 text-sm font-medium">
              <div>Date</div>
              <div>Weight (kg)</div>
              <div>Height (cm)</div>
              <div>Notes</div>
              <div className="text-right">Actions</div>
            </div>
            <div className="divide-y">
              {entries.map((entry) => (
                <div key={entry.id} className="grid grid-cols-5 p-3 text-sm">
                  <div>{format(parseISO(entry.date), "MMM d, yyyy")}</div>
                  <div>{entry.weight.toFixed(2)}</div>
                  <div>{entry.height.toFixed(1)}</div>
                  <div className="truncate">{entry.notes}</div>
                  <div className="flex justify-end">
                    <DeleteEventButton eventId={entry.id} eventType="growth" onDelete={handleDelete} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

