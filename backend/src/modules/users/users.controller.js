const prisma = require("../../config/prisma");
const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");

/**
 * GET /users/me — Get current user's profile with quota info
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      quota: true,
    },
  });

  // Remove password from response
  const { password, ...userWithoutPassword } = user;

  res.status(200).json(ApiResponse.success(userWithoutPassword));
});

module.exports = { getProfile };
