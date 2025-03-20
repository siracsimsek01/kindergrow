'use server';

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import axios from "axios";

export async function POST() {
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const response = await axios.post("http://127.0.0.1:5000/auth/sync-user", {}, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return NextResponse.json(response.data, { status: response.status });
  } catch (error: any) {
    console.error("❌ Error syncing user:", error.response?.data || error.message);

    return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
  }
}