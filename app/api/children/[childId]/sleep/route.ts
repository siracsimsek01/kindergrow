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
    const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit")!) : 100

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
      eventType: "sleeping",
    }

    if (startDate) {
      query.timestamp = {
        ...query.timestamp,
        gte: startDate,
      }
    }

    if (endDate) {
      query.timestamp = {
        ...query.timestamp,
        lte: endDate,
      }
    }

    // Fetch sleep events
    const events = await prisma.event.findMany({
      where: query,
      orderBy: { timestamp: "desc" },
      take: limit,
    })

    // Process events to extract sleep-specific data
    const sleepEvents = events.map((event) => {
      interface SleepDetails {
        startTime?: Date;
        endTime?: Date;
        duration?: number;
        quality?: string;
        location?: string;
        notes?: string;
      }
      
      let details: SleepDetails = {}
      try {
        details = JSON.parse(event.details || "{}") as SleepDetails
      } catch (e) {
        console.error("Error parsing sleep details:", e)
      }

      return {
        id: event.id,
        childId: event.childId,
        timestamp: event.timestamp,
        startTime: details.startTime || event.timestamp,
        endTime: details.endTime,
        duration: event.value || details.duration || 0,
        quality: details.quality || "good",
        location: details.location,
        notes: event.notes || details.notes,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      }
    })

    return NextResponse.json(sleepEvents)
  } catch (error: any) {
    console.error("Error fetching sleep events:", error)
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

    if (!body.startTime || !body.endTime || !body.quality) {
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

    const startTime = new Date(body.startTime)
    const endTime = new Date(body.endTime)

    // Calculate duration in hours
    const durationMs = endTime.getTime() - startTime.getTime()
    const durationHours = durationMs / (1000 * 60 * 60)

    // Create sleep event
    const event = await prisma.event.create({
      data: {
        childId,
        eventType: "sleeping",
        timestamp: startTime,
        details: JSON.stringify({
          startTime,
          endTime,
          duration: durationHours,
          quality: body.quality,
          location: body.location,
          notes: body.notes,
        }),
        value: durationHours,
        unit: "hours",
        notes: body.notes,
      },
    })

    // Format response
    const sleepEvent = {
      id: event.id,
      childId: event.childId,
      timestamp: event.timestamp,
      startTime: startTime,
      endTime: endTime,
      duration: durationHours,
      quality: body.quality,
      location: body.location,
      notes: body.notes,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    }

    return NextResponse.json(sleepEvent)
  } catch (error: any) {
    console.error("Error creating sleep event:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
