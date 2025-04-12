import { prisma } from "@/lib/db"
import { addDays, subMonths, differenceInDays } from "date-fns"

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

// Sleep quality options
const sleepQualities = ["poor", "fair", "good", "excellent"] as const
// Sleep locations
const sleepLocations = ["crib", "bassinet", "parent's bed", "stroller", "car seat"] as const
// Feeding types
const feedingTypes = ["breast", "bottle", "formula", "solid", "snack"] as const
// Diaper types
const diaperTypes = ["wet", "dirty", "both", "dry"] as const
// Medication types
const medicationTypes = ["fever reducer", "antibiotic", "allergy", "vitamin", "other"] as const

// Generate sleep entries for a child
export async function seedSleepData(childId: string): Promise<number> {
  try {
    console.log("Starting sleep data seeding for child ID:", childId)

    // Find child
    const child = await prisma.child.findUnique({
      where: { id: childId },
    })

    if (!child) {
      throw new Error(`Child not found with ID ${childId}`)
    }

    // Define date range for seed data (last 3 months)
    const endDate = new Date()
    const startDate = subMonths(endDate, 3)

    // Calculate child's age in months
    const childAgeMonths = Math.floor((endDate.getTime() - child.birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30))

    // Determine number of entries based on age
    let entriesCount = 90 // Default

    if (childAgeMonths <= 3) {
      entriesCount = 90 * 5 // ~450 entries over 3 months for newborns
    } else if (childAgeMonths <= 6) {
      entriesCount = 90 * 4 // ~360 entries for 3-6 months
    } else if (childAgeMonths <= 12) {
      entriesCount = 90 * 3 // ~270 entries for 6-12 months
    } else if (childAgeMonths <= 24) {
      entriesCount = 90 * 2 // ~180 entries for 1-2 years
    } else {
      entriesCount = 90 * 1.5 // ~135 entries for 2+ years
    }

    // For testing purposes, limit the number of entries
    const count = Math.min(Math.round(entriesCount), 150)

    // Clear existing sleep data for this child
    await prisma.event.deleteMany({
      where: {
        childId,
        eventType: "sleeping",
      },
    })

    // Generate sleep entries
    const sleepEntries = []
    const daysDifference = differenceInDays(endDate, startDate) + 1
    const entriesPerDay = Math.max(1, Math.min(count / daysDifference, 5)) // Max 5 entries per day

    let currentDate = new Date(startDate)

    while (currentDate <= endDate && sleepEntries.length < count) {
      // Determine how many sleep sessions for this day (night sleep + naps)
      const sessionsToday = Math.round(getRandomFloat(entriesPerDay * 0.7, entriesPerDay * 1.3, 0))

      // Always include night sleep if possible
      if (sessionsToday > 0) {
        // Night sleep (starts previous evening, ends this morning)
        const nightStart = new Date(currentDate)
        nightStart.setHours(20, getRandomInt(0, 59), 0, 0) // Around 8 PM

        // If this is not the first day, adjust to previous day
        if (currentDate > startDate) {
          nightStart.setDate(nightStart.getDate() - 1)
        }

        const nightDuration = getRandomInt(360, 720) // 6-12 hours in minutes
        const nightEnd = addMinutes(nightStart, nightDuration)
        const quality = getRandomItem(sleepQualities)
        const location = getRandomItem(["crib", "bassinet", "parent's bed"])
        const notes = Math.random() > 0.7 ? "Night sleep" : undefined

        sleepEntries.push({
          childId,
          eventType: "sleeping",
          timestamp: nightStart,
          details: JSON.stringify({
            startTime: nightStart,
            endTime: nightEnd,
            duration: nightDuration / 60, // Convert to hours
            quality,
            location,
            notes,
          }),
          value: nightDuration / 60, // Duration in hours
          unit: "hours",
          notes,
        })
      }

      // Add naps if we have sessions left for today
      const napCount = Math.min(sessionsToday - 1, 4) // Max 4 naps per day

      for (let i = 0; i < napCount; i++) {
        // Space naps throughout the day
        const hour = 9 + Math.floor((i * 8) / napCount) // Between 9am and 5pm
        const napStart = new Date(currentDate)
        napStart.setHours(hour, getRandomInt(0, 59), 0, 0)

        const napDuration = getRandomInt(20, 180) // 20 min to 3 hours
        const napEnd = addMinutes(napStart, napDuration)
        const quality = getRandomItem(sleepQualities)
        const location = getRandomItem(sleepLocations)
        const notes = Math.random() > 0.7 ? "Nap time" : undefined

        sleepEntries.push({
          childId,
          eventType: "sleeping",
          timestamp: napStart,
          details: JSON.stringify({
            startTime: napStart,
            endTime: napEnd,
            duration: napDuration / 60, // Convert to hours
            quality,
            location,
            notes,
          }),
          value: napDuration / 60, // Duration in hours
          unit: "hours",
          notes,
        })
      }

      // Move to next day
      currentDate = addDays(currentDate, 1)
    }

    // Limit to requested count
    const finalEntries = sleepEntries.slice(0, count)

    // Create entries in database
    await prisma.event.createMany({
      data: finalEntries,
    })

    console.log(`Created ${finalEntries.length} sleep entries for child ${childId}`)
    return finalEntries.length
  } catch (error) {
    console.error("Error seeding sleep data:", error)
    throw error
  }
}

