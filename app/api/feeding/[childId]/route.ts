import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import connectToDatabase from "@/lib/mongodb"
import { v4 as uuidv4 } from "uuid"

export async function GET(request: NextRequest, { params }: { params: { childId: string } }) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Verify child belongs to user
    const child = await db.collection("children").findOne({
      _id: params.childId,
      userId,
    })

    if (!child) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 })
    }

    // Get feeding events
    const query: any = {
      childId: params.childId,
      eventType: "feeding",
    }

    // Add date filters if provided
    const { searchParams } = new URL(request.url)
    if (searchParams.has("startDate")) {
      query.timestamp = {
        ...(query.timestamp || {}),
        $gte: new Date(searchParams.get("startDate")!),
      }
    }

    if (searchParams.has("endDate")) {
      query.timestamp = {
        ...(query.timestamp || {}),
        $lte: new Date(searchParams.get("endDate")!),
      }
    }

    const events = await db.collection("events").find(query).sort({ timestamp: -1 }).toArray()

    return NextResponse.json(events)
  } catch (error: any) {
    console.error("Error fetching feeding data:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { childId: string } }) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Verify child belongs to user
    const child = await db.collection("children").findOne({
      _id: params.childId,
      userId,
    })

    if (!child) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 })
    }

    // Parse request body
    const body = await request.json()

    // Validate required fields
    if (!body.timestamp || !body.type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create feeding event
    const feedingEvent = {
      _id: uuidv4(),
      childId: params.childId,
      eventType: "feeding",
      timestamp: new Date(body.timestamp).toISOString(),
      type: body.type,
      amount: body.amount || "",
      notes: body.notes || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await db.collection("events").insertOne(feedingEvent)

    return NextResponse.json(feedingEvent, { status: 201 })
  } catch (error: any) {
    console.error("Error creating feeding event:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

