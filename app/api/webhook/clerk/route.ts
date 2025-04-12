import { Webhook } from "svix"
import { headers } from "next/headers"
import type { WebhookEvent } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local")
  }

  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occurred -- no svix headers", {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error("Error verifying webhook:", err)
    return new Response("Error occurred", {
      status: 400,
    })
  }

  // Handle the webhook
  const eventType = evt.type
  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name } = evt.data
    const email = email_addresses[0]?.email_address

    if (!email) {
      console.error("No email found for user", id)
      return new Response("No email found for user", { status: 400 })
    }

    try {
      // Upsert the user in your database using Prisma
      await prisma.user.upsert({
        where: {
          id: id as string,
        },
        update: {
          email: email,
          name: `${first_name || ""} ${last_name || ""}`.trim(),
          updatedAt: new Date(),
        },
        create: {
          id: id as string,
          email: email,
          name: `${first_name || ""} ${last_name || ""}`.trim(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      console.log(`User ${id} successfully ${eventType === "user.created" ? "created" : "updated"}`)
    } catch (error) {
      console.error("Error upserting user in database:", error)
      return new Response("Error updating user in database", { status: 500 })
    }
  }

  return new Response("", { status: 200 })
}
