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
    const eventType = searchParams.get("eventType")
    const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit")!) : 100
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

    // Build query
    const query: any = { childId }

    if (eventType) {
      query.eventType = eventType
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

    // Fetch events
    const events = await prisma.event.findMany({
      where: query,
      orderBy: { timestamp: "desc" },
      take: limit,
    })

    return NextResponse.json(events)
  } catch (error: any) {
    console.error("Error fetching events:", error)
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
    const { eventType, timestamp, details, value, unit, notes } = body

    if (!eventType || !timestamp) {
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

    // Create event
    const event = await prisma.event.create({
      data: {
        childId,
        eventType,
        timestamp: new Date(timestamp),
        details,
        value,
        unit,
        notes,
      },
    })

    return NextResponse.json(event)
  } catch (error: any) {
    console.error("Error creating event:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
