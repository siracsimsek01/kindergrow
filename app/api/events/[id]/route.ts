import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { auth } from "@clerk/nextjs/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const id = params.id

    // Create a query that works for both ObjectId and string IDs
    const query = {
      parentId: `user_${userId}`, // Only return events belonging to the authenticated user
    }

    // Add ID condition based on whether it's a valid ObjectId or not
    if (ObjectId.isValid(id)) {
      query["$or"] = [{ _id: new ObjectId(id) }, { id: id }]
    } else {
      query["id"] = id
    }

    const event = await db.collection("events").findOne(query)

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 })
    }

    // Convert MongoDB _id to string to avoid serialization issues
    const serializedEvent = {
      ...event,
      _id: event._id.toString(),
    }

    return NextResponse.json(serializedEvent)
  } catch (error) {
    console.error("Error fetching event:", error)
    return NextResponse.json({ message: "Failed to fetch event" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const id = params.id
    const data = await request.json()

    // Remove fields that shouldn't be updated
    delete data._id
    delete data.id
    delete data.childId
    delete data.eventType
    delete data.parentId

    // Add updatedAt timestamp
    data.updatedAt = new Date().toISOString()

    // Create a query that works for both ObjectId and string IDs
    const query = {
      parentId: `user_${userId}`, // Only update if event belongs to the authenticated user
    }

    // Add ID condition based on whether it's a valid ObjectId or not
    if (ObjectId.isValid(id)) {
      query["$or"] = [{ _id: new ObjectId(id) }, { id: id }]
    } else {
      query["id"] = id
    }

    // First check if the event belongs to the authenticated user
    const eventCheck = await db.collection("events").findOne(query)

    if (!eventCheck) {
      return NextResponse.json({ message: "Event not found or unauthorized" }, { status: 404 })
    }

    const result = await db.collection("events").updateOne(query, { $set: data })

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 })
    }

    const updatedEvent = await db.collection("events").findOne(query)

    // Convert MongoDB _id to string to avoid serialization issues
    const serializedEvent = {
      ...updatedEvent,
      _id: updatedEvent._id.toString(),
    }

    return NextResponse.json(serializedEvent)
  } catch (error) {
    console.error("Error updating event:", error)
    return NextResponse.json({ message: "Failed to update event" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const id = params.id

    // Create a query that works for both ObjectId and string IDs
    const query = {
      parentId: `user_${userId}`, // Only delete if event belongs to the authenticated user
    }

    // Add ID condition based on whether it's a valid ObjectId or not
    if (ObjectId.isValid(id)) {
      query["$or"] = [{ _id: new ObjectId(id) }, { id: id }]
    } else {
      query["id"] = id
    }

    // First check if the event belongs to the authenticated user
    const eventCheck = await db.collection("events").findOne(query)

    if (!eventCheck) {
      return NextResponse.json({ message: "Event not found or unauthorized" }, { status: 404 })
    }

    const result = await db.collection("events").deleteOne(query)

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Event deleted successfully" })
  } catch (error) {
    console.error("Error deleting event:", error)
    return NextResponse.json({ message: "Failed to delete event" }, { status: 500 })
  }
}

