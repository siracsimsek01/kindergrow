"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"

export async function getGrowthEntries(childId: string) {
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
        eventType: "growth",
      },
      orderBy: {
        timestamp: "desc",
      },
    })

    // Process events to extract growth-specific data
    return entries.map((event) => {
      interface GrowthDetails {
        weight?: number;
        height?: number;
        headCircumference?: number;
        notes?: string;
      }
      
      let details: GrowthDetails = {}
      try {
        details = JSON.parse(event.details || "{}") as GrowthDetails
      } catch (e) {
        console.error("Error parsing growth details:", e)
      }

      return {
        id: event.id,
        childId: event.childId,
        timestamp: event.timestamp,
        weight: event.value || details.weight,
        height: details.height,
        headCircumference: details.headCircumference,
        unit: event.unit || "kg",
        notes: event.notes || details.notes,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      }
    })
  } catch (error) {
    console.error("Error fetching growth entries:", error)
    throw error
  }
}

export async function addGrowthEntry(formData: FormData) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    const childId = formData.get("childId") as string
    const weight = formData.get("weight") as string
    const height = formData.get("height") as string
    const headCircumference = formData.get("headCircumference") as string
    const date = formData.get("date") as string
    const notes = (formData.get("notes") as string) || undefined

    if (!childId || !weight || !date) {
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

    const timestamp = new Date(date)
    const weightValue = Number.parseFloat(weight)
    const heightValue = height ? Number.parseFloat(height) : null
    const headCircumferenceValue = headCircumference ? Number.parseFloat(headCircumference) : null

    // Create growth event
    const event = await prisma.event.create({
      data: {
        childId,
        eventType: "growth",
        timestamp,
        details: JSON.stringify({
          weight: weightValue,
          height: heightValue,
          headCircumference: headCircumferenceValue,
          notes,
        }),
        value: weightValue,
        unit: "kg",
        notes,
      },
    })

    revalidatePath("/dashboard/growth")

    return { success: true, id: event.id }
  } catch (error) {
    console.error("Error adding growth entry:", error)
    throw error
  }
}

export async function updateGrowthEntry(id: string, formData: FormData) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    const weight = formData.get("weight") as string
    const height = formData.get("height") as string
    const headCircumference = formData.get("headCircumference") as string
    const date = formData.get("date") as string
    const notes = (formData.get("notes") as string) || undefined

    // Get the event to verify ownership
    const event = await prisma.event.findUnique({
      where: { id },
      include: { child: true },
    })

    if (!event) {
      throw new Error("Growth entry not found")
    }

    // Verify child belongs to user
    if (event.child.userId !== userId) {
      throw new Error("Not authorized to update this entry")
    }

    const timestamp = date ? new Date(date) : undefined
    const weightValue = weight ? Number.parseFloat(weight) : null
    const heightValue = height ? Number.parseFloat(height) : null
    const headCircumferenceValue = headCircumference ? Number.parseFloat(headCircumference) : null

    // Parse existing details
    let details = {}
    try {
      details = JSON.parse(event.details || "{}")
    } catch (e) {
      console.error("Error parsing growth details:", e)
    }

    // Update details
    const updatedDetails = {
      ...details,
      ...(weightValue !== null && { weight: weightValue }),
      ...(heightValue !== null && { height: heightValue }),
      ...(headCircumferenceValue !== null && { headCircumference: headCircumferenceValue }),
      ...(notes !== undefined && { notes }),
    }

    // Update event
    await prisma.event.update({
      where: { id },
      data: {
        ...(timestamp && { timestamp }),
        details: JSON.stringify(updatedDetails),
        ...(weightValue !== null && { value: weightValue }),
        ...(notes !== undefined && { notes }),
      },
    })

    revalidatePath("/dashboard/growth")

    return { success: true }
  } catch (error) {
    console.error("Error updating growth entry:", error)
    throw error
  }
}

export async function deleteGrowthEntry(id: string) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    // Get the event to verify ownership
    const event = await prisma.event.findUnique({
      where: { id },
      include: { child: true },
    })

    if (!event) {
      throw new Error("Growth entry not found")
    }

    // Verify child belongs to user
    if (event.child.userId !== userId) {
      throw new Error("Not authorized to delete this entry")
    }

    // Delete the event
    await prisma.event.delete({
      where: { id },
    })

    revalidatePath("/dashboard/growth")

    return { success: true }
  } catch (error) {
    console.error("Error deleting growth entry:", error)
    throw error
  }
}
