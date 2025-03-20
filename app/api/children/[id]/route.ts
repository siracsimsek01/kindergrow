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
      parentId: `user_${userId}`, // Only return child if it belongs to the authenticated user
    }

    // Add ID condition based on whether it's a valid ObjectId or not
    if (ObjectId.isValid(id)) {
      query["$or"] = [{ _id: new ObjectId(id) }, { id: id }]
    } else {
      query["id"] = id
    }

    const child = await db.collection("children").findOne(query)

    if (!child) {
      return NextResponse.json({ message: "Child not found" }, { status: 404 })
    }

    // Convert MongoDB _id to string to avoid serialization issues
    const serializedChild = {
      ...child,
      _id: child._id.toString(),
    }

    return NextResponse.json(serializedChild)
  } catch (error) {
    console.error("Error fetching child:", error)
    return NextResponse.json({ message: "Failed to fetch child" }, { status: 500 })
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
    delete data.parentId

    // Add updatedAt timestamp
    data.updatedAt = new Date().toISOString()

    // Create a query that works for both ObjectId and string IDs
    const query = {
      parentId: `user_${userId}`, // Only update if child belongs to the authenticated user
    }

    // Add ID condition based on whether it's a valid ObjectId or not
    if (ObjectId.isValid(id)) {
      query["$or"] = [{ _id: new ObjectId(id) }, { id: id }]
    } else {
      query["id"] = id
    }

    // First check if the child belongs to the authenticated user
    const childCheck = await db.collection("children").findOne(query)

    if (!childCheck) {
      return NextResponse.json({ message: "Child not found or unauthorized" }, { status: 404 })
    }

    const result = await db.collection("children").updateOne(query, { $set: data })

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Child not found" }, { status: 404 })
    }

    const updatedChild = await db.collection("children").findOne(query)

    // Convert MongoDB _id to string to avoid serialization issues
    const serializedChild = {
      ...updatedChild,
      _id: updatedChild._id.toString(),
    }

    return NextResponse.json(serializedChild)
  } catch (error) {
    console.error("Error updating child:", error)
    return NextResponse.json({ message: "Failed to update child" }, { status: 500 })
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
      parentId: `user_${userId}`, // Only delete if child belongs to the authenticated user
    }

    // Add ID condition based on whether it's a valid ObjectId or not
    if (ObjectId.isValid(id)) {
      query["$or"] = [{ _id: new ObjectId(id) }, { id: id }]
    } else {
      query["id"] = id
    }

    // First check if the child belongs to the authenticated user
    const childCheck = await db.collection("children").findOne(query)

    if (!childCheck) {
      return NextResponse.json({ message: "Child not found or unauthorized" }, { status: 404 })
    }

    const result = await db.collection("children").deleteOne(query)

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Child not found" }, { status: 404 })
    }

    // Delete all events associated with this child
    await db.collection("events").deleteMany({
      childId: id,
      parentId: `user_${userId}`, // Only delete events that belong to the authenticated user
    })

    return NextResponse.json({ message: "Child deleted successfully" })
  } catch (error) {
    console.error("Error deleting child:", error)
    return NextResponse.json({ message: "Failed to delete child" }, { status: 500 })
  }
}

