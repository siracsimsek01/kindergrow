import type { SleepEntry, SleepFilters, SleepStats } from "@/lib/types"
import { toast } from "@/components/ui/use-toast"

// Base URL for API endpoints
const API_BASE_URL = "/api/children"

// Helper function to handle API errors
const handleApiError = (error: any, message: string) => {
  console.error(`${message}:`, error)
  toast({
    title: "Error",
    description: message,
    variant: "destructive",
  })
  throw error
}

// Get all sleep entries for a child
export async function getSleepEntries(childId: string, filters?: SleepFilters): Promise<SleepEntry[]> {
  try {
    let url = `${API_BASE_URL}/${childId}/sleep`

    // Add query parameters for filters
    if (filters) {
      const params = new URLSearchParams()

      if (filters.startDate) {
        params.append("startDate", filters.startDate.toISOString())
      }

      if (filters.endDate) {
        params.append("endDate", filters.endDate.toISOString())
      }

      if (filters.quality) {
        params.append("quality", filters.quality)
      }

      if (filters.minDuration) {
        params.append("minDuration", filters.minDuration.toString())
      }

      if (filters.maxDuration) {
        params.append("maxDuration", filters.maxDuration.toString())
      }

      if (params.toString()) {
        url += `?${params.toString()}`
      }
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const data = await response.json()

    // Modify the data transformation in the getSleepEntries function:

    // Convert string dates to Date objects and ensure non-zero durations
    return data.map((entry: any) => ({
      ...entry,
      startTime: new Date(entry.timestamp || Date.now()),
      endTime: new Date(new Date(entry.timestamp || Date.now()).getTime() + (entry.duration || 60) * 60000),
      // Ensure duration is at least 0.1 hours (6 minutes) for display purposes
      duration: Math.max(0.1, entry.duration || 0.1) * 60, // Convert to minutes
      quality: entry.quality || "Good",
      date: new Date(entry.timestamp || Date.now()),
    }))
  } catch (error) {
    return handleApiError(error, "Failed to fetch sleep entries")
  }
}

// Get a single sleep entry
export async function getSleepEntry(childId: string, sleepId: string): Promise<SleepEntry> {
  try {
    const response = await fetch(`${API_BASE_URL}/${childId}/sleep/${sleepId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const data = await response.json()

    // Convert string dates to Date objects
    return {
      ...data,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      // Ensure duration is a number and not zero
      duration: Math.max(1, data.duration || 1),
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    }
  } catch (error) {
    return handleApiError(error, "Failed to fetch sleep entry")
  }
}

// Create a new sleep entry
export async function createSleepEntry(
  childId: string,
  data: Omit<SleepEntry, "id" | "childId" | "duration" | "createdAt" | "updatedAt">,
): Promise<SleepEntry> {
  try {
    const response = await fetch(`${API_BASE_URL}/${childId}/sleep`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const responseData = await response.json()

    toast({
      title: "Success",
      description: "Sleep entry created successfully",
    })

    // Convert string dates to Date objects
    return {
      ...responseData,
      startTime: new Date(responseData.startTime),
      endTime: new Date(responseData.endTime),
      createdAt: new Date(responseData.createdAt),
      updatedAt: new Date(responseData.updatedAt),
    }
  } catch (error) {
    return handleApiError(error, "Failed to create sleep entry")
  }
}

// Update an existing sleep entry
export async function updateSleepEntry(
  childId: string,
  sleepId: string,
  data: Partial<Omit<SleepEntry, "id" | "childId" | "createdAt" | "updatedAt">>,
): Promise<SleepEntry> {
  try {
    const response = await fetch(`${API_BASE_URL}/${childId}/sleep/${sleepId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const responseData = await response.json()

    toast({
      title: "Success",
      description: "Sleep entry updated successfully",
    })

    // Convert string dates to Date objects
    return {
      ...responseData,
      startTime: new Date(responseData.startTime),
      endTime: new Date(responseData.endTime),
      createdAt: new Date(responseData.createdAt),
      updatedAt: new Date(responseData.updatedAt),
    }
  } catch (error) {
    return handleApiError(error, "Failed to update sleep entry")
  }
}

// Delete a sleep entry
export async function deleteSleepEntry(childId: string, sleepId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/${childId}/sleep/${sleepId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    toast({
      title: "Success",
      description: "Sleep entry deleted successfully",
    })
  } catch (error) {
    handleApiError(error, "Failed to delete sleep entry")
  }
}

// Get sleep statistics
export async function getSleepStats(childId: string, startDate?: Date, endDate?: Date): Promise<SleepStats> {
  try {
    let url = `${API_BASE_URL}/${childId}/sleep/stats`

    // Add query parameters for date range
    if (startDate || endDate) {
      const params = new URLSearchParams()

      if (startDate) {
        params.append("startDate", startDate.toISOString())
      }

      if (endDate) {
        params.append("endDate", endDate.toISOString())
      }

      url += `?${params.toString()}`
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const data = await response.json()

    // Ensure we have non-zero values for better UI display
    return {
      ...data,
      totalSleepTime: Math.max(1, data.totalSleepTime || 1),
      averageSleepDuration: Math.max(0.1, data.averageSleepDuration || 0.1),
      longestSleep: Math.max(0.1, data.longestSleep || 0.1),
      shortestSleep: Math.max(0.1, data.shortestSleep || 0.1),
    }
  } catch (error) {
    return handleApiError(error, "Failed to fetch sleep statistics")
  }
}

