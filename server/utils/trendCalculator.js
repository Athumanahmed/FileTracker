const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * "Grew by X% from last week" -- computed from createdAt only (no
 * historical snapshot table exists), so it reflects growth, not net
 * change: a resource that also loses records (soft deletes, deactivation)
 * would still show 0% rather than negative. Shared by every admin
 * summary/stats endpoint that needs a week-over-week trend for a
 * Prisma-countable resource.
 */
export const withWeeklyTrend = async (countFn, baseWhere) => {
  const since = new Date(Date.now() - SEVEN_DAYS_MS);

  const [total, createdThisWeek] = await Promise.all([
    countFn(baseWhere),
    countFn({ ...baseWhere, createdAt: { gte: since } }),
  ]);

  const totalBeforeThisWeek = total - createdThisWeek;
  const changePercent =
    totalBeforeThisWeek > 0
      ? Math.round((createdThisWeek / totalBeforeThisWeek) * 100)
      : createdThisWeek > 0
        ? 100
        : 0;

  return { total, changePercent };
};
