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
      eventType: "growth",
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

    // Fetch growth events
    const events = await prisma.event.findMany({
      where: query,
      orderBy: { timestamp: "desc" },
      take: limit,
    })

    // Process events to extract growth-specific data
    const growthEvents = events.map((event) => {
      let details: { weight?: number, notes?: string } = {}
      try {
        details = JSON.parse(event.details || "{}") as { weight?: number, notes?: string }
      } catch (e) {
        console.error("Error parsing growth details:", e)
      }

      return {
        id: event.id,
        childId: event.childId,
        timestamp: event.timestamp,
        weight: event.value || details.weight,
        unit: event.unit || "kg",
        notes: event.notes || details.notes,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      }
    })

    return NextResponse.json(growthEvents)
  } catch (error: any) {
    console.error("Error fetching growth events:", error)
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

    if (!body.timestamp || !body.weight) {
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

    const timestamp = new Date(body.timestamp)
    const weight = Number.parseFloat(body.weight)

    // Create growth event
    const event = await prisma.event.create({
      data: {
        childId,
        eventType: "growth",
        timestamp,
        details: JSON.stringify({
          weight,
          notes: body.notes,
        }),
        value: weight,
        unit: "kg",
        notes: body.notes,
      },
    })

    // Format response
    const growthEvent = {
      id: event.id,
      childId: event.childId,
      timestamp: event.timestamp,
      weight,
      unit: "kg",
      notes: body.notes,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    }

    return NextResponse.json(growthEvent)
  } catch (error: any) {
    console.error("Error creating growth event:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
