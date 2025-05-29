import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/mongodb";
import { ObjectId } from "mongodb";

async function checkChildOwnership(db, childId, userId) {
  return await db.collection("children").findOne({ id: childId, parentId: `user_${userId}` });
}

// GET: Fetch growth records for a child (optional startDate/endDate)
export async function GET(request: NextRequest, context : { params : { id: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { db } = await connectToDatabase();
    const childId = context.params.id;
    if (!await checkChildOwnership(db, childId, userId))
      return NextResponse.json({ error: "Child not found" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const query: any = { childId, eventType: "growth" };
    if (startDate) query.timestamp = { $gte: new Date(startDate).toISOString() };
    if (endDate) query.timestamp = { ...(query.timestamp || {}), $lte: new Date(endDate).toISOString() };

    const records = await db.collection("events").find(query).sort({ timestamp: -1 }).toArray();
    return NextResponse.json(records);
  } catch (error) {
    console.error("[GET] /api/children/[id]/growth error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Add new growth record
export async function POST(request: NextRequest, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { db } = await connectToDatabase();
    const childId = params.id;
    if (!await checkChildOwnership(db, childId, userId))
      return NextResponse.json({ error: "Child not found" }, { status: 404 });

    const body = await request.json();
    const { height, weight, heightUnit, weightUnit, notes } = body;
    if (height === undefined || weight === undefined)
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const entry = {
      id: new ObjectId().toString(),
      childId,
      parentId: `user_${userId}`,
      eventType: "growth",
      height,
      heightUnit: heightUnit || "cm",
      weight,
      weightUnit: weightUnit || "kg",
      notes: notes || "",
      timestamp: new Date().toISOString(),
    };

    await db.collection("events").insertOne(entry);
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("[POST] /api/children/[id]/growth error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH: Update a growth record (eventId in query param)
export async function PATCH(request: NextRequest, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { db } = await connectToDatabase();
    const childId = params.id;
    if (!await checkChildOwnership(db, childId, userId))
      return NextResponse.json({ error: "Child not found" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    if (!eventId) return NextResponse.json({ error: "eventId query param is required" }, { status: 400 });

    const body = await request.json();
    const updateFields: any = {};
    ["height", "heightUnit", "weight", "weightUnit", "notes"].forEach((field) => {
      if (body[field] !== undefined) updateFields[field] = body[field];
    });
    updateFields.updatedAt = new Date().toISOString();

    const result = await db.collection("events").findOneAndUpdate(
      { id: eventId, childId, eventType: "growth", parentId: `user_${userId}` },
      { $set: updateFields },
      { returnDocument: "after" }
    );
    if (!result.value) return NextResponse.json({ error: "Growth record not found" }, { status: 404 });

    return NextResponse.json(result.value);
  } catch (error) {
    console.error("[PATCH] /api/children/[id]/growth error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Remove a growth record (eventId in query param)
export async function DELETE(request: NextRequest, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { db } = await connectToDatabase();
    const childId = params.id;
    if (!await checkChildOwnership(db, childId, userId))
      return NextResponse.json({ error: "Child not found" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    if (!eventId) return NextResponse.json({ error: "eventId query param is required" }, { status: 400 });

    const result = await db.collection("events").deleteOne({
      id: eventId, childId, eventType: "growth", parentId: `user_${userId}`,
    });

    if (!result.deletedCount) return NextResponse.json({ error: "Growth record not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE] /api/children/[id]/growth error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}