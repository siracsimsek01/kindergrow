import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import connectToDatabase from "@/lib/mongodb"

export async function DELETE() {
  try {
    // Get the authenticated user from Clerk
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Get the current user
    const user = await db.collection("users").findOne({ clerkId: userId })

    if (!user) {
      // If user doesn't exist in our database yet, there's nothing to delete
      return NextResponse.json({ success: true, message: "No data to remove" })
    }

    // Delete all children and associated data for this user
    const children = await db.collection("children").find({ userId: user._id }).toArray()

    for (const child of children) {
      // Delete all events for this child
      await db.collection("events").deleteMany({ childId: child._id })
    }

    // Delete all children
    await db.collection("children").deleteMany({ userId: user._id })

    return NextResponse.json({ success: true, message: "All seeded data has been removed" })
  } catch (error: any) {
    console.error("Error removing seeded data:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