// Generate feeding entries for a child
export async function seedFeedingData(childId: string): Promise<number> {
  try {
    console.log("Starting feeding data seeding for child ID:", childId)

    // Find child
    const child = await prisma.child.findUnique({
      where: { id: childId },
    })

    if (!child) {
      throw new Error(`Child not found with ID ${childId}`)
    }

    // Define date range for seed data (last 3 months)
    const endDate = new Date()
    const startDate = subMonths(endDate, 3)

    // Calculate child's age in months
    const childAgeMonths = Math.floor((endDate.getTime() - child.birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30))

    // Determine number of entries based on age
    let entriesCount = 90 * 5 // Default

    if (childAgeMonths <= 3) {
      entriesCount = 90 * 8 // 0-3 months: Many feedings
    } else if (childAgeMonths <= 6) {
      entriesCount = 90 * 6 // 3-6 months
    } else if (childAgeMonths <= 12) {
      entriesCount = 90 * 5 // 6-12 months
    } else if (childAgeMonths <= 24) {
      entriesCount = 90 * 4 // 1-2 years
    } else {
      entriesCount = 90 * 3 // 2+ years
    }

    // For testing purposes, limit the number of entries
    const count = Math.min(Math.round(entriesCount), 200)

    // Clear existing feeding data for this child
    await prisma.event.deleteMany({
      where: {
        childId,
        eventType: "feeding",
      },
    })

    // Generate feeding entries
    const feedingEntries = []
    const daysDifference = differenceInDays(endDate, startDate) + 1
    const entriesPerDay = Math.max(1, Math.min(count / daysDifference, 8)) // Max 8 entries per day

    let currentDate = new Date(startDate)

    while (currentDate <= endDate && feedingEntries.length < count) {
      // Determine how many feedings for this day
      const feedingsToday = Math.round(getRandomFloat(entriesPerDay * 0.7, entriesPerDay * 1.3, 0))

      for (let i = 0; i < feedingsToday; i++) {
        // Space feedings throughout the day
        const hour = 8 + Math.floor((i * 14) / feedingsToday) // Between 8am and 10pm
        const feedingTime = new Date(currentDate)
        feedingTime.setHours(hour, getRandomInt(0, 59), 0, 0)

        // Determine feeding type based on age
        let type = getRandomItem(feedingTypes)

        // Adjust probabilities based on age
        if (childAgeMonths <= 3) {
          type = getRandomItem(["breast", "bottle", "formula"])
        } else if (childAgeMonths <= 6) {
          type = getRandomItem(["breast", "bottle", "formula", "solid"])
        } else if (childAgeMonths > 24) {
          type = getRandomItem(["solid", "snack"])
        }

        // Determine amount based on type and age
        let amount: number | null = null
        if (type === "breast" || type === "bottle" || type === "formula") {
          amount = getRandomFloat(2, 8, 1)
        }

        const notes = Math.random() > 0.7 ? `Regular ${type} feeding` : undefined

        feedingEntries.push({
          childId,
          eventType: "feeding",
          timestamp: feedingTime,
          details: JSON.stringify({
            type,
            amount,
            notes,
          }),
          value: amount,
          unit: type === "breast" ? "minutes" : "oz",
          notes,
        })
      }

      // Move to next day
      currentDate = addDays(currentDate, 1)
    }

    // Limit to requested count
    const finalEntries = feedingEntries.slice(0, count)

    // Create entries in database
    await prisma.event.createMany({
      data: finalEntries,
    })

    console.log(`Created ${finalEntries.length} feeding entries for child ${childId}`)
    return finalEntries.length
  } catch (error) {
    console.error("Error seeding feeding data:", error)
    throw error
  }
}

