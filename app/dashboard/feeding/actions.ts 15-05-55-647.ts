"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import connectToDatabase from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function getFeedingEntries(childId: string) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    const { db } = await connectToDatabase()

    const entries = await db
      .collection("events")
      .find({
        userId,
        childId,
        eventType: "feeding",
      })
      .sort({ startTime: -1 })
      .toArray()

    return entries
  } catch (error) {
    console.error("Error fetching feeding entries:", error)
    throw error
  }
}

export async function getFeedingStats(childId: string) {
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
        eventType: "feeding",
        startTime: { $gte: today },
      })
      .toArray()

    // Calculate stats
    const totalFeedings = todayEntries.length

    // Calculate total volume (for formula/breast milk)
    let totalVolume = 0
    let volumeCount = 0

    todayEntries.forEach((entry) => {
      if ((entry.data.type === "formula" || entry.data.type === "breast_milk") && entry.data.amount) {
        totalVolume += Number(entry.data.amount)
        volumeCount++
      }
    })

    const averageVolume = volumeCount > 0 ? Math.round(totalVolume / volumeCount) : 0

    // Get last feeding time
    const lastFeeding =
      todayEntries.length > 0 ? new Date(Math.max(...todayEntries.map((e) => new Date(e.startTime).getTime()))) : null

    // Calculate average interval between feedings
    let totalInterval = 0
    let intervalCount = 0

    if (todayEntries.length > 1) {
      const sortedEntries = [...todayEntries].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      )

      for (let i = 1; i < sortedEntries.length; i++) {
        const interval =
          new Date(sortedEntries[i].startTime).getTime() - new Date(sortedEntries[i - 1].startTime).getTime()
        totalInterval += interval
        intervalCount++
      }
    }

    const averageInterval = intervalCount > 0 ? totalInterval / intervalCount : 0
    const intervalHours = Math.floor(averageInterval / (1000 * 60 * 60))
    const intervalMinutes = Math.floor((averageInterval % (1000 * 60 * 60)) / (1000 * 60))

    return {
      today: {
        totalFeedings,
        totalVolume,
        averageVolume,
        lastFeeding,
        feedingInterval: `${intervalHours}h ${intervalMinutes}m`,
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
    const time = formData.get("time") as string
    const type = formData.get("type") as string
    const amount = formData.get("amount") as string
    const unit = formData.get("unit") as string
    const foodDescription = formData.get("foodDescription") as string
    const portionConsumed = formData.get("portionConsumed") as string
    const notes = formData.get("notes") as string

    if (!childId || !time || !type) {
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
      eventType: "feeding",
      startTime: new Date(time),
      data: {
        type,
        amount: amount ? Number(amount) : undefined,
        unit,
        foodDescription,
        portionConsumed,
      },
      notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("events").insertOne(entry)

    revalidatePath("/dashboard/feeding")

    return { success: true, _id: result.insertedId }
  } catch (error) {
    console.error("Error adding feeding entry:", error)
    throw error
  }
}

