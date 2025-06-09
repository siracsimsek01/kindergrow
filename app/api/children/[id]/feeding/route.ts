import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Check child ownership
async function checkChildOwnership(db, childId, userId) {
  return await db.collection("children").findOne({ id: childId, parentId: `user_${userId}` });
}

// GET: All feeding events (supports startDate/endDate)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { db } = await connectToDatabase();
    const { id: childId } = await params;
    if (!await checkChildOwnership(db, childId, userId))
      return NextResponse.json({ error: "Child not found" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const query: any = { childId, eventType: "feeding" };
    if (startDate) query.startTime = { $gte: new Date(startDate).toISOString() };
    if (endDate) query.startTime = { ...(query.startTime || {}), $lte: new Date(endDate).toISOString() };

    const events = await db.collection("events").find(query).sort({ startTime: -1 }).toArray();
    return NextResponse.json(events);
  } catch (error) {
    console.error("[GET] /api/children/[id]/feeding error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Create feeding event
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { db } = await connectToDatabase();
    const { id: childId } = await params;
    if (!await checkChildOwnership(db, childId, userId))
      return NextResponse.json({ error: "Child not found" }, { status: 404 });

    const body = await request.json();
    const { startTime, endTime, method, amount, notes } = body;
    if (!startTime || !method || amount === undefined)
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const entry = {
      id: new ObjectId().toString(),
      childId,
      parentId: `user_${userId}`,
      eventType: "feeding",
      startTime: new Date(startTime).toISOString(),
      endTime: endTime ? new Date(endTime).toISOString() : null,
      method,
      amount,
      notes: notes || "",
      timestamp: new Date().toISOString(),
    };

    await db.collection("events").insertOne(entry);
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("[POST] /api/children/[id]/feeding error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH: Update feeding event (by eventId in query param)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { db } = await connectToDatabase();
    const { id: childId } = await params;
    if (!await checkChildOwnership(db, childId, userId))
      return NextResponse.json({ error: "Child not found" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    if (!eventId) return NextResponse.json({ error: "eventId query param is required" }, { status: 400 });

    const body = await request.json();
    const updateFields: any = {};
    ["startTime", "endTime", "method", "amount", "notes"].forEach((field) => {
      if (body[field] !== undefined) updateFields[field] = body[field];
    });
    updateFields.updatedAt = new Date().toISOString();

    const result = await db.collection("events").findOneAndUpdate(
      { id: eventId, childId, eventType: "feeding", parentId: `user_${userId}` },
      { $set: updateFields },
      { returnDocument: "after" }
    );
    if (!result.value) return NextResponse.json({ error: "Feeding event not found" }, { status: 404 });

    return NextResponse.json(result.value);
  } catch (error) {
    console.error("[PATCH] /api/children/[id]/feeding error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Delete feeding event (by eventId in query param)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { db } = await connectToDatabase();
    const { id: childId } = await params;
    if (!await checkChildOwnership(db, childId, userId))
      return NextResponse.json({ error: "Child not found" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    if (!eventId) return NextResponse.json({ error: "eventId query param is required" }, { status: 400 });

    const result = await db.collection("events").deleteOne({
      id: eventId, childId, eventType: "feeding", parentId: `user_${userId}`,
    });

    if (!result.deletedCount) return NextResponse.json({ error: "Feeding event not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE] /api/children/[id]/feeding error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}