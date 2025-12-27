import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import PDFDocument from "pdfkit";

export const runtime = "nodejs"; // IMPORTANT: pdfkit must run on Node

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const childId = params.id;
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    if (!childId) {
      return NextResponse.json({ error: "Child ID is required" }, { status: 400 });
    }

    const { client } = await clientPromise();
    const db = client.db(process.env.MONGO_DB);

    const child = await db.collection("children").findOne({
      _id: new ObjectId(childId),
      parentId: userId,
    });

    if (!child) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    const reportDate = new Date(date);
    const startOfDay = new Date(reportDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(reportDate);
    endOfDay.setHours(23, 59, 59, 999);

    const startISOString = startOfDay.toISOString();
    const endISOString = endOfDay.toISOString();

    const [sleepEntries, feedingEntries, diaperEntries, medicationEntries] =
      await Promise.all([
        db
          .collection("events")
          .find({
            childId,
            eventType: "sleeping",
            $or: [
              { startTime: { $gte: startISOString, $lte: endISOString } },
              { endTime: { $gte: startISOString, $lte: endISOString } },
            ],
          })
          .sort({ startTime: 1 })
          .toArray(),

        db
          .collection("events")
          .find({
            childId,
            eventType: "feeding",
            startTime: { $gte: startISOString, $lte: endISOString },
          })
          .sort({ startTime: 1 })
          .toArray(),

        db
          .collection("events")
          .find({
            childId,
            eventType: "diaperChange",
            changeTime: { $gte: startISOString, $lte: endISOString },
          })
          .sort({ changeTime: 1 })
          .toArray(),

        db
          .collection("events")
          .find({
            childId,
            eventType: "medication",
            administrationTime: { $gte: startISOString, $lte: endISOString },
          })
          .sort({ administrationTime: 1 })
          .toArray(),
      ]);

    const pdfBuffer = await generateDailyReportPDF(
      child,
      reportDate,
      sleepEntries,
      feedingEntries,
      diaperEntries,
      medicationEntries
    );

    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set(
      "Content-Disposition",
      `attachment; filename="daily_report_${child.name}_${date}.pdf"`
    );

    // ✅ Use standard Response to avoid NextResponse BodyInit type issues on Vercel
    return new Response(new Uint8Array(pdfBuffer), { headers });
  } catch (error) {
    console.error("Error generating PDF report:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
