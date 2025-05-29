import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const params = await context.params;
    const childId = params.id;
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]; // Default to today
    
    if (!childId) {
      return NextResponse.json({ error: 'Child ID is required' }, { status: 400 });
    }
    
    const { client } = await clientPromise();
    const db = client.db(process.env.MONGO_DB);
    
    // Verify child belongs to user
    const child = await db.collection("children").findOne({
      _id: new ObjectId(childId),
      parentId: userId
    });
    
    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }
    
    // Parse date
    const reportDate = new Date(date);
    const startOfDay = new Date(reportDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(reportDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Convert to ISO strings for MongoDB queries
    const startISOString = startOfDay.toISOString();
    const endISOString = endOfDay.toISOString();
    
    // Fetch all data for the daily report
    const [sleepEntries, feedingEntries, diaperEntries, medicationEntries] = await Promise.all([
      // Sleep entries that start or end within the day
      db.collection("events").find({
        childId,
        eventType: "sleeping",
        $or: [
          {
            startTime: { $gte: startISOString, $lte: endISOString }
          },
          {
            endTime: { $gte: startISOString, $lte: endISOString }
          }
        ]
      }).sort({ startTime: 1 }).toArray(),
      
      // Feeding entries for the day
      db.collection("events").find({
        childId,
        eventType: "feeding",
        startTime: { $gte: startISOString, $lte: endISOString }
      }).sort({ startTime: 1 }).toArray(),
      
      // Diaper entries for the day
      db.collection("events").find({
        childId,
        eventType: "diaperChange",
        changeTime: { $gte: startISOString, $lte: endISOString }
      }).sort({ changeTime: 1 }).toArray(),
      
      // Medication entries for the day
      db.collection("events").find({
        childId,
        eventType: "medication",
        administrationTime: { $gte: startISOString, $lte: endISOString }
      }).sort({ administrationTime: 1 }).toArray()
    ]);
    
    // Format the daily report
    const dailyReport = {
      child: {
        id: childId,
        name: child.name
      },
      date: reportDate.toISOString().split('T')[0],
      meals: formatMeals(feedingEntries),
      sleep: formatSleep(sleepEntries),
      diaperChanges: formatDiaperChanges(diaperEntries),
      medications: formatMedications(medicationEntries)
    };
    
    return NextResponse.json(dailyReport);
  } catch (error) {
    console.error('Error generating daily report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper functions for formatting daily report
function formatMeals(feedingEntries) {
  return feedingEntries.map(entry => {
    const time = new Date(entry.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    let description = '';
    if (entry.foodType === 'formula' || entry.foodType === 'breast_milk' || entry.foodType === 'cow_milk') {
      description = `${entry.foodType.replace('_', ' ')} - ${entry.quantity}${entry.unit || 'ml'}`;
    } else {
      description = `${entry.foodType || 'Food'}: ${formatPortionConsumed(entry.portionConsumed)}`;
    }
    
    return {
      time,
      description,
      notes: entry.notes
    };
  });
}

function formatPortionConsumed(portion) {
  const portionMap = {
    'none': 'None of it',
    'some': 'Some of it',
    'half': 'Half of it',
    'most': 'Most of it',
    'all': 'All of it'
  };
  
  return portionMap[portion] || portion;
}

function formatSleep(sleepEntries) {
  return sleepEntries.map(entry => {
    const startTime = new Date(entry.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endTime = entry.endTime 
      ? new Date(entry.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'ongoing';
    
    return {
      startTime,
      endTime,
      duration: entry.endTime 
        ? formatDuration(new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime())
        : 'ongoing',
      notes: entry.notes
    };
  });
}

function formatDuration(durationMs) {
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
}

function formatDiaperChanges(diaperEntries) {
  return diaperEntries.map(entry => {
    const time = new Date(entry.changeTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return {
      time,
      type: entry.type.charAt(0).toUpperCase() + entry.type.slice(1),
      notes: entry.notes
    };
  });
}

function formatMedications(medicationEntries) {
  return medicationEntries.map(entry => {
    const time = new Date(entry.administrationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return {
      time,
      medication: entry.medicationName,
      dosage: entry.dosage,
      reason: entry.reason,
      notes: entry.notes
    };
  });
}