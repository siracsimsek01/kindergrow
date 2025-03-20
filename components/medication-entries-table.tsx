"use client"

import { useState, useEffect } from "react"
import { format, parseISO } from "date-fns"
import { useChildContext } from "@/contexts/child-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GraphLoader } from "@/components/ui/graph-loader"
import { Button } from "@/components/ui/button"
import { RefreshCw, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { AddEventModal } from "@/components/add-event-modal"
import { DeleteEventButton } from "@/components/delete-event-button"

interface MedicationEntry {
  id: string
  date: string
  name: string
  dosage: string
  frequency: string
  instructions: string
}

export function MedicationEntriesTable() {
  const { selectedChild, lastUpdated, triggerRefresh } = useChildContext()
  const [entries, setEntries] = useState<MedicationEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false)

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
      const response = await fetch(`/api/events?childId=${selectedChild.id}&eventType=medication`)

      if (!response.ok) {
        throw new Error(`Failed to fetch medication entries: ${response.status}`)
      }

      const events = await response.json()

      // Process the events
      const processedEntries = events.map((event: any) => {
        // Extract medication details
        const details = event.details || ""
        const nameMatch = details.match(/Medication: (.+)/)
        const dosageMatch = details.match(/Dosage: (.+)/)
        const frequencyMatch = details.match(/Frequency: (.+)/)
        const instructionsMatch = details.match(/Instructions: (.+)/)

        const name = nameMatch ? nameMatch[1] : "Not specified"
        const dosage = dosageMatch ? dosageMatch[1] : ""
        const frequency = frequencyMatch ? frequencyMatch[1] : "once"
        const instructions = instructionsMatch ? instructionsMatch[1] : ""

        return {
          id: event.id,
          date: event.timestamp,
          name,
          dosage,
          frequency,
          instructions,
        }
      })

      // Sort by date (newest first)
      processedEntries.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      })

      setEntries(processedEntries)
    } catch (error) {
      console.error("Error fetching medication entries:", error)
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

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case "once":
        return "Once"
      case "daily":
        return "Daily"
      case "twice-daily":
        return "Twice Daily"
      case "three-times-daily":
        return "Three Times Daily"
      case "as-needed":
        return "As Needed"
      default:
        return frequency
    }
  }

  if (!selectedChild) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground">Select a child to view medication entries</p>
      </div>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Medication Entries</CardTitle>
            <CardDescription>All recorded medications</CardDescription>
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
              Add Medication
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <GraphLoader variant="shimmer" message="Loading medication entries..." />
          ) : entries.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed">
              <p className="text-muted-foreground">No medication entries found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="grid grid-cols-6 bg-muted/50 p-3 text-sm font-medium">
                <div>Date</div>
                <div>Time</div>
                <div>Medication</div>
                <div>Dosage</div>
                <div>Frequency</div>
                <div className="text-right">Actions</div>
              </div>
              <div className="divide-y">
                {entries.map((entry) => (
                  <div key={entry.id} className="grid grid-cols-6 p-3 text-sm">
                    <div>{format(parseISO(entry.date), "MMM d, yyyy")}</div>
                    <div>{format(parseISO(entry.date), "h:mm a")}</div>
                    <div className="font-medium">{entry.name}</div>
                    <div>{entry.dosage}</div>
                    <div>
                      <Badge variant="outline">{getFrequencyLabel(entry.frequency)}</Badge>
                    </div>
                    <div className="flex justify-end">
                      <DeleteEventButton eventId={entry.id} eventType="medication" onDelete={() => fetchEntries()} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AddEventModal open={isAddEventModalOpen} onOpenChange={setIsAddEventModalOpen} defaultEventType="medication" />
    </>
  )
}

