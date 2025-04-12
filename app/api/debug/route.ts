import { NextResponse } from "next/server"
import { prisma, testConnection } from "@/lib/db"

export async function GET() {
  try {
    // Test the database connection
    const isConnected = await testConnection()

    // Get counts for debugging
    const userCount = await prisma.user.count()
    const childCount = await prisma.child.count()
    const eventCount = await prisma.event.count()

    return NextResponse.json({
      status: isConnected ? "Connected" : "Disconnected",
      counts: {
        users: userCount,
        children: childCount,
        events: eventCount,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Database debug error:", error)
    return NextResponse.json(
      {
        status: "Error",
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
