"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useChildContext } from "@/contexts/child-context"
import { format } from "date-fns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { deleteEvent } from "@/app/actions"

interface FeedingEntry {
  id: string
  type: string
  amount: string
  startTime: string
  endTime: string
  duration: string
  date: string
  notes: string
}

export function FeedingEntries() {
  const { selectedChild } = useChildContext()
  const [entries, setEntries] = useState<FeedingEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (selectedChild) {
      fetchFeedingEntries()
    } else {
      setEntries([])
    }
  }, [selectedChild])

  const fetchFeedingEntries = async () => {
    if (!selectedChild) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/events?childId=${selectedChild.id}&eventType=feeding`)

      if (!response.ok) {
        throw new Error(`Failed to fetch feeding entries: ${response.status} ${response.statusText}`)
      }

      const events = await response.json()

      // Parse feeding details from events
      const feedingEntries = events.map((event) => {
        const details = event.details || ""
        const typeMatch = details.match(/Type: (.+)/)
        const amountMatch = details.match(/Amount: (.+)/)
        const notesMatch = details.match(/Notes: (.+)/)

        const startTime = new Date(event.startTime)
        const endTime = new Date(event.endTime || event.startTime)
        const durationMs = endTime.getTime() - startTime.getTime()
        const durationMinutes = Math.round(durationMs / 60000)

        return {
          id: event.id,
          type: typeMatch ? typeMatch[1] : "Unknown",
          amount: amountMatch ? amountMatch[1] : "-",
          startTime: format(startTime, "h:mm a"),
          endTime: format(endTime, "h:mm a"),
          duration: `${durationMinutes} min`,
          date: format(startTime, "MMM d, yyyy"),
          notes: notesMatch ? notesMatch[1] : "",
        }
      })

      // Sort by date, most recent first
      feedingEntries.sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.startTime}`).getTime()
        const dateB = new Date(`${b.date} ${b.startTime}`).getTime()
        return dateB - dateA
      })

      setEntries(feedingEntries)
    } catch (error) {
      console.error("Error fetching feeding entries:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (entryId: string) => {
    try {
      const result = await deleteEvent(entryId)

      if (result.success) {
        // Update local state
        setEntries((prev) => prev.filter((entry) => entry.id !== entryId))

        toast({
          title: "Entry deleted",
          description: "The feeding entry has been deleted.",
        })
      } else {
        throw new Error(result.error || "Failed to delete entry")
      }
    } catch (error) {
      console.error("Error deleting entry:", error)
      toast({
        title: "Error",
        description: "Failed to delete entry. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (!selectedChild) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Feeding Entries</CardTitle>
          <CardDescription>Select a child to view their feeding entries</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No child selected</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feeding Entries</CardTitle>
        <CardDescription>All feeding entries for {selectedChild.name}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-4 text-center">
            <p className="text-muted-foreground">Loading feeding entries...</p>
          </div>
        ) : entries.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry, index) => (
                <TableRow key={index}>
                  <TableCell>{entry.date}</TableCell>
                  <TableCell>{entry.startTime}</TableCell>
                  <TableCell className="capitalize">{entry.type}</TableCell>
                  <TableCell>{entry.amount}</TableCell>
                  <TableCell>{entry.duration}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{entry.notes}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="py-4 text-center">
            <p className="text-muted-foreground">No feeding entries found</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

