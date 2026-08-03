import prisma from "../config/prisma.js";

/**
 * A single `UPDATE ... SET lastValue = lastValue + 1` is row-locked and
 * atomic in Postgres for the duration of the statement -- concurrent
 * callers serialize on the row automatically, so no explicit
 * transaction/locking is needed at the call site for correctness.
 */
export const incrementAndGet = (scope, year) =>
  prisma.numberSequence.upsert({
    where: { scope_year: { scope, year } },
    create: { scope, year, lastValue: 1 },
    update: { lastValue: { increment: 1 } },
  });
