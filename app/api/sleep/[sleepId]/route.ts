import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { sleepId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const client = await clientPromise;
    const db = client.db("kindergrow");
    
    const sleepEntry = await db.collection("events").findOne({
      id: params.sleepId,
      eventType: "sleeping"
    });
    
    if (!sleepEntry) {
      return NextResponse.json({ error: 'Sleep entry not found' }, { status: 404 });
    }
    
    // Verify the child belongs to the user
    const child = await db.collection("children").findOne({
      _id: new ObjectId(sleepEntry.childId),
      parentId: userId
    });
    
    if (!child) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json(sleepEntry);
  } catch (error) {
    console.error('Error fetching sleep entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { sleepId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { startTime, endTime, notes } = body;
    
    const client = await clientPromise;
    const db = client.db("kindergrow");
    
    // Fetch the sleep entry
    const sleepEntry = await db.collection("events").findOne({
      id: params.sleepId,
      eventType: "sleeping"
    });
    
    if (!sleepEntry) {
      return NextResponse.json({ error: 'Sleep entry not found' }, { status: 404 });
    }
    
    // Verify the child belongs to the user
    const child = await db.collection("children").findOne({
      _id: new ObjectId(sleepEntry.childId),
      parentId: userId
    });
    
    if (!child) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const updateData: any = {};
    
    if (startTime) updateData.startTime = new Date(startTime).toISOString();
    if (endTime !== undefined) updateData.endTime = endTime ? new Date(endTime).toISOString() : null;
    if (notes !== undefined) updateData.notes = notes;
    
    await db.collection("events").updateOne(
      { id: params.sleepId },
      { $set: updateData }
    );
    
    const updatedSleepEntry = await db.collection("events").findOne({
      id: params.sleepId
    });
    
    return NextResponse.json(updatedSleepEntry);
  } catch (error) {
    console.error('Error updating sleep entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { sleepId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const client = await clientPromise;
    const db = client.db("kindergrow");
    
    // Fetch the sleep entry
    const sleepEntry = await db.collection("events").findOne({
      id: params.sleepId,
      eventType: "sleeping"
    });
    
    if (!sleepEntry) {
      return NextResponse.json({ error: 'Sleep entry not found' }, { status: 404 });
    }
    
    // Verify the child belongs to the user
    const child = await db.collection("children").findOne({
      _id: new ObjectId(sleepEntry.childId),
      parentId: userId
    });
    
    if (!child) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await db.collection("events").deleteOne({ id: params.sleepId });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting sleep entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}