const express = require("express");
const cookieParser = require("cookie-parser");

const authRouter = require("./routes/auth.routes.js");
require("./modules/courses/jobs/course.worker.js");
const courseRouter = require("./routes/course.routes.js");

const app = express();

app.use(cookieParser());
app.use(express.json());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/courses", courseRouter);

module.exports = app;
