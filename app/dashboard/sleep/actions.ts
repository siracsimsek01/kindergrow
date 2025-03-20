"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import  connectToDatabase  from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function getSleepEntries(childId: string) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    const { db } = await connectToDatabase()

    const entries = await db
      .collection("events")
      .find({
        userId,
        childId,
        eventType: "sleep",
      })
      .sort({ startTime: -1 })
      .toArray()

    return entries
  } catch (error) {
    console.error("Error fetching sleep entries:", error)
    throw error
  }
}

export async function getSleepStats(childId: string) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    const { db } = await connectToDatabase()

    // Get entries from the last 7 days
    const lastWeek = new Date()
    lastWeek.setDate(lastWeek.getDate() - 7)

    const entries = await db
      .collection("events")
      .find({
        userId,
        childId,
        eventType: "sleep",
        startTime: { $gte: lastWeek },
      })
      .toArray()

    // Calculate average sleep duration
    let totalDuration = 0
    let count = 0

    entries.forEach((entry) => {
      if (entry.endTime) {
        const duration = new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()
        totalDuration += duration
        count++
      }
    })

    const averageDuration = count > 0 ? totalDuration / count : 0
    const averageHours = Math.floor(averageDuration / (1000 * 60 * 60))
    const averageMinutes = Math.floor((averageDuration % (1000 * 60 * 60)) / (1000 * 60))

    return {
      averageSleep: `${averageHours}h ${averageMinutes}m`,
      totalEntries: entries.length,
      napCount: entries.filter((e) => e.data.type === "nap").length,
      nightCount: entries.filter((e) => e.data.type === "night").length,
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
    const endTime = (formData.get("endTime") as string) || null
    const type = (formData.get("type") as string) || "night"
    const quality = (formData.get("quality") as string) || "good"
    const notes = (formData.get("notes") as string) || undefined

    if (!childId || !startTime) {
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
      eventType: "sleep",
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : null,
      data: {
        type,
        quality,
      },
      notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("events").insertOne(entry)

    revalidatePath("/dashboard/sleep")

    return { success: true, _id: result.insertedId }
  } catch (error) {
    console.error("Error adding sleep entry:", error)
    throw error
  }
}

export async function updateSleepEntry(id: string, formData: FormData) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    const endTime = formData.get("endTime") as string
    const quality = formData.get("quality") as string
    const notes = formData.get("notes") as string

    if (!endTime) {
      throw new Error("Missing required fields")
    }

    const { db } = await connectToDatabase()

    const result = await db.collection("events").updateOne(
      {
        _id: new ObjectId(id),
        userId,
        eventType: "sleep",
      },
      {
        $set: {
          endTime: new Date(endTime),
          "data.quality": quality,
          notes,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      throw new Error("Entry not found or not authorized to update")
    }

    revalidatePath("/dashboard/sleep")

    return { success: true }
  } catch (error) {
    console.error("Error updating sleep entry:", error)
    throw error
  }
}

