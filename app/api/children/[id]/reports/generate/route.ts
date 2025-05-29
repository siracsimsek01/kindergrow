import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { generateReport } from "@/lib/reportGenerator"

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { reportType, startDate, endDate } = await request.json()
    const params = await context.params;
    const childId = params.id;

    if (!childId) {
      return NextResponse.json({ error: "Missing childId" }, { status: 400 })
    }

    const { client } = await clientPromise();
    const db = client.db(process.env.MONGO_DB);

    console.log(`Generating ${reportType} report from ${startDate} to ${endDate} for child ${childId}`)

    // Verify child belongs to user
    const child = await db.collection("children").findOne({
      _id: new ObjectId(childId),
      parentId: userId
    });

    if (!child) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 })
    }

    // Fetch events based on the report type and date range
    const events = await db
      .collection("events")
      .find({
        childId,
        eventType: reportType,
        $or: [
          { startTime: { $gte: new Date(startDate).toISOString(), $lte: new Date(endDate).toISOString() } },
          { timestamp: { $gte: new Date(startDate).toISOString(), $lte: new Date(endDate).toISOString() } },
          { changeTime: { $gte: new Date(startDate).toISOString(), $lte: new Date(endDate).toISOString() } },
          { administrationTime: { $gte: new Date(startDate).toISOString(), $lte: new Date(endDate).toISOString() } }
        ]
      })
      .toArray()

    console.log(`Fetched ${events.length} events for report`)

    // Transform the data for the report
    const reportData = events.map((event) => ({
      date: event.timestamp,
      startTime: event.startTime || event.timestamp,
      endTime: event.endTime || event.timestamp,
      type: event.eventType,
      childId: event.childId,
      // Calculate duration for sleep events
      value:
        event.eventType === "sleeping"
          ? (new Date(event.endTime || event.timestamp).getTime() -
              new Date(event.startTime || event.timestamp).getTime()) /
            (1000 * 60) // duration in minutes
          : event.value || null,
      notes:
        event.details ||
        `Duration: ${Math.round((new Date(event.endTime || event.timestamp).getTime() - new Date(event.startTime || event.timestamp).getTime()) / (1000 * 60))} minutes`,
    }))

    const pdfBuffer = await generateReport(reportType, reportData, startDate, endDate, child.name)

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${reportType}-report.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error generating report:", error)
    return NextResponse.json(
      {
        error: "Error generating report",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

