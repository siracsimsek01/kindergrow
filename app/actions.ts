"use server"

import { revalidatePath } from "next/cache"
import  connectToDatabase  from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function addEvent(data: {
  childId: string
  eventType: string
  startTime: string
  endTime?: string
  details?: string
}) {
  try {
    console.log("Adding event with data:", JSON.stringify(data))

    const { db } = await connectToDatabase()

    // Validate required fields
    if (!data.childId) throw new Error("Child ID is required")
    if (!data.eventType) throw new Error("Event type is required")
    if (!data.startTime) throw new Error("Start time is required")

    // Create the event object
    const event = {
      childId: data.childId,
      eventType: data.eventType,
      startTime: new Date(data.startTime),
      endTime: data.endTime ? new Date(data.endTime) : undefined,
      details: data.details || "",
      createdAt: new Date(),
    }

    // Insert the event
    const result = await db.collection("events").insertOne(event)

    if (!result.acknowledged) {
      throw new Error(`Failed to record ${data.eventType} session`)
    }

    // Revalidate the dashboard path to update the UI
    revalidatePath("/dashboard")

    return { success: true, eventId: result.insertedId.toString() }
  } catch (error: any) {
    console.error("Error adding event:", error)
    return { success: false, error: error.message }
  }
}

export async function updateEvent(id: string, data: any) {
  try {
    const { db } = await connectToDatabase()

    // Convert string ID to ObjectId
    const objectId = new ObjectId(id)

    // Prepare update data
    const updateData: any = { ...data }

    // Convert date strings to Date objects
    if (updateData.startTime) updateData.startTime = new Date(updateData.startTime)
    if (updateData.endTime) updateData.endTime = new Date(updateData.endTime)

    // Add updatedAt timestamp
    updateData.updatedAt = new Date()

    const result = await db.collection("events").updateOne({ _id: objectId }, { $set: updateData })

    if (result.matchedCount === 0) {
      throw new Error("Event not found")
    }

    revalidatePath("/dashboard")

    return { success: true }
  } catch (error: any) {
    console.error("Error updating event:", error)
    return { success: false, error: error.message }
  }
}

export async function deleteEvent(id: string) {
  try {
    const { db } = await connectToDatabase()

    // Convert string ID to ObjectId
    const objectId = new ObjectId(id)

    const result = await db.collection("events").deleteOne({ _id: objectId })

    if (result.deletedCount === 0) {
      throw new Error("Event not found")
    }

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
}) {
  try {
    const { db } = await connectToDatabase()

    const child = {
      name: data.name,
      dateOfBirth: new Date(data.dateOfBirth),
      sex: data.sex,
      imageUrl: data.imageUrl || null,
      createdAt: new Date(),
    }

    const result = await db.collection("children").insertOne(child)

    revalidatePath("/dashboard")

    return { success: true, childId: result.insertedId.toString() }
  } catch (error: any) {
    console.error("Error adding child:", error)
    return { success: false, error: error.message }
  }
}

export async function updateChild(id: string, data: any) {
  try {
    const { db } = await connectToDatabase()

    // Convert string ID to ObjectId
    const objectId = new ObjectId(id)

    // Prepare update data
    const updateData: any = { ...data }

    // Convert dateOfBirth string to Date object if present
    if (updateData.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth)
    }

    // Add updatedAt timestamp
    updateData.updatedAt = new Date()

    const result = await db.collection("children").updateOne({ _id: objectId }, { $set: updateData })

    if (result.matchedCount === 0) {
      throw new Error("Child not found")
    }

    revalidatePath("/dashboard")

    return { success: true }
  } catch (error: any) {
    console.error("Error updating child:", error)
    return { success: false, error: error.message }
  }
}

export async function deleteChild(id: string) {
  try {
    const { db } = await connectToDatabase()

    // Convert string ID to ObjectId
    const objectId = new ObjectId(id)

    // Delete the child
    const result = await db.collection("children").deleteOne({ _id: objectId })

    if (result.deletedCount === 0) {
      throw new Error("Child not found")
    }

    // Delete all events associated with this child
    await db.collection("events").deleteMany({ childId: id })

    revalidatePath("/dashboard")

    return { success: true }
  } catch (error: any) {
    console.error("Error deleting child:", error)
    return { success: false, error: error.message }
  }
}

