import prisma from "../config/prisma.js";

const DETAIL_INCLUDE = {
  writtenBy: { select: { id: true, fullName: true, username: true } },
  addressedTo: { select: { id: true, fullName: true, username: true } },
  attachments: { where: { deletedAt: null }, include: { currentVersion: true } },
  _count: { select: { replies: true } },
};

export const findById = (id) => prisma.fileMinute.findFirst({ where: { id, deletedAt: null }, include: DETAIL_INCLUDE });

/** The file's full decision history, oldest first -- parentMinuteId lets the client reconstruct threading. */
export const findByFileId = (fileId) =>
  prisma.fileMinute.findMany({ where: { fileId, deletedAt: null }, include: DETAIL_INCLUDE, orderBy: { createdAt: "asc" } });

export const create = (data) => prisma.fileMinute.create({ data, include: DETAIL_INCLUDE });

export const softDelete = (id, deletedById) =>
  prisma.fileMinute.update({ where: { id }, data: { deletedAt: new Date(), deletedById }, include: DETAIL_INCLUDE });
