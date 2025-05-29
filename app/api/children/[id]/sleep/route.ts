import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Utils
const checkOwnership = async (db, childId, userId) => {
  const child = await db.collection("children").findOne({
    id: childId,
    parentId: `user_${userId}`,
  });
  return child;
};

export async function GET(request: NextRequest, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { db } = await connectToDatabase();
    const childId = params.id;
    if (!await checkOwnership(db, childId, userId)) return NextResponse.json({ error: "Child not found" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const query: { 
      childId: any; 
      eventType: string; 
      startTime?: { $gte?: string; $lte?: string } 
    } = { childId, eventType: "sleeping" };
    if (startDate) query.startTime = { $gte: new Date(startDate).toISOString() };
    if (endDate) query.startTime = { ...(query.startTime || {}), $lte: new Date(endDate).toISOString() };

    const entries = await db.collection("events").find(query).sort({ startTime: -1 }).toArray();
    return NextResponse.json(entries);
  } catch (err) {
    console.error("GET sleep error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { db } = await connectToDatabase();
    const childId = params.id;
    if (!await checkOwnership(db, childId, userId)) return NextResponse.json({ error: "Child not found" }, { status: 404 });

    const body = await request.json();
    const { startTime, endTime, notes, quality } = body;
    if (!startTime) return NextResponse.json({ error: "startTime is required" }, { status: 400 });

    const entry = {
      childId,
      eventType: "sleeping",
      startTime: new Date(startTime).toISOString(),
      endTime: endTime ? new Date(endTime).toISOString() : null,
      notes: notes || "",
      quality: quality || "Good",
      timestamp: new Date().toISOString(),
      id: new ObjectId().toString(),
      parentId: `user_${userId}`,
    };
    await db.collection("events").insertOne(entry);
    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    console.error("POST sleep error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context : { params : { id: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { db } = await connectToDatabase();
    const childId = context.params.id;
    if (!await checkOwnership(db, childId, userId)) return NextResponse.json({ error: "Child not found" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    if (!eventId) return NextResponse.json({ error: "eventId is required" }, { status: 400 });

    const body = await request.json();
    const updateFields: { [key: string]: any } = {};
    ["startTime", "endTime", "notes", "quality"].forEach(field => {
      if (body[field] !== undefined) updateFields[field] = body[field];
    });
    updateFields.updatedAt = new Date().toISOString();

    const result = await db.collection("events").findOneAndUpdate(
      { id: eventId, childId, eventType: "sleeping", parentId: `user_${userId}` },
      { $set: updateFields },
      { returnDocument: "after" }
    );
    if (!result.value) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    return NextResponse.json(result.value);
  } catch (err) {
    console.error("PATCH sleep error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { db } = await connectToDatabase();
    const childId = params.id;
    if (!await checkOwnership(db, childId, userId)) return NextResponse.json({ error: "Child not found" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    if (!eventId) return NextResponse.json({ error: "eventId is required" }, { status: 400 });

    const result = await db.collection("events").deleteOne({
      id: eventId, childId, eventType: "sleeping", parentId: `user_${userId}`
    });
    if (!result.deletedCount) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE sleep error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}