"use client"

import { useEffect, useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { useChildContext } from "@/contexts/child-context"
import { format, parseISO } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"

interface FeedingEvent {
  id: string
  type: string
  amount: string
  startTime: string
  endTime: string
  timestamp: string
  details: string
}

export function FeedingCalendar() {
  const { selectedChild } = useChildContext()
  const [events, setEvents] = useState<FeedingEvent[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [isLoading, setIsLoading] = useState(false)
  const [dateEvents, setDateEvents] = useState<FeedingEvent[]>([])

  useEffect(() => {
    if (selectedChild) {
      fetchFeedingEvents()
    } else {
      setEvents([])
    }
  }, [selectedChild])

  useEffect(() => {
    if (selectedDate && events.length > 0) {
      const formattedDate = format(selectedDate, "yyyy-MM-dd")
      const filteredEvents = events.filter((event) => {
        const eventDate = format(parseISO(event.timestamp), "yyyy-MM-dd")
        return eventDate === formattedDate
      })

      // Sort by time
      filteredEvents.sort((a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime())

      setDateEvents(filteredEvents)
    } else {
      setDateEvents([])
    }
  }, [selectedDate, events])

  const fetchFeedingEvents = async () => {
    if (!selectedChild) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/events?childId=${selectedChild.id}&eventType=feeding`)

      if (!response.ok) {
        throw new Error(`Failed to fetch feeding events: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      // Parse feeding details from events
      const feedingEvents = data.map((event) => {
        const details = event.details || ""
        const typeMatch = details.match(/Type: (.+)/)
        const amountMatch = details.match(/Amount: (.+)/)

        return {
          id: event.id,
          type: typeMatch ? typeMatch[1] : "Unknown",
          amount: amountMatch ? amountMatch[1] : "-",
          startTime: format(parseISO(event.startTime), "h:mm a"),
          endTime: format(parseISO(event.endTime || event.startTime), "h:mm a"),
          timestamp: event.startTime,
          details: event.details,
        }
      })

      setEvents(feedingEvents)
    } catch (error) {
      console.error("Error fetching feeding events:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Function to get dates with events for highlighting in the calendar
  const getDatesWithEvents = () => {
    const dates = events.map((event) => {
      const date = parseISO(event.timestamp)
      return format(date, "yyyy-MM-dd")
    })

    // Remove duplicates
    return [...new Set(dates)].map((dateStr) => new Date(dateStr))
  }

  if (!selectedChild) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground">Please select a child to view feeding calendar</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="md:w-1/2">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          className="rounded-md border"
          modifiers={{
            booked: getDatesWithEvents(),
          }}
          modifiersStyles={{
            booked: { fontWeight: "bold", backgroundColor: "hsl(var(--primary) / 0.1)" },
          }}
        />
      </div>
      <div className="md:w-1/2">
        <Card className="h-full">
          <CardContent className="p-4">
            <h3 className="font-medium mb-4">
              Feedings for {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "selected date"}
            </h3>
            {isLoading ? (
              <p className="text-muted-foreground">Loading events...</p>
            ) : dateEvents.length > 0 ? (
              <ul className="space-y-3">
                {dateEvents.map((event, index) => (
                  <li key={index} className="border-b pb-2">
                    <div className="flex justify-between">
                      <span className="font-medium capitalize">{event.type}</span>
                      <span className="text-sm text-muted-foreground">{event.startTime}</span>
                    </div>
                    {event.amount !== "-" && <div className="text-sm">Amount: {event.amount}</div>}
                    <div className="text-sm text-muted-foreground">
                      Duration: {format(parseISO(event.timestamp), "h:mm a")} - {event.endTime}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No feedings recorded for this date</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

