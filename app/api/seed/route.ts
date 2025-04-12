import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"

export async function POST() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`Starting database seeding for user: ${userId}`)

    // Check if user exists in database
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    // Create user if not exists
    if (!user) {
      console.log(`Creating new user record for Clerk ID: ${userId}`)
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: "user@example.com", // This will be updated by Clerk webhook later
          name: "Test User",
        },
      })
      console.log(`Created user with ID: ${user.id}`)
    } else {
      console.log(`Found existing user with ID: ${user.id}`)
    }

    // Delete existing children and events for clean seeding
    console.log(`Cleaning existing data for user: ${user.id}`)
    const existingChildren = await prisma.child.findMany({
      where: { userId: user.id },
      select: { id: true },
    })

    for (const child of existingChildren) {
      await prisma.event.deleteMany({
        where: { childId: child.id },
      })
    }

    await prisma.child.deleteMany({
      where: { userId: user.id },
    })

    console.log(`Deleted existing children and events`)

    // Create sample children
    console.log(`Creating sample children`)
    const child1 = await prisma.child.create({
      data: {
        name: "Baby Alex",
        birthDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year old
        gender: "Male",
        userId: user.id,
      },
    })
    console.log(`Created child 1: ${child1.id}`)

    const child2 = await prisma.child.create({
      data: {
        name: "Baby Emma",
        birthDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 6 months old
        gender: "Female",
        userId: user.id,
      },
    })
    console.log(`Created child 2: ${child2.id}`)

    // Create sample sleep events for child1
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)

    console.log(`Creating sample events`)

    // Create events one by one to avoid potential issues
    await prisma.event.create({
      data: {
        childId: child1.id,
        userId: user.id,
        eventType: "sleeping",
        timestamp: new Date(yesterday.setHours(20, 0, 0)),
        details: "Quality: Good\nNotes: Slept through the night",
      },
    })

    await prisma.event.create({
      data: {
        childId: child1.id,
        userId: user.id,
        eventType: "sleeping",
        timestamp: new Date(now.setHours(8, 0, 0)),
        details: "Quality: Excellent\nNotes: Morning nap",
      },
    })

    await prisma.event.create({
      data: {
        childId: child1.id,
        userId: user.id,
        eventType: "feeding",
        timestamp: new Date(now.setHours(12, 0, 0)),
        details: "Type: Breast milk\nAmount: 120ml\nNotes: Fed well",
      },
    })

    await prisma.event.create({
      data: {
        childId: child1.id,
        userId: user.id,
        eventType: "diaper",
        timestamp: new Date(now.setHours(14, 0, 0)),
        details: "Type: Wet\nNotes: Normal",
      },
    })

    await prisma.event.create({
      data: {
        childId: child1.id,
        userId: user.id,
        eventType: "growth",
        timestamp: new Date(now.setHours(9, 0, 0)),
        details: "Height: 75cm\nWeight: 9.5kg",
        value: 9.5, // Weight in kg
      },
    })

    await prisma.event.create({
      data: {
        childId: child1.id,
        userId: user.id,
        eventType: "temperature",
        timestamp: new Date(now.setHours(16, 0, 0)),
        details: "Normal temperature",
        value: 36.8, // Temperature in Celsius
      },
    })

    await prisma.event.create({
      data: {
        childId: child1.id,
        userId: user.id,
        eventType: "medication",
        timestamp: new Date(now.setHours(18, 0, 0)),
        details: "Medication: Paracetamol\nDosage: 5ml\nReason: Slight fever",
      },
    })

    // Create sample events for child2
    await prisma.event.create({
      data: {
        childId: child2.id,
        userId: user.id,
        eventType: "sleeping",
        timestamp: new Date(yesterday.setHours(19, 0, 0)),
        details: "Quality: Fair\nNotes: Woke up twice",
      },
    })

    await prisma.event.create({
      data: {
        childId: child2.id,
        userId: user.id,
        eventType: "feeding",
        timestamp: new Date(now.setHours(11, 0, 0)),
        details: "Type: Formula\nAmount: 90ml\nNotes: Fed well",
      },
    })

    await prisma.event.create({
      data: {
        childId: child2.id,
        userId: user.id,
        eventType: "diaper",
        timestamp: new Date(now.setHours(13, 0, 0)),
        details: "Type: Dirty\nNotes: Normal",
      },
    })

    await prisma.event.create({
      data: {
        childId: child2.id,
        userId: user.id,
        eventType: "growth",
        timestamp: new Date(now.setHours(10, 0, 0)),
        details: "Height: 65cm\nWeight: 7.2kg",
        value: 7.2, // Weight in kg
      },
    })

    console.log(`Database seeding completed successfully`)

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      data: {
        user,
        children: [child1, child2],
        eventsCount: 11, // Total number of events created
      },
    })
  } catch (error) {
    console.error("Error seeding database:", error)
    return NextResponse.json(
      {
        error: "Failed to seed database",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
