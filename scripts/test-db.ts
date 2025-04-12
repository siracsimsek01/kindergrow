// scripts/test-db.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Test query
    const userCount = await prisma.user.count();
    console.log(`Database connection successful! User count: ${userCount}`);
  } catch (error) {
    console.error("Database connection test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();