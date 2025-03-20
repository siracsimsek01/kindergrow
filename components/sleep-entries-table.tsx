"use client"

import { useState, useEffect } from "react"
import { format, parseISO, differenceInMinutes } from "date-fns"
import { useChildContext } from "@/contexts/child-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GraphLoader } from "@/components/ui/graph-loader"
import { Button } from "@/components/ui/button"
import { RefreshCw, Plus } from 'lucide-react'
import { DeleteEventButton } from "@/components/delete-event-button"
import { SleepFormModal } from "@/components/sleep-form-modal"

interface SleepEntry {
  id: string
  date: string
  startTime: string
  endTime: string
  duration: string
  quality: string
  notes: string
}

export function SleepEntriesTable() {
  const { selectedChild, lastUpdated, triggerRefresh } = useChildContext()
  const [entries, setEntries] = useState<SleepEntry[]>([])
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
      const response = await fetch(`/api/events?childId=${selectedChild.id}&eventType=sleeping`)

      if (!response.ok) {
        throw new Error(`Failed to fetch sleep entries: ${response.status}`)
      }

      const events = await response.json()

      // Process the events
      const processedEntries = events.map((event) => {
        // Extract quality and notes from details
        const details = event.details || ""
        const qualityMatch = details.match(/Quality: (.+?)(?:\n|$)/)
        const notesMatch = details.match(/Notes: (.+)/)

        const quality = qualityMatch ? qualityMatch[1] : "Not specified"
        const notes = notesMatch ? notesMatch[1] : ""

        // Calculate duration
        const start = parseISO(event.startTime)
        const end = event.endTime ? parseISO(event.endTime) : new Date()
        const durationMinutes = differenceInMinutes(end, start)
        const hours = Math.floor(durationMinutes / 60)
        const minutes = durationMinutes % 60
        const duration = `${hours}h ${minutes}m`

        return {
          id: event.id,
          date: event.timestamp,
          startTime: event.startTime,
          endTime: event.endTime || "",
          duration,
          quality,
          notes,
        }
      })

      // Sort by date (newest first)
      processedEntries.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      })

      setEntries(processedEntries)
    } catch (error) {
      console.error("Error fetching sleep entries:", error)
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
        <p className="text-muted-foreground">Select a child to view sleep entries</p>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Sleep Entries</CardTitle>
          <CardDescription>All recorded sleep sessions</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1 cursor-pointer"
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
          <SleepFormModal>
            <Button size="sm" className="cursor-pointer">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Sleep Entry
            </Button>
          </SleepFormModal>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <GraphLoader variant="shimmer" message="Loading sleep entries..." />
        ) : entries.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed">
            <p className="text-muted-foreground">No sleep entries found</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <div className="grid grid-cols-6 bg-muted/50 p-3 text-sm font-medium">
              <div>Date</div>
              <div>Start Time</div>
              <div>End Time</div>
              <div>Duration</div>
              <div>Quality</div>
              <div className="text-right">Actions</div>
            </div>
            <div className="divide-y">
              {entries.map((entry) => (
                <div key={entry.id} className="grid grid-cols-6 p-3 text-sm">
                  <div>{format(parseISO(entry.date), "MMM d, yyyy")}</div>
                  <div>{format(parseISO(entry.startTime), "h:mm a")}</div>
                  <div>{entry.endTime ? format(parseISO(entry.endTime), "h:mm a") : "Ongoing"}</div>
                  <div>{entry.duration}</div>
                  <div className="capitalize">{entry.quality}</div>
                  <div className="flex justify-end">
                    <DeleteEventButton eventId={entry.id} eventType="sleeping" onDelete={handleDelete} />
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
