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

    // Build query for date range
    const dateQuery: any = {}
    if (startDate) {
      dateQuery.gte = startDate
    }
    if (endDate) {
      dateQuery.lte = endDate
    }

    // Get event counts by type
    const eventCounts = await prisma.event.groupBy({
      by: ["eventType"],
      where: {
        childId,
        ...(Object.keys(dateQuery).length > 0 ? { timestamp: dateQuery } : {}),
      },
      _count: {
        id: true,
      },
    })

    // Get latest events
    const latestEvents = await prisma.event.findMany({
      where: {
        childId,
        ...(Object.keys(dateQuery).length > 0 ? { timestamp: dateQuery } : {}),
      },
      orderBy: {
        timestamp: "desc",
      },
      take: 10,
    })

    // Calculate sleep stats
    const sleepEvents = await prisma.event.findMany({
      where: {
        childId,
        eventType: "sleeping",
        ...(Object.keys(dateQuery).length > 0 ? { timestamp: dateQuery } : {}),
      },
      orderBy: {
        timestamp: "desc",
      },
    })

    let totalSleepTime = 0
    const sleepQualityCounts = {
      poor: 0,
      fair: 0,
      good: 0,
      excellent: 0,
    }

    sleepEvents.forEach((event) => {
      totalSleepTime += event.value || 0

      try {
        const details = JSON.parse(event.details || "{}")
        const quality = details.quality || "good"
        if (sleepQualityCounts.hasOwnProperty(quality)) {
          sleepQualityCounts[quality as keyof typeof sleepQualityCounts]++
        }
      } catch (e) {
        console.error("Error parsing sleep details:", e)
      }
    })

    const averageSleepDuration = sleepEvents.length > 0 ? totalSleepTime / sleepEvents.length : 0

    // Format the stats response
    const stats = {
      eventCounts: Object.fromEntries(eventCounts.map((count) => [count.eventType, count._count.id])),
      latestEvents,
      sleepStats: {
        totalSleepTime,
        averageSleepDuration,
        qualityDistribution: sleepQualityCounts,
        totalEvents: sleepEvents.length,
      },
    }

    return NextResponse.json(stats)
  } catch (error: any) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
