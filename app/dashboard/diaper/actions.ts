"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import connectToDatabase from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function getDiaperEntries(childId: string) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    const { db } = await connectToDatabase()

    const entries = await db
      .collection("events")
      .find({
        userId,
        childId,
        eventType: "diaper",
      })
      .sort({ startTime: -1 })
      .toArray()

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

    const { db } = await connectToDatabase()

    // Get today's date at midnight
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get today's entries
    const todayEntries = await db
      .collection("events")
      .find({
        userId,
        childId,
        eventType: "diaper",
        startTime: { $gte: today },
      })
      .toArray()

    // Count by type
    const wetCount = todayEntries.filter((entry) => entry.data.type === "wet").length
    const dirtyCount = todayEntries.filter((entry) => entry.data.type === "dirty").length
    const mixedCount = todayEntries.filter((entry) => entry.data.type === "mixed").length

    // Get last change time
    const lastChange =
      todayEntries.length > 0 ? new Date(Math.max(...todayEntries.map((e) => new Date(e.startTime).getTime()))) : null

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

    const { db } = await connectToDatabase()

    // Verify child belongs to user
    const child = await db.collection("children").findOne({
      _id: new ObjectId(childId),
      userId,
    })

    if (!child) {
      throw new Error("Child not found")
    }

    const entry = {
      userId,
      childId,
      eventType: "diaper",
      startTime: new Date(time),
      data: {
        type,
        consistency,
        color,
      },
      notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("events").insertOne(entry)

    revalidatePath("/dashboard/diaper")

    return { success: true, _id: result.insertedId }
  } catch (error) {
    console.error("Error adding diaper entry:", error)
    throw error
  }
}

export async function deleteDiaperEntry(id: string) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    const { db } = await connectToDatabase()

    const result = await db.collection("events").deleteOne({
      _id: new ObjectId(id),
      userId,
      eventType: "diaper",
    })

    if (result.deletedCount === 0) {
      throw new Error("Entry not found or not authorized to delete")
    }

    revalidatePath("/dashboard/diaper")

    return { success: true }
  } catch (error) {
    console.error("Error deleting diaper entry:", error)
    throw error
  }
}

