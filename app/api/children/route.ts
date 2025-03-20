import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import connectToDatabase from "@/lib/mongodb"

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    const children = await db
      .collection("children")
      .find({ parentId: `user_${userId}` })
      .toArray()

    console.log(`Fetched ${children.length} children for user ${userId}`)
    return NextResponse.json(children)
  } catch (error) {
    console.error("Error fetching children:", error)
    return NextResponse.json({ error: "Failed to fetch children" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    const data = await request.json()
    const now = new Date().toISOString()

    const childData = {
      id: `child_${Math.random().toString(36).substr(2, 9)}`,
      parentId: `user_${userId}`,
      name: data.name,
      dateOfBirth: data.dateOfBirth,
      sex: data.sex,
      photoUrl: data.photoUrl || null,
      createdAt: now,
      updatedAt: now,
    }

    console.log("Adding child via API:", childData)
    const result = await db.collection("children").insertOne(childData)
    console.log("Child added, result:", result)

    return NextResponse.json({ ...childData, _id: result.insertedId })
  } catch (error) {
    console.error("Error adding child:", error)
    return NextResponse.json({ error: "Failed to add child" }, { status: 500 })
  }
}
