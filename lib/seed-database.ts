"use server"

import { auth } from "@clerk/nextjs/server"
import connectToDatabase from "@/lib/mongodb"
import { addDays, subMonths } from "date-fns"

// Seed data constants
const CHILDREN = [
  {
    name: "Emma",
    dateOfBirth: "2022-03-15",
    sex: "Female",
  },
  {
    name: "Noah",
    dateOfBirth: "2021-07-22",
    sex: "Male",
  },
  {
    name: "Olivia",
    dateOfBirth: "2023-01-10",
    sex: "Female",
  },
  {
    name: "Liam",
    dateOfBirth: "2022-11-05",
    sex: "Male",
  },
]

// Event type distributions
const FEEDING_TYPES = ["breast", "formula", "solid", "other"]
const DIAPER_TYPES = ["wet", "dirty", "both"]
const SLEEP_QUALITY = ["good", "fair", "poor"]
const MEDICATION_TYPES = ["acetaminophen", "ibuprofen", "antibiotic", "antihistamine", "vitamin"]

// Helper function to generate a random number between min and max
function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

// Helper function to generate a random date between start and end
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

// Helper function to generate a random item from an array
function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

// Generate feeding events for a child
async function generateFeedingEvents(childId: string, parentId: string, startDate: Date, endDate: Date, db: any) {
  const events = []
  let currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    // Generate 4-8 feeding events per day
    const feedingsPerDay = randomBetween(4, 8)

    for (let i = 0; i < feedingsPerDay; i++) {
      const feedingType = randomItem(FEEDING_TYPES)
      const feedingTime = new Date(currentDate)
      feedingTime.setHours(randomBetween(0, 23), randomBetween(0, 59))

      const endTime = new Date(feedingTime)
      endTime.setMinutes(endTime.getMinutes() + randomBetween(10, 30))

      const amount = feedingType === "breast" ? null : randomBetween(2, 8)

      const details = `Type: ${feedingType}${amount ? `\nAmount: ${amount}` : ""}\nNotes: Regular feeding`

      const eventId = `event_${Math.random().toString(36).substr(2, 9)}`
      const now = new Date().toISOString()

      events.push({
        id: eventId,
        childId,
        parentId,
        eventType: "feeding",
        startTime: feedingTime.toISOString(),
        endTime: endTime.toISOString(),
        details,
        value: amount,
        timestamp: feedingTime.toISOString(),
        createdAt: now,
        updatedAt: now,
      })
    }

    // Move to next day
    currentDate = addDays(currentDate, 1)
  }

  if (events.length > 0) {
    await db.collection("events").insertMany(events)
    console.log(`Added ${events.length} feeding events for child ${childId}`)
  }
}

