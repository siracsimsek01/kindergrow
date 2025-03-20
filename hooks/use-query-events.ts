"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

interface Event {
  id: string
  childId: string
  parentId: string
  eventType: string
  startTime?: string
  endTime?: string
  details?: string
  value?: number
  timestamp: string
  createdAt: string
  updatedAt: string
  _id?: string
}

interface FetchEventsParams {
  childId: string
  eventType?: string
  startDate?: string
  endDate?: string
  limit?: number
}

export function useQueryEvents(params: FetchEventsParams) {
  const queryClient = useQueryClient()
  const queryKey = ["events", params]

  // Build the query URL
  const buildQueryUrl = () => {
    let url = `/api/events?childId=${params.childId}`
    if (params.eventType) url += `&eventType=${params.eventType}`
    if (params.startDate) url += `&startDate=${params.startDate}`
    if (params.endDate) url += `&endDate=${params.endDate}`
    if (params.limit) url += `&limit=${params.limit}`
    return url
  }

  // Fetch events
  const {
    data: events = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Event[]>({
    queryKey,
    queryFn: async () => {
      const response = await fetch(buildQueryUrl())
      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status} ${response.statusText}`)
      }
      return response.json()
    },
    enabled: !!params.childId, // Only run the query if childId is provided
  })

  // Add an event
  const addEventMutation = useMutation({
    mutationFn: async (eventData: Partial<Event>) => {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      })

      if (!response.ok) {
        throw new Error(`Failed to add event: ${response.status} ${response.statusText}`)
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch the events query
      queryClient.invalidateQueries({ queryKey: ["events"] })
    },
  })

  // Update an event
  const updateEventMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Event> }) => {
      const response = await fetch(`/api/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`Failed to update event: ${response.status} ${response.statusText}`)
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch the events query
      queryClient.invalidateQueries({ queryKey: ["events"] })
    },
  })

  // Delete an event
  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/events/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`Failed to delete event: ${response.status} ${response.statusText}`)
      }

      return id
    },
    onSuccess: () => {
      // Invalidate and refetch the events query
      queryClient.invalidateQueries({ queryKey: ["events"] })
    },
  })

  return {
    events,
    isLoading,
    error,
    refetch,
    addEvent: addEventMutation.mutate,
    updateEvent: updateEventMutation.mutate,
    deleteEvent: deleteEventMutation.mutate,
    isAddingEvent: addEventMutation.isPending,
    isUpdatingEvent: updateEventMutation.isPending,
    isDeletingEvent: deleteEventMutation.isPending,
  }
}

