import { NextRequest, NextResponse } from "next/server"
import { auth } from '@clerk/nextjs/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { client } = await clientPromise();
    const db = client.db(process.env.MONGO_DB);
    const data = await request.json()
    const params = await context.params;
    const childId = params.id;

    // Validate required fields
    if (!data.startDate || !data.endDate || !data.reportType) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    const { startDate, endDate, reportType } = data

    // Verify child belongs to user
    const child = await db.collection("children").findOne({
      _id: new ObjectId(childId),
      parentId: userId
    });

    if (!child) {
      return NextResponse.json({ message: "Child not found" }, { status: 404 })
    }

    // Get events for the specified date range
    const events = await db
      .collection("events")
      .find({
        childId,
        $or: [
          { startTime: { $gte: new Date(startDate).toISOString(), $lte: new Date(endDate).toISOString() } },
          { timestamp: { $gte: new Date(startDate).toISOString(), $lte: new Date(endDate).toISOString() } },
          { changeTime: { $gte: new Date(startDate).toISOString(), $lte: new Date(endDate).toISOString() } },
          { administrationTime: { $gte: new Date(startDate).toISOString(), $lte: new Date(endDate).toISOString() } }
        ],
        ...(reportType !== "all" ? { eventType: reportType } : {}),
      })
      .sort({ startTime: 1, timestamp: 1, changeTime: 1, administrationTime: 1 })
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

