"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"

export async function getFeedingEntries(childId: string) {
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
        eventType: "feeding",
      },
      orderBy: {
        timestamp: "desc",
      },
    })

    // Process events to extract feeding-specific data
    return entries.map((event : any) => {
      interface FeedingDetails {
        type?: string;
        amount?: number;
        notes?: string;
      }
      
      let details: FeedingDetails = {}
      try {
        details = JSON.parse(event.details || "{}") as FeedingDetails
      } catch (e) {
        console.error("Error parsing feeding details:", e)
      }

      return {
        id: event.id,
        childId: event.childId,
        timestamp: event.timestamp,
        type: details.type || "breast",
        amount: event.value || details.amount,
        unit: event.unit,
        notes: event.notes || details.notes,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      }
    })
  } catch (error) {
    console.error("Error fetching feeding entries:", error)
    throw error
  }
}

export async function getFeedingStats(childId: string) {
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
        eventType: "feeding",
        timestamp: {
          gte: today,
        },
      },
    })

    // Process entries to extract feeding-specific data
    interface FeedingDetails {
      type?: string;
      amount?: number;
      notes?: string;
    }

    const processedEntries = todayEntries.map((event: any) => {
      let details: FeedingDetails = {}
      try {
        details = JSON.parse(event.details || "{}") as FeedingDetails
      } catch (e) {
        console.error("Error parsing feeding details:", e)
      }

      return {
        ...event,
        type: details.type || "breast",
        amount: event.value || details.amount,
      }
    })

    // Count by type
    const breastCount = processedEntries.filter((entry) => entry.type === "breast").length
    const bottleCount = processedEntries.filter((entry) => entry.type === "bottle").length
    const formulaCount = processedEntries.filter((entry) => entry.type === "formula").length
    const solidCount = processedEntries.filter((entry) => entry.type === "solid").length
    const snackCount = processedEntries.filter((entry) => entry.type === "snack").length

    // Calculate total amount (only for bottle and formula)
    const totalAmount = processedEntries
      .filter((entry) => entry.type === "bottle" || entry.type === "formula")
      .reduce((sum, entry) => sum + (entry.amount || 0), 0)

    // Get last feeding time
    const lastFeeding =
      todayEntries.length > 0
        ? todayEntries.reduce(
            (latest, entry) => (entry.timestamp > latest ? entry.timestamp : latest),
            todayEntries[0].timestamp,
          )
        : null

    return {
      today: {
        total: todayEntries.length,
        breast: breastCount,
        bottle: bottleCount,
        formula: formulaCount,
        solid: solidCount,
        snack: snackCount,
        totalAmount,
        lastFeeding,
      },
    }
  } catch (error) {
    console.error("Error fetching feeding stats:", error)
    throw error
  }
}

export async function addFeedingEntry(formData: FormData) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    const childId = formData.get("childId") as string
    const type = formData.get("type") as string
    const time = formData.get("time") as string
    const amount = formData.get("amount") as string
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
    const amountValue = amount ? Number.parseFloat(amount) : null

    // Create feeding event
    const event = await prisma.event.create({
      data: {
        childId,
        eventType: "feeding",
        timestamp,
        details: JSON.stringify({
          type,
          amount: amountValue,
          notes,
        }),
        value: amountValue,
        unit: type === "breast" ? "minutes" : "oz",
        notes,
      },
    })

    revalidatePath("/dashboard/feeding")

    return { success: true, id: event.id }
  } catch (error) {
    console.error("Error adding feeding entry:", error)
    throw error
  }
}

export async function updateFeedingEntry(id: string, formData: FormData) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    const type = formData.get("type") as string
    const time = formData.get("time") as string
    const amount = formData.get("amount") as string
    const notes = (formData.get("notes") as string) || undefined

    // Get the event to verify ownership
    const event = await prisma.event.findUnique({
      where: { id },
      include: { child: true },
    })

    if (!event) {
      throw new Error("Feeding entry not found")
    }

    // Verify child belongs to user
    if (event.child.userId !== userId) {
      throw new Error("Not authorized to update this entry")
    }

    const timestamp = time ? new Date(time) : undefined
    const amountValue = amount ? Number.parseFloat(amount) : null

    // Parse existing details
    let details = {}
    try {
      details = JSON.parse(event.details || "{}")
    } catch (e) {
      console.error("Error parsing feeding details:", e)
    }

    // Update details
    const updatedDetails = {
      ...details,
      ...(type && { type }),
      ...(amountValue !== null && { amount: amountValue }),
      ...(notes !== undefined && { notes }),
    }

    // Update event
    await prisma.event.update({
      where: { id },
      data: {
        ...(timestamp && { timestamp }),
        details: JSON.stringify(updatedDetails),
        ...(amountValue !== null && { value: amountValue }),
        ...(type && { unit: type === "breast" ? "minutes" : "oz" }),
        ...(notes !== undefined && { notes }),
      },
    })

    revalidatePath("/dashboard/feeding")

    return { success: true }
  } catch (error) {
    console.error("Error updating feeding entry:", error)
    throw error
  }
}

export async function deleteFeedingEntry(id: string) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    // Get the event to verify ownership
    const event = await prisma.event.findUnique({
      where: { id },
      include: { child: true },
    })

    if (!event) {
      throw new Error("Feeding entry not found")
    }

    // Verify child belongs to user
    if (event.child.userId !== userId) {
      throw new Error("Not authorized to delete this entry")
    }

    // Delete the event
    await prisma.event.delete({
      where: { id },
    })

    revalidatePath("/dashboard/feeding")

    return { success: true }
  } catch (error) {
    console.error("Error deleting feeding entry:", error)
    throw error
  }
}
