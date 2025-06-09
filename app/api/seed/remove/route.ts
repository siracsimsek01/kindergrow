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

    // Use the same parentId format as seeding: 'user_' + userId
    const parentId = `user_${userId}`
    
    console.log(`Removing seeded data for parentId: ${parentId}`)

    // Find all children for this user (by parentId)
    const children = await db.collection("children").find({ parentId }).toArray()
    console.log(`Found ${children.length} children to delete`)

    // Delete all events for all children first
    if (children.length > 0) {
      const childIds = children.map(child => child.id)
      const eventDeleteResult = await db.collection("events").deleteMany({ 
        childId: { $in: childIds } 
      })
      console.log(`Deleted ${eventDeleteResult.deletedCount} events`)
    }

    // Delete all children for this user (by parentId)
    const childDeleteResult = await db.collection("children").deleteMany({ parentId })
    console.log(`Deleted ${childDeleteResult.deletedCount} children`)

    return NextResponse.json({ 
      success: true, 
      message: `Removed ${childDeleteResult.deletedCount} children and their events`
    })
  } catch (error) {
    console.error("Error removing seeded data:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

