require("dotenv").config();
const app = require("./app.js");
const logger = require("./config/logger");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info({ port: PORT }, "Server running");
});
