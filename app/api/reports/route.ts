import { NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb" // Changed to default import

export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase()
    const data = await request.json()

    // Validate required fields
    if (!data.childId || !data.startDate || !data.endDate || !data.reportType) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    const { childId, startDate, endDate, reportType } = data

    // Get child information
    const child = await db.collection("children").findOne({ id: childId })

    if (!child) {
      return NextResponse.json({ message: "Child not found" }, { status: 404 })
    }

    // Get events for the specified date range
    const events = await db
      .collection("events")
      .find({
        childId,
        timestamp: {
          $gte: new Date(startDate).toISOString(),
          $lte: new Date(endDate).toISOString(),
        },
        ...(reportType !== "all" ? { eventType: reportType } : {}),
      })
      .sort({ timestamp: 1 })
      .toArray()

    // Generate report data
    const reportData = {
      child,
      dateRange: {
        start: startDate,
        end: endDate,
      },
      reportType,
      events,
      generatedAt: new Date().toISOString(),
    }

    // Save report to database
    const result = await db.collection("reports").insertOne({
      ...reportData,
      id: `report_${Math.random().toString(36).substr(2, 9)}`,
    })

    return NextResponse.json({
      ...reportData,
      _id: result.insertedId,
      message: "Report generated successfully",
    })
  } catch (error) {
    console.error("Error generating report:", error)
    return NextResponse.json({ message: "Failed to generate report" }, { status: 500 })
  }
}

