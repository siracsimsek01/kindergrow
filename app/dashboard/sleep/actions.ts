"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"

export async function getSleepEntries(childId: string) {
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
        eventType: "sleeping",
      },
      orderBy: {
        timestamp: "desc",
      },
    })

    // Process events to extract sleep-specific data
    return entries.map((event) => {
      let details: {
        startTime?: Date;
        endTime?: Date;
        duration?: number;
        quality?: string;
        location?: string;
        notes?: string;
      } = {}
      try {
        details = JSON.parse(event.details || "{}") as typeof details
      } catch (e) {
        console.error("Error parsing sleep details:", e)
      }

      return {
        id: event.id,
        childId: event.childId,
        timestamp: event.timestamp,
        startTime: details.startTime || event.timestamp,
        endTime: details.endTime,
        duration: event.value || details.duration || 0,
        quality: details.quality || "good",
        location: details.location,
        notes: event.notes || details.notes,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      }
    })
  } catch (error) {
    console.error("Error fetching sleep entries:", error)
    throw error
  }
}

export async function getSleepStats(childId: string, startDate?: Date, endDate?: Date) {
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

    // Build query
    const query: any = {
      childId,
      eventType: "sleeping",
    }

    if (startDate || endDate) {
      query.timestamp = {}
      if (startDate) query.timestamp.gte = startDate
      if (endDate) query.timestamp.lte = endDate
    }

    const entries = await prisma.event.findMany({
      where: query,
    })

    if (entries.length === 0) {
      return {
        totalSleepTime: 0,
        averageSleepDuration: 0,
        longestSleep: 0,
        shortestSleep: 0,
        qualityDistribution: {
          poor: 0,
          fair: 0,
          good: 0,
          excellent: 0,
        },
        sleepCountByDay: {},
        sleepDurationByDay: {},
      }
    }

    // Process entries to extract sleep data
    interface SleepDetails {
      startTime?: Date;
      endTime?: Date;
      duration?: number;
      quality?: string;
      location?: string;
      notes?: string;
    }

    const processedEntries = entries.map((event) => {
      let details: SleepDetails = {}
      try {
        details = JSON.parse(event.details || "{}") as SleepDetails
      } catch (e) {
        console.error("Error parsing sleep details:", e)
      }

      return {
        id: event.id,
        childId: event.childId,
        timestamp: event.timestamp,
        startTime: details.startTime || event.timestamp,
        endTime: details.endTime,
        duration: event.value || details.duration || 0,
        quality: details.quality || "good",
        location: details.location,
        notes: event.notes || details.notes,
      }
    })

    const totalSleepTime = processedEntries.reduce((sum, entry) => sum + entry.duration, 0)
    const averageSleepDuration = totalSleepTime / entries.length
    const longestSleep = Math.max(...processedEntries.map((entry) => entry.duration))
    const shortestSleep = Math.min(...processedEntries.map((entry) => entry.duration))

    const qualityDistribution = {
      poor: 0,
      fair: 0,
      good: 0,
      excellent: 0,
    }

    const sleepCountByDay: Record<string, number> = {}
    const sleepDurationByDay: Record<string, number> = {}

    processedEntries.forEach((entry : any) => {
      // Count quality distribution
      const quality = entry.quality as keyof typeof qualityDistribution
      if (qualityDistribution[quality] !== undefined) {
        qualityDistribution[quality]++
      }

      // Count and sum by day
      const day = entry.timestamp.toISOString().split("T")[0]
      sleepCountByDay[day] = (sleepCountByDay[day] || 0) + 1
      sleepDurationByDay[day] = (sleepDurationByDay[day] || 0) + entry.duration
    })

    return {
      totalSleepTime,
      averageSleepDuration,
      longestSleep,
      shortestSleep,
      qualityDistribution,
      sleepCountByDay,
      sleepDurationByDay,
    }
  } catch (error) {
    console.error("Error fetching sleep stats:", error)
    throw error
  }
}

