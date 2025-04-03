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

    const { searchParams } = new URL(request.url)
    const stats = searchParams.get("stats") === "true"

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

    // Get sleep events
    const query: any = {
      childId: params.childId,
      eventType: "sleeping",
    }

    // Add date filters if provided
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

    if (stats) {
      // Calculate sleep statistics
      // This is a simplified version - you can expand it as needed
      const totalSleepTime = events.reduce((sum, event) => sum + (event.duration || 0), 0)
      const averageSleepDuration = events.length > 0 ? totalSleepTime / events.length : 0
      const longestSleep = events.length > 0 ? Math.max(...events.map((event) => event.duration || 0)) : 0
      const shortestSleep = events.length > 0 ? Math.min(...events.map((event) => event.duration || 0)) : 0

      // Count quality distribution
      const qualityDistribution = {
        poor: 0,
        fair: 0,
        good: 0,
        excellent: 0,
      }

      events.forEach((event) => {
        const quality = event.quality?.toLowerCase() || "good"
        if (qualityDistribution.hasOwnProperty(quality)) {
          qualityDistribution[quality as keyof typeof qualityDistribution]++
        }
      })

      return NextResponse.json({
        totalSleepTime,
        averageSleepDuration,
        longestSleep,
        shortestSleep,
        qualityDistribution,
        sleepCountByDay: {},
        sleepDurationByDay: {},
      })
    }

    return NextResponse.json(events)
  } catch (error: any) {
    console.error("Error fetching sleep data:", error)
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
    if (!body.startTime || !body.endTime || !body.quality) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Calculate duration in hours
    const startTime = new Date(body.startTime)
    const endTime = new Date(body.endTime)

    if (endTime <= startTime) {
      return NextResponse.json({ error: "End time must be after start time" }, { status: 400 })
    }

    const durationMs = endTime.getTime() - startTime.getTime()
    const durationHours = durationMs / (1000 * 60 * 60)

    // Create sleep event
    const sleepEvent = {
      _id: uuidv4(),
      childId: params.childId,
      eventType: "sleeping",
      timestamp: startTime.toISOString(),
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: durationHours,
      quality: body.quality,
      location: body.location || "crib",
      notes: body.notes || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await db.collection("events").insertOne(sleepEvent)

    return NextResponse.json(sleepEvent, { status: 201 })
  } catch (error: any) {
    console.error("Error creating sleep event:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

