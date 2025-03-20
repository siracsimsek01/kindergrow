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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    if (!childId) {
      return NextResponse.json({ error: 'Child ID is required' }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db("KinderGrow");
    
    // Verify child belongs to user
    const child = await db.collection("children").findOne({
      _id: new ObjectId(childId),
      parentId: userId
    });
    
    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }
    
    const query: any = {
      childId,
      eventType: "growthTracking"
    };
    
    if (startDate) {
      query.timestamp = { $gte: new Date(startDate).toISOString() };
    }
    
    if (endDate) {
      query.timestamp = {
        ...(query.timestamp || {}),
        $lte: new Date(endDate).toISOString()
      };
    }
    
    const growthEntries = await db.collection("events")
      .find(query)
      .sort({ timestamp: -1 })
      .toArray();
    
    return NextResponse.json(growthEntries);
  } catch (error) {
    console.error('Error fetching growth entries:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { 
      childId, 
      date, 
      weight, 
      weightUnit, 
      height, 
      heightUnit, 
      notes 
    } = body;
    
    if (!childId || !date || (!weight && !height)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db("KinderGrow");
    
    // Verify child belongs to user
    const child = await db.collection("children").findOne({
      _id: new ObjectId(childId),
      parentId: userId
    });
    
    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }
    
    const growthEntry = {
      childId,
      eventType: "growthTracking",
      timestamp: new Date(date).toISOString(),
      weight: weight ? Number(weight) : null,
      weightUnit: weightUnit || 'kg',
      height: height ? Number(height) : null,
      heightUnit: heightUnit || 'cm',
      notes,
      id: new ObjectId().toString()
    };
    
    await db.collection("events").insertOne(growthEntry);
    
    return NextResponse.json(growthEntry, { status: 201 });
  } catch (error) {
    console.error('Error creating growth entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}