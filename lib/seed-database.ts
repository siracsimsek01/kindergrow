"use server"

import { auth } from "@clerk/nextjs/server"
import connectToDatabase from "@/lib/mongodb"
import { addDays, subMonths } from "date-fns"

// Seed data constants with updated birth dates to create more realistic ages for 2025
const CHILDREN = [
  {
    name: "Emma",
    dateOfBirth: "2021-06-15", // ~4 years old
    sex: "Female",
  },
  {
    name: "Noah", 
    dateOfBirth: "2022-08-22", // ~2.8 years old
    sex: "Male",
  },
  {
    name: "Olivia",
    dateOfBirth: "2023-12-10", // ~1.5 years old
    sex: "Female",
  },
  {
    name: "Liam",
    dateOfBirth: "2024-08-15", // ~9 months old
    sex: "Male",
  },
]

// Event type distributions - improved variety
const FEEDING_TYPES = ["breast", "bottle", "solid", "snack", "water"]  // Changed "formula" to "bottle" to match chart parsing
const DIAPER_TYPES = ["Wet", "Dirty", "Mixed", "Dry"]
const SLEEP_QUALITY = ["good", "fair", "poor", "excellent"]
const MEDICATION_TYPES = ["acetaminophen", "ibuprofen", "antibiotic", "antihistamine", "vitamin", "probiotic"]

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
    // Generate realistic feeding times throughout the day
    const feedingTimes = []
    
    // Early morning feeding (5-7 AM)
    feedingTimes.push(randomBetween(5, 7))
    
    // Morning feeding (8-10 AM)
    feedingTimes.push(randomBetween(8, 10))
    
    // Lunch feeding (11-13 PM)
    feedingTimes.push(randomBetween(11, 13))
    
    // Afternoon feeding (14-16 PM)
    feedingTimes.push(randomBetween(14, 16))
    
    // Dinner feeding (17-19 PM)
    feedingTimes.push(randomBetween(17, 19))
    
    // Evening feeding (20-22 PM)
    feedingTimes.push(randomBetween(20, 22))
    
    // Optional late night feeding (23-1 AM)
    if (Math.random() < 0.7) {
      feedingTimes.push(randomBetween(23, 24))
    }

    for (const hour of feedingTimes) {
      const feedingType = randomItem(FEEDING_TYPES)
      const feedingTime = new Date(currentDate)
      feedingTime.setHours(hour, randomBetween(0, 59))

      const endTime = new Date(feedingTime)
      endTime.setMinutes(endTime.getMinutes() + randomBetween(15, 45))

      // More realistic amounts based on feeding type
      let amount = null
      let unit = ""
      
      if (feedingType === "breast") {
        amount = null // No amount tracking for breastfeeding
      } else if (feedingType === "bottle") {  // Updated to match new feeding type
        amount = randomBetween(60, 240) // 60-240ml
        unit = "ml"
      } else if (feedingType === "solid") {
        amount = randomBetween(2, 8) // 2-8 tablespoons
        unit = "tbsp"
      } else if (feedingType === "snack") {
        amount = randomBetween(1, 3) // 1-3 servings
        unit = "serving"
      } else if (feedingType === "water") {
        amount = randomBetween(30, 120) // 30-120ml
        unit = "ml"
      }

      const details = `Type: ${feedingType}${amount ? `\nAmount: ${amount}${unit}` : ""}\nNotes: Regular feeding`

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
    // Generate realistic sleep patterns: 1 main night sleep + 1-2 naps
    const sleepEvents = []

    // Main night sleep (varies by child's routine)
    const bedtime = new Date(currentDate)
    bedtime.setHours(randomBetween(19, 21), randomBetween(0, 59)) // 7-9 PM bedtime

    const wakeTime = new Date(bedtime)
    wakeTime.setDate(wakeTime.getDate() + 1)
    wakeTime.setHours(randomBetween(6, 8), randomBetween(0, 59)) // 6-8 AM wake time

    const nightSleepQuality = randomItem(SLEEP_QUALITY)
    
    sleepEvents.push({
      startTime: bedtime,
      endTime: wakeTime,
      quality: nightSleepQuality,
      type: "night sleep"
    })

    // Morning nap (if child is young enough)
    if (Math.random() < 0.7) { // 70% chance of morning nap
      const morningNapStart = new Date(currentDate)
      morningNapStart.setHours(randomBetween(9, 11), randomBetween(0, 59))
      
      const morningNapEnd = new Date(morningNapStart)
      morningNapEnd.setMinutes(morningNapEnd.getMinutes() + randomBetween(45, 120)) // 45min-2hr nap

      const morningNapQuality = randomItem(SLEEP_QUALITY)
      
      sleepEvents.push({
        startTime: morningNapStart,
        endTime: morningNapEnd,
        quality: morningNapQuality,
        type: "morning nap"
      })
    }

    // Afternoon nap
    if (Math.random() < 0.8) { // 80% chance of afternoon nap
      const afternoonNapStart = new Date(currentDate)
      afternoonNapStart.setHours(randomBetween(13, 15), randomBetween(0, 59))
      
      const afternoonNapEnd = new Date(afternoonNapStart)
      afternoonNapEnd.setMinutes(afternoonNapEnd.getMinutes() + randomBetween(60, 180)) // 1-3hr nap

      const afternoonNapQuality = randomItem(SLEEP_QUALITY)
      
      sleepEvents.push({
        startTime: afternoonNapStart,
        endTime: afternoonNapEnd,
        quality: afternoonNapQuality,
        type: "afternoon nap"
      })
    }

    // Create database entries for each sleep event
    for (const sleepEvent of sleepEvents) {
      const details = `Quality: ${sleepEvent.quality}\nType: ${sleepEvent.type}\nDuration: ${Math.round((sleepEvent.endTime.getTime() - sleepEvent.startTime.getTime()) / (1000 * 60))} minutes\nNotes: Regular sleep pattern`

      const eventId = `event_${Math.random().toString(36).substr(2, 9)}`
      const now = new Date().toISOString()

      events.push({
        id: eventId,
        childId,
        parentId,
        eventType: "sleeping",
        startTime: sleepEvent.startTime.toISOString(),
        endTime: sleepEvent.endTime.toISOString(),
        details,
        timestamp: sleepEvent.startTime.toISOString(),
        createdAt: now,
        updatedAt: now,
      })
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
    growthTime.setHours(randomBetween(8, 18), randomBetween(0, 59)) // Doctor visit hours

    // Calculate expected weight and height based on age
    // These are simplified calculations and not medically accurate
    const ageInMonths =
      ageInMonthsAtStart +
      ((currentDate.getFullYear() - startDate.getFullYear()) * 12 + (currentDate.getMonth() - startDate.getMonth()))

    // Weight in kg: starts around 3.5kg and increases realistically
    const baseWeight = 3.5
    const weightGain = ageInMonths < 6 ? 0.7 : ageInMonths < 12 ? 0.5 : ageInMonths < 24 ? 0.3 : 0.2
    const weight = Math.max(3.0, baseWeight + ageInMonths * weightGain + (Math.random() * 0.5 - 0.25))

    // Height in cm: starts around 50cm and increases realistically
    const baseHeight = 50
    const heightGain = ageInMonths < 6 ? 2.5 : ageInMonths < 12 ? 1.5 : ageInMonths < 24 ? 1.0 : 0.8
    const height = Math.max(45, baseHeight + ageInMonths * heightGain + (Math.random() * 2 - 1))

    const details = `Weight: ${weight.toFixed(2)}\nHeight: ${height.toFixed(1)}\nNotes: Monthly checkup - growing well`

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

  // Generate random medication events (less frequent but realistic)
  while (currentDate <= endDate) {
    // 15% chance of medication on any given day (children don't take medication daily)
    if (Math.random() < 0.15) {
      const medicationsPerDay = randomBetween(1, 2) // Usually 1, sometimes 2

      for (let i = 0; i < medicationsPerDay; i++) {
        const medicationType = randomItem(MEDICATION_TYPES)
        const medicationTime = new Date(currentDate)
        
        // Medications usually given at specific times
        const preferredHours = [8, 14, 20] // Morning, afternoon, evening
        const hour = randomItem(preferredHours)
        medicationTime.setHours(hour, randomBetween(0, 59))

        // More realistic dosage based on medication type and age
        let dosage = 0
        let unit = "ml"
        
        if (medicationType === "acetaminophen" || medicationType === "ibuprofen") {
          dosage = randomBetween(3, 8) * 1.25 // 3.75-10 ml
          unit = "ml"
        } else if (medicationType === "antibiotic") {
          dosage = randomBetween(2, 6) * 2.5 // 5-15 ml
          unit = "ml"
        } else if (medicationType === "vitamin") {
          dosage = randomBetween(1, 2) // 1-2 units
          unit = "tablet"
        } else if (medicationType === "probiotic") {
          dosage = 1 // Usually 1 capsule
          unit = "capsule"
        } else {
          dosage = randomBetween(2, 5) // 2-5 ml
          unit = "ml"
        }

        const details = `Medication: ${medicationType}\nDosage: ${dosage} ${unit}\nFrequency: As prescribed\nNotes: Administered as per doctor's instructions`

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

  // Generate temperature events (routine checks + illness monitoring)
  while (currentDate <= endDate) {
    // Weekly routine check (every 7 days on random weekday)
    if (currentDate.getDay() === 0) {
      // Sunday - weekly check
      const tempTime = new Date(currentDate)
      tempTime.setHours(randomBetween(9, 11), randomBetween(0, 59)) // Morning check

      // Normal temperature with slight variation (36.1-37.2°C)
      const temp = 36.5 + (Math.random() * 0.7 - 0.4)

      const details = `Temperature: ${temp.toFixed(1)}°C\nMethod: Digital thermometer\nLocation: Oral\nNotes: Weekly routine check - normal`

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

    // Occasional fever monitoring (3% chance on any day)
    if (Math.random() < 0.03) {
      // Generate 2-5 temperature readings throughout the day when child is sick
      const readingsCount = randomBetween(2, 5)

      for (let i = 0; i < readingsCount; i++) {
        const tempTime = new Date(currentDate)
        const hour = randomBetween(8, 21) // Throughout the day
        tempTime.setHours(hour, randomBetween(0, 59))

        // Fever temperature (37.8-39.5°C) with some variation
        const temp = 37.8 + Math.random() * 1.7

        const details = `Temperature: ${temp.toFixed(1)}°C\nMethod: Digital thermometer\nLocation: ${randomItem(['Oral', 'Underarm', 'Forehead'])}\nNotes: Monitoring fever - child feeling unwell`

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

    // Generate comprehensive data spread across entire past year for better testing
    const endDate = new Date() // Current date
    const startDate = subMonths(endDate, 12) // 12 months (full year) of historical data
    
    // Also generate future data for testing (next 2 weeks)
    const futureEndDate = addDays(endDate, 14) // 2 weeks into the future

    console.log(`Generating events from ${startDate.toISOString()} to ${futureEndDate.toISOString()}`)

    for (let i = 0; i < childrenData.length; i++) {
      const child = childrenData[i]
      console.log(`Generating events for child: ${child.name} (${CHILDREN[i].dateOfBirth})`)

      // Generate events for each child (with more comprehensive data)
      await generateFeedingEvents(child.id, `user_${userId}`, startDate, futureEndDate, db)
      await generateSleepEvents(child.id, `user_${userId}`, startDate, futureEndDate, db)
      await generateDiaperEvents(child.id, `user_${userId}`, startDate, futureEndDate, db)
      await generateGrowthEvents(child.id, `user_${userId}`, startDate, futureEndDate, CHILDREN[i].dateOfBirth, db)
      await generateMedicationEvents(child.id, `user_${userId}`, startDate, futureEndDate, db)
      await generateTemperatureEvents(child.id, `user_${userId}`, startDate, futureEndDate, db)
    }

    return { success: true, message: "Database seeded successfully" }
  } catch (error) {
    console.error("Error seeding database:", error)
    return { success: false, error: error.message }
  }
}
