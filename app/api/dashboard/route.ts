import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');
    
    if (!childId) {
      return NextResponse.json({ error: 'Child ID is required' }, { status: 400 });
    }
    
    const { db } = await clientPromise();
    
    // Verify child belongs to user
    const child = await db.collection("children").findOne({
      _id: new ObjectId(childId),
      parentId: userId
    });
    
    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }
    
    // Get today's date range
    const today = new Date();
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);
    
    // Get yesterday's date range
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfYesterday = new Date(yesterday);
    startOfYesterday.setHours(0, 0, 0, 0);
    
    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999);
    
    // Get last week's date range
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    // Convert to ISO strings for MongoDB queries
    const startOfTodayISO = startOfToday.toISOString();
    const endOfTodayISO = endOfToday.toISOString();
    const startOfYesterdayISO = startOfYesterday.toISOString();
    const endOfYesterdayISO = endOfYesterday.toISOString();
    const oneWeekAgoISO = oneWeekAgo.toISOString();
    
    // Get sleep data
    const sleepToday = await db.collection("events").find({
      childId,
      eventType: "sleeping",
      $or: [
        {
          startTime: { $gte: startOfTodayISO, $lte: endOfTodayISO }
        },
        {
          endTime: { $gte: startOfTodayISO, $lte: endOfTodayISO }
        }
      ]
    }).toArray();
    
    const sleepYesterday = await db.collection("events").find({
      childId,
      eventType: "sleeping",
      $or: [
        {
          startTime: { $gte: startOfYesterdayISO, $lte: endOfYesterdayISO }
        },
        {
          endTime: { $gte: startOfYesterdayISO, $lte: endOfYesterdayISO }
        }
      ]
    }).toArray();
    
    // Get feeding data
    const feedingsToday = await db.collection("events").find({
      childId,
      eventType: "feeding",
      startTime: { $gte: startOfTodayISO, $lte: endOfTodayISO }
    }).toArray();
    
    // Get diaper data
    const diapersToday = await db.collection("events").find({
      childId,
      eventType: "diaperChange",
      changeTime: { $gte: startOfTodayISO, $lte: endOfTodayISO }
    }).toArray();
    
    // Get medication data
    const medicationsToday = await db.collection("events").find({
      childId,
      eventType: "medication",
      administrationTime: { $gte: startOfTodayISO }
    }).sort({ administrationTime: 1 }).toArray();
    
    // Get growth data
    const latestGrowth = await db.collection("events").find({
      childId,
      eventType: "growthTracking"
    }).sort({ timestamp: -1 }).limit(1).toArray();
    
    // Get recent activities
    const recentActivities = await db.collection("events").find({
      childId
    }).sort({ timestamp: -1 }).limit(10).toArray();
    
    // Calculate sleep duration
    const totalSleepToday = calculateTotalSleepDuration(sleepToday, startOfToday, endOfToday);
    const totalSleepYesterday = calculateTotalSleepDuration(sleepYesterday, startOfYesterday, endOfYesterday);
    
    // Calculate sleep trend for the last 7 days
    const sleepTrend = await getSleepTrend(db, childId, oneWeekAgoISO);
    
    // Calculate feeding trend for the last 7 days
    const feedingTrend = await getFeedingTrend(db, childId, oneWeekAgoISO);
    
    // Calculate growth trend for the last 6 months
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const growthTrend = await getGrowthTrend(db, childId, sixMonthsAgo.toISOString());
    
    // Get next medication dose
    const nextDose = medicationsToday.length > 0 ? medicationsToday[0] : null;
    
    // Prepare dashboard data
    const dashboardData = {
      sleep: {
        today: {
          hours: Math.floor(totalSleepToday / 60),
          minutes: totalSleepToday % 60,
          percentChange: calculatePercentChange(totalSleepToday, totalSleepYesterday)
        },
        lastUpdated: sleepToday.length > 0 ? sleepToday[sleepToday.length - 1].timestamp : null,
        trend: sleepTrend
      },
      feedings: {
        today: feedingsToday.length,
        lastFeeding: feedingsToday.length > 0 ? feedingsToday[feedingsToday.length - 1] : null,
        trend: feedingTrend
      },
      diapers: {
        today: diapersToday.length,
        lastChange: diapersToday.length > 0 ? diapersToday[diapersToday.length - 1] : null,
        breakdown: {
          wet: diapersToday.filter(d => d.type === 'wet').length,
          dirty: diapersToday.filter(d => d.type === 'dirty').length,
          mixed: diapersToday.filter(d => d.type === 'mixed').length,
          dry: diapersToday.filter(d => d.type === 'dry').length
        }
      },
      medications: {
        active: medicationsToday.length,
        nextDose: nextDose
      },
      growth: {
        latest: latestGrowth.length > 0 ? latestGrowth[0] : null,
        trend: growthTrend
      },
      recentActivities
    };
    
    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper functions
