const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 12;

const hashPassword = async (plainPassword) => {
  // We await because hashing is a CPU-intensive task
  return await bcrypt.hash(plainPassword, SALT_ROUNDS);
};

const comparePassword = async (plainPassword, hashedPassword) => {
  // Returns true if match, false if not
  return await bcrypt.compare(plainPassword, hashedPassword);
};

module.exports = { hashPassword, comparePassword };
