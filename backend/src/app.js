const express = require("express");
const cookieParser = require("cookie-parser");

const authRouter = require("./routes/auth.routes.js");
require("./modules/courses/jobs/course.worker.js");
require("./modules/courses/jobs/translation.worker.js");
const courseRouter = require("./routes/course.routes.js");
const exportRouter = require("./routes/export.routes.js");
const progressRouter = require("./routes/progress.routes.js");
const lessonRouter = require("./routes/lesson.routes.js");
const userRouter = require("./routes/user.routes.js");
const { globalLimiter } = require("./middlewares/rateLimiter");
const errorHandler = require("./middlewares/error.middleware");
const AppError = require("./utils/AppError");

const app = express();

// --- Body parsers ---
app.use(cookieParser());
app.use(express.json());

// --- Global rate limiter ---
app.use("/api/v1/", globalLimiter);

// --- Routes ---
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/courses", courseRouter);
app.use("/api/v1/courses", exportRouter);
app.use("/api/v1/progress", progressRouter);
app.use("/api/v1/lessons", lessonRouter);
app.use("/api/v1/users", userRouter);

// --- 404 catch-all (must be after all routes) ---
app.use((req, res, next) => {
  next(AppError.notFound(`Cannot find ${req.method} ${req.originalUrl}`));
});

// --- Global error handler (must be LAST middleware) ---
app.use(errorHandler);

module.exports = app;