// Generate sleep events for a child
async function generateSleepEvents(childId: string, parentId: string, startDate: Date, endDate: Date, db: any) {
  const events = []
  let currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    // Generate 2-4 sleep events per day
    const sleepsPerDay = randomBetween(2, 4)

    for (let i = 0; i < sleepsPerDay; i++) {
      const sleepQuality = randomItem(SLEEP_QUALITY)
      const sleepTime = new Date(currentDate)

      // Distribute sleep throughout the day
      if (i === 0) {
        // Night sleep (continues from previous day)
        sleepTime.setHours(0, 0)
        const endTime = new Date(sleepTime)
        endTime.setHours(randomBetween(6, 8), randomBetween(0, 59))

        const details = `Quality: ${sleepQuality}\nNotes: Night sleep`

        const eventId = `event_${Math.random().toString(36).substr(2, 9)}`
        const now = new Date().toISOString()

        events.push({
          id: eventId,
          childId,
          parentId,
          eventType: "sleeping",
          startTime: sleepTime.toISOString(),
          endTime: endTime.toISOString(),
          details,
          timestamp: sleepTime.toISOString(),
          createdAt: now,
          updatedAt: now,
        })
      } else if (i === sleepsPerDay - 1) {
        // Night sleep (continues to next day)
        sleepTime.setHours(randomBetween(19, 21), randomBetween(0, 59))
        const endTime = new Date(sleepTime)
        endTime.setDate(endTime.getDate() + 1)
        endTime.setHours(randomBetween(6, 8), randomBetween(0, 59))

        const details = `Quality: ${sleepQuality}\nNotes: Night sleep`

        const eventId = `event_${Math.random().toString(36).substr(2, 9)}`
        const now = new Date().toISOString()

        events.push({
          id: eventId,
          childId,
          parentId,
          eventType: "sleeping",
          startTime: sleepTime.toISOString(),
          endTime: endTime.toISOString(),
          details,
          timestamp: sleepTime.toISOString(),
          createdAt: now,
          updatedAt: now,
        })
      } else {
        // Nap during the day
        sleepTime.setHours(randomBetween(9, 18), randomBetween(0, 59))
        const endTime = new Date(sleepTime)
        endTime.setMinutes(endTime.getMinutes() + randomBetween(30, 120))

        const details = `Quality: ${sleepQuality}\nNotes: Daytime nap`

        const eventId = `event_${Math.random().toString(36).substr(2, 9)}`
        const now = new Date().toISOString()

        events.push({
          id: eventId,
          childId,
          parentId,
          eventType: "sleeping",
          startTime: sleepTime.toISOString(),
          endTime: endTime.toISOString(),
          details,
          timestamp: sleepTime.toISOString(),
          createdAt: now,
          updatedAt: now,
        })
      }
    }

    // Move to next day
    currentDate = addDays(currentDate, 1)
  }

  if (events.length > 0) {
    await db.collection("events").insertMany(events)
    console.log(`Added ${events.length} sleep events for child ${childId}`)
  }
}

// Generate diaper events for a child
async function generateDiaperEvents(childId: string, parentId: string, startDate: Date, endDate: Date, db: any) {
  const events = []
  let currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    // Generate 6-10 diaper events per day
    const diapersPerDay = randomBetween(6, 10)

    for (let i = 0; i < diapersPerDay; i++) {
      const diaperType = randomItem(DIAPER_TYPES)
      const diaperTime = new Date(currentDate)
      diaperTime.setHours(randomBetween(0, 23), randomBetween(0, 59))

      const details = `Type: ${diaperType}\nNotes: Regular diaper change`

      const eventId = `event_${Math.random().toString(36).substr(2, 9)}`
      const now = new Date().toISOString()

      events.push({
        id: eventId,
        childId,
        parentId,
        eventType: "diaper",
        startTime: diaperTime.toISOString(),
        endTime: diaperTime.toISOString(),
        details,
        timestamp: diaperTime.toISOString(),
        createdAt: now,
        updatedAt: now,
      })
    }

    // Move to next day
    currentDate = addDays(currentDate, 1)
  }

  if (events.length > 0) {
    await db.collection("events").insertMany(events)
    console.log(`Added ${events.length} diaper events for child ${childId}`)
  }
}

