const prisma = require("../../config/prisma");

const checkAndReserveQuota = async (userId, estimatedTokens) => {
  return await prisma.$transaction(async (tx) => {
    const quota = await tx.userQuota.findUnique({ where: { userId } });

    if (!quota) {
      // Create a default quota if it doesn't exist
      return await tx.userQuota.create({
        data: { userId, monthlyLimit: 50000, used: estimatedTokens },
      });
    }

    if (quota.used + estimatedTokens > quota.monthlyLimit) {
      throw new Error("QUOTA_EXCEEDED");
    }

    // Atomic increment
    return await tx.userQuota.update({
      where: { userId },
      data: { used: { increment: estimatedTokens } },
    });
  });
};

module.exports = { checkAndReserveQuota };