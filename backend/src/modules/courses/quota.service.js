const prisma = require("../../config/prisma");
const AppError = require("../../utils/AppError");

/**
 * Centralized quota management — single source of truth.
 * All quota operations use Prisma transactions for atomicity.
 */

/**
 * Check if a user has enough quota and atomically reserve tokens.
 * Called BEFORE enqueuing an AI generation job.
 */
const checkAndReserveQuota = async (userId, estimatedTokens) => {
  return await prisma.$transaction(async (tx) => {
    const quota = await tx.userQuota.findUnique({ where: { userId } });

    if (!quota) {
      // First-time user: create default quota with reserved tokens
      return await tx.userQuota.create({
        data: { userId, monthlyLimit: 50000, used: estimatedTokens },
      });
    }

    if (quota.used + estimatedTokens > quota.monthlyLimit) {
      throw AppError.tooMany(
        "Monthly AI generation quota exceeded. Please upgrade or wait for reset.",
        "QUOTA_EXCEEDED",
      );
    }

    // Atomic increment
    return await tx.userQuota.update({
      where: { userId },
      data: { used: { increment: estimatedTokens } },
    });
  });
};

/**
 * Reconcile quota after actual AI usage is known.
 * Called inside the worker after AI generation completes.
 * adjustment = actualTokens - reservedTokens (can be negative for refunds)
 */
const reconcileQuota = async (tx, userId, adjustment) => {
  await tx.userQuota.update({
    where: { userId },
    data: { used: { increment: adjustment } },
  });
};

/**
 * Refund reserved quota on job failure.
 */
const refundQuota = async (userId, reservedTokens) => {
  await prisma.userQuota.update({
    where: { userId },
    data: { used: { decrement: reservedTokens } },
  });
};

module.exports = { checkAndReserveQuota, reconcileQuota, refundQuota };