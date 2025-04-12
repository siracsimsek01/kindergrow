import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"

export async function POST() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`Starting database cleanup for user: ${userId}`)

    // Check if user exists in database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log(`Found user with ID: ${user.id}`)

    // Get all children for this user
    const children = await prisma.child.findMany({
      where: { userId: user.id },
      select: { id: true },
    })

    console.log(`Found ${children.length} children to clean up`)

    // Delete all events for each child
    for (const child of children) {
      const deletedEvents = await prisma.event.deleteMany({
        where: { childId: child.id },
      })
      console.log(`Deleted ${deletedEvents.count} events for child ${child.id}`)
    }

    // Delete all children
    const deletedChildren = await prisma.child.deleteMany({
      where: { userId: user.id },
    })

    console.log(`Deleted ${deletedChildren.count} children`)

    return NextResponse.json({
      success: true,
      message: "Database cleared successfully",
      data: {
        deletedChildren: deletedChildren.count,
      },
    })
  } catch (error) {
    console.error("Error clearing database:", error)
    return NextResponse.json(
      {
        error: "Failed to clear database",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
