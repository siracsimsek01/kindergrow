"use client"

import { useState, useEffect } from "react"
import { format, isSameDay, addDays, subDays, subMonths, subYears, eachDayOfInterval } from "date-fns"
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
  timeFrame?: "week" | "month" | "3months" | "year"
}

export function MedicationSchedule({
  medications,
  administrations,
  onLogDose,
  expanded = false,
  timeFrame = "week",
}: MedicationScheduleProps) {
  const [today, setToday] = useState(new Date())
  const [calendarDays, setCalendarDays] = useState<Date[]>([])
  const [medicationSchedule, setMedicationSchedule] = useState<any[]>([])

  // Generate calendar days based on timeFrame
  useEffect(() => {
    const currentDate = new Date()
    let startDate: Date

    switch (timeFrame) {
      case "week":
        startDate = subDays(currentDate, 6)
        break
      case "month":
        startDate = subDays(currentDate, 29)
        break
      case "3months":
        startDate = subMonths(currentDate, 3)
        break
      case "year":
        startDate = subYears(currentDate, 1)
        break
      default:
        startDate = subDays(currentDate, 6)
    }

    const days = eachDayOfInterval({ start: startDate, end: currentDate })
    setCalendarDays(days)
  }, [timeFrame])

  // Generate medication schedule based on calendar days
  useEffect(() => {
    if (calendarDays.length === 0 || medications.length === 0) return

    const activeMedications = medications.filter(
      (med) =>
        med.status === "active" ||
        (med.status === "completed" && med.endDate && new Date(med.endDate) >= calendarDays[0]),
    )

    const schedule = activeMedications.map((medication) => {
      const startDate = new Date(medication.startDate)
      const endDate = medication.endDate ? new Date(medication.endDate) : new Date(2099, 11, 31)

      // For each day in the calendar, determine if this medication should be taken
      const dailySchedule = calendarDays.map((day) => {
        // Check if the day is within the medication's date range
        const isInDateRange = day >= startDate && day <= endDate

        // Find administrations for this medication on this day
        const dayAdministrations = administrations.filter(
          (admin) => admin.medicationId === medication.id && isSameDay(new Date(admin.timestamp), day),
        )

        // Determine status for this day
        let status = "none" // Default: not scheduled

        if (isInDateRange) {
          status = "scheduled" // Scheduled but not taken

          if (dayAdministrations.length > 0) {
            // If any administration was skipped, mark as skipped
            if (dayAdministrations.some((admin) => admin.skipped)) {
              status = "skipped"
            } else {
              status = "taken"
            }
          }
        }

        return {
          date: day,
          status,
          administrations: dayAdministrations,
        }
      })

      return {
        ...medication,
        dailySchedule,
      }
    })

    setMedicationSchedule(schedule)
  }, [calendarDays, medications, administrations])

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
        return <Check className="h-3 w-3" />
      case "skipped":
        return <X className="h-3 w-3" />
      case "scheduled":
        return <Clock className="h-3 w-3" />
      default:
        return null
    }
  }

  // Format date based on timeFrame
  const formatDate = (date: Date) => {
    if (timeFrame === "week" || timeFrame === "month") {
      return format(date, "MMM d")
    } else if (timeFrame === "3months") {
      return format(date, "MMM d")
    } else {
      return format(date, "MMM d, yy")
    }
  }

  if (calendarDays.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading medication schedule...</p>
      </div>
    )
  }

  if (medications.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No active medications to display</p>
      </div>
    )
  }

  if (medicationSchedule.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No active medications for the selected time period</p>
      </div>
    )
  }

  // For short time periods (week), use the original vertical layout
  if (timeFrame === "week") {
    // Group medications by time of day for today only
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

        // Add tomorrow's schedule if expanded
        if (expanded) {
          timeGroups[time].push({
            ...medication,
            day: "tomorrow",
            status: "scheduled",
            administrations: [],
          })
        }
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

    return (
      <div className="h-full overflow-auto pr-2">
        <div className="space-y-6">
          {sortedSchedule.map((timeGroup) => (
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

  // For longer time periods, use horizontal scrolling calendar layout
  return (
    <div className="h-full overflow-auto">
      <div className="min-w-full">
        {/* Header row with dates */}
        <div className={cn(
          "grid border-b sticky top-0 bg-background z-10",
          timeFrame === "month" ? "grid-cols-[200px_1fr]" : "grid-cols-[250px_1fr]"
        )}>
          <div className="p-3 font-medium border-r">Medication</div>
          <div className="overflow-x-auto">
            <div className={cn(
              "grid gap-0",
              timeFrame === "year" ? "grid-flow-col auto-cols-[80px]" : 
              timeFrame === "3months" ? "grid-flow-col auto-cols-[60px]" :
              "grid-flow-col auto-cols-[50px]"
            )}>
              {calendarDays.map((day, index) => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "p-2 text-center text-xs border-l",
                    isSameDay(day, new Date()) && "bg-primary/10 font-medium",
                  )}
                >
                  {formatDate(day)}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Medication rows */}
        {medicationSchedule.map((medication) => (
          <div key={medication.id} className={cn(
            "grid border-b hover:bg-muted/30",
            timeFrame === "month" ? "grid-cols-[200px_1fr]" : "grid-cols-[250px_1fr]"
          )}>
            <div className="p-3 flex flex-col border-r">
              <span className="font-medium text-sm">{medication.medicationName}</span>
              <span className="text-xs text-muted-foreground">{medication.dosage}</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {medication.timeOfDay?.map((time: string) => (
                  <Badge key={time} variant="outline" className="text-xs">
                    {time}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <div className={cn(
                "grid gap-0",
                timeFrame === "year" ? "grid-flow-col auto-cols-[80px]" : 
                timeFrame === "3months" ? "grid-flow-col auto-cols-[60px]" :
                "grid-flow-col auto-cols-[50px]"
              )}>
                {medication.dailySchedule.map((day: any, index: number) => (
                  <div
                    key={index}
                    className={cn(
                      "p-2 flex justify-center items-center border-l min-h-[50px]",
                      isSameDay(day.date, new Date()) && "bg-primary/10",
                    )}
                  >
                    {day.status !== "none" && (
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-colors",
                          getStatusColor(day.status),
                        )}
                        onClick={() => onLogDose(medication.id)}
                        title={`${medication.medicationName} - ${format(day.date, "MMM d, yyyy")}`}
                      >
                        {getStatusIcon(day.status)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

