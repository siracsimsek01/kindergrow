"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import connectToDatabase from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function getMedications(childId: string) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    const { db } = await connectToDatabase()

    const entries = await db
      .collection("events")
      .find({
        userId,
        childId,
        eventType: "medication",
      })
      .sort({ startTime: -1 })
      .toArray()

    return entries
  } catch (error) {
    console.error("Error fetching medications:", error)
    throw error
  }
}

export async function getMedicationStats(childId: string) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    const { db } = await connectToDatabase()

    // Get today's date at midnight
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get active medications (those with future end dates or no end date)
    const activeMedications = await db
      .collection("events")
      .find({
        userId,
        childId,
        eventType: "medication",
        $or: [{ "data.endDate": { $exists: false } }, { "data.endDate": null }, { "data.endDate": { $gte: today } }],
      })
      .toArray()

    // Get today's administrations
    const todayAdministrations = await db
      .collection("events")
      .find({
        userId,
        childId,
        eventType: "medication",
        "data.administrationTime": { $gte: today },
      })
      .toArray()

    // Calculate next dose
    let nextDose = null
    let nextMedication = null

    const now = new Date()

    activeMedications.forEach((med) => {
      if (med.data.schedule) {
        med.data.schedule.forEach((time) => {
          const [hours, minutes] = time.split(":").map(Number)
          const doseTime = new Date(now)
          doseTime.setHours(hours, minutes, 0, 0)

          if (doseTime > now && (!nextDose || doseTime < nextDose)) {
            nextDose = doseTime
            nextMedication = med
          }
        })
      }
    })

    // Calculate upcoming refills (medications ending in the next 7 days)
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)

    const upcomingRefills = activeMedications.filter(
      (med) => med.data.endDate && new Date(med.data.endDate) <= nextWeek,
    )

    return {
      activeMedicationsCount: activeMedications.length,
      todayAdministrationsCount: todayAdministrations.length,
      totalScheduledDoses: activeMedications.reduce(
        (total, med) => total + (med.data.schedule ? med.data.schedule.length : 0),
        0,
      ),
      nextDose: nextDose
        ? {
            time: nextDose,
            medication: nextMedication
              ? {
                  name: nextMedication.data.name,
                  dosage: nextMedication.data.dosage,
                  unit: nextMedication.data.unit,
                }
              : null,
          }
        : null,
      upcomingRefillsCount: upcomingRefills.length,
    }
  } catch (error) {
    console.error("Error fetching medication stats:", error)
    throw error
  }
}

export async function addMedication(formData: FormData) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    const childId = formData.get("childId") as string
    const name = formData.get("name") as string
    const dosage = formData.get("dosage") as string
    const unit = formData.get("unit") as string
    const frequency = formData.get("frequency") as string
    const startDate = formData.get("startDate") as string
    const endDate = (formData.get("endDate") as string) || null
    const withFood = formData.get("withFood") === "on"
    const reminder = formData.get("reminder") === "on"
    const notes = formData.get("notes") as string
    const schedule = formData.getAll("schedule") as string[]

    if (!childId || !name || !dosage || !unit || !frequency) {
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
      eventType: "medication",
      startTime: new Date(startDate),
      data: {
        name,
        dosage,
        unit,
        frequency,
        endDate: endDate ? new Date(endDate) : null,
        withFood,
        reminder,
        schedule,
      },
      notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("events").insertOne(entry)

    revalidatePath("/dashboard/medications")

    return { success: true, _id: result.insertedId }
  } catch (error) {
    console.error("Error adding medication:", error)
    throw error
  }
}

