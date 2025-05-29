import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import PDFDocument from 'pdfkit';

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
    
    // Generate PDF
    const pdfBuffer = await generateDailyReportPDF(child, reportDate, sleepEntries, feedingEntries, diaperEntries, medicationEntries);
    
    // Return PDF as response
    return new NextResponse(pdfBuffer as Buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="daily_report_${child.name}_${date}.pdf"`
      }
    });
  } catch (error) {
    console.error('Error generating PDF report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function generateDailyReportPDF(child, date, sleepEntries, feedingEntries, diaperEntries, medicationEntries) {
  return new Promise((resolve, reject) => {
    try {
      const chunks = [];
      const doc = new PDFDocument({ margin: 50 });
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      
      // Format date
      const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Add title
      doc.fontSize(20).text('Daily Report', { align: 'center' });
      doc.moveDown();
      
      // Add child info
      doc.fontSize(16).text(`Name: ${child.name}`);
      doc.fontSize(14).text(`Date: ${formattedDate}`);
      doc.moveDown();
      
      // Add meals section
      doc.fontSize(16).text('Meals:', { underline: true });
      if (feedingEntries.length > 0) {
        feedingEntries.forEach(entry => {
          const time = new Date(entry.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          let description = '';
          
          if (entry.foodType === 'formula' || entry.foodType === 'breast_milk' || entry.foodType === 'cow_milk') {
            description = `${entry.foodType.replace('_', ' ')} - ${entry.quantity}${entry.unit || 'ml'}`;
          } else {
            const portionMap = {
              'none': 'None of it',
              'some': 'Some of it',
              'half': 'Half of it',
              'most': 'Most of it',
              'all': 'All of it'
            };
            description = `${entry.foodType || 'Food'}: ${portionMap[entry.portionConsumed] || entry.portionConsumed}`;
          }
          
          doc.fontSize(12).text(`${time}: ${description}`);
        });
      } else {
        doc.fontSize(12).text('No meals recorded for this day.');
      }
      doc.moveDown();
      
      // Add sleep section
      doc.fontSize(16).text('Sleep time:', { underline: true });
      if (sleepEntries.length > 0) {
        sleepEntries.forEach(entry => {
          const startTime = new Date(entry.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const endTime = entry.endTime 
            ? new Date(entry.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'ongoing';
          
          const duration = entry.endTime 
            ? formatDuration(new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime())
            : 'ongoing';
          
          doc.fontSize(12).text(`${startTime} to ${endTime} (${duration})`);
        });
      } else {
        doc.fontSize(12).text('No sleep records for this day.');
      }
      doc.moveDown();
      
      // Add diaper changes section
      doc.fontSize(16).text('Nappy changes/Toilet:', { underline: true });
      if (diaperEntries.length > 0) {
        diaperEntries.forEach(entry => {
          const time = new Date(entry.changeTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const type = entry.type.charAt(0).toUpperCase() + entry.type.slice(1);
          
          doc.fontSize(12).text(`${type} nappy at ${time}`);
        });
      } else {
        doc.fontSize(12).text('No diaper changes recorded for this day.');
      }
      doc.moveDown();
      
      // Add medication section
      doc.fontSize(16).text('Medication:', { underline: true });
      if (medicationEntries.length > 0) {
        medicationEntries.forEach(entry => {
          const time = new Date(entry.administrationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          doc.fontSize(12).text(`${entry.medicationName} at ${time}`);
        });
      } else {
        doc.fontSize(12).text('No medications recorded for this day.');
      }
      doc.moveDown();
      
      // Add comments section
      doc.fontSize(16).text('Any comments:', { underline: true });
      doc.fontSize(12).text('');
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function formatDuration(durationMs) {
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
}