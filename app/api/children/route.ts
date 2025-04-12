import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    // Get the authenticated user from Clerk
    const { userId } = await auth()

    if (!userId) {
      console.log("Unauthorized access attempt to /api/children")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`Fetching children for user: ${userId}`)

    // Get children for user
    const children = await prisma.child.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })

    console.log(`Found ${children.length} children for user ${userId}`)
    return NextResponse.json(children)
  } catch (error: any) {
    console.error("Error fetching children:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Get the authenticated user from Clerk
    const { userId } = await auth()

    if (!userId) {
      console.log("Unauthorized access attempt to POST /api/children")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    console.log(`Creating child for user ${userId}:`, body)

    // Validate required fields
    if (!body.name || !body.birthDate || !body.gender) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create child
    const child = await prisma.child.create({
      data: {
        name: body.name,
        birthDate: new Date(body.birthDate),
        gender: body.gender,
        userId,
      },
    })

    console.log(`Child created successfully:`, child)
    return NextResponse.json(child)
  } catch (error: any) {
    console.error("Error creating child:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
