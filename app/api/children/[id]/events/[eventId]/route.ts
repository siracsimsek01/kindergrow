import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Utility to check child ownership
async function checkChildOwnership(db, childId, userId) {
  return await db.collection("children").findOne({ id: childId, parentId: `user_${userId}` });
}

// Utility to check event ownership
async function checkEventOwnership(db, eventId, childId, userId) {
  return await db.collection("events").findOne({ id: eventId, childId, parentId: `user_${userId}` });
}

// GET: Fetch one event
export async function GET(request: NextRequest, context : { params  : { id: string, eventId: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { db } = await connectToDatabase();
    const { id: childId, eventId } = context.params;

    if (!await checkChildOwnership(db, childId, userId))
      return NextResponse.json({ error: "Child not found" }, { status: 404 });

    const event = await db.collection("events").findOne({ id: eventId, childId, parentId: `user_${userId}` });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    return NextResponse.json(event);
  } catch (error) {
    console.error("[GET] /api/children/[id]/events/[eventId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH: Update one event (partial update)
export async function PATCH(request: NextRequest, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { db } = await connectToDatabase();
    const { id: childId, eventId } = params;

    if (!await checkChildOwnership(db, childId, userId))
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    if (!await checkEventOwnership(db, eventId, childId, userId))
      return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const update = await request.json();
    update.updatedAt = new Date().toISOString();

    const result = await db.collection("events").findOneAndUpdate(
      { id: eventId, childId, parentId: `user_${userId}` },
      { $set: update },
      { returnDocument: "after" }
    );
    if (!result.value) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    return NextResponse.json(result.value);
  } catch (error) {
    console.error("[PATCH] /api/children/[id]/events/[eventId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Remove one event
export async function DELETE(request: NextRequest, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { db } = await connectToDatabase();
    const { id: childId, eventId } = params;

    if (!await checkChildOwnership(db, childId, userId))
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    if (!await checkEventOwnership(db, eventId, childId, userId))
      return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const result = await db.collection("events").deleteOne({
      id: eventId, childId, parentId: `user_${userId}`
    });

    if (!result.deletedCount) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE] /api/children/[id]/events/[eventId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}