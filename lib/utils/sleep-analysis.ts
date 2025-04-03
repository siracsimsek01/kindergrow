import type { SleepEntry, SleepQuality } from "@/lib/types"

// Format sleep duration from minutes to hours and minutes
export function formatSleepDuration(durationMinutes: number): string {
  // Ensure we have a positive number
  durationMinutes = Math.max(0, durationMinutes)

  const hours = Math.floor(durationMinutes / 60)
  const minutes = Math.round(durationMinutes % 60)

  if (hours === 0) {
    return `${minutes} min`
  } else if (minutes === 0) {
    return `${hours} hr`
  } else {
    return `${hours} hr ${minutes} min`
  }
}

// Determine if a sleep entry is a nap (less than 3 hours or between 9am and 7pm)
export function isSleepEntryNap(entry: SleepEntry): boolean {
  const startHour = entry.startTime.getHours()

  // Consider it a nap if it's less than 3 hours (180 minutes)
  if (entry.duration < 180) return true

  // Or if it starts between 9am and 7pm
  if (startHour >= 9 && startHour < 19) return true

  return false
}

// Calculate sleep score based on duration, quality, and consistency
export function calculateSleepScore(entries: SleepEntry[], childAgeMonths: number): number {
  if (entries.length === 0) return 0

  // Get recommended sleep duration based on age
  const recommendedSleep = getRecommendedSleepHours(childAgeMonths)

  // Group entries by day
  const sleepByDay: Record<string, number> = {}

  entries.forEach((entry) => {
    const dayKey = entry.startTime.toISOString().split("T")[0]
    sleepByDay[dayKey] = (sleepByDay[dayKey] || 0) + entry.duration
  })

  // Calculate average daily sleep duration (in hours)
  const dailySleepDurations = Object.values(sleepByDay)
  const avgDailySleep =
    dailySleepDurations.reduce((sum, duration) => sum + duration, 0) / dailySleepDurations.length / 60

  // Duration score (0-40 points)
  // Full points if within 1 hour of recommendation, scaled down as it deviates
  const durationDiff = Math.abs(avgDailySleep - recommendedSleep)
  const durationScore = Math.max(0, 40 - (durationDiff > 1 ? (durationDiff - 1) * 10 : 0))

  // Quality score (0-40 points)
  const qualityMap: Record<SleepQuality, number> = {
    poor: 10,
    fair: 20,
    good: 30,
    excellent: 40,
  }

  const avgQuality = entries.reduce((sum, entry) => sum + qualityMap[entry.quality as SleepQuality], 0) / entries.length

  // Consistency score (0-20 points)
  // Calculate standard deviation of daily sleep durations
  const mean = avgDailySleep * 60 // Convert back to minutes for calculation
  const squaredDiffs = dailySleepDurations.map((duration) => Math.pow(duration - mean, 2))
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / dailySleepDurations.length
  const stdDev = Math.sqrt(variance)

  // Lower standard deviation means more consistent sleep
  // 20 points for stdDev < 30 minutes, scaled down as it increases
  const consistencyScore = Math.max(0, 20 - (stdDev > 30 ? (stdDev - 30) / 15 : 0))

  // Total score (0-100)
  const totalScore = Math.round(durationScore + avgQuality + consistencyScore)

  // Ensure score is between 0 and 100
  return Math.min(100, Math.max(0, totalScore))
}

// Get recommended sleep hours based on child's age in months
export function getRecommendedSleepHours(ageMonths: number): number {
  if (ageMonths < 4) {
    return 14 // 0-3 months: 14-17 hours
  } else if (ageMonths < 12) {
    return 13 // 4-11 months: 12-15 hours
  } else if (ageMonths < 24) {
    return 12 // 12-23 months: 11-14 hours
  } else if (ageMonths < 36) {
    return 11 // 24-35 months: 10-13 hours
  } else if (ageMonths < 60) {
    return 10.5 // 3-5 years: 10-13 hours
  } else if (ageMonths < 144) {
    return 9.5 // 6-12 years: 9-12 hours
  } else {
    return 8.5 // 13+ years: 8-10 hours
  }
}

// Get sleep quality description based on score
export function getSleepQualityDescription(score: number): string {
  if (score >= 90) return "Excellent"
  if (score >= 75) return "Very Good"
  if (score >= 60) return "Good"
  if (score >= 45) return "Fair"
  if (score >= 30) return "Poor"
  return "Very Poor"
}