function calculateTotalSleepDuration(sleepEntries, startOfDay, endOfDay) {
  let totalMinutes = 0;
  
  for (const entry of sleepEntries) {
    const start = new Date(entry.startTime);
    const end = entry.endTime ? new Date(entry.endTime) : new Date();
    
    // Adjust start time if it's before the start of the day
    const adjustedStart = start < startOfDay ? startOfDay : start;
    
    // Adjust end time if it's after the end of the day
    const adjustedEnd = end > endOfDay ? endOfDay : end;
    
    // Calculate duration in minutes
    if (adjustedEnd > adjustedStart) {
      const durationMs = adjustedEnd.getTime() - adjustedStart.getTime();
      totalMinutes += Math.floor(durationMs / (1000 * 60));
    }
  }
  
  return totalMinutes;
}

function calculatePercentChange(current, previous) {
  if (previous === 0) return 100;
  return Math.round(((current - previous) / previous) * 100);
}

async function getSleepTrend(db, childId, startDate) {
  const sleepEntries = await db.collection("events").find({
    childId,
    eventType: "sleeping",
    startTime: { $gte: startDate }
  }).toArray();
  
  // Group by day and calculate total sleep duration
  const sleepByDay = {};
  const today = new Date();
  
  // Initialize the last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayKey = date.toISOString().split('T')[0];
    sleepByDay[dayKey] = 0;
  }
  
  // Calculate sleep duration for each day
  for (const entry of sleepEntries) {
    const start = new Date(entry.startTime);
    const end = entry.endTime ? new Date(entry.endTime) : new Date();
    
    const startDay = start.toISOString().split('T')[0];
    const endDay = end.toISOString().split('T')[0];
    
    if (startDay === endDay) {
      // Sleep within the same day
      const durationMs = end.getTime() - start.getTime();
      const durationHours = durationMs / (1000 * 60 * 60);
      sleepByDay[startDay] = (sleepByDay[startDay] || 0) + durationHours;
    } else {
      // Sleep spans multiple days
      const startDayEnd = new Date(startDay);
      startDayEnd.setHours(23, 59, 59, 999);
      
      // Duration for the start day
      const startDayDurationMs = startDayEnd.getTime() - start.getTime();
      const startDayDurationHours = startDayDurationMs / (1000 * 60 * 60);
      sleepByDay[startDay] = (sleepByDay[startDay] || 0) + startDayDurationHours;
      
      // Duration for the end day
      const endDayStart = new Date(endDay);
      endDayStart.setHours(0, 0, 0, 0);
      
      const endDayDurationMs = end.getTime() - endDayStart.getTime();
      const endDayDurationHours = endDayDurationMs / (1000 * 60 * 60);
      sleepByDay[endDay] = (sleepByDay[endDay] || 0) + endDayDurationHours;
    }
  }
  
  // Convert to array for chart
  return Object.entries(sleepByDay).map(([date, hours]) => ({
    date,
    hours: Math.round(Number(hours) * 10) / 10 // Round to 1 decimal place
  }));
}

async function getFeedingTrend(db, childId, startDate) {
  const feedingEntries = await db.collection("events").find({
    childId,
    eventType: "feeding",
    startTime: { $gte: startDate }
  }).toArray();
  
  // Group by day and calculate total feeding amount
  const feedingByDay = {};
  const today = new Date();
  
  // Initialize the last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayKey = date.toISOString().split('T')[0];
    feedingByDay[dayKey] = 0;
  }
  
  // Calculate feeding amount for each day
  for (const entry of feedingEntries) {
    const day = new Date(entry.startTime).toISOString().split('T')[0];
    
    if (entry.quantity) {
      feedingByDay[day] = (feedingByDay[day] || 0) + entry.quantity;
    }
  }
  
  // Convert to array for chart
  return Object.entries(feedingByDay).map(([date, amount]) => ({
    date,
    amount: Math.round(Number(amount))
  }));
}

async function getGrowthTrend(db, childId, startDate) {
  const growthEntries = await db.collection("events").find({
    childId,
    eventType: "growthTracking",
    timestamp: { $gte: startDate }
  }).sort({ timestamp: 1 }).toArray();
  
  // Convert to array for chart
  return growthEntries.map(entry => ({
    date: new Date(entry.timestamp).toISOString().split('T')[0],
    weight: entry.weight,
    weightUnit: entry.weightUnit || 'kg',
    height: entry.height,
    heightUnit: entry.heightUnit || 'cm'
  }));
}