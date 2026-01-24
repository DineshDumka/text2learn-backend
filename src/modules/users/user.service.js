
const prisma = require("../../config/prisma");
const checkQuota = async (userId, estimatedCost = 1000) => {
  return await prisma.$transaction(async (tx) => {
    const quota = await tx.userQuota.findUnique({ where: { userId } });

    if (!quota) {
      // Create a default quota if it doesn't exist
      return await tx.userQuota.create({
        data: { userId, monthlyLimit: 50000, used: estimatedCost },
      });
    }

    if (quota.used + estimatedCost > quota.monthlyLimit) {
      throw new Error("QUOTA_EXCEEDED"); //
    }

    // Atomic increment
    return await tx.userQuota.update({
      where: { userId },
      data: { used: { increment: estimatedCost } },
    });
  });
};

module.exports = { checkQuota };