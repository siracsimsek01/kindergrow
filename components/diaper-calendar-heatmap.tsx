"use client"

import { useState, useEffect } from "react"
import { format, subMonths, eachDayOfInterval, isSameDay } from "date-fns"

interface DiaperEvent {
  id: string
  timestamp: string
  type: string
  date: Date
}

interface DiaperCalendarHeatmapProps {
  events: DiaperEvent[]
  selectedChild?: any
}

export function DiaperCalendarHeatmap({ events, selectedChild }: DiaperCalendarHeatmapProps) {
  const [heatmapData, setHeatmapData] = useState<any[]>([])
  const [maxCount, setMaxCount] = useState(0)

  useEffect(() => {
    if (!events || events.length === 0) {
      setHeatmapData([])
      return
    }

    // Get date range for the last 3 months
    const endDate = new Date()
    const startDate = subMonths(endDate, 3)

    // Get all days in the range
    const days = eachDayOfInterval({ start: startDate, end: endDate })

    // Count events for each day
    const dailyCounts = days.map((day) => {
      const dayEvents = events.filter((event) => isSameDay(new Date(event.timestamp), day))

      // Count by type
      const wetCount = dayEvents.filter((e) => e.type === "Wet").length
      const dirtyCount = dayEvents.filter((e) => e.type === "Dirty").length
      const mixedCount = dayEvents.filter((e) => e.type === "Mixed").length
      const dryCount = dayEvents.filter((e) => e.type === "Dry").length

      return {
        date: day,
        formattedDate: format(day, "yyyy-MM-dd"),
        displayDate: format(day, "MMM d"),
        count: dayEvents.length,
        wet: wetCount,
        dirty: dirtyCount,
        mixed: mixedCount,
        dry: dryCount,
        month: format(day, "MMM"),
      }
    })

    // Find the maximum count for color scaling
    const max = Math.max(...dailyCounts.map((d) => d.count))
    setMaxCount(max)

    // Group by month for display
    const months: Record<string, any[]> = {}
    dailyCounts.forEach((day) => {
      const monthKey = format(day.date, "yyyy-MM")
      if (!months[monthKey]) {
        months[monthKey] = []
      }
      months[monthKey].push(day)
    })

    // Convert to array for rendering
    const monthsArray = Object.keys(months).map((key) => ({
      month: months[key][0].month,
      year: format(months[key][0].date, "yyyy"),
      days: months[key],
    }))

    setHeatmapData(monthsArray)
  }, [events])

  // Get color based on count
  const getColor = (count: number) => {
    if (count === 0) return "bg-muted/30"

    const intensity = Math.min(1, count / (maxCount || 1))

    // Blue color scale with increasing intensity
    return `rgb(59, 130, 246, ${0.2 + intensity * 0.8})`
  }

  // Tooltip content
  const getTooltipContent = (day: any) => {
    if (day.count === 0) return "No diaper changes"

    return `
      ${day.displayDate}: ${day.count} changes
      ${day.wet > 0 ? `\n💧 Wet: ${day.wet}` : ""}
      ${day.dirty > 0 ? `\n💩 Dirty: ${day.dirty}` : ""}
      ${day.mixed > 0 ? `\n🔄 Mixed: ${day.mixed}` : ""}
      ${day.dry > 0 ? `\n✅ Dry: ${day.dry}` : ""}
    `
  }

  if (!events || events.length === 0 || heatmapData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No diaper data available</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full overflow-auto">
      <div className="space-y-6 p-2">
        {heatmapData.map((month, monthIndex) => (
          <div key={`${month.year}-${month.month}`} className="space-y-2">
            <h3 className="text-sm font-medium">
              {month.month} {month.year}
            </h3>
            <div className="grid grid-cols-7 gap-1">
              {/* Day labels */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="h-6 text-xs text-center text-muted-foreground">
                  {day}
                </div>
              ))}

              {/* Empty cells for proper alignment */}
              {Array.from({ length: new Date(month.days[0].date).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="h-8"></div>
              ))}

              {/* Day cells */}
              {month.days.map((day: any) => (
                <div
                  key={day.formattedDate}
                  className="h-8 rounded-sm flex items-center justify-center text-xs relative group"
                  style={{ backgroundColor: getColor(day.count) }}
                  title={getTooltipContent(day)}
                >
                  <span className={day.count > 0 ? "font-medium" : "text-muted-foreground"}>
                    {format(day.date, "d")}
                  </span>

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-36 bg-card border border-border rounded-md p-2 text-xs shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-10">
                    <div className="font-medium mb-1">{day.displayDate}</div>
                    {day.count === 0 ? (
                      <div className="text-muted-foreground">No diaper changes</div>
                    ) : (
                      <>
                        <div className="font-medium">{day.count} changes</div>
                        {day.wet > 0 && (
                          <div className="flex justify-between">
                            <span>💧 Wet:</span> <span>{day.wet}</span>
                          </div>
                        )}
                        {day.dirty > 0 && (
                          <div className="flex justify-between">
                            <span>💩 Dirty:</span> <span>{day.dirty}</span>
                          </div>
                        )}
                        {day.mixed > 0 && (
                          <div className="flex justify-between">
                            <span>🔄 Mixed:</span> <span>{day.mixed}</span>
                          </div>
                        )}
                        {day.dry > 0 && (
                          <div className="flex justify-between">
                            <span>✅ Dry:</span> <span>{day.dry}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

