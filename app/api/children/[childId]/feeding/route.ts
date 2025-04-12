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
      eventType: "feeding",
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

    // Fetch feeding events
    const events = await prisma.event.findMany({
      where: query,
      orderBy: { timestamp: "desc" },
      take: limit,
    })

    // Process events to extract feeding-specific data
    const feedingEvents = events.map((event : any) => {
      let details: { type?: string; amount?: number; notes?: string } = {}
      try {
        details = JSON.parse(event.details || "{}") as typeof details
      } catch (e) {
        console.error("Error parsing feeding details:", e)
      }

      return {
        id: event.id,
        childId: event.childId,
        timestamp: event.timestamp,
        type: details.type || "breast",
        amount: event.value || details.amount,
        unit: event.unit,
        notes: event.notes || details.notes,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      }
    })

    return NextResponse.json(feedingEvents)
  } catch (error: any) {
    console.error("Error fetching feeding events:", error)
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

    if (!body.timestamp || !body.type) {
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
    const amount = body.amount ? Number.parseFloat(body.amount) : null

    // Create feeding event
    const event = await prisma.event.create({
      data: {
        childId,
        eventType: "feeding",
        timestamp,
        details: JSON.stringify({
          type: body.type,
          amount,
          notes: body.notes,
        }),
        value: amount,
        unit: body.type === "breast" ? "minutes" : "oz",
        notes: body.notes,
      },
    })

    // Format response
    const feedingEvent = {
      id: event.id,
      childId: event.childId,
      timestamp: event.timestamp,
      type: body.type,
      amount,
      unit: event.unit,
      notes: body.notes,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    }

    return NextResponse.json(feedingEvent)
  } catch (error: any) {
    console.error("Error creating feeding event:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
