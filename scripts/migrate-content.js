const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function migrate() {
  console.log("🚀 Starting data migration...");
  // 1. Find all lessons that don't have LessonContent yet
  const lessons = await prisma.lesson.findMany({
    include: { contents: true },
  });

  for (const lesson of lessons) {
    if (lesson.contents.length === 0) {
      // Create the default English content using the temporary fields or placeholders
      await prisma.lessonContent.create({
        data: {
          lessonId: lesson.id,
          language: "ENGLISH",
          title: "Migrated Lesson", // Or use existing data if you haven't dropped columns yet
          content: "Content needs re-generation or was moved.",
        },
      });
    }
  }
  console.log("✅ Migration complete.");
}

migrate().catch(console.error);
