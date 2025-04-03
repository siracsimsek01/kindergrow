import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { growthId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
     const { client } = await clientPromise();
     const db = client.db(process.env.MONGO_DB);
    
    const growthEntry = await db.collection("events").findOne({
      id: params.growthId,
      eventType: "growthTracking"
    });
    
    if (!growthEntry) {
      return NextResponse.json({ error: 'Growth entry not found' }, { status: 404 });
    }
    
    // Verify the child belongs to the user
    const child = await db.collection("children").findOne({
      _id: new ObjectId(growthEntry.childId),
      parentId: userId
    });
    
    if (!child) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json(growthEntry);
  } catch (error) {
    console.error('Error fetching growth entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { growthId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { 
      date, 
      weight, 
      weightUnit, 
      height, 
      heightUnit, 
      notes 
    } = body;
    
      const { client } = await clientPromise();
      const db = client.db(process.env.MONGO_DB);
    
    // Fetch the growth entry
    const growthEntry = await db.collection("events").findOne({
      id: params.growthId,
      eventType: "growthTracking"
    });
    
    if (!growthEntry) {
      return NextResponse.json({ error: 'Growth entry not found' }, { status: 404 });
    }
    
    // Verify the child belongs to the user
    const child = await db.collection("children").findOne({
      _id: new ObjectId(growthEntry.childId),
      parentId: userId
    });
    
    if (!child) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const updateData: any = {};
    
    if (date) updateData.timestamp = new Date(date).toISOString();
    if (weight !== undefined) updateData.weight = weight ? Number(weight) : null;
    if (weightUnit) updateData.weightUnit = weightUnit;
    if (height !== undefined) updateData.height = height ? Number(height) : null;
    if (heightUnit) updateData.heightUnit = heightUnit;
    if (notes !== undefined) updateData.notes = notes;
    
    await db.collection("events").updateOne(
      { id: params.growthId },
      { $set: updateData }
    );
    
    const updatedGrowthEntry = await db.collection("events").findOne({
      id: params.growthId
    });
    
    return NextResponse.json(updatedGrowthEntry);
  } catch (error) {
    console.error('Error updating growth entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { growthId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
      const { client } = await clientPromise();
      const db = client.db(process.env.MONGO_DB);
    
    // Fetch the growth entry
    const growthEntry = await db.collection("events").findOne({
      id: params.growthId,
      eventType: "growthTracking"
    });
    
    if (!growthEntry) {
      return NextResponse.json({ error: 'Growth entry not found' }, { status: 404 });
    }
    
    // Verify the child belongs to the user
    const child = await db.collection("children").findOne({
      _id: new ObjectId(growthEntry.childId),
      parentId: userId
    });
    
    if (!child) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await db.collection("events").deleteOne({ id: params.growthId });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting growth entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}