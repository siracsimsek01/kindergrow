"use server"

import { auth } from "@clerk/nextjs/server"
import connectToDatabase from "@/lib/mongodb"
import { ObjectId } from "mongodb"


export async function getReportData(childId: string, reportType: string, startDate: Date, endDate: Date) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    const { db } = await connectToDatabase()

    // Verify child belongs to user
    const child = await db.collection("children").findOne({
      _id: new ObjectId(childId),
      userId,
    })

    if (!child) {
      throw new Error("Child not found")
    }

    // Get events based on report type
    const events = await db
      .collection("events")
      .find({
        userId,
        childId,
        eventType: reportType,
        startTime: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .sort({ startTime: 1 })
      .toArray()

    return {
      child,
      events,
      reportType,
      startDate,
      endDate,
    }
  } catch (error) {
    console.error(`Error fetching ${reportType} report data:`, error)
    throw error
  }
}

export async function generateReport(formData: FormData) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    const childId = formData.get("childId") as string
    const reportType = formData.get("reportType") as string
    const startDate = formData.get("startDate") as string
    const endDate = formData.get("endDate") as string

    if (!childId || !reportType || !startDate || !endDate) {
      throw new Error("Missing required fields")
    }

    const reportData = await getReportData(childId, reportType, new Date(startDate), new Date(endDate))

    // In a real implementation, you would generate a PDF here
    // For now, we'll just return the data

    return {
      success: true,
      data: reportData,
    }
  } catch (error) {
    console.error("Error generating report:", error)
    throw error
  }
}

export async function getGrowthData(childId: string) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    const { db } = await connectToDatabase()

    // Get all growth events for the child
    const growthEvents = await db
      .collection("events")
      .find({
        userId,
        childId,
        eventType: "growth",
      })
      .sort({ startTime: 1 })
      .toArray()

    // Format data for charts
    const weightData = growthEvents
      .filter((event) => event.data.weight)
      .map((event) => ({
        date: event.startTime,
        value: event.data.weight,
        unit: event.data.weightUnit,
      }))

    const heightData = growthEvents
      .filter((event) => event.data.height)
      .map((event) => ({
        date: event.startTime,
        value: event.data.height,
        unit: event.data.heightUnit,
      }))

    const headCircumferenceData = growthEvents
      .filter((event) => event.data.headCircumference)
      .map((event) => ({
        date: event.startTime,
        value: event.data.headCircumference,
        unit: "cm",
      }))

    return {
      weight: weightData,
      height: heightData,
      headCircumference: headCircumferenceData,
    }
  } catch (error) {
    console.error("Error fetching growth data:", error)
    throw error
  }
}

