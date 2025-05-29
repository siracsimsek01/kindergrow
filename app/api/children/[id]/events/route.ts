import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Utility to check child ownership
async function checkChildOwnership(db, childId, userId) {
  return await db.collection("children").findOne({ id: childId, parentId: `user_${userId}` });
}

// GET: List events for a child (optionally filter by type, date, etc.)
export async function GET(request: NextRequest, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { db } = await connectToDatabase();
    const childId = params.id;

    if (!await checkChildOwnership(db, childId, userId))
      return NextResponse.json({ error: "Child not found" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get("eventType");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "100");

    const query: any = { childId };
    if (eventType) query.eventType = eventType;
    if (startDate) query.timestamp = { $gte: new Date(startDate).toISOString() };
    if (endDate) query.timestamp = { ...(query.timestamp || {}), $lte: new Date(endDate).toISOString() };

    const events = await db.collection("events")
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json(events);
  } catch (error) {
    console.error("[GET] /api/children/[id]/events error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Create a new event for a child
export async function POST(request: NextRequest, context: { params : { id: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { db } = await connectToDatabase();
    const childId = context.params.id;

    if (!await checkChildOwnership(db, childId, userId))
      return NextResponse.json({ error: "Child not found" }, { status: 404 });

    const body = await request.json();
    const { eventType, data, timestamp, notes } = body;

    if (!eventType || !timestamp) {
      return NextResponse.json({ error: "eventType and timestamp are required" }, { status: 400 });
    }

    // You can add further validation for specific types
    const entry = {
      id: new ObjectId().toString(),
      childId,
      parentId: `user_${userId}`,
      eventType,
      data: data || {},
      timestamp: new Date(timestamp).toISOString(),
      notes: notes || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection("events").insertOne(entry);
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("[POST] /api/children/[id]/events error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}