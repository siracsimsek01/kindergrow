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

interface DiaperEntry {
  id: string
  date: string
  type: string
  notes: string
}

export function DiaperEntriesTable() {
  const { selectedChild, lastUpdated, triggerRefresh, setIsAddEventModalOpen } = useChildContext()
  const [entries, setEntries] = useState<DiaperEntry[]>([])
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
      const response = await fetch(`/api/events?childId=${selectedChild.id}&eventType=diaper`)

      if (!response.ok) {
        throw new Error(`Failed to fetch diaper entries: ${response.status}`)
      }

      const events = await response.json()

      // Process the events
      const processedEntries = events.map((event) => {
        // Extract diaper details
        const details = event.details || ""
        const typeMatch = details.match(/Type: (.+)/)
        const notesMatch = details.match(/Notes: (.+)/)

        const type = typeMatch ? typeMatch[1] : "Not specified"
        const notes = notesMatch ? notesMatch[1] : ""

        return {
          id: event.id,
          date: event.timestamp,
          type,
          notes,
        }
      })

      // Sort by date (newest first)
      processedEntries.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      })

      setEntries(processedEntries)
    } catch (error) {
      console.error("Error fetching diaper entries:", error)
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

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "wet":
        return "bg-blue-500 text-white"
      case "dirty":
        return "bg-amber-500 text-white"
      case "both":
        return "bg-purple-500 text-white"
      default:
        return "bg-gray-300"
    }
  }

  if (!selectedChild) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground">Select a child to view diaper entries</p>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Diaper Entries</CardTitle>
          <CardDescription>All recorded diaper changes</CardDescription>
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
          <Button size="sm" onClick={() => setIsAddEventModalOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Diaper Change
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <GraphLoader variant="shimmer" message="Loading diaper entries..." />
        ) : entries.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed">
            <p className="text-muted-foreground">No diaper entries found</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <div className="grid grid-cols-4 bg-muted/50 p-3 text-sm font-medium">
              <div>Date</div>
              <div>Time</div>
              <div>Type</div>
              <div className="text-right">Actions</div>
            </div>
            <div className="divide-y">
              {entries.map((entry) => (
                <div key={entry.id} className="grid grid-cols-4 p-3 text-sm">
                  <div>{format(parseISO(entry.date), "MMM d, yyyy")}</div>
                  <div>{format(parseISO(entry.date), "h:mm a")}</div>
                  <div>
                    <Badge className={getTypeColor(entry.type)}>{entry.type}</Badge>
                  </div>
                  <div className="flex justify-end">
                    <DeleteEventButton eventId={entry.id} eventType="diaper" onDelete={handleDelete} />
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