// Generate growth entries for a child
export async function seedGrowthData(childId: string): Promise<number> {
  try {
    console.log("Starting growth data seeding for child ID:", childId)

    // Find child
    const child = await prisma.child.findUnique({
      where: { id: childId },
    })

    if (!child) {
      throw new Error(`Child not found with ID ${childId}`)
    }

    // Define date range for seed data (last 3 months)
    const endDate = new Date()
    const startDate = subMonths(endDate, 3)

    // Calculate child's age in months
    const childAgeMonths = Math.floor((endDate.getTime() - child.birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30))

    // Determine starting weight based on age
    let startingWeight = 0
    if (childAgeMonths <= 3) {
      startingWeight = getRandomFloat(3.0, 6.0) // 0-3 months
    } else if (childAgeMonths <= 6) {
      startingWeight = getRandomFloat(5.0, 8.0) // 3-6 months
    } else if (childAgeMonths <= 12) {
      startingWeight = getRandomFloat(7.0, 10.0) // 6-12 months
    } else if (childAgeMonths <= 24) {
      startingWeight = getRandomFloat(9.0, 12.0) // 1-2 years
    } else if (childAgeMonths <= 36) {
      startingWeight = getRandomFloat(11.0, 14.0) // 2-3 years
    } else {
      startingWeight = getRandomFloat(13.0, 18.0) // 3+ years
    }

    // Clear existing growth data for this child
    await prisma.event.deleteMany({
      where: {
        childId,
        eventType: "growth",
      },
    })

    // Growth entries are typically recorded monthly or bi-monthly
    const growthEntries = []
    const daysBetweenEntries = Math.max(15, Math.floor(differenceInDays(endDate, startDate) / 6)) // 6 entries over period

    let currentDate = new Date(startDate)
    let currentWeight = startingWeight

    while (currentDate <= endDate && growthEntries.length < 6) {
      // Increase weight slightly for each entry (more for younger children)
      const weightIncrease = childAgeMonths <= 12 ? getRandomFloat(0.2, 0.5) : getRandomFloat(0.1, 0.3)
      currentWeight += weightIncrease

      growthEntries.push({
        childId,
        eventType: "growth",
        timestamp: currentDate,
        details: JSON.stringify({
          weight: currentWeight,
          notes: "Regular growth check",
        }),
        value: currentWeight,
        unit: "kg",
        notes: "Regular growth check",
      })

      // Move to next entry date
      currentDate = addDays(currentDate, daysBetweenEntries)
    }

    // Create entries in database
    await prisma.event.createMany({
      data: growthEntries,
    })

    console.log(`Created ${growthEntries.length} growth entries for child ${childId}`)
    return growthEntries.length
  } catch (error) {
    console.error("Error seeding growth data:", error)
    throw error
  }
}

