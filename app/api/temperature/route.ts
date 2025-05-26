import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import connectToDatabase from "@/lib/mongodb"

export async function POST(
  request: NextRequest,
  { params }: { params: { childId: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { timestamp, temperature, notes } = body

    if (!timestamp || temperature === undefined) {
      return NextResponse.json(
        { error: "Timestamp and temperature are required" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()

    // Verify child belongs to user
    const child = await db.collection("children").findOne({
      _id: params.childId,
      userId,
    })

    if (!child) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 })
    }

    const event = {
      id: `event_${Math.random().toString(36).substr(2, 9)}`,
      childId: params.childId,
      parentId: userId,
      eventType: "temperature",
      startTime: new Date(timestamp).toISOString(),
      endTime: new Date(timestamp).toISOString(),
      details: `Temperature: ${temperature}°C${notes ? `\nNotes: ${notes}` : ""}`,
      value: temperature,
      timestamp: new Date(timestamp).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await db.collection("events").insertOne(event)

    return NextResponse.json({ success: true, event })
  } catch (error) {
    console.error("Error adding temperature event:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}