// Generate growth events for a child
async function generateGrowthEvents(
  childId: string,
  parentId: string,
  startDate: Date,
  endDate: Date,
  childDob: string,
  db: any,
) {
  const events = []
  let currentDate = new Date(startDate)

  // Calculate age in months at start date
  const dobDate = new Date(childDob)
  const ageInMonthsAtStart =
    (startDate.getFullYear() - dobDate.getFullYear()) * 12 + (startDate.getMonth() - dobDate.getMonth())

  // Generate monthly growth records
  while (currentDate <= endDate) {
    const growthTime = new Date(currentDate)
    growthTime.setDate(randomBetween(1, 28)) // Random day of the month
    growthTime.setHours(randomBetween(8, 20), randomBetween(0, 59))

    // Calculate expected weight and height based on age
    // These are simplified calculations and not medically accurate
    const ageInMonths =
      ageInMonthsAtStart +
      ((currentDate.getFullYear() - startDate.getFullYear()) * 12 + (currentDate.getMonth() - startDate.getMonth()))

    // Weight in kg: starts around 3.5kg and increases
    const baseWeight = 3.5
    const weightGain = ageInMonths < 6 ? 0.7 : ageInMonths < 12 ? 0.5 : 0.3
    const weight = baseWeight + ageInMonths * weightGain + (Math.random() * 0.5 - 0.25)

    // Height in cm: starts around 50cm and increases
    const baseHeight = 50
    const heightGain = ageInMonths < 6 ? 2.5 : ageInMonths < 12 ? 1.5 : 1.0
    const height = baseHeight + ageInMonths * heightGain + (Math.random() * 2 - 1)

    const details = `Weight: ${weight.toFixed(2)}\nHeight: ${height.toFixed(1)}\nNotes: Monthly checkup`

    const eventId = `event_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()

    events.push({
      id: eventId,
      childId,
      parentId,
      eventType: "growth",
      startTime: growthTime.toISOString(),
      endTime: growthTime.toISOString(),
      details,
      value: weight,
      timestamp: growthTime.toISOString(),
      createdAt: now,
      updatedAt: now,
    })

    // Move to next month
    currentDate = addDays(currentDate, 30)
  }

  if (events.length > 0) {
    await db.collection("events").insertMany(events)
    console.log(`Added ${events.length} growth events for child ${childId}`)
  }
}

// Generate medication events for a child
async function generateMedicationEvents(childId: string, parentId: string, startDate: Date, endDate: Date, db: any) {
  const events = []
  let currentDate = new Date(startDate)

  // Generate random medication events (less frequent)
  while (currentDate <= endDate) {
    // 20% chance of medication on any given day
    if (Math.random() < 0.2) {
      const medicationsPerDay = randomBetween(1, 3)

      for (let i = 0; i < medicationsPerDay; i++) {
        const medicationType = randomItem(MEDICATION_TYPES)
        const medicationTime = new Date(currentDate)
        medicationTime.setHours(randomBetween(8, 20), randomBetween(0, 59))

        // Dosage depends on medication type
        let dosage = 0
        if (medicationType === "acetaminophen" || medicationType === "ibuprofen") {
          dosage = randomBetween(2, 5) * 2.5 // 5-12.5 ml
        } else if (medicationType === "antibiotic") {
          dosage = randomBetween(1, 3) * 5 // 5-15 ml
        } else {
          dosage = randomBetween(1, 2) // 1-2 ml or tablets
        }

        const details = `Medication: ${medicationType}\nDosage: ${dosage}\nFrequency: once\nInstructions: As needed for symptoms`

        const eventId = `event_${Math.random().toString(36).substr(2, 9)}`
        const now = new Date().toISOString()

        events.push({
          id: eventId,
          childId,
          parentId,
          eventType: "medication",
          startTime: medicationTime.toISOString(),
          endTime: medicationTime.toISOString(),
          details,
          value: dosage,
          timestamp: medicationTime.toISOString(),
          createdAt: now,
          updatedAt: now,
        })
      }
    }

    // Move to next day
    currentDate = addDays(currentDate, 1)
  }

  if (events.length > 0) {
    await db.collection("events").insertMany(events)
    console.log(`Added ${events.length} medication events for child ${childId}`)
  }
}

// Generate temperature events for a child
async function generateTemperatureEvents(childId: string, parentId: string, startDate: Date, endDate: Date, db: any) {
  const events = []
  let currentDate = new Date(startDate)

  // Generate temperature events (weekly routine + when sick)
  while (currentDate <= endDate) {
    // Weekly routine check (every 7 days)
    if (currentDate.getDay() === 0) {
      // Sunday
      const tempTime = new Date(currentDate)
      tempTime.setHours(randomBetween(8, 20), randomBetween(0, 59))

      // Normal temperature with slight variation
      const temp = 36.5 + (Math.random() * 0.6 - 0.3)

      const details = `Temperature: ${temp.toFixed(1)}\nUnit: celsius\nNotes: Routine check`

      const eventId = `event_${Math.random().toString(36).substr(2, 9)}`
      const now = new Date().toISOString()

      events.push({
        id: eventId,
        childId,
        parentId,
        eventType: "temperature",
        startTime: tempTime.toISOString(),
        endTime: tempTime.toISOString(),
        details,
        value: temp,
        timestamp: tempTime.toISOString(),
        createdAt: now,
        updatedAt: now,
      })
    }

    // Occasional fever (5% chance on any day)
    if (Math.random() < 0.05) {
      // Generate 2-4 temperature readings for the fever
      const readingsCount = randomBetween(2, 4)

      for (let i = 0; i < readingsCount; i++) {
        const tempTime = new Date(currentDate)
        tempTime.setHours(randomBetween(8, 20), randomBetween(0, 59))

        // Fever temperature
        const temp = 37.8 + Math.random() * 1.2

        const details = `Temperature: ${temp.toFixed(1)}\nUnit: celsius\nNotes: Fever check`

        const eventId = `event_${Math.random().toString(36).substr(2, 9)}`
        const now = new Date().toISOString()

        events.push({
          id: eventId,
          childId,
          parentId,
          eventType: "temperature",
          startTime: tempTime.toISOString(),
          endTime: tempTime.toISOString(),
          details,
          value: temp,
          timestamp: tempTime.toISOString(),
          createdAt: now,
          updatedAt: now,
        })
      }
    }

    // Move to next day
    currentDate = addDays(currentDate, 1)
  }

  if (events.length > 0) {
    await db.collection("events").insertMany(events)
    console.log(`Added ${events.length} temperature events for child ${childId}`)
  }
}

// Main seeding function
export async function seedDatabase() {
  try {
    const { userId } = await auth()
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const { db } = await connectToDatabase()

    // Clear existing data for this user
    await db.collection("children").deleteMany({ parentId: `user_${userId}` })

    // Add children
    const childrenData = []
    for (const child of CHILDREN) {
      const now = new Date().toISOString()
      const childId = `child_${Math.random().toString(36).substr(2, 9)}`

      childrenData.push({
        id: childId,
        parentId: `user_${userId}`,
        name: child.name,
        dateOfBirth: child.dateOfBirth,
        sex: child.sex,
        photoUrl: null,
        createdAt: now,
        updatedAt: now,
      })
    }

    const result = await db.collection("children").insertMany(childrenData)
    console.log(`Added ${childrenData.length} children`)

    // Delete existing events for these children
    const childIds = childrenData.map((child) => child.id)
    await db.collection("events").deleteMany({ childId: { $in: childIds } })

    // Generate a year of data for each child
    const endDate = new Date()
    const startDate = subMonths(endDate, 12) // 1 year of data

    for (let i = 0; i < childrenData.length; i++) {
      const child = childrenData[i]

      // Generate events for each child
      await generateFeedingEvents(child.id, `user_${userId}`, startDate, endDate, db)
      await generateSleepEvents(child.id, `user_${userId}`, startDate, endDate, db)
      await generateDiaperEvents(child.id, `user_${userId}`, startDate, endDate, db)
      await generateGrowthEvents(child.id, `user_${userId}`, startDate, endDate, CHILDREN[i].dateOfBirth, db)
      await generateMedicationEvents(child.id, `user_${userId}`, startDate, endDate, db)
      await generateTemperatureEvents(child.id, `user_${userId}`, startDate, endDate, db)
    }

    return { success: true, message: "Database seeded successfully" }
  } catch (error) {
    console.error("Error seeding database:", error)
    return { success: false, error: error.message }
  }
}

