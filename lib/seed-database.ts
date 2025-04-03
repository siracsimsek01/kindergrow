"use server"

import { v4 as uuidv4 } from "uuid"
import connectToDatabase from "@/lib/mongodb"
import { addDays, subMonths, differenceInDays } from "date-fns"

// Sleep quality options
const sleepQualities = ["poor", "fair", "good", "excellent"] as const

// Sleep locations
const sleepLocations = ["crib", "bassinet", "parent's bed", "stroller", "car seat"] as const

// Helper function to get random item from array
function getRandomItem<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

// Helper function to get random integer between min and max (inclusive)
function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Helper function to get random float between min and max with precision
function getRandomFloat(min: number, max: number, precision = 2): number {
  const value = Math.random() * (max - min) + min
  return Number(value.toFixed(precision))
}

// Helper function to generate random date within range
function getRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

// Helper function to add minutes to date
function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000)
}

// Helper function to create weighted random selection
function weightedRandom<T>(items: T[], weights: number[]): T {
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
  let random = Math.random() * totalWeight

  for (let i = 0; i < items.length; i++) {
    if (random < weights[i]) {
      return items[i]
    }
    random -= weights[i]
  }

  return items[items.length - 1]
}

// Generate sleep entries for a child
async function generateSleepEntriesForChild(childId: string, startDate: Date, endDate: Date, count: number) {
  console.log(`Generating ${count} sleep entries for child ${childId}...`)

  // Connect to database
  const { db } = await connectToDatabase()

  // Get child's info to adjust sleep patterns
  const child = await db.collection("children").findOne({ _id: childId })

  if (!child) {
    throw new Error(`Child with ID ${childId} not found`)
  }

  const childBirthDate = new Date(child.birthDate)
  const childAgeMonths = Math.floor((endDate.getTime() - childBirthDate.getTime()) / (1000 * 60 * 60 * 24 * 30))

  // Create a more realistic sleep schedule based on age
  const sleepSchedule = createAgeAppropriateSchedule(childAgeMonths)

  // Calculate how many days we're generating data for
  const daysDifference = differenceInDays(endDate, startDate) + 1

  // Calculate entries per day (with some randomness)
  const entriesPerDay = Math.max(1, Math.min(count / daysDifference, sleepSchedule.napsPerDay + 1))

  const sleepEntries = []
  let currentDate = new Date(startDate)

  // Generate entries day by day for more realistic patterns
  while (currentDate <= endDate && sleepEntries.length < count) {
    // Determine how many sleep sessions for this day (night sleep + naps)
    const sessionsToday = Math.round(getRandomFloat(entriesPerDay * 0.7, entriesPerDay * 1.3, 0))

    // Always include night sleep if possible
    if (sessionsToday > 0) {
      // Night sleep (starts previous evening, ends this morning)
      const nightStart = new Date(currentDate)
      nightStart.setHours(sleepSchedule.nightSleepStart.hour, getRandomInt(0, 59), 0, 0)

      // If this is not the first day, adjust to previous day
      if (currentDate > startDate) {
        nightStart.setDate(nightStart.getDate() - 1)
      }

      const nightDuration = getRandomInt(sleepSchedule.nightSleepDuration.min, sleepSchedule.nightSleepDuration.max)

      const nightEnd = addMinutes(nightStart, nightDuration)

      // Quality tends to be better for night sleep
      const qualityWeights = [0.1, 0.2, 0.4, 0.3] // poor, fair, good, excellent
      const quality = sleepQualities[weightedRandom([0, 1, 2, 3], qualityWeights)]

      // Location is almost always crib/bassinet for night sleep
      const location = Math.random() > 0.9 ? "parent's bed" : getRandomItem(["crib", "bassinet"])

      // Generate notes sometimes
      const notes = generateSleepNotes(quality, nightDuration, false)

      // Format for MongoDB events collection
      sleepEntries.push({
        _id: uuidv4(),
        childId,
        eventType: "sleeping",
        timestamp: nightStart.toISOString(),
        startTime: nightStart.toISOString(),
        endTime: nightEnd.toISOString(),
        duration: nightDuration / 60, // Convert to hours for consistency with your app
        details: formatSleepDetails(quality, nightDuration, location, notes),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    // Add naps if we have sessions left for today
    const napCount = Math.min(sessionsToday - 1, sleepSchedule.napsPerDay)

    for (let i = 0; i < napCount; i++) {
      // Space naps throughout the day
      const napTimeSlot = sleepSchedule.napTimeSlots[i % sleepSchedule.napTimeSlots.length]

      const napStart = new Date(currentDate)
      napStart.setHours(napTimeSlot.hour, getRandomInt(napTimeSlot.minuteMin, napTimeSlot.minuteMax), 0, 0)

      const napDuration = getRandomInt(sleepSchedule.napDuration.min, sleepSchedule.napDuration.max)

      const napEnd = addMinutes(napStart, napDuration)

      // Nap quality distribution
      const qualityWeights = [0.15, 0.25, 0.4, 0.2] // poor, fair, good, excellent
      const quality = sleepQualities[weightedRandom([0, 1, 2, 3], qualityWeights)]

      // Naps happen in various locations
      const locationWeights = [0.4, 0.2, 0.15, 0.15, 0.1] // crib, bassinet, parent's bed, stroller, car seat
      const locationIndex = weightedRandom([0, 1, 2, 3, 4], locationWeights)
      const location = sleepLocations[locationIndex]

      // Generate notes sometimes
      const notes = generateSleepNotes(quality, napDuration, true)

      // Format for MongoDB events collection
      sleepEntries.push({
        _id: uuidv4(),
        childId,
        eventType: "sleeping",
        timestamp: napStart.toISOString(),
        startTime: napStart.toISOString(),
        endTime: napEnd.toISOString(),
        duration: napDuration / 60, // Convert to hours for consistency with your app
        details: formatSleepDetails(quality, napDuration, location, notes),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    // Move to next day
    currentDate = addDays(currentDate, 1)

    // If we've generated enough entries, break
    if (sleepEntries.length >= count) {
      break
    }
  }

  // Sort by start time
  sleepEntries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  // Limit to requested count
  const finalEntries = sleepEntries.slice(0, count)

  // Create entries in database
  if (finalEntries.length > 0) {
    await db.collection("events").insertMany(finalEntries)
  }

  console.log(`Created ${finalEntries.length} sleep entries for child ${childId}`)
  return finalEntries.length
}

// Format sleep details to match your app's expected format
function formatSleepDetails(quality: string, durationMinutes: number, location: string, notes?: string): string {
  const durationHours = (durationMinutes / 60).toFixed(1)

  let details = `Quality: ${quality}\nDuration: ${durationHours}\nLocation: ${location}`

  if (notes) {
    details += `\nNotes: ${notes}`
  }

  return details
}

// Create age-appropriate sleep schedule
function createAgeAppropriateSchedule(ageMonths: number) {
  if (ageMonths <= 3) {
    // 0-3 months: Many naps, shorter night sleep
    return {
      napsPerDay: 4,
      napTimeSlots: [
        { hour: 9, minuteMin: 0, minuteMax: 30 },
        { hour: 12, minuteMin: 0, minuteMax: 30 },
        { hour: 15, minuteMin: 0, minuteMax: 30 },
        { hour: 18, minuteMin: 0, minuteMax: 30 },
      ],
      napDuration: { min: 30, max: 120 },
      nightSleepStart: { hour: 20, minute: 0 },
      nightSleepDuration: { min: 360, max: 480 }, // 6-8 hours
    }
  } else if (ageMonths <= 6) {
    // 3-6 months: 3-4 naps, longer night sleep
    return {
      napsPerDay: 3,
      napTimeSlots: [
        { hour: 9, minuteMin: 0, minuteMax: 30 },
        { hour: 12, minuteMin: 30, minuteMax: 45 },
        { hour: 15, minuteMin: 30, minuteMax: 45 },
      ],
      napDuration: { min: 45, max: 120 },
      nightSleepStart: { hour: 19, minute: 30 },
      nightSleepDuration: { min: 480, max: 600 }, // 8-10 hours
    }
  } else if (ageMonths <= 12) {
    // 6-12 months: 2-3 naps, consistent night sleep
    return {
      napsPerDay: 2,
      napTimeSlots: [
        { hour: 9, minuteMin: 30, minuteMax: 45 },
        { hour: 13, minuteMin: 0, minuteMax: 30 },
        { hour: 16, minuteMin: 0, minuteMax: 30 },
      ],
      napDuration: { min: 60, max: 120 },
      nightSleepStart: { hour: 19, minute: 0 },
      nightSleepDuration: { min: 540, max: 660 }, // 9-11 hours
    }
  } else if (ageMonths <= 18) {
    // 12-18 months: 1-2 naps, longer night sleep
    return {
      napsPerDay: 2,
      napTimeSlots: [
        { hour: 10, minuteMin: 0, minuteMax: 30 },
        { hour: 14, minuteMin: 0, minuteMax: 30 },
      ],
      napDuration: { min: 60, max: 150 },
      nightSleepStart: { hour: 19, minute: 0 },
      nightSleepDuration: { min: 600, max: 720 }, // 10-12 hours
    }
  } else if (ageMonths <= 36) {
    // 18-36 months: 1 nap, consistent night sleep
    return {
      napsPerDay: 1,
      napTimeSlots: [{ hour: 13, minuteMin: 0, minuteMax: 30 }],
      napDuration: { min: 90, max: 180 },
      nightSleepStart: { hour: 19, minute: 30 },
      nightSleepDuration: { min: 600, max: 720 }, // 10-12 hours
    }
  } else {
    // 3+ years: Occasional nap, consistent night sleep
    return {
      napsPerDay: Math.random() > 0.5 ? 1 : 0,
      napTimeSlots: [{ hour: 13, minuteMin: 30, minuteMax: 45 }],
      napDuration: { min: 60, max: 120 },
      nightSleepStart: { hour: 20, minute: 0 },
      nightSleepDuration: { min: 600, max: 660 }, // 10-11 hours
    }
  }
}

// Generate realistic sleep notes
function generateSleepNotes(quality: string, durationMinutes: number, isNap: boolean): string | undefined {
  // Only generate notes sometimes
  if (Math.random() > 0.7) {
    return undefined
  }

  const noteTemplates = {
    poor: [
      "Woke up crying multiple times",
      "Had trouble falling asleep",
      "Woke up early and couldn't go back to sleep",
      "Very restless sleep",
      "Seemed uncomfortable",
      "Needed lots of soothing",
    ],
    fair: [
      "Woke up once for feeding",
      "Took a while to settle",
      "Woke up briefly but self-soothed",
      "Slightly restless",
      "Needed some rocking to fall asleep",
    ],
    good: [
      "Slept well with minimal waking",
      "Fell asleep quickly",
      "Woke up happy",
      "Good solid sleep",
      "Used white noise machine",
    ],
    excellent: [
      "Slept peacefully through the night",
      "Perfect sleep session",
      "Slept soundly",
      "Woke up very happy and refreshed",
      "Fell asleep independently",
    ],
  }

  // Select base note based on quality
  const baseNote = getRandomItem(noteTemplates[quality as keyof typeof noteTemplates])

  // Add context sometimes
  if (Math.random() > 0.5) {
    const contextTemplates = [
      isNap ? "After active playtime." : "After bath time routine.",
      "Room was slightly cooler than usual.",
      "Used sleep sack.",
      "Had white noise on.",
      isNap ? "In a quiet room." : "With night light on.",
      "Seemed tired earlier than usual.",
    ]

    // Add quality-specific context
    if (quality === "poor" || quality === "fair") {
      contextTemplates.push(
        "Might be teething.",
        "May have had a bad dream.",
        "Was overtired.",
        "Had a busy day.",
        "Might be coming down with something.",
      )
    }

    return `${baseNote} ${getRandomItem(contextTemplates)}`
  }

  return baseNote
}

// Main seed function
export async function seedSleepData(childId: string): Promise<number> {
  try {
    console.log("Starting sleep data seeding...")

    // Connect to database
    const { db } = await connectToDatabase()

    // Check if the child exists
    const child = await db.collection("children").findOne({ _id: childId })

    if (!child) {
      throw new Error("Child not found")
    }

    // Define date range for seed data (last 3 months)
    const endDate = new Date()
    const startDate = subMonths(endDate, 3)

    // Number of entries depends on child's age
    // Younger children have more frequent sleep entries
    const childAgeMonths = child.birthDate
      ? Math.floor((new Date().getTime() - new Date(child.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
      : 12 // Default to 12 months if birthdate not available

    let entriesCount

    if (childAgeMonths <= 3) {
      // Newborns: 4-5 naps + night sleep per day
      entriesCount = 90 * 5 // ~450 entries over 3 months
    } else if (childAgeMonths <= 6) {
      // 3-6 months: 3-4 naps + night sleep per day
      entriesCount = 90 * 4 // ~360 entries over 3 months
    } else if (childAgeMonths <= 12) {
      // 6-12 months: 2-3 naps + night sleep per day
      entriesCount = 90 * 3 // ~270 entries over 3 months
    } else if (childAgeMonths <= 24) {
      // 1-2 years: 1-2 naps + night sleep per day
      entriesCount = 90 * 2 // ~180 entries over 3 months
    } else {
      // 2+ years: 0-1 nap + night sleep per day
      entriesCount = 90 * 1.5 // ~135 entries over 3 months
    }

    // For testing purposes, limit the number of entries
    const count = Math.min(Math.round(entriesCount), 150)

    // First, clear existing sleep data for this child to avoid duplicates
    await db.collection("events").deleteMany({
      childId,
      eventType: "sleeping",
    })

    return await generateSleepEntriesForChild(childId, startDate, endDate, count)
  } catch (error) {
    console.error("Error seeding sleep data:", error)
    throw error
  }
}

// Create sample children with different ages
async function createSampleChildren(userId: string) {
  const { db } = await connectToDatabase()

  // Clear existing children for this user
  await db.collection("children").deleteMany({ userId })

  // Create 4 children with different ages
  const today = new Date()

  const children = [
    {
      _id: uuidv4(),
      name: "Baby Emma",
      birthDate: subMonths(today, 3), // 3 months old
      gender: "female",
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: uuidv4(),
      name: "Toddler Noah",
      birthDate: subMonths(today, 18), // 18 months old
      gender: "male",
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: uuidv4(),
      name: "Preschooler Sophia",
      birthDate: subMonths(today, 36), // 3 years old
      gender: "female",
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: uuidv4(),
      name: "School-age Liam",
      birthDate: subMonths(today, 60), // 5 years old
      gender: "male",
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  await db.collection("children").insertMany(children)
  console.log(`Created ${children.length} sample children`)

  return children
}

// Main database seeding function that your client component is trying to import
export async function seedDatabase() {
  try {
    console.log("Starting database seeding process...")

    // Get the current user
    const { db } = await connectToDatabase()

    // Get the current user or create one if none exists

    // Try to find a user
    let user = await db.collection("users").findOne({})

    // If no user exists, create a sample user
    if (!user) {
      console.log("No user found, creating a sample user...")
      const sampleUser = {
        _id: uuidv4(),
        name: "Sample User",
        email: "sample@example.com",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await db.collection("users").insertOne(sampleUser)
      user = sampleUser
      console.log("Created sample user:", user._id)
    }

    // Clear existing events
    await db.collection("events").deleteMany({ userId: user._id })

    // Create sample children
    const children = await createSampleChildren(user._id)

    // Generate sleep data for each child
    let totalEntries = 0
    for (const child of children) {
      const sleepEntries = await seedSleepData(child._id)
      totalEntries += sleepEntries
    }

    console.log(`Database seeding completed successfully with ${totalEntries} total entries`)

    return {
      success: true,
      message: `Database seeded successfully with ${children.length} children and ${totalEntries} events`,
    }
  } catch (error: any) {
    console.error("Error seeding database:", error)
    return {
      success: false,
      error: error.message || "An unknown error occurred while seeding the database",
    }
  }
}

