import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { medicationId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
      const { client } = await clientPromise();
      const db = client.db(process.env.MONGO_DB);
    
    const medicationEntry = await db.collection("events").findOne({
      id: params.medicationId,
      eventType: "medication"
    });
    
    if (!medicationEntry) {
      return NextResponse.json({ error: 'Medication entry not found' }, { status: 404 });
    }
    
    // Verify the child belongs to the user
    const child = await db.collection("children").findOne({
      _id: new ObjectId(medicationEntry.childId),
      parentId: userId
    });
    
    if (!child) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json(medicationEntry);
  } catch (error) {
    console.error('Error fetching medication entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { medicationId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { 
      administrationTime, 
      medicationType, 
      medicationName, 
      dosage, 
      reason, 
      notes 
    } = body;
    
    const { client } = await clientPromise();
    const db = client.db(process.env.MONGO_DB);
    
    // Fetch the medication entry
    const medicationEntry = await db.collection("events").findOne({
      id: params.medicationId,
      eventType: "medication"
    });
    
    if (!medicationEntry) {
      return NextResponse.json({ error: 'Medication entry not found' }, { status: 404 });
    }
    
    // Verify the child belongs to the user
    const child = await db.collection("children").findOne({
      _id: new ObjectId(medicationEntry.childId),
      parentId: userId
    });
    
    if (!child) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const updateData: any = {};
    
    if (administrationTime) updateData.administrationTime = new Date(administrationTime).toISOString();
    if (medicationType) updateData.medicationType = medicationType;
    if (medicationName) updateData.medicationName = medicationName;
    if (dosage !== undefined) updateData.dosage = dosage;
    if (reason !== undefined) updateData.reason = reason;
    if (notes !== undefined) updateData.notes = notes;
    
    await db.collection("events").updateOne(
      { id: params.medicationId },
      { $set: updateData }
    );
    
    const updatedMedicationEntry = await db.collection("events").findOne({
      id: params.medicationId
    });
    
    return NextResponse.json(updatedMedicationEntry);
  } catch (error) {
    console.error('Error updating medication entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { medicationId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { client } = await clientPromise();
    const db = client.db(process.env.MONGO_DB);
    
    // Fetch the medication entry
    const medicationEntry = await db.collection("events").findOne({
      id: params.medicationId,
      eventType: "medication"
    });
    
    if (!medicationEntry) {
      return NextResponse.json({ error: 'Medication entry not found' }, { status: 404 });
    }
    
    // Verify the child belongs to the user
    const child = await db.collection("children").findOne({
      _id: new ObjectId(medicationEntry.childId),
      parentId: userId
    });
    
    if (!child) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await db.collection("events").deleteOne({ id: params.medicationId });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting medication entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}