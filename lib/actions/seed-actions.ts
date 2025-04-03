"use server"

import { seedDatabase } from "@/lib/seed-database"

// This is a server action that can be called from client components
export async function seedDatabaseAction() {
  return await seedDatabase()
}

