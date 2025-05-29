import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { getSafeTimestamp } from '@/lib/date-utils'

export interface Event {
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

interface EventsState {
  items: Event[]
  loading: boolean
  error: string | null
  lastUpdated: number
}

const initialState: EventsState = {
  items: [],
  loading: false,
  error: null,
  lastUpdated: getSafeTimestamp(),
}

export const fetchEvents = createAsyncThunk(
  "events/fetchEvents",
  async (
    params: { childId: string; eventType?: string; startDate?: string; endDate?: string; limit?: number },
    { rejectWithValue },
  ) => {
    try {
      let url = `/api/events?childId=${params.childId}`
      if (params.eventType) url += `&eventType=${params.eventType}`
      if (params.startDate) url += `&startDate=${params.startDate}`
      if (params.endDate) url += `&endDate=${params.endDate}`
      if (params.limit) url += `&limit=${params.limit}`

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error("Failed to fetch events")
      }
      return await response.json()
    } catch (error) {
      return rejectWithValue(error.message)
    }
  },
)

export const addEventAsync = createAsyncThunk(
  "events/addEvent",
  async (eventData: Partial<Event>, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      })
      if (!response.ok) {
        throw new Error("Failed to add event")
      }
      return await response.json()
    } catch (error) {
      return rejectWithValue(error.message)
    }
  },
)

export const updateEventAsync = createAsyncThunk(
  "events/updateEvent",
  async ({ id, data }: { id: string; data: Partial<Event> }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        throw new Error("Failed to update event")
      }
      return await response.json()
    } catch (error) {
      return rejectWithValue(error.message)
    }
  },
)

export const deleteEventAsync = createAsyncThunk("events/deleteEvent", async (id: string, { rejectWithValue }) => {
  try {
    const response = await fetch(`/api/events/${id}`, {
      method: "DELETE",
    })
    if (!response.ok) {
      throw new Error("Failed to delete event")
    }
    return id
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

const eventsSlice = createSlice({
  name: "events",
  initialState,
  reducers: {
    triggerRefresh: (state) => {
      state.lastUpdated = Date.now()
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(addEventAsync.fulfilled, (state, action) => {
        state.items.push(action.payload)
        state.lastUpdated = Date.now()
      })
      .addCase(updateEventAsync.fulfilled, (state, action) => {
        const index = state.items.findIndex((event) => event.id === action.payload.id)
        if (index !== -1) {
          state.items[index] = action.payload
        }
        state.lastUpdated = Date.now()
      })
      .addCase(deleteEventAsync.fulfilled, (state, action) => {
        state.items = state.items.filter((event) => event.id !== action.payload)
        state.lastUpdated = Date.now()
      })
  },
})

export const { triggerRefresh } = eventsSlice.actions
export default eventsSlice.reducer

