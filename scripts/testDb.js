require("dotenv").config();
// Import the prisma instance from your config
const prisma = require("../src/config/prisma.js");

async function main() {
  console.log("Checking database connection...");
  try {
    // Attempt to create a test user
    const user = await prisma.user.create({
      data: {
        name: "Test User",
        email: `test-${Date.now()}@db.com`, // Unique email every time
      },
    });

    console.log("✅ Success! Inserted:", user);

    const count = await prisma.user.count();
    console.log(`📊 Total users in DB: ${count}`);
  } catch (error) {
    console.error("❌ Database Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