export async function addSleepEntry(formData: FormData) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    const childId = formData.get("childId") as string
    const startTime = formData.get("startTime") as string
    const endTime = formData.get("endTime") as string
    const quality = formData.get("quality") as string
    const location = (formData.get("location") as string) || undefined
    const notes = (formData.get("notes") as string) || undefined

    if (!childId || !startTime || !endTime || !quality) {
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

    const startTimeDate = new Date(startTime)
    const endTimeDate = new Date(endTime)

    // Calculate duration in hours
    const durationMs = endTimeDate.getTime() - startTimeDate.getTime()
    const durationHours = durationMs / (1000 * 60 * 60)

    // Create sleep event
    const event = await prisma.event.create({
      data: {
        childId,
        eventType: "sleeping",
        timestamp: startTimeDate,
        details: JSON.stringify({
          startTime: startTimeDate,
          endTime: endTimeDate,
          duration: durationHours,
          quality,
          location,
          notes,
        }),
        value: durationHours,
        unit: "hours",
        notes,
      },
    })

    revalidatePath("/dashboard/sleep")

    return { success: true, id: event.id }
  } catch (error) {
    console.error("Error adding sleep entry:", error)
    throw error
  }
}

export async function updateSleepEntry(id: string, formData: FormData) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    const startTime = formData.get("startTime") as string
    const endTime = formData.get("endTime") as string
    const quality = formData.get("quality") as string
    const location = (formData.get("location") as string) || undefined
    const notes = (formData.get("notes") as string) || undefined

    // Get the event to verify ownership
    const event = await prisma.event.findUnique({
      where: { id },
      include: { child: true },
    })

    if (!event) {
      throw new Error("Sleep entry not found")
    }

    // Verify child belongs to user
    if (event.child.userId !== userId) {
      throw new Error("Not authorized to update this entry")
    }

    const startTimeDate = startTime ? new Date(startTime) : undefined
    const endTimeDate = endTime ? new Date(endTime) : undefined

    // Calculate duration if start or end time changed
    let durationHours
    if (startTimeDate && endTimeDate) {
      const durationMs = endTimeDate.getTime() - startTimeDate.getTime()
      durationHours = durationMs / (1000 * 60 * 60)
    }

    // Parse existing details
    let details = {}
    try {
      details = JSON.parse(event.details || "{}")
    } catch (e) {
      console.error("Error parsing sleep details:", e)
    }

    // Update details
    const updatedDetails = {
      ...details,
      ...(startTimeDate && { startTime: startTimeDate }),
      ...(endTimeDate && { endTime: endTimeDate }),
      ...(durationHours && { duration: durationHours }),
      ...(quality && { quality }),
      ...(location && { location }),
      ...(notes !== undefined && { notes }),
    }

    // Update event
    await prisma.event.update({
      where: { id },
      data: {
        ...(startTimeDate && { timestamp: startTimeDate }),
        details: JSON.stringify(updatedDetails),
        ...(durationHours && { value: durationHours }),
        ...(notes !== undefined && { notes }),
      },
    })

    revalidatePath("/dashboard/sleep")

    return { success: true }
  } catch (error) {
    console.error("Error updating sleep entry:", error)
    throw error
  }
}

export async function deleteSleepEntry(id: string) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    // Get the event to verify ownership
    const event = await prisma.event.findUnique({
      where: { id },
      include: { child: true },
    })

    if (!event) {
      throw new Error("Sleep entry not found")
    }

    // Verify child belongs to user
    if (event.child.userId !== userId) {
      throw new Error("Not authorized to delete this entry")
    }

    // Delete the event
    await prisma.event.delete({
      where: { id },
    })

    revalidatePath("/dashboard/sleep")

    return { success: true }
  } catch (error) {
    console.error("Error deleting sleep entry:", error)
    throw error
  }
}
