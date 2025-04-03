import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { diaperId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { db } = await clientPromise();
    
    const diaperEntry = await db.collection("events").findOne({
      id: params.diaperId,
      eventType: "diaperChange"
    });
    
    if (!diaperEntry) {
      return NextResponse.json({ error: 'Diaper entry not found' }, { status: 404 });
    }
    
    // Verify the child belongs to the user
    const child = await db.collection("children").findOne({
      _id: new ObjectId(diaperEntry.childId),
      parentId: userId
    });
    
    if (!child) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json(diaperEntry);
  } catch (error) {
    console.error('Error fetching diaper entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { diaperId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { changeTime, type, notes } = body;
    
    // Verify type is valid if provided
    if (type) {
      const validTypes = ['wet', 'dirty', 'mixed', 'dry'];
      if (!validTypes.includes(type)) {
        return NextResponse.json({ error: 'Invalid diaper type' }, { status: 400 });
      }
    }
    
    const { db } = await clientPromise();
    
    // Fetch the diaper entry
    const diaperEntry = await db.collection("events").findOne({
      id: params.diaperId,
      eventType: "diaperChange"
    });
    
    if (!diaperEntry) {
      return NextResponse.json({ error: 'Diaper entry not found' }, { status: 404 });
    }
    
    // Verify the child belongs to the user
    const child = await db.collection("children").findOne({
      _id: new ObjectId(diaperEntry.childId),
      parentId: userId
    });
    
    if (!child) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const updateData: any = {};
    
    if (changeTime) updateData.changeTime = new Date(changeTime).toISOString();
    if (type) updateData.type = type;
    if (notes !== undefined) updateData.notes = notes;
    
    await db.collection("events").updateOne(
      { id: params.diaperId },
      { $set: updateData }
    );
    
    const updatedDiaperEntry = await db.collection("events").findOne({
      id: params.diaperId
    });
    
    return NextResponse.json(updatedDiaperEntry);
  } catch (error) {
    console.error('Error updating diaper entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { diaperId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { db } = await clientPromise();
    
    // Fetch the diaper entry
    const diaperEntry = await db.collection("events").findOne({
      id: params.diaperId,
      eventType: "diaperChange"
    });
    
    if (!diaperEntry) {
      return NextResponse.json({ error: 'Diaper entry not found' }, { status: 404 });
    }
    
    // Verify the child belongs to the user
    const child = await db.collection("children").findOne({
      _id: new ObjectId(diaperEntry.childId),
      parentId: userId
    });
    
    if (!child) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await db.collection("events").deleteOne({ id: params.diaperId });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting diaper entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}