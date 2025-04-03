"use client"

import { useState, useEffect, useMemo } from "react"
import { addMonths, format, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval, subMonths } from "date-fns"

interface SleepEvent {
  id: string
  timestamp: string
  quality: string
  duration: number
  date: Date
}

interface SleepCalendarHeatmapProps {
  events: SleepEvent[]
  selectedChild?: any
  months?: number
}

export function SleepCalendarHeatmap({ events, selectedChild, months = 3 }: SleepCalendarHeatmapProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [sleepByDay, setSleepByDay] = useState<Record<string, number>>({})

  // Use useMemo to optimize the data transformation
  const processedEvents = useMemo(() => {
    if (!events || events.length === 0) return {}

    // Get the last 'months' months
    const endDate = new Date()
    const startDate = subMonths(endDate, months - 1)
    startDate.setDate(1)
    startDate.setHours(0, 0, 0, 0)

    // Filter events within date range
    const filteredEvents = events.filter((event) =>
      isWithinInterval(new Date(event.timestamp), {
        start: startDate,
        end: endDate,
      }),
    )

    // Group by day and sum durations
    const sleepData: Record<string, number> = {}

    filteredEvents.forEach((event) => {
      const dayKey = format(new Date(event.timestamp), "yyyy-MM-dd")
      sleepData[dayKey] = (sleepData[dayKey] || 0) + event.duration
    })

    // Convert minutes to hours with decimal precision
    Object.keys(sleepData).forEach((day) => {
      sleepData[day] = Number.parseFloat(sleepData[day].toFixed(1))
      // Ensure non-zero values for better visualization
      if (sleepData[day] < 0.1) sleepData[day] = 0.1
    })

    return sleepData
  }, [events, months])

  // Update sleepByDay when processedEvents changes
  useEffect(() => {
    setSleepByDay(processedEvents)
  }, [processedEvents])

  // Get days for the current month - memoize this calculation
  const daysInMonth = useMemo(() => {
    const firstDay = startOfMonth(currentMonth)
    const lastDay = endOfMonth(currentMonth)
    return eachDayOfInterval({ start: firstDay, end: lastDay })
  }, [currentMonth])

  // Get max sleep hours for color scaling
  const maxSleepHours = Math.max(...Object.values(sleepByDay), 12)

  // Function to get color intensity based on sleep hours
  const getColorIntensity = (hours: number) => {
    if (!hours) return "bg-muted/20"

    const intensity = Math.min(1, hours / maxSleepHours)

    // Return tailwind classes based on intensity
    if (intensity > 0.8) return "bg-primary"
    if (intensity > 0.6) return "bg-primary/80"
    if (intensity > 0.4) return "bg-primary/60"
    if (intensity > 0.2) return "bg-primary/40"
    return "bg-primary/20"
  }

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, -1))
  }

  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1))
  }

  // Get day of week names
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  // Get first day of month for empty cells calculation
  const firstDay = startOfMonth(currentMonth)
  const lastDay = endOfMonth(currentMonth)

  return (
    <div className="w-full h-full flex flex-col max-h-[500px] overflow-hidden">
      <div className="flex justify-between items-center mb-2">
        <button onClick={prevMonth} className="text-sm px-2 py-1 rounded hover:bg-muted" type="button">
          ← Prev
        </button>
        <h3 className="text-base font-medium">{format(currentMonth, "MMMM yyyy")}</h3>
        <button onClick={nextMonth} className="text-sm px-2 py-1 rounded hover:bg-muted" type="button">
          Next →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {/* Weekday headers */}
        {weekdays.map((day) => (
          <div key={day} className="text-xs text-center font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 overflow-y-auto flex-grow">
        {/* Empty cells for days before the first of the month */}
        {Array.from({ length: firstDay.getDay() }).map((_, i) => (
          <div key={`empty-start-${i}`} className="aspect-square"></div>
        ))}

        {/* Calendar days */}
        {daysInMonth.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd")
          const sleepHours = sleepByDay[dateKey] || 0

          return (
            <div
              key={dateKey}
              className="aspect-square relative flex flex-col items-center justify-center border rounded-sm"
            >
              <div className="text-xs absolute top-1 left-1 text-white">{format(day, "d")}</div>
              <div
                className={`absolute inset-0 m-1 rounded-sm ${getColorIntensity(sleepHours)}`}
                title={`${format(day, "MMM d")}: ${sleepHours.toFixed(1)} hours`}
              >
                {sleepHours > 0 && (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-xs font-medium text-white mix-blend-difference">{sleepHours.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Empty cells for days after the end of the month */}
        {Array.from({ length: (6 - lastDay.getDay()) % 7 }).map((_, i) => (
          <div key={`empty-end-${i}`} className="aspect-square"></div>
        ))}
      </div>

      <div className="mt-2">
        <div className="flex items-center justify-center gap-1">
          <div className="text-xs text-muted-foreground mr-1">Less</div>
          <div className="w-4 h-4 bg-muted/20 rounded-sm"></div>
          <div className="w-4 h-4 bg-primary/20 rounded-sm"></div>
          <div className="w-4 h-4 bg-primary/40 rounded-sm"></div>
          <div className="w-4 h-4 bg-primary/60 rounded-sm"></div>
          <div className="w-4 h-4 bg-primary/80 rounded-sm"></div>
          <div className="w-4 h-4 bg-primary rounded-sm"></div>
          <div className="text-xs text-muted-foreground ml-1">More</div>
        </div>
      </div>
    </div>
  )
}

