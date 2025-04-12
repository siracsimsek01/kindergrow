"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"

export async function getChildReports(childId: string, startDate?: Date, endDate?: Date) {
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

    // Build query
    const query: any = {
      childId,
    }

    if (startDate || endDate) {
      query.timestamp = {}
      if (startDate) query.timestamp.gte = startDate
      if (endDate) query.timestamp.lte = endDate
    }

    // Get all events for the child
    const events = await prisma.event.findMany({
      where: query,
      orderBy: {
        timestamp: "desc",
      },
    })

    // Group events by type
    const eventsByType: Record<string, any[]> = {}
    events.forEach((event) => {
      if (!eventsByType[event.eventType]) {
        eventsByType[event.eventType] = []
      }
      eventsByType[event.eventType].push(event)
    })

    // Calculate stats for each event type
    const sleepEvents = eventsByType.sleeping || []
    const feedingEvents = eventsByType.feeding || []
    const diaperEvents = eventsByType.diaper || []
    const growthEvents = eventsByType.growth || []
    const medicationEvents = eventsByType.medication || []
    const temperatureEvents = eventsByType.temperature || []

    // Sleep stats
    const sleepStats = {
      count: sleepEvents.length,
      totalDuration: sleepEvents.reduce((sum, event) => sum + (event.value || 0), 0),
      averageDuration:
        sleepEvents.length > 0
          ? sleepEvents.reduce((sum, event) => sum + (event.value || 0), 0) / sleepEvents.length
          : 0,
    }

    // Feeding stats
    const feedingStats = {
      count: feedingEvents.length,
      byType: {} as Record<string, number>,
    }

    feedingEvents.forEach((event) => {
      let details: { type?: string } = {}
      try {
        details = JSON.parse(event.details || "{}") as { type?: string }
      } catch (e) {
        console.error("Error parsing feeding details:", e)
      }

      const type = details.type || "unknown"
      feedingStats.byType[type] = (feedingStats.byType[type] || 0) + 1
    })

    // Diaper stats
    const diaperStats = {
      count: diaperEvents.length,
      byType: {} as Record<string, number>,
    }

    diaperEvents.forEach((event) => {
      let details: { type?: string } = {}
      try {
        details = JSON.parse(event.details || "{}") as { type?: string }
      } catch (e) {
        console.error("Error parsing diaper details:", e)
      }

      const type = details.type || "unknown"
      diaperStats.byType[type] = (diaperStats.byType[type] || 0) + 1
    })

    // Growth stats
    const growthStats = {
      count: growthEvents.length,
      latestWeight: growthEvents.length > 0 ? growthEvents[0].value : null,
      weightGain: growthEvents.length > 1 ? growthEvents[0].value - growthEvents[growthEvents.length - 1].value : null,
    }

    // Medication stats
    const medicationStats = {
      count: medicationEvents.length,
      byMedication: {} as Record<string, number>,
    }

    medicationEvents.forEach((event) => {
      let details: { medication?: string } = {}
      try {
        details = JSON.parse(event.details || "{}") as { medication?: string }
      } catch (e) {
        console.error("Error parsing medication details:", e)
      }

      const medication = details.medication || "unknown"
      medicationStats.byMedication[medication] = (medicationStats.byMedication[medication] || 0) + 1
    })

    // Temperature stats
    const temperatureStats = {
      count: temperatureEvents.length,
      average:
        temperatureEvents.length > 0
          ? temperatureEvents.reduce((sum, event) => sum + (event.value || 0), 0) / temperatureEvents.length
          : null,
      highest: temperatureEvents.length > 0 ? Math.max(...temperatureEvents.map((event) => event.value || 0)) : null,
      lowest: temperatureEvents.length > 0 ? Math.min(...temperatureEvents.map((event) => event.value || 0)) : null,
    }

    return {
      totalEvents: events.length,
      eventsByType: {
        sleep: sleepEvents.length,
        feeding: feedingEvents.length,
        diaper: diaperEvents.length,
        growth: growthEvents.length,
        medication: medicationEvents.length,
        temperature: temperatureEvents.length,
      },
      stats: {
        sleep: sleepStats,
        feeding: feedingStats,
        diaper: diaperStats,
        growth: growthStats,
        medication: medicationStats,
        temperature: temperatureStats,
      },
    }
  } catch (error) {
    console.error("Error generating reports:", error)
    throw error
  }
}

export async function generateReport(formData: FormData) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    const childId = formData.get("childId") as string
    const startDateStr = formData.get("startDate") as string
    const endDateStr = formData.get("endDate") as string
    const reportType = formData.get("reportType") as string

    if (!childId || !startDateStr || !endDateStr || !reportType) {
      throw new Error("Missing required fields")
    }

    const startDate = new Date(startDateStr)
    const endDate = new Date(endDateStr)

    // Get report data
    const reportData = await getChildReports(childId, startDate, endDate)

    return {
      success: true,
      reportType,
      startDate,
      endDate,
      data: reportData,
    }
  } catch (error) {
    console.error("Error generating report:", error)
    throw error
  }
}
