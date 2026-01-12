const express = require("express");

const app = express();

app.use(express.json());

const healthRouter = require("./routes/health.routes.js");

app.use("/", healthRouter);

module.exports = app;
