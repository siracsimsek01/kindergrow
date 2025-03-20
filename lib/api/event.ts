import { apiClient } from "../api-client"
import type { Event } from "../types"

export async function getEvents(): Promise<Event[]> {
  const client = await apiClient()
  const response = await client.get<Event[]>("/events/getAll")
  return response.data
}

export async function addEvent(eventData: Omit<Event, "id">): Promise<Event> {
  const client = await apiClient()
  const response = await client.post("/events/add", eventData)
  return response.data
}

export async function updateEvent(eventData: Event): Promise<Event> {
  const client = await apiClient()
  const response = await client.put(`/events/update/${eventData.id}`, eventData)
  return response.data
}

export async function deleteEvent(eventId: string): Promise<void> {
  const client = await apiClient()
  await client.delete(`/events/delete/${eventId}`)
}

