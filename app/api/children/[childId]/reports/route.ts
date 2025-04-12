import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"

export async function GET(request: Request, { params }: { params: { childId: string } }) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const childId = params.childId
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined
    const endDate = searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined
    const reportType = searchParams.get("type") || "all"

    // Verify child belongs to user
    const child = await prisma.child.findFirst({
      where: {
        id: childId,
        userId,
      },
    })

    if (!child) {
      return NextResponse.json({ error: "Child not found or does not belong to user" }, { status: 404 })
    }

    // Build query
    const query: any = {
      childId,
    }

    if (reportType !== "all") {
      query.eventType = reportType
    }

    if (startDate || endDate) {
      query.timestamp = {}
      if (startDate) query.timestamp.gte = startDate
      if (endDate) query.timestamp.lte = endDate
    }

    // Fetch events
    const events = await prisma.event.findMany({
      where: query,
      orderBy: { timestamp: "desc" },
    })

    // Group events by type
    const eventsByType: Record<string, any[]> = {}
    events.forEach((event : any) => {
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

    return NextResponse.json({
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
      child: {
        id: child.id,
        name: child.name,
        birthDate: child.birthDate,
      },
      period: {
        startDate,
        endDate,
      },
    })
  } catch (error: any) {
    console.error("Error generating report:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { childId: string } }) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const childId = params.childId
    const body = await request.json()

    if (!body.startDate || !body.endDate || !body.reportType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify child belongs to user
    const child = await prisma.child.findFirst({
      where: {
        id: childId,
        userId,
      },
    })

    if (!child) {
      return NextResponse.json({ error: "Child not found or does not belong to user" }, { status: 404 })
    }

    const startDate = new Date(body.startDate)
    const endDate = new Date(body.endDate)

    // Redirect to GET with query parameters
    const url = new URL(request.url)
    url.searchParams.set("startDate", startDate.toISOString())
    url.searchParams.set("endDate", endDate.toISOString())
    url.searchParams.set("type", body.reportType)

    return NextResponse.redirect(url)
  } catch (error: any) {
    console.error("Error creating report:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
