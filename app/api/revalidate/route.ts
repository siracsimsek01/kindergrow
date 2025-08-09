import { type NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const path = searchParams.get("path") || "/dashboard"

    // Revalidate the path
    revalidatePath(path)

    return NextResponse.json({ revalidated: true, now: Date.now() })
  } catch (error) {
    console.error("Error revalidating path:", error)
    return NextResponse.json({ error: "Failed to revalidate" }, { status: 500 })
  }
}

