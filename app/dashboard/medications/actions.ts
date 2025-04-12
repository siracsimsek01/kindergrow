"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"

export async function getMedicationEntries(childId: string) {
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
        eventType: "medication",
      },
      orderBy: {
        timestamp: "desc",
      },
    })

    // Process events to extract medication-specific data
    return entries.map((event) => {
      let details: {
        medication?: string;
        dosage?: string;
        reason?: string;
        notes?: string;
      } = {}
      try {
        details = JSON.parse(event.details || "{}") as typeof details
      } catch (e) {
        console.error("Error parsing medication details:", e)
      }

      return {
        id: event.id,
        childId: event.childId,
        timestamp: event.timestamp,
        medication: details.medication,
        dosage: details.dosage,
        reason: details.reason,
        notes: event.notes || details.notes,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      }
    })
  } catch (error) {
    console.error("Error fetching medication entries:", error)
    throw error
  }
}

export async function getMedicationStats(childId: string) {
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
        eventType: "medication",
        timestamp: {
          gte: today,
        },
      },
    })

    // Process entries to extract medication-specific data
    const processedEntries = todayEntries.map((event) => {
      let details: {
        medication?: string;
        dosage?: string;
        reason?: string;
        notes?: string;
      } = {}
      try {
        details = JSON.parse(event.details || "{}") as typeof details
      } catch (e) {
        console.error("Error parsing medication details:", e)
      }

      return {
        ...event,
        medication: details.medication,
        dosage: details.dosage,
        reason: details.reason,
      }
    })

    // Count by medication type
    const medicationCounts: Record<string, number> = {}
    processedEntries.forEach((entry) => {
      if (entry.medication) {
        medicationCounts[entry.medication] = (medicationCounts[entry.medication] || 0) + 1
      }
    })

    // Get last medication time
    const lastMedication =
      todayEntries.length > 0
        ? todayEntries.reduce(
            (latest, entry) => (entry.timestamp > latest ? entry.timestamp : latest),
            todayEntries[0].timestamp,
          )
        : null

    return {
      today: {
        total: todayEntries.length,
        medicationCounts,
        lastMedication,
      },
    }
  } catch (error) {
    console.error("Error fetching medication stats:", error)
    throw error
  }
}

export async function addMedicationEntry(formData: FormData) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    const childId = formData.get("childId") as string
    const medication = formData.get("medication") as string
    const dosage = formData.get("dosage") as string
    const reason = (formData.get("reason") as string) || undefined
    const time = formData.get("time") as string
    const notes = (formData.get("notes") as string) || undefined

    if (!childId || !medication || !dosage || !time) {
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

    // Create medication event
    const event = await prisma.event.create({
      data: {
        childId,
        eventType: "medication",
        timestamp,
        details: JSON.stringify({
          medication,
          dosage,
          reason,
          notes,
        }),
        notes,
      },
    })

    revalidatePath("/dashboard/medications")

    return { success: true, id: event.id }
  } catch (error) {
    console.error("Error adding medication entry:", error)
    throw error
  }
}

export async function updateMedicationEntry(id: string, formData: FormData) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    const medication = formData.get("medication") as string
    const dosage = formData.get("dosage") as string
    const reason = (formData.get("reason") as string) || undefined
    const time = formData.get("time") as string
    const notes = (formData.get("notes") as string) || undefined

    // Get the event to verify ownership
    const event = await prisma.event.findUnique({
      where: { id },
      include: { child: true },
    })

    if (!event) {
      throw new Error("Medication entry not found")
    }

    // Verify child belongs to user
    if (event.child.userId !== userId) {
      throw new Error("Not authorized to update this entry")
    }

    const timestamp = time ? new Date(time) : undefined

    // Parse existing details
    let details = {}
    try {
      details = JSON.parse(event.details || "{}")
    } catch (e) {
      console.error("Error parsing medication details:", e)
    }

    // Update details
    const updatedDetails = {
      ...details,
      ...(medication && { medication }),
      ...(dosage && { dosage }),
      ...(reason !== undefined && { reason }),
      ...(notes !== undefined && { notes }),
    }

    // Update event
    await prisma.event.update({
      where: { id },
      data: {
        ...(timestamp && { timestamp }),
        details: JSON.stringify(updatedDetails),
        ...(notes !== undefined && { notes }),
      },
    })

    revalidatePath("/dashboard/medications")

    return { success: true }
  } catch (error) {
    console.error("Error updating medication entry:", error)
    throw error
  }
}

export async function deleteMedicationEntry(id: string) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    // Get the event to verify ownership
    const event = await prisma.event.findUnique({
      where: { id },
      include: { child: true },
    })

    if (!event) {
      throw new Error("Medication entry not found")
    }

    // Verify child belongs to user
    if (event.child.userId !== userId) {
      throw new Error("Not authorized to delete this entry")
    }

    // Delete the event
    await prisma.event.delete({
      where: { id },
    })

    revalidatePath("/dashboard/medications")

    return { success: true }
  } catch (error) {
    console.error("Error deleting medication entry:", error)
    throw error
  }
}
