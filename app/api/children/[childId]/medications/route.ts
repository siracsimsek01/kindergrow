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
      eventType: "medication",
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

    // Fetch medication events
    const events = await prisma.event.findMany({
      where: query,
      orderBy: { timestamp: "desc" },
      take: limit,
    })

    // Process events to extract medication-specific data
    const medicationEvents = events.map((event : any) => {
      let details: { medication?: string; dosage?: string; reason?: string; notes?: string } = {}
      try {
        details = JSON.parse(event.details || "{}") as typeof details
      } catch (e) {
        console.error("Error parsing medication details:", e)
      }

      return {
        id: event.id,
        childId: event.childId,
        timestamp: event.timestamp,
        medication: details.medication,
        dosage: details.dosage,
        reason: details.reason,
        notes: event.notes || details.notes,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      }
    })

    return NextResponse.json(medicationEvents)
  } catch (error: any) {
    console.error("Error fetching medication events:", error)
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

    if (!body.medication || !body.dosage || !body.timestamp) {
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

    // Create medication event
    const event = await prisma.event.create({
      data: {
        childId,
        eventType: "medication",
        timestamp,
        details: JSON.stringify({
          medication: body.medication,
          dosage: body.dosage,
          reason: body.reason,
          notes: body.notes,
        }),
        notes: body.notes,
      },
    })

    // Format response
    const medicationEvent = {
      id: event.id,
      childId: event.childId,
      timestamp: event.timestamp,
      medication: body.medication,
      dosage: body.dosage,
      reason: body.reason,
      notes: body.notes,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    }

    return NextResponse.json(medicationEvent)
  } catch (error: any) {
    console.error("Error creating medication event:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
