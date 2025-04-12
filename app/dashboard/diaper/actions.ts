"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"

export async function getDiaperEntries(childId: string) {
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
        eventType: "diaper",
      },
      orderBy: {
        timestamp: "desc",
      },
    })

    return entries
  } catch (error) {
    console.error("Error fetching diaper entries:", error)
    throw error
  }
}

export async function getDiaperStats(childId: string) {
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

    // Get today's date at midnight
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get today's entries
    const todayEntries = await prisma.event.findMany({
      where: {
        childId,
        eventType: "diaper",
        timestamp: {
          gte: today,
        },
      },
    })

    // Define the type for diaper details
    interface DiaperDetails {
      type?: string;
      consistency?: string;
      color?: string;
    }

    // Process entries to extract diaper-specific data
    const processedEntries = todayEntries.map((event) => {
      let details: DiaperDetails = {}
      try {
        details = JSON.parse(event.details || "{}") as DiaperDetails
      } catch (e) {
        console.error("Error parsing diaper details:", e)
      }

      return {
        ...event,
        data: details,
      }
    })

    // Count by type
    const wetCount = processedEntries.filter((entry) => entry.data.type === "wet").length
    const dirtyCount = processedEntries.filter((entry) => entry.data.type === "dirty").length
    const mixedCount = processedEntries.filter((entry) => entry.data.type === "mixed").length

    // Get last change time
    const lastChange =
      todayEntries.length > 0
        ? todayEntries.reduce(
            (latest, entry) => (entry.timestamp > latest ? entry.timestamp : latest),
            todayEntries[0].timestamp,
          )
        : null

    return {
      today: {
        total: todayEntries.length,
        wet: wetCount,
        dirty: dirtyCount,
        mixed: mixedCount,
        lastChange,
      },
    }
  } catch (error) {
    console.error("Error fetching diaper stats:", error)
    throw error
  }
}

export async function addDiaperEntry(formData: FormData) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    const childId = formData.get("childId") as string
    const type = formData.get("type") as string
    const time = formData.get("time") as string
    const consistency = (formData.get("consistency") as string) || undefined
    const color = (formData.get("color") as string) || undefined
    const notes = (formData.get("notes") as string) || undefined

    if (!childId || !type || !time) {
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

    // Create diaper event
    const event = await prisma.event.create({
      data: {
        childId,
        eventType: "diaper",
        timestamp,
        details: JSON.stringify({
          type,
          consistency,
          color,
        }),
        notes,
      },
    })

    revalidatePath("/dashboard/diaper")

    return { success: true, id: event.id }
  } catch (error) {
    console.error("Error adding diaper entry:", error)
    throw error
  }
}

export async function deleteDiaperEntry(id: string) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    // First, get the event to verify ownership
    const event = await prisma.event.findUnique({
      where: { id },
      include: { child: true },
    })

    if (!event) {
      throw new Error("Entry not found")
    }

    // Verify child belongs to user
    if (event.child.userId !== userId) {
      throw new Error("Not authorized to delete this entry")
    }

    // Delete the event
    await prisma.event.delete({
      where: { id },
    })

    revalidatePath("/dashboard/diaper")

    return { success: true }
  } catch (error) {
    console.error("Error deleting diaper entry:", error)
    throw error
  }
}
