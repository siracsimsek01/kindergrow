import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { feedingId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const client = await clientPromise;
    const db = client.db("kindergrow");
    
    const feedingEntry = await db.collection("events").findOne({
      id: params.feedingId,
      eventType: "feeding"
    });
    
    if (!feedingEntry) {
      return NextResponse.json({ error: 'Feeding entry not found' }, { status: 404 });
    }
    
    // Verify the child belongs to the user
    const child = await db.collection("children").findOne({
      _id: new ObjectId(feedingEntry.childId),
      parentId: userId
    });
    
    if (!child) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json(feedingEntry);
  } catch (error) {
    console.error('Error fetching feeding entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { feedingId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { 
      startTime, 
      endTime,
      foodType, 
      quantity,
      unit,
      portionConsumed,
      notes 
    } = body;
    
    const client = await clientPromise;
    const db = client.db("kindergrow");
    
    // Fetch the feeding entry
    const feedingEntry = await db.collection("events").findOne({
      id: params.feedingId,
      eventType: "feeding"
    });
    
    if (!feedingEntry) {
      return NextResponse.json({ error: 'Feeding entry not found' }, { status: 404 });
    }
    
    // Verify the child belongs to the user
    const child = await db.collection("children").findOne({
      _id: new ObjectId(feedingEntry.childId),
      parentId: userId
    });
    
    if (!child) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const updateData: any = {};
    
    if (startTime) updateData.startTime = new Date(startTime).toISOString();
    if (endTime !== undefined) updateData.endTime = endTime ? new Date(endTime).toISOString() : null;
    if (foodType) updateData.foodType = foodType;
    if (quantity !== undefined) updateData.quantity = quantity ? Number(quantity) : null;
    if (unit) updateData.unit = unit;
    if (portionConsumed) updateData.portionConsumed = portionConsumed;
    if (notes !== undefined) updateData.notes = notes;
    
    await db.collection("events").updateOne(
      { id: params.feedingId },
      { $set: updateData }
    );
    
    const updatedFeedingEntry = await db.collection("events").findOne({
      id: params.feedingId
    });
    
    return NextResponse.json(updatedFeedingEntry);
  } catch (error) {
    console.error('Error updating feeding entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { feedingId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const client = await clientPromise;
    const db = client.db("kindergrow");
    
    // Fetch the feeding entry
    const feedingEntry = await db.collection("events").findOne({
      id: params.feedingId,
      eventType: "feeding"
    });
    
    if (!feedingEntry) {
      return NextResponse.json({ error: 'Feeding entry not found' }, { status: 404 });
    }
    
    // Verify the child belongs to the user
    const child = await db.collection("children").findOne({
      _id: new ObjectId(feedingEntry.childId),
      parentId: userId
    });
    
    if (!child) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await db.collection("events").deleteOne({ id: params.feedingId });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting feeding entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}