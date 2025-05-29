"use client"

import { useEffect, useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { useChildContext } from "@/contexts/child-context"
import { format } from "date-fns"

export function DashboardCalendar() {
  const { children, selectedChild } = useChildContext()
  const [events, setEvents] = useState([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [isLoading, setIsLoading] = useState(false)
  const [dateEvents, setDateEvents] = useState([])

  useEffect(() => {
    if (children.length > 0) {
      fetchAllEvents()
    }
  }, [children])

  useEffect(() => {
    if (selectedDate && events.length > 0) {
      const formattedDate = format(selectedDate, "yyyy-MM-dd")
      const filteredEvents = events.filter((event) => {
        const eventDate = format(new Date(event.timestamp), "yyyy-MM-dd")
        return eventDate === formattedDate
      })
      setDateEvents(filteredEvents)
    } else {
      setDateEvents([])
    }
  }, [selectedDate, events])

  const fetchAllEvents = async () => {
    try {
      setIsLoading(true)

      // Fetch events for all children
      const eventPromises = children.map(async (child) => {
        const response = await fetch(`/api/children/${child.id}/events`})
        if (!response.ok) {
          throw new Error(`Failed to fetch events for child ${child.id}`)
        }
        const childEvents = await response.json()

        // Add child name to each event
        return childEvents.map((event) => ({
          ...event,
          childName: child.name,
        }))
      })

      const allEvents = await Promise.all(eventPromises)
      setEvents(allEvents.flat())
    } catch (error) {
      console.error("Error fetching events:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Function to get dates with events for highlighting in the calendar
  const getDatesWithEvents = () => {
    const dates = events.map((event) => {
      const date = new Date(event.timestamp)
      return format(date, "yyyy-MM-dd")
    })

    // Remove duplicates
    return [...new Set(dates)].map((dateStr) => new Date(dateStr))
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
        <div className="rounded-md border p-4">
          <h3 className="font-medium mb-2">
            Events for {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "selected date"}
          </h3>
          {isLoading ? (
            <p className="text-muted-foreground">Loading events...</p>
          ) : dateEvents.length > 0 ? (
            <ul className="space-y-2">
              {dateEvents.map((event, index) => (
                <li key={index} className="text-sm border-b pb-2">
                  <div className="font-medium">
                    {event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1)}
                  </div>
                  <div className="text-muted-foreground">
                    {event.childName} • {format(new Date(event.timestamp), "h:mm a")}
                  </div>
                  {event.details && <div className="mt-1">{event.details}</div>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No events for this date</p>
          )}
        </div>
      </div>
    </div>
  )
}

