"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"

export async function getTemperatureEntries(childId: string) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    // Verify child belongs to user
    const child = await prisma.child.findFirst({
      where: {
        id: childId,
        userId,
      },
    })

    if (!child) {
      throw new Error("Child not found or not authorized")
    }

    const entries = await prisma.event.findMany({
      where: {
        childId,
        eventType: "temperature",
      },
      orderBy: {
        timestamp: "desc",
      },
    })

    // Process events to extract temperature-specific data
    return entries.map((event) => {
      let details: { temperature?: number; method?: string; notes?: string } = {}
      try {
        details = JSON.parse(event.details || "{}") as typeof details
      } catch (e) {
        console.error("Error parsing temperature details:", e)
      }

      return {
        id: event.id,
        childId: event.childId,
        timestamp: event.timestamp,
        temperature: event.value || details.temperature,
        unit: event.unit || "°C",
        method: details.method,
        notes: event.notes || details.notes,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      }
    })
  } catch (error) {
    console.error("Error fetching temperature entries:", error)
    throw error
  }
}

export async function getTemperatureStats(childId: string) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    // Verify child belongs to user
    const child = await prisma.child.findFirst({
      where: {
        id: childId,
        userId,
      },
    })

    if (!child) {
      throw new Error("Child not found or not authorized")
    }

    const entries = await prisma.event.findMany({
      where: {
        childId,
        eventType: "temperature",
      },
      orderBy: {
        timestamp: "desc",
      },
    })

    if (entries.length === 0) {
      return {
        latestTemperature: null,
        averageTemperature: null,
        highestTemperature: null,
        lowestTemperature: null,
        hasFever: false,
      }
    }

    // Process entries to extract temperature data
    const processedEntries = entries.map((event) => {
      let details: { temperature?: number } = {}
      try {
        details = JSON.parse(event.details || "{}") as typeof details
      } catch (e) {
        console.error("Error parsing temperature details:", e)
      }

      return {
        id: event.id,
        timestamp: event.timestamp,
        temperature: event.value || details.temperature || 0,
      }
    })

    const latestTemperature = processedEntries[0].temperature
    const temperatures = processedEntries.map((entry) => entry.temperature)
    const averageTemperature = temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length
    const highestTemperature = Math.max(...temperatures)
    const lowestTemperature = Math.min(...temperatures)
    const hasFever = latestTemperature >= 38.0 // Consider 38°C or higher as fever

    return {
      latestTemperature,
      averageTemperature,
      highestTemperature,
      lowestTemperature,
      hasFever,
    }
  } catch (error) {
    console.error("Error fetching temperature stats:", error)
    throw error
  }
}

export async function addTemperatureEntry(formData: FormData) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    const childId = formData.get("childId") as string
    const temperature = formData.get("temperature") as string
    const unit = (formData.get("unit") as string) || "°C"
    const method = (formData.get("method") as string) || undefined
    const time = formData.get("time") as string
    const notes = (formData.get("notes") as string) || undefined

    if (!childId || !temperature || !time) {
      throw new Error("Missing required fields")
    }

    // Verify child belongs to user
    const child = await prisma.child.findFirst({
      where: {
        id: childId,
        userId,
      },
    })

    if (!child) {
      throw new Error("Child not found or not authorized")
    }

    const timestamp = new Date(time)
    const temperatureValue = Number.parseFloat(temperature)

    // Create temperature event
    const event = await prisma.event.create({
      data: {
        childId,
        eventType: "temperature",
        timestamp,
        details: JSON.stringify({
          temperature: temperatureValue,
          unit,
          method,
          notes,
        }),
        value: temperatureValue,
        unit,
        notes,
      },
    })

    revalidatePath("/dashboard/temperature")

    return { success: true, id: event.id }
  } catch (error) {
    console.error("Error adding temperature entry:", error)
    throw error
  }
}

export async function updateTemperatureEntry(id: string, formData: FormData) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    const temperature = formData.get("temperature") as string
    const unit = (formData.get("unit") as string) || "°C"
    const method = (formData.get("method") as string) || undefined
    const time = formData.get("time") as string
    const notes = (formData.get("notes") as string) || undefined

    // Get the event to verify ownership
    const event = await prisma.event.findUnique({
      where: { id },
      include: { child: true },
    })

    if (!event) {
      throw new Error("Temperature entry not found")
    }

    // Verify child belongs to user
    if (event.child.userId !== userId) {
      throw new Error("Not authorized to update this entry")
    }

    const timestamp = time ? new Date(time) : undefined
    const temperatureValue = temperature ? Number.parseFloat(temperature) : null

    // Parse existing details
    let details = {}
    try {
      details = JSON.parse(event.details || "{}")
    } catch (e) {
      console.error("Error parsing temperature details:", e)
    }

    // Update details
    const updatedDetails = {
      ...details,
      ...(temperatureValue !== null && { temperature: temperatureValue }),
      ...(unit && { unit }),
      ...(method !== undefined && { method }),
      ...(notes !== undefined && { notes }),
    }

    // Update event
    await prisma.event.update({
      where: { id },
      data: {
        ...(timestamp && { timestamp }),
        details: JSON.stringify(updatedDetails),
        ...(temperatureValue !== null && { value: temperatureValue }),
        ...(unit && { unit }),
        ...(notes !== undefined && { notes }),
      },
    })

    revalidatePath("/dashboard/temperature")

    return { success: true }
  } catch (error) {
    console.error("Error updating temperature entry:", error)
    throw error
  }
}

export async function deleteTemperatureEntry(id: string) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    // Get the event to verify ownership
    const event = await prisma.event.findUnique({
      where: { id },
      include: { child: true },
    })

    if (!event) {
      throw new Error("Temperature entry not found")
    }

    // Verify child belongs to user
    if (event.child.userId !== userId) {
      throw new Error("Not authorized to delete this entry")
    }

    // Delete the event
    await prisma.event.delete({
      where: { id },
    })

    revalidatePath("/dashboard/temperature")

    return { success: true }
  } catch (error) {
    console.error("Error deleting temperature entry:", error)
    throw error
  }
}
