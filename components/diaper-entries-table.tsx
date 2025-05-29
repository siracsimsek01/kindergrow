"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { useQueryClient } from "@tanstack/react-query"
import { Trash2 } from "lucide-react"
import type { Event } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"

interface DiaperEntriesTableProps {
  events: Event[]
}

export function DiaperEntriesTable({ events }: DiaperEntriesTableProps) {
  const queryClient = useQueryClient()
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({})

  const sortedEvents = [...events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const getDiaperType = (details: string) => {
    if (!details) return "Unknown"
    const match = details.match(/Type: (wet|dirty|both)/i)
    return match ? match[1].charAt(0).toUpperCase() + match[1].slice(1) : "Unknown"
  }

  const getNotes = (details: string) => {
    if (!details) return ""
    const match = details.match(/Notes: (.+)/i)
    return match ? match[1] : ""
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

  const handleDelete = async (eventId: string) => {
    if (isDeleting[eventId]) return

    setIsDeleting((prev) => ({ ...prev, [eventId]: true }))

    try {
      const response = await fetch(`/api/children/${eventId}/events`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete diaper entry")
      }

      queryClient.invalidateQueries({ queryKey: ["events"] })

      toast({
        title: "Diaper entry deleted",
        description: "The diaper entry has been removed successfully",
      })
    } catch (error) {
      console.error("Error deleting diaper entry:", error)
      toast({
        title: "Error",
        description: "Failed to delete diaper entry. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting((prev) => ({ ...prev, [eventId]: false }))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Diaper Changes</CardTitle>
      </CardHeader>
      <CardContent>
        {sortedEvents.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No diaper changes recorded</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedEvents.map((event) => {
                  const type = getDiaperType(event.details || "")
                  return (
                    <TableRow key={event.id}>
                      <TableCell>{format(parseISO(event.timestamp), "MMM d, yyyy h:mm a")}</TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(type)}>{type}</Badge>
                      </TableCell>
                      <TableCell>{getNotes(event.details || "")}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(event.id)}
                          disabled={isDeleting[event.id]}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

