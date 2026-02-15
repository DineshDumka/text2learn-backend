const prisma = require("../../config/prisma");
const courseQueue = require("../../queue/course.queue");
const { checkAndReserveQuota } = require("./quota.service");
const { getTokenBudget } = require("./promptBuilder.service");
const AppError = require("../../utils/AppError");

const createCourse = async (courseData, userId) => {
  const { title, description, difficulty, language, rawText } = courseData;

  // Difficulty-aware quota reservation (not hardcoded anymore)
  const tokenBudget = getTokenBudget(difficulty);
  await checkAndReserveQuota(userId, tokenBudget);

  // Save the course shell in DB
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

  // Queue the AI generation job
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

const searchCourses = async ({
  query,
  difficulty,
  language,
  limit = 10,
  cursor = null,
}) => {
  const take = Number(limit);

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

  const findOptions = {
    where,
    take: take + 1,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    include: {
      creator: { select: { name: true } },
      _count: { select: { modules: true } },
    },
  };

  if (cursor) {
    const [_, id] = cursor.includes(":") ? cursor.split(":") : [null, cursor];
    findOptions.cursor = { id };
    findOptions.skip = 1;
  }

  const courses = await prisma.course.findMany(findOptions);

  let nextCursor = null;
  if (courses.length > take) {
    const nextItem = courses.pop();
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
    },
  });

  if (!course) {
    throw AppError.notFound("Course not found");
  }

  // Ownership check
  if (course.creatorId !== userId) {
    throw AppError.forbidden("You are not authorized to view this course status");
  }

  return { status: course.status };
};

const deleteCourse = async (courseId, userId) => {
  const course = await prisma.course.findUnique({ where: { id: courseId } });

  if (!course) {
    throw AppError.notFound("Course not found");
  }

  if (course.creatorId !== userId) {
    throw AppError.forbidden("You are not authorized to delete this course");
  }

  return await prisma.course.delete({ where: { id: courseId } });
};

module.exports = {
  createCourse,
  searchCourses,
  getCourseStatusOnly,
  deleteCourse,
};
