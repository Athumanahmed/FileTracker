import prisma from "../config/prisma.js";

export const findById = (id) => prisma.citizen.findFirst({ where: { id, isActive: true } });

export const findByNationalId = (nationalId) => prisma.citizen.findFirst({ where: { nationalId, isActive: true } });

export const findByPhoneNumber = (phoneNumber) => prisma.citizen.findFirst({ where: { phoneNumber, isActive: true } });

export const create = (data) => prisma.citizen.create({ data });

/** Global Search's citizen half -- a lightweight top-N lookup, not a full directory query. */
export const search = (term, limit) =>
  prisma.citizen.findMany({
    where: {
      isActive: true,
      OR: [
        { fullName: { contains: term, mode: "insensitive" } },
        { phoneNumber: { contains: term, mode: "insensitive" } },
        { nationalId: { contains: term, mode: "insensitive" } },
        { citizenNumber: { contains: term, mode: "insensitive" } },
      ],
    },
    select: { id: true, citizenNumber: true, fullName: true, phoneNumber: true, nationalId: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
