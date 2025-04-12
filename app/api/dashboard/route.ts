import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const childId = searchParams.get("childId")

    if (!childId) {
      return NextResponse.json({ error: "Child ID is required" }, { status: 400 })
    }

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

    // Get today's date range
    const today = new Date()
    const startOfToday = new Date(today)
    startOfToday.setHours(0, 0, 0, 0)

    const endOfToday = new Date(today)
    endOfToday.setHours(23, 59, 59, 999)

    // Get yesterday's date range
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const startOfYesterday = new Date(yesterday)
    startOfYesterday.setHours(0, 0, 0, 0)

    const endOfYesterday = new Date(yesterday)
    endOfYesterday.setHours(23, 59, 59, 999)

    // Get last week's date range
    const oneWeekAgo = new Date(today)
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    // Get sleep data
    const sleepToday = await prisma.event.findMany({
      where: {
        childId,
        eventType: "sleeping",
        OR: [
          {
            timestamp: {
              gte: startOfToday,
              lte: endOfToday,
            },
          },
          {
            details: {
              contains: "endTime",
            },
            timestamp: {
              lte: endOfToday,
            },
          },
        ],
      },
    })

    const sleepYesterday = await prisma.event.findMany({
      where: {
        childId,
        eventType: "sleeping",
        OR: [
          {
            timestamp: {
              gte: startOfYesterday,
              lte: endOfYesterday,
            },
          },
          {
            details: {
              contains: "endTime",
            },
            timestamp: {
              lte: endOfYesterday,
            },
          },
        ],
      },
    })

    // Get feeding data
    const feedingsToday = await prisma.event.findMany({
      where: {
        childId,
        eventType: "feeding",
        timestamp: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    })

    // Get diaper data
    const diapersToday = await prisma.event.findMany({
      where: {
        childId,
        eventType: "diaper",
        timestamp: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    })

    // Get medication data
    const medicationsToday = await prisma.event.findMany({
      where: {
        childId,
        eventType: "medication",
        timestamp: {
          gte: startOfToday,
        },
      },
      orderBy: {
        timestamp: "asc",
      },
    })

    // Get growth data
    const latestGrowth = await prisma.event.findMany({
      where: {
        childId,
        eventType: "growth",
      },
      orderBy: {
        timestamp: "desc",
      },
      take: 1,
    })

    // Get recent activities
    const recentActivities = await prisma.event.findMany({
      where: {
        childId,
      },
      orderBy: {
        timestamp: "desc",
      },
      take: 10,
    })

    // Calculate sleep duration
    const totalSleepToday = calculateTotalSleepDuration(sleepToday, startOfToday, endOfToday)
    const totalSleepYesterday = calculateTotalSleepDuration(sleepYesterday, startOfYesterday, endOfYesterday)

    // Calculate sleep trend for the last 7 days
    const sleepTrend = await getSleepTrend(childId, oneWeekAgo)

    // Calculate feeding trend for the last 7 days
    const feedingTrend = await getFeedingTrend(childId, oneWeekAgo)

    // Calculate growth trend for the last 6 months
    const sixMonthsAgo = new Date(today)
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const growthTrend = await getGrowthTrend(childId, sixMonthsAgo)

    // Get next medication dose
    const nextDose = medicationsToday.length > 0 ? medicationsToday[0] : null

    // Prepare dashboard data
    const dashboardData = {
      sleep: {
        today: {
          hours: Math.floor(totalSleepToday / 60),
          minutes: totalSleepToday % 60,
          percentChange: calculatePercentChange(totalSleepToday, totalSleepYesterday),
        },
        lastUpdated: sleepToday.length > 0 ? sleepToday[sleepToday.length - 1].timestamp : null,
        trend: sleepTrend,
      },
      feedings: {
        today: feedingsToday.length,
        lastFeeding: feedingsToday.length > 0 ? feedingsToday[feedingsToday.length - 1] : null,
        trend: feedingTrend,
      },
      diapers: {
        today: diapersToday.length,
        lastChange: diapersToday.length > 0 ? diapersToday[diapersToday.length - 1] : null,
        breakdown: {
          wet: diapersToday.filter((d) => d.details?.includes("wet")).length,
          dirty: diapersToday.filter((d) => d.details?.includes("dirty")).length,
          mixed: diapersToday.filter((d) => d.details?.includes("mixed")).length,
          dry: diapersToday.filter((d) => d.details?.includes("dry")).length,
        },
      },
      medications: {
        active: medicationsToday.length,
        nextDose: nextDose,
      },
      growth: {
        latest: latestGrowth.length > 0 ? latestGrowth[0] : null,
        trend: growthTrend,
      },
      recentActivities,
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Helper functions
function calculateTotalSleepDuration(sleepEntries, startOfDay, endOfDay) {
  let totalMinutes = 0

  for (const entry of sleepEntries) {
    // Parse start and end times from the entry
    const start = new Date(entry.timestamp)

    // Try to extract end time from details
    let end = new Date()
    try {
      if (entry.details) {
        const detailsObj = JSON.parse(entry.details)
        if (detailsObj.endTime) {
          end = new Date(detailsObj.endTime)
        }
      }
    } catch (e) {
      // If parsing fails, use current time as fallback
      console.error("Error parsing sleep entry details:", e)
    }

    // Adjust start time if it's before the start of the day
    const adjustedStart = start < startOfDay ? startOfDay : start

    // Adjust end time if it's after the end of the day
    const adjustedEnd = end > endOfDay ? endOfDay : end

    // Calculate duration in minutes
    if (adjustedEnd > adjustedStart) {
      const durationMs = adjustedEnd.getTime() - adjustedStart.getTime()
      totalMinutes += Math.floor(durationMs / (1000 * 60))
    }
  }

  return totalMinutes
}

function calculatePercentChange(current, previous) {
  if (previous === 0) return 100
  return Math.round(((current - previous) / previous) * 100)
}

async function getSleepTrend(childId, startDate) {
  const sleepEntries = await prisma.event.findMany({
    where: {
      childId,
      eventType: "sleeping",
      timestamp: {
        gte: startDate,
      },
    },
  })

  // Group by day and calculate total sleep duration
  const sleepByDay = {}
  const today = new Date()

  // Initialize the last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dayKey = date.toISOString().split("T")[0]
    sleepByDay[dayKey] = 0
  }

  // Calculate sleep duration for each day
  for (const entry of sleepEntries) {
    const start = new Date(entry.timestamp)

    // Try to extract end time from details
    let end = new Date()
    try {
      if (entry.details) {
        const detailsObj = JSON.parse(entry.details)
        if (detailsObj.endTime) {
          end = new Date(detailsObj.endTime)
        }
      }
    } catch (e) {
      // If parsing fails, use current time as fallback
      console.error("Error parsing sleep entry details:", e)
    }

    const startDay = start.toISOString().split("T")[0]
    const endDay = end.toISOString().split("T")[0]

    if (startDay === endDay) {
      // Sleep within the same day
      const durationMs = end.getTime() - start.getTime()
      const durationHours = durationMs / (1000 * 60 * 60)
      sleepByDay[startDay] = (sleepByDay[startDay] || 0) + durationHours
    } else {
      // Sleep spans multiple days
      const startDayEnd = new Date(startDay)
      startDayEnd.setHours(23, 59, 59, 999)

      // Duration for the start day
      const startDayDurationMs = startDayEnd.getTime() - start.getTime()
      const startDayDurationHours = startDayDurationMs / (1000 * 60 * 60)
      sleepByDay[startDay] = (sleepByDay[startDay] || 0) + startDayDurationHours

      // Duration for the end day
      const endDayStart = new Date(endDay)
      endDayStart.setHours(0, 0, 0, 0)

      const endDayDurationMs = end.getTime() - endDayStart.getTime()
      const endDayDurationHours = endDayDurationMs / (1000 * 60 * 60)
      sleepByDay[endDay] = (sleepByDay[endDay] || 0) + endDayDurationHours
    }
  }

  // Convert to array for chart
  return Object.entries(sleepByDay).map(([date, hours]) => ({
    date,
    hours: Math.round(Number(hours) * 10) / 10, // Round to 1 decimal place
  }))
}

async function getFeedingTrend(childId, startDate) {
  const feedingEntries = await prisma.event.findMany({
    where: {
      childId,
      eventType: "feeding",
      timestamp: {
        gte: startDate,
      },
    },
  })

  // Group by day and calculate total feeding amount
  const feedingByDay = {}
  const today = new Date()

  // Initialize the last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dayKey = date.toISOString().split("T")[0]
    feedingByDay[dayKey] = 0
  }

  // Calculate feeding amount for each day
  for (const entry of feedingEntries) {
    const day = new Date(entry.timestamp).toISOString().split("T")[0]

    try {
      if (entry.details) {
        const detailsObj = JSON.parse(entry.details)
        if (detailsObj.quantity) {
          feedingByDay[day] = (feedingByDay[day] || 0) + Number.parseFloat(detailsObj.quantity)
        }
      }

      // Also check value field
      if (entry.value) {
        feedingByDay[day] = (feedingByDay[day] || 0) + Number.parseFloat(entry.value.toString())
      }
    } catch (e) {
      console.error("Error parsing feeding entry details:", e)
    }
  }

  // Convert to array for chart
  return Object.entries(feedingByDay).map(([date, amount]) => ({
    date,
    amount: Math.round(Number(amount)),
  }))
}

async function getGrowthTrend(childId, startDate) {
  const growthEntries = await prisma.event.findMany({
    where: {
      childId,
      eventType: "growth",
      timestamp: {
        gte: startDate,
      },
    },
    orderBy: {
      timestamp: "asc",
    },
  })

  // Convert to array for chart
  return growthEntries.map((entry) => {
    let weight = null
    let height = null
    let weightUnit = "kg"
    let heightUnit = "cm"

    try {
      if (entry.details) {
        const detailsObj = JSON.parse(entry.details)
        weight = detailsObj.weight || entry.value
        height = detailsObj.height
        weightUnit = detailsObj.weightUnit || "kg"
        heightUnit = detailsObj.heightUnit || "cm"
      } else if (entry.value) {
        weight = entry.value
      }
    } catch (e) {
      console.error("Error parsing growth entry details:", e)
    }

    return {
      date: new Date(entry.timestamp).toISOString().split("T")[0],
      weight,
      weightUnit,
      height,
      heightUnit,
    }
  })
}
