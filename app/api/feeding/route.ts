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
    
    const { db } = await clientPromise();
    
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
      eventType: "feeding"
    };
    
    if (startDate) {
      query.startTime = { $gte: new Date(startDate).toISOString() };
    }
    
    if (endDate) {
      query.startTime = {
        ...(query.startTime || {}),
        $lte: new Date(endDate).toISOString()
      };
    }
    
    const feedingEntries = await db.collection("events")
      .find(query)
      .sort({ startTime: -1 })
      .toArray();
    
    return NextResponse.json(feedingEntries);
  } catch (error) {
    console.error('Error fetching feeding entries:', error);
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
      startTime, 
      endTime,
      foodType, 
      quantity,
      unit,
      portionConsumed,
      notes 
    } = body;
    
    if (!childId || !startTime || !foodType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const client = await clientPromise;
    const { db } = await clientPromise();
    // Verify child belongs to user
    const child = await db.collection("children").findOne({
      _id: new ObjectId(childId),
      parentId: userId
    });
    
    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }
    
    const feedingEntry = {
      childId,
      eventType: "feeding",
      startTime: new Date(startTime).toISOString(),
      endTime: endTime ? new Date(endTime).toISOString() : null,
      foodType,
      quantity: quantity ? Number(quantity) : null,
      unit,
      portionConsumed,
      notes,
      timestamp: new Date().toISOString(),
      id: new ObjectId().toString()
    };
    
    await db.collection("events").insertOne(feedingEntry);
    
    return NextResponse.json(feedingEntry, { status: 201 });
  } catch (error) {
    console.error('Error creating feeding entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}