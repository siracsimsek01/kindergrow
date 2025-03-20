"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useChildContext } from "@/contexts/child-context"
import { format, parseISO } from "date-fns"
import { Check, X } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Medication {
  id: string
  name: string
  dosage: string
  time: string
  date: string
  timestamp: string
  details: string
  status: "completed" | "missed"
}

export function MedicationHistory() {
  const { selectedChild } = useChildContext()
  const [medications, setMedications] = useState<Medication[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (selectedChild) {
      fetchMedicationHistory()
    } else {
      setMedications([])
    }
  }, [selectedChild])

  const fetchMedicationHistory = async () => {
    if (!selectedChild) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/events?childId=${selectedChild.id}&eventType=medication`)

      if (!response.ok) {
        throw new Error(`Failed to fetch medications: ${response.status} ${response.statusText}`)
      }

      const events = await response.json()

      // Parse medication details from events
      const medicationEvents = events.map((event) => {
        const details = event.details || ""
        const nameMatch = details.match(/Medication: (.+)/)
        const dosageMatch = details.match(/Dosage: (.+)/)

        return {
          id: event.id,
          name: nameMatch ? nameMatch[1] : "Unknown Medication",
          dosage: dosageMatch ? dosageMatch[1] : "Unknown Dosage",
          time: format(parseISO(event.startTime), "h:mm a"),
          date: format(parseISO(event.startTime), "MMM d, yyyy"),
          timestamp: event.startTime,
          details: event.details,
          status: event.completed ? "completed" : "missed",
        }
      })

      // Sort by date, most recent first
      medicationEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      setMedications(medicationEvents)
    } catch (error) {
      console.error("Error fetching medication history:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!selectedChild) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Medication History</CardTitle>
          <CardDescription>Select a child to view their medication history</CardDescription>
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
        <CardTitle>Medication History</CardTitle>
        <CardDescription>Past medications for {selectedChild.name}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-4 text-center">
            <p className="text-muted-foreground">Loading medication history...</p>
          </div>
        ) : medications.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Medication</TableHead>
                <TableHead>Dosage</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medications.map((medication, index) => (
                <TableRow key={index}>
                  <TableCell>{medication.date}</TableCell>
                  <TableCell>{medication.time}</TableCell>
                  <TableCell>{medication.name}</TableCell>
                  <TableCell>{medication.dosage}</TableCell>
                  <TableCell>
                    {medication.status === "completed" ? (
                      <div className="flex items-center">
                        <Check className="h-4 w-4 text-green-600 mr-1" />
                        <span>Given</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <X className="h-4 w-4 text-red-600 mr-1" />
                        <span>Missed</span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="py-4 text-center">
            <p className="text-muted-foreground">No medication history found</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

