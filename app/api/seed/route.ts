import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { seedDatabase } from "@/lib/seed-database"

export async function POST(request: Request) {
  try {
    // Get the authenticated user from Clerk
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const childId = searchParams.get("childId")

    if (!childId) {
      return NextResponse.json({ error: "Child ID is required" }, { status: 400 })
    }

    // Seed the database with sleep data
    const count = await seedDatabase()

    return NextResponse.json({ success: true, count })
  } catch (error: any) {
    console.error("Error seeding database:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

