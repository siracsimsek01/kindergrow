import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"

export async function GET(request: Request, { params }: { params: { childId: string } }) {
  try {
    // Get the authenticated user from Clerk
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const childId = params.childId

    // Verify child belongs to user
    const child = await prisma.child.findFirst({
      where: {
        id: childId,
        userId,
      },
    })

    if (!child) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 })
    }

    return NextResponse.json(child)
  } catch (error: any) {
    console.error("Error fetching child:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { childId: string } }) {
  try {
    // Get the authenticated user from Clerk
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const childId = params.childId

    // Verify child belongs to user
    const existingChild = await prisma.child.findFirst({
      where: {
        id: childId,
        userId,
      },
    })

    if (!existingChild) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 })
    }

    // Parse request body
    const body = await request.json()

    // Update child
    const updatedChild = await prisma.child.update({
      where: {
        id: childId,
      },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        birthDate: body.birthDate !== undefined ? new Date(body.birthDate) : undefined,
        gender: body.gender !== undefined ? body.gender : undefined,
      },
    })

    return NextResponse.json(updatedChild)
  } catch (error: any) {
    console.error("Error updating child:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { childId: string } }) {
  try {
    // Get the authenticated user from Clerk
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const childId = params.childId

    // Verify child belongs to user
    const existingChild = await prisma.child.findFirst({
      where: {
        id: childId,
        userId,
      },
    })

    if (!existingChild) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 })
    }

    // Delete all events for this child first
    await prisma.event.deleteMany({
      where: {
        childId,
      },
    })

    // Delete the child
    await prisma.child.delete({
      where: {
        id: childId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting child:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
