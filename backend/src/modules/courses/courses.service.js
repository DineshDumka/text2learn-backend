const prisma = require("../../config/prisma");
const courseQueue = require("../../queue/course.queue");
const { checkAndReserveQuota } = require("./quota.service"); // 👈 IMPORT THIS

const createCourse = async (courseData, userId) => {
  const { title, description, difficulty, language, rawText } = courseData;

  // 1️. CHANGE: ATOMIC QUOTA CHECK
  // We check if the user has tokens BEFORE creating the DB record or enqueuing.
  // This prevents users from spamming the system for free.
  await checkAndReserveQuota(userId, 2000); // Estimating 2k tokens for a course

  // 2. Save the 'Shell' of the course in DB
  const course = await prisma.course.create({
    data: {
      title,
      description,
      difficulty,
      language,
      rawText,
      creatorId: userId,
      status: "GENERATING",
    },
  });

  // 3. Put the job in the queue
  await courseQueue.add(
    "COURSE_GENERATION",
    {
      courseId: course.id,
      userId: userId,
      rawText: rawText || title,
      language,
      difficulty,
    },
    {
      attempts: 3,
      backoff: { type: "exponential", delay: 60000 },
      removeOnComplete: true,
    },
  );

  return course;
};

const searchCourses = async ({ query, difficulty, language, limit = 10, cursor = null }) => {

  const take = Number(limit); // Ensure it's a number

  const where = {
    status: "PUBLISHED",
    ...(difficulty && { difficulty }),
    ...(language && { language }),
    ...(query && {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ],
    }),
  };

  // 2️. CHANGE: REFINED CURSOR LOGIC
  // We fetch 'take + 1' to know if there's a next page without a second COUNT query.
  const findOptions = {
    where,
    take: take + 1,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    include: {
      creator: { select: { name: true } },
      _count: { select: { modules: true } }, // Show module count on search results
    },
  };

  if (cursor) {
    // If your cursor is "timestamp:uuid", we only need the uuid for Prisma's cursor field
    const [_, id] = cursor.includes(":") ? cursor.split(":") : [null, cursor];
    findOptions.cursor = { id };
    findOptions.skip = 1;
  }

  const courses = await prisma.course.findMany(findOptions);

  // 3️. CHANGE: DYNAMIC NEXT CURSOR
  let nextCursor = null;
  if (courses.length > take) {
    const nextItem = courses.pop(); // Remove the extra (+1) item
    nextCursor = `${nextItem.createdAt.toISOString()}:${nextItem.id}`;
  }

  return { courses, nextCursor };
};

const getCourseStatusOnly = async (courseId, userId) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      status: true,
      creatorId: true,
    }, // Only fetch exactly what we need
  });

  if (!course) throw new Error("NOT_FOUND");

  // Ownership Check
  if (course.creatorId !== userId) throw new Error("UNAUTHORIZED");

  return { status: course.status };
};

const deleteCourse = async (courseId, userId) => {
  const course = await prisma.course.findUnique({ where: { id: courseId } });

  if (!course) throw new Error("Course not found");
  if (course.creatorId !== userId)
    throw new Error("Unauthorized to delete this course");

  return await prisma.course.delete({ where: { id: courseId } });
};

module.exports = {
  createCourse,
  searchCourses,
  getCourseStatusOnly,
  deleteCourse,
};
