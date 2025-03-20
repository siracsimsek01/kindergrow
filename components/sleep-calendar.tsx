"use client"

import { useState, useEffect } from "react"
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useAppSelector } from "@/lib/redux/hooks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { GraphLoader } from "@/components/ui/graph-loader"
import { useQueryEvents } from "@/hooks/use-query-events"

export function SleepCalendar() {
  const selectedChild = useAppSelector((state) => state.children.selectedChild)
  const [date, setDate] = useState<Date>(new Date())
  const [calendarDays, setCalendarDays] = useState<any[]>([])

  const { data: sleepEvents, isLoading } = useQueryEvents({
    childId: selectedChild?.id,
    eventType: "sleeping",
    startDate: startOfMonth(date),
    endDate: endOfMonth(date),
  })

  useEffect(() => {
    if (sleepEvents && sleepEvents.length > 0) {
      const days = eachDayOfInterval({
        start: startOfMonth(date),
        end: endOfMonth(date),
      })

      const daysWithEvents = days.map((day) => {
        const dayEvents = sleepEvents.filter((event) => {
          const eventDate = parseISO(event.timestamp)
          return isSameDay(eventDate, day)
        })

        return {
          date: day,
          events: dayEvents,
          totalHours: dayEvents.reduce((total, event) => {
            const startTime = parseISO(event.timestamp)
            const endTime = event.endTimestamp ? parseISO(event.endTimestamp) : startTime
            const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
            return total + durationHours
          }, 0),
        }
      })

      setCalendarDays(daysWithEvents)
    }
  }, [sleepEvents, date])

  if (!selectedChild) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground">Select a child to view sleep calendar</p>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Sleep Calendar</CardTitle>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2 cursor-pointer">
              <CalendarIcon className="h-4 w-4" />
              {format(date, "MMMM yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-[9999]" align="end">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => newDate && setDate(newDate)}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <GraphLoader message="Loading sleep calendar..." />
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center font-medium py-2">
                {day}
              </div>
            ))}
            {calendarDays.map((day, i) => {
              const hasEvents = day.events.length > 0
              const colorClass = hasEvents
                ? day.totalHours >= 10
                  ? "bg-green-100 dark:bg-green-900"
                  : day.totalHours >= 7
                    ? "bg-yellow-100 dark:bg-yellow-900"
                    : "bg-red-100 dark:bg-red-900"
                : ""

              return (
                <div
                  key={i}
                  className={cn(
                    "aspect-square p-1 border rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50",
                    colorClass,
                  )}
                >
                  <span className="text-sm font-medium">{format(day.date, "d")}</span>
                  {hasEvents && (
                    <span className="text-xs mt-1">
                      {day.totalHours.toFixed(1)}h ({day.events.length})
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

