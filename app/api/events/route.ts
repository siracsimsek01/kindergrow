import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import { auth } from "@clerk/nextjs/server"

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const { searchParams } = new URL(request.url)

    const childId = searchParams.get("childId")
    const eventType = searchParams.get("eventType")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // First verify that the requested child belongs to the authenticated user
    if (childId) {
      const childCheck = await db.collection("children").findOne({
        id: childId,
        parentId: `user_${userId}`,
      })

      if (!childCheck) {
        return NextResponse.json({ message: "Child not found or unauthorized" }, { status: 404 })
      }
    }

    const query: any = {
      parentId: `user_${userId}`, // Always filter by the authenticated user
    }

    if (childId) {
      query.childId = childId
    }

    if (eventType) {
      query.eventType = eventType
    }

    if (startDate || endDate) {
      query.timestamp = {}

      if (startDate) {
        query.timestamp.$gte = new Date(startDate).toISOString()
      }

      if (endDate) {
        query.timestamp.$lte = new Date(endDate).toISOString()
      }
    }

    const events = await db.collection("events").find(query).sort({ timestamp: -1 }).toArray()

    // Serialize MongoDB objects to avoid issues with _id
    const serializedEvents = events.map((event) => ({
      ...event,
      _id: event._id.toString(),
    }))

    return NextResponse.json(serializedEvents)
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ message: "Failed to fetch events" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const data = await request.json()

    // Validate required fields
    if (!data.childId || !data.eventType) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Verify that the child belongs to the authenticated user
    const childCheck = await db.collection("children").findOne({
      id: data.childId,
      parentId: `user_${userId}`,
    })

    if (!childCheck) {
      return NextResponse.json({ message: "Child not found or unauthorized" }, { status: 404 })
    }

    // Add timestamps and user ID
    const now = new Date().toISOString()
    const eventData = {
      ...data,
      id: `event_${Math.random().toString(36).substr(2, 9)}`,
      parentId: `user_${userId}`,
      timestamp: data.timestamp || now,
      createdAt: now,
      updatedAt: now,
    }

    const result = await db.collection("events").insertOne(eventData)

    // Serialize the MongoDB object to avoid issues with _id
    const serializedEvent = {
      ...eventData,
      _id: result.insertedId.toString(),
    }

    return NextResponse.json(serializedEvent)
  } catch (error) {
    console.error("Error adding event:", error)
    return NextResponse.json({ message: "Failed to add event" }, { status: 500 })
  }
}

