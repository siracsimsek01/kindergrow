"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"

export async function addEvent(data: {
  childId: string
  eventType: string
  startTime: string
  endTime?: string
  details?: string
}) {
  try {
    console.log("Adding event with data:", JSON.stringify(data))

    // Validate required fields
    if (!data.childId) throw new Error("Child ID is required")
    if (!data.eventType) throw new Error("Event type is required")
    if (!data.startTime) throw new Error("Start time is required")

    // Create the event using Prisma
    const result = await prisma.event.create({
      data: {
        childId: data.childId,
        eventType: data.eventType,
        timestamp: new Date(data.startTime), // Using timestamp field from Prisma schema
        details: data.details || "",
        // If you need to store endTime, consider adding it to your Event model or storing it in the details field
      },
    })

    // Revalidate the dashboard path to update the UI
    revalidatePath("/dashboard")

    return { success: true, eventId: result.id }
  } catch (error: any) {
    console.error("Error adding event:", error)
    return { success: false, error: error.message }
  }
}

export async function updateEvent(id: string, data: any) {
  try {
    // Prepare update data
    const updateData: any = { ...data }

    // Convert date strings to Date objects
    if (updateData.startTime) updateData.timestamp = new Date(updateData.startTime)

    
    delete updateData.startTime
    delete updateData.endTime

    // Update the event using Prisma
    const result = await prisma.event.update({
      where: { id },
      data: updateData,
    })

    revalidatePath("/dashboard")

    return { success: true }
  } catch (error: any) {
    console.error("Error updating event:", error)
    return { success: false, error: error.message }
  }
}

export async function deleteEvent(id: string) {
  try {
    // Delete the event using Prisma
    await prisma.event.delete({
      where: { id },
    })

    revalidatePath("/dashboard")

    return { success: true }
  } catch (error: any) {
    console.error("Error deleting event:", error)
    return { success: false, error: error.message }
  }
}

export async function addChild(data: {
  name: string
  dateOfBirth: string
  sex: string
  imageUrl?: string
  userId: string // Add userId parameter to link the child to a user
}) {
  try {
    // Create the child using Prisma
    const result = await prisma.child.create({
      data: {
        name: data.name,
        birthDate: new Date(data.dateOfBirth),
        gender: data.sex, // Note: using 'gender' field as per Prisma schema instead of 'sex'
        // If you need to store imageUrl, consider adding it to your Child model
        user: {
          connect: {
            id: data.userId
          }
        }
      },
    })

    revalidatePath("/dashboard")

    return { success: true, childId: result.id }
  } catch (error: any) {
    console.error("Error adding child:", error)
    return { success: false, error: error.message }
  }
}

export async function updateChild(id: string, data: any) {
  try {
    // Prepare update data
    const updateData: any = { ...data }

    // Convert dateOfBirth string to Date object if present
    if (updateData.dateOfBirth) {
      updateData.birthDate = new Date(updateData.dateOfBirth)
      delete updateData.dateOfBirth
    }

    // Convert sex to gender if present
    if (updateData.sex) {
      updateData.gender = updateData.sex
      delete updateData.sex
    }

    // Update the child using Prisma
    await prisma.child.update({
      where: { id },
      data: updateData,
    })

    revalidatePath("/dashboard")

    return { success: true }
  } catch (error: any) {
    console.error("Error updating child:", error)
    return { success: false, error: error.message }
  }
}

export async function deleteChild(id: string) {
  try {
    // Delete all events associated with this child
    await prisma.event.deleteMany({
      where: { childId: id },
    })

    // Delete the child
    await prisma.child.delete({
      where: { id },
    })

    revalidatePath("/dashboard")

    return { success: true }
  } catch (error: any) {
    console.error("Error deleting child:", error)
    return { success: false, error: error.message }
  }
}
