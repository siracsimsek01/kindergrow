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
    const type = searchParams.get('type'); // wet, dirty, mixed, dry
    
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
      eventType: "diaperChange"
    };
    
    if (startDate) {
      query.changeTime = { $gte: new Date(startDate).toISOString() };
    }
    
    if (endDate) {
      query.changeTime = {
        ...(query.changeTime || {}),
        $lte: new Date(endDate).toISOString()
      };
    }
    
    if (type) {
      query.type = type;
    }
    
    const diaperEntries = await db.collection("events")
      .find(query)
      .sort({ changeTime: -1 })
      .toArray();
    
    return NextResponse.json(diaperEntries);
  } catch (error) {
    console.error('Error fetching diaper entries:', error);
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
    const { childId, changeTime, type, notes } = body;
    
    if (!childId || !changeTime || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Verify type is valid
    const validTypes = ['wet', 'dirty', 'mixed', 'dry'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid diaper type' }, { status: 400 });
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
    
    const diaperEntry = {
      childId,
      eventType: "diaperChange",
      changeTime: new Date(changeTime).toISOString(),
      type,
      notes,
      timestamp: new Date().toISOString(),
      id: new ObjectId().toString()
    };
    
    await db.collection("events").insertOne(diaperEntry);
    
    return NextResponse.json(diaperEntry, { status: 201 });
  } catch (error) {
    console.error('Error creating diaper entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}