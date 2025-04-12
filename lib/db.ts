import { PrismaClient } from "@prisma/client"

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

// Add a connection test function
export async function testConnection() {
  try {
    await prisma.$connect()
    console.log("Database connection successful!")
    return true
  } catch (error) {
    console.error("Database connection failed:", error)
    return false
  }
}
