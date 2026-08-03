import prisma from "../config/prisma.js";

export const findByUserAndType = (userId, type) => prisma.notificationPreference.findMany({ where: { userId, type } });

export const findByUser = (userId) => prisma.notificationPreference.findMany({ where: { userId }, orderBy: { type: "asc" } });

export const upsert = ({ userId, type, channel, isEnabled }) =>
  prisma.notificationPreference.upsert({
    where: { userId_type_channel: { userId, type, channel } },
    update: { isEnabled },
    create: { userId, type, channel, isEnabled },
  });