// Generate diaper entries for a child
export async function seedDiaperData(childId: string): Promise<number> {
  try {
    console.log("Starting diaper data seeding for child ID:", childId)

    // Find child
    const child = await prisma.child.findUnique({
      where: { id: childId },
    })

    if (!child) {
      throw new Error(`Child not found with ID ${childId}`)
    }

    // Define date range for seed data (last 3 months)
    const endDate = new Date()
    const startDate = subMonths(endDate, 3)

    // Calculate child's age in months
    const childAgeMonths = Math.floor((endDate.getTime() - child.birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30))

    // Determine number of entries based on age
    let diapersPerDay = 8 // Default for newborns

    if (childAgeMonths <= 3) {
      diapersPerDay = 8 // 0-3 months: Many diapers
    } else if (childAgeMonths <= 6) {
      diapersPerDay = 7 // 3-6 months
    } else if (childAgeMonths <= 12) {
      diapersPerDay = 6 // 6-12 months
    } else if (childAgeMonths <= 24) {
      diapersPerDay = 5 // 1-2 years
    } else if (childAgeMonths <= 36) {
      diapersPerDay = 4 // 2-3 years (potty training)
    } else {
      diapersPerDay = 2 // 3+ years (mostly potty trained)
    }

    // For testing purposes, limit the number of entries
    const count = Math.min(90 * diapersPerDay, 200)

    // Clear existing diaper data for this child
    await prisma.event.deleteMany({
      where: {
        childId,
        eventType: "diaper",
      },
    })

    // Generate diaper entries
    const diaperEntries = []
    const daysDifference = differenceInDays(endDate, startDate) + 1
    const entriesPerDay = Math.max(1, Math.min(count / daysDifference, diapersPerDay))

    let currentDate = new Date(startDate)

    while (currentDate <= endDate && diaperEntries.length < count) {
      // Determine how many diapers for this day
      const diapersToday = Math.round(getRandomFloat(entriesPerDay * 0.7, entriesPerDay * 1.3, 0))

      for (let i = 0; i < diapersToday; i++) {
        // Space diapers throughout the day
        const hour = 7 + Math.floor((i * 16) / diapersToday) // Between 7am and 11pm
        const minute = getRandomInt(0, 59)

        const diaperTime = new Date(currentDate)
        diaperTime.setHours(hour, minute, 0, 0)

        // Determine diaper type
        const type = getRandomItem(diaperTypes)
        const notes = Math.random() > 0.8 ? "Regular diaper change" : undefined

        diaperEntries.push({
          childId,
          eventType: "diaper",
          timestamp: diaperTime,
          details: JSON.stringify({
            type,
            notes,
          }),
          value: null,
          unit: null,
          notes,
        })
      }

      // Move to next day
      currentDate = addDays(currentDate, 1)
    }

    // Limit to requested count
    const finalEntries = diaperEntries.slice(0, count)

    // Create entries in database
    await prisma.event.createMany({
      data: finalEntries,
    })

    console.log(`Created ${finalEntries.length} diaper entries for child ${childId}`)
    return finalEntries.length
  } catch (error) {
    console.error("Error seeding diaper data:", error)
    throw error
  }
}

// Main seed function
export async function seedDatabase(childId: string) {
  try {
    console.log("Starting database seeding process for child:", childId)

    // Seed all data types
    const sleepCount = await seedSleepData(childId)
    const feedingCount = await seedFeedingData(childId)
    const growthCount = await seedGrowthData(childId)
    const diaperCount = await seedDiaperData(childId)

    const totalCount = sleepCount + feedingCount + growthCount + diaperCount

    console.log(`Database seeding completed successfully with ${totalCount} total entries`)

    return {
      success: true,
      totalCount,
      counts: {
        sleep: sleepCount,
        feeding: feedingCount,
        growth: growthCount,
        diaper: diaperCount,
      },
    }
  } catch (error: any) {
    console.error("Error seeding database:", error)
    return {
      success: false,
      error: error.message || "An unknown error occurred while seeding the database",
    }
  }
}
