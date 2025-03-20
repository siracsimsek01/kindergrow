"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useChildContext } from "@/contexts/child-context"
import { format, parseISO, isToday } from "date-fns"
import { Button } from "@/components/ui/button"
import { Check, Clock, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { updateEvent } from "@/app/actions"

interface Medication {
  id: string
  name: string
  dosage: string
  time: string
  timestamp: string
  details: string
  status: "pending" | "completed" | "missed"
}

export function MedicationSchedule() {
  const { selectedChild } = useChildContext()
  const [medications, setMedications] = useState<Medication[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (selectedChild) {
      fetchMedications()
    } else {
      setMedications([])
    }
  }, [selectedChild])

  const fetchMedications = async () => {
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
        const lines = details.split("\n")

        const nameMatch = details.match(/Medication: (.+)/)
        const dosageMatch = details.match(/Dosage: (.+)/)

        return {
          id: event.id,
          name: nameMatch ? nameMatch[1] : "Unknown Medication",
          dosage: dosageMatch ? dosageMatch[1] : "Unknown Dosage",
          time: format(parseISO(event.startTime), "h:mm a"),
          timestamp: event.startTime,
          details: event.details,
          status: event.completed ? "completed" : isToday(parseISO(event.startTime)) ? "pending" : "missed",
        }
      })

      // Sort by time
      medicationEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

      setMedications(medicationEvents)
    } catch (error) {
      console.error("Error fetching medications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsCompleted = async (medicationId: string) => {
    try {
      const result = await updateEvent(medicationId, {
        completed: true,
      })

      if (result.success) {
        // Update local state
        setMedications((prev) => prev.map((med) => (med.id === medicationId ? { ...med, status: "completed" } : med)))

        toast({
          title: "Medication marked as given",
          description: "The medication has been marked as completed.",
        })
      } else {
        throw new Error(result.error || "Failed to update medication")
      }
    } catch (error) {
      console.error("Error updating medication:", error)
      toast({
        title: "Error",
        description: "Failed to mark medication as given. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (!selectedChild) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Medication Schedule</CardTitle>
          <CardDescription>Select a child to view their medication schedule</CardDescription>
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
        <CardTitle>Today's Medication Schedule</CardTitle>
        <CardDescription>Medications scheduled for {selectedChild.name} today</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-4 text-center">
            <p className="text-muted-foreground">Loading medications...</p>
          </div>
        ) : medications.length > 0 ? (
          <div className="space-y-4">
            {medications.map((medication, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  medication.status === "completed"
                    ? "bg-green-50 border-green-200"
                    : medication.status === "missed"
                      ? "bg-red-50 border-red-200"
                      : "bg-yellow-50 border-yellow-200"
                }`}
              >
                <div className="flex items-center space-x-4">
                  {medication.status === "completed" ? (
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="h-5 w-5 text-green-600" />
                    </div>
                  ) : medication.status === "missed" ? (
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-yellow-600" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium text-black">{medication.name}</h4>
                    <p className="text-sm text-muted-foreground ">
                      {medication.dosage} at {medication.time}
                    </p>
                  </div>
                </div>
                {medication.status === "pending" && (
                  <Button variant="outline" size="sm" onClick={() => markAsCompleted(medication.id)}>
                    Mark as Given
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-muted-foreground">No medications scheduled for today</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

