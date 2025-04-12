import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error: any) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (existingUser) {
      // Update existing user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          name: body.name,
          email: body.email,
          image: body.image,
        },
      })

      return NextResponse.json(updatedUser)
    }

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        id: userId,
        name: body.name,
        email: body.email,
        image: body.image,
      },
    })

    return NextResponse.json(newUser)
  } catch (error: any) {
    console.error("Error creating/updating user:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
