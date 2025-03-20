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
    const limit = Number.parseInt(searchParams.get("limit") || "5", 10)

    // First verify that the requested child belongs to the authenticated user if childId is provided
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
      eventType: "appointment",
      timestamp: { $gte: new Date().toISOString() },
      parentId: `user_${userId}`, // Always filter by the authenticated user
    }

    if (childId) {
      query.childId = childId
    }

    const events = await db.collection("events").find(query).sort({ timestamp: 1 }).limit(limit).toArray()

    // Serialize MongoDB objects to avoid issues with _id
    const serializedEvents = events.map((event) => ({
      ...event,
      _id: event._id.toString(),
    }))

    return NextResponse.json(serializedEvents)
  } catch (error) {
    console.error("Error fetching upcoming events:", error)
    return NextResponse.json({ message: "Failed to fetch upcoming events" }, { status: 500 })
  }
}

