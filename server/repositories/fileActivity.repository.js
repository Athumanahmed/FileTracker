import prisma from "../config/prisma.js";

/** Access/interaction telemetry (views, downloads) -- distinct from the business-event TimelineEvent/FileHistory logs. */
export const record = (data) => prisma.fileActivity.create({ data });
