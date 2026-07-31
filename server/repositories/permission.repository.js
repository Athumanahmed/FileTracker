import prisma from "../config/prisma.js";

/** Data-access layer for the Permissions admin module. */

export const findById = (id) => prisma.permission.findUnique({ where: { id } });

export const findByCode = (code) => prisma.permission.findUnique({ where: { code } });

export const findManyByIds = (ids) => prisma.permission.findMany({ where: { id: { in: ids } } });

export const create = (data) => prisma.permission.create({ data });

export const update = (id, data) => prisma.permission.update({ where: { id }, data });

export const setActive = (id, isActive) =>
  prisma.permission.update({ where: { id }, data: { isActive } });

export const findMany = ({ where, orderBy, skip, take }) =>
  prisma.permission.findMany({ where, orderBy, skip, take });

export const count = (where) => prisma.permission.count({ where });
