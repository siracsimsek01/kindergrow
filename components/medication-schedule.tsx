"use client"

import { useState, useEffect } from "react"
import { format, isSameDay, addDays } from "date-fns"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Check, X, AlertTriangle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface MedicationScheduleProps {
  medications: any[]
  administrations: any[]
  onLogDose: (medicationId: string) => void
  expanded?: boolean
}

export function MedicationSchedule({
  medications,
  administrations,
  onLogDose,
  expanded = false,
}: MedicationScheduleProps) {
  const [today, setToday] = useState(new Date())
  const [tomorrow, setTomorrow] = useState(addDays(new Date(), 1))
  const [schedule, setSchedule] = useState<any[]>([])

  // Generate schedule for today and tomorrow
  useEffect(() => {
    if (medications.length === 0) return

    // Group medications by time of day
    const timeGroups: Record<string, any[]> = {}

    medications.forEach((medication) => {
      // Skip if no time of day specified
      if (!medication.timeOfDay || medication.timeOfDay.length === 0) {
        if (!timeGroups["Unspecified"]) {
          timeGroups["Unspecified"] = []
        }
        timeGroups["Unspecified"].push({
          ...medication,
          day: "today",
          status: "scheduled",
        })
        return
      }

      // Add to each time of day group
      medication.timeOfDay.forEach((time: string) => {
        if (!timeGroups[time]) {
          timeGroups[time] = []
        }

        // Check if medication was taken today
        const todayAdministrations = administrations.filter(
          (admin) => admin.medicationId === medication.id && isSameDay(new Date(admin.timestamp), today),
        )

        let todayStatus = "scheduled"
        if (todayAdministrations.length > 0) {
          todayStatus = todayAdministrations.some((admin) => admin.skipped) ? "skipped" : "taken"
        }

        // Add today's schedule
        timeGroups[time].push({
          ...medication,
          day: "today",
          status: todayStatus,
          administrations: todayAdministrations,
        })

        // Add tomorrow's schedule
        timeGroups[time].push({
          ...medication,
          day: "tomorrow",
          status: "scheduled",
          administrations: [],
        })
      })
    })

    // Convert to array and sort by time of day
    const timeOrder = [
      "Morning",
      "Breakfast",
      "Before Breakfast",
      "After Breakfast",
      "Noon",
      "Lunch",
      "Before Lunch",
      "After Lunch",
      "Afternoon",
      "Evening",
      "Dinner",
      "Before Dinner",
      "After Dinner",
      "Bedtime",
      "Night",
      "As needed",
      "Unspecified",
    ]

    const sortedSchedule = Object.entries(timeGroups)
      .sort(([timeA], [timeB]) => {
        const indexA = timeOrder.indexOf(timeA)
        const indexB = timeOrder.indexOf(timeB)
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB)
      })
      .map(([time, meds]) => ({
        time,
        medications: meds,
      }))

    setSchedule(sortedSchedule)
  }, [medications, administrations, today, tomorrow])

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "taken":
        return "bg-green-500/20 border-green-500/30 text-green-500"
      case "skipped":
        return "bg-red-500/20 border-red-500/30 text-red-500"
      case "scheduled":
        return "bg-blue-500/20 border-blue-500/30 text-blue-500"
      default:
        return "bg-transparent border-transparent text-transparent"
    }
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "taken":
        return <Check className="h-4 w-4" />
      case "skipped":
        return <X className="h-4 w-4" />
      case "scheduled":
        return <Clock className="h-4 w-4" />
      default:
        return null
    }
  }

  if (schedule.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No active medications to display</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto pr-2">
      <div className="space-y-6">
        {schedule.map((timeGroup) => (
          <div key={timeGroup.time} className="space-y-2">
            <h3 className="text-sm font-medium">{timeGroup.time}</h3>
            <div className="grid gap-2">
              {timeGroup.medications
                .filter((med: any) => expanded || med.day === "today")
                .map((medication: any, index: number) => (
                  <Card key={`${medication.id}-${medication.day}-${index}`} className="overflow-hidden">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center",
                              getStatusColor(medication.status),
                            )}
                          >
                            {getStatusIcon(medication.status)}
                          </div>
                          <div>
                            <div className="flex items-center">
                              <p className="font-medium">{medication.medicationName}</p>
                              <Badge variant="outline" className="ml-2 text-xs">
                                {medication.dosage}
                              </Badge>
                              {medication.day === "tomorrow" && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  Tomorrow
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{medication.instructions}</p>
                            {medication.administrations && medication.administrations.length > 0 && (
                              <div className="mt-1">
                                {medication.administrations.map((admin: any) => (
                                  <div key={admin.id} className="text-xs">
                                    <span className="text-muted-foreground">
                                      {format(new Date(admin.timestamp), "h:mm a")}:
                                    </span>
                                    <span className={admin.skipped ? "text-red-500" : "text-green-500"}>
                                      {" "}
                                      {admin.skipped ? "Skipped" : "Taken"}
                                    </span>
                                    {admin.sideEffects && (
                                      <span className="flex items-center text-amber-500 mt-1">
                                        <AlertTriangle className="h-3 w-3 mr-1" /> {admin.sideEffects}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        {medication.status === "scheduled" && (
                          <Button size="sm" onClick={() => onLogDose(medication.id)} className="h-8">
                            Log Dose
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

