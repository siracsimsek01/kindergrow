import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the child ID from the URL
    const childId =  context.params.id;

    const { db } = await connectToDatabase();

    // Look up the child by either the Mongo ObjectId or string id
    const child = await db.collection("children").findOne({
      $or: [
        { _id: ObjectId.isValid(childId) ? new ObjectId(childId) : undefined },
        { id: childId },
      ],
      parentId: `user_${userId}`,
    });

    if (!child) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    // Always use the unique child ID used in your events
    const actualChildId = child.id || child._id.toString();

    // Fetch all events for this child (sorted by newest first)
    const events = await db
      .collection("events")
      .find({
        childId: actualChildId,
        parentId: `user_${userId}`,
      })
      .sort({ timestamp: -1 })
      .toArray();

    // If your events use MongoDB _id, convert them to string for frontend safety
    const serializedEvents = events.map((event) => ({
      ...event,
      _id: event._id?.toString?.() ?? undefined,
    }));

    return NextResponse.json(serializedEvents, { status: 200 });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}