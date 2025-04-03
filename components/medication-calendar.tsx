"use client"

import { useState, useEffect } from "react"
import { format, subDays, subMonths, subYears, eachDayOfInterval, isSameDay } from "date-fns"
import { Pill, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface MedicationCalendarProps {
  medications: any[]
  administrations: any[]
  timeFrame: "week" | "month" | "3months" | "year"
  onLogDose: (medicationId: string) => void
}

export function MedicationCalendar({ medications, administrations, timeFrame, onLogDose }: MedicationCalendarProps) {
  const [calendarDays, setCalendarDays] = useState<Date[]>([])
  const [medicationSchedule, setMedicationSchedule] = useState<any[]>([])

  // Generate calendar days based on timeFrame
  useEffect(() => {
    const today = new Date()
    let startDate: Date

    switch (timeFrame) {
      case "week":
        startDate = subDays(today, 6)
        break
      case "month":
        startDate = subDays(today, 29)
        break
      case "3months":
        startDate = subMonths(today, 3)
        break
      case "year":
        startDate = subYears(today, 1)
        break
      default:
        startDate = subDays(today, 6)
    }

    const days = eachDayOfInterval({ start: startDate, end: today })
    setCalendarDays(days)
  }, [timeFrame])

  // Generate medication schedule
  useEffect(() => {
    if (calendarDays.length === 0 || medications.length === 0) return

    const activeMedications = medications.filter(
      (med) =>
        med.status === "active" ||
        (med.status === "completed" && med.endDate && new Date(med.endDate) >= calendarDays[0]),
    )

    const schedule = activeMedications.map((medication) => {
      const startDate = new Date(medication.startDate)
      const endDate = medication.endDate ? new Date(medication.endDate) : new Date(2099, 11, 31) // Far future date

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
        return <Pill className="h-3 w-3" />
      default:
        return null
    }
  }

  // Format date based on timeFrame
  const formatDate = (date: Date) => {
    if (timeFrame === "week" || timeFrame === "month") {
      return format(date, "MMM d")
    } else {
      return format(date, "MMM d, yyyy")
    }
  }

  if (calendarDays.length === 0 || medicationSchedule.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No active medications to display</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      <div className="min-w-[800px]">
        {/* Header row with dates */}
        <div className="grid grid-cols-[200px_1fr] border-b">
          <div className="p-2 font-medium">Medication</div>
          <div className="grid grid-flow-col auto-cols-fr">
            {calendarDays.map((day, index) => (
              <div
                key={day.toISOString()}
                className={cn(
                  "p-2 text-center text-sm border-l",
                  isSameDay(day, new Date()) && "bg-primary/10 font-medium",
                )}
              >
                {formatDate(day)}
              </div>
            ))}
          </div>
        </div>

        {/* Medication rows */}
        {medicationSchedule.map((medication) => (
          <div key={medication.id} className="grid grid-cols-[200px_1fr] border-b hover:bg-muted/30">
            <div className="p-2 flex flex-col">
              <span className="font-medium">{medication.medicationName}</span>
              <span className="text-xs text-muted-foreground">{medication.dosage}</span>
            </div>
            <div className="grid grid-flow-col auto-cols-fr">
              {medication.dailySchedule.map((day, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-2 flex justify-center items-center border-l",
                    isSameDay(day.date, new Date()) && "bg-primary/10",
                  )}
                >
                  {day.status !== "none" && (
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center cursor-pointer",
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
        ))}
      </div>
    </div>
  )
}

