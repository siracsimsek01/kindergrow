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
    const medicationType = searchParams.get('type');
    
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
    
    const query: any = {
      childId,
      eventType: "medication"
    };
    
    if (startDate) {
      query.administrationTime = { $gte: new Date(startDate).toISOString() };
    }
    
    if (endDate) {
      query.administrationTime = {
        ...(query.administrationTime || {}),
        $lte: new Date(endDate).toISOString()
      };
    }
    
    if (medicationType) {
      query.medicationType = medicationType;
    }
    
    const medicationEntries = await db.collection("events")
      .find(query)
      .sort({ administrationTime: -1 })
      .toArray();
    
    return NextResponse.json(medicationEntries);
  } catch (error) {
    console.error('Error fetching medication entries:', error);
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
      administrationTime, 
      medicationType, 
      medicationName, 
      dosage, 
      reason, 
      notes 
    } = body;
    
    if (!childId || !administrationTime || !medicationType || !medicationName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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
    
    const medicationEntry = {
      childId,
      eventType: "medication",
      administrationTime: new Date(administrationTime).toISOString(),
      medicationType,
      medicationName,
      dosage,
      reason,
      notes,
      timestamp: new Date().toISOString(),
      id: new ObjectId().toString()
    };
    
    await db.collection("events").insertOne(medicationEntry);
    
    return NextResponse.json(medicationEntry, { status: 201 });
  } catch (error) {
    console.error('Error creating medication entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}