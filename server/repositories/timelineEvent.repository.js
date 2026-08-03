import prisma from "../config/prisma.js";

/** Written exclusively by the domain-event subscriber (timelineEvent.subscriber.js) -- never by an API request handler. */
export const create = (data) => prisma.timelineEvent.create({ data });

const ACTOR_INCLUDE = { actor: { select: { id: true, fullName: true, username: true } } };

export const findByFileId = ({ fileId, where, skip, take, orderBy }) =>
  prisma.timelineEvent.findMany({
    where: { fileId, ...where },
    include: ACTOR_INCLUDE,
    orderBy,
    skip,
    take,
  });

export const count = (fileId, where) => prisma.timelineEvent.count({ where: { fileId, ...where } });
