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
      eventType: "temperature",
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

    // Fetch temperature events
    const events = await prisma.event.findMany({
      where: query,
      orderBy: { timestamp: "desc" },
      take: limit,
    })

    // Define interface for temperature details
    interface TemperatureDetails {
      temperature?: number;
      method?: string;
      notes?: string;
      unit?: string;
    }

    // Process events to extract temperature-specific data
    const temperatureEvents = events.map((event) => {
      let details: TemperatureDetails = {}
      try {
        details = JSON.parse(event.details || "{}") as TemperatureDetails
      } catch (e) {
        console.error("Error parsing temperature details:", e)
      }

      return {
        id: event.id,
        childId: event.childId,
        timestamp: event.timestamp,
        temperature: event.value || details.temperature,
        unit: event.unit || "°C",
        method: details.method,
        notes: event.notes || details.notes,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      }
    })

    return NextResponse.json(temperatureEvents)
  } catch (error: any) {
    console.error("Error fetching temperature events:", error)
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

    if (!body.temperature || !body.timestamp) {
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
    const temperature = Number.parseFloat(body.temperature)
    const unit = body.unit || "°C"

    // Create temperature event
    const event = await prisma.event.create({
      data: {
        childId,
        eventType: "temperature",
        timestamp,
        details: JSON.stringify({
          temperature,
          unit,
          method: body.method,
          notes: body.notes,
        }),
        value: temperature,
        unit,
        notes: body.notes,
      },
    })

    // Format response
    const temperatureEvent = {
      id: event.id,
      childId: event.childId,
      timestamp: event.timestamp,
      temperature,
      unit,
      method: body.method,
      notes: body.notes,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    }

    return NextResponse.json(temperatureEvent)
  } catch (error: any) {
    console.error("Error creating temperature event:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
