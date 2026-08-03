import { AppError } from "../utils/AppError.js";
import { parsePagination, buildPaginationMeta } from "../utils/queryOptions.js";
import * as fileRepository from "../repositories/file.repository.js";
import * as timelineEventRepository from "../repositories/timelineEvent.repository.js";

const sanitize = (event) => ({
  id: event.id,
  eventType: event.eventType,
  title: event.title,
  description: event.description,
  sourceType: event.sourceType,
  sourceId: event.sourceId,
  actor: event.actor,
  occurredAt: event.occurredAt,
});

/**
 * The file's permanent, read-only timeline. Populated exclusively by the
 * domain-event subscriber (see timelineEvent.subscriber.js) -- this
 * service has no create/update/delete, by design: nothing calls this API
 * to write history, history is a side effect of everything else.
 */
export const listTimeline = async ({ fileId, query }) => {
  const file = await fileRepository.findById(fileId);
  if (!file) throw new AppError(404, "File not found");

  const { page, limit, skip, take } = parsePagination(query);
  const sortOrder = query.sortOrder === "desc" ? "desc" : "asc";

  const where = {
    ...(query.eventType ? { eventType: query.eventType } : {}),
    ...(query.fromDate || query.toDate
      ? {
          occurredAt: {
            ...(query.fromDate ? { gte: new Date(query.fromDate) } : {}),
            ...(query.toDate ? { lte: new Date(query.toDate) } : {}),
          },
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    timelineEventRepository.findByFileId({ fileId, where, skip, take, orderBy: { occurredAt: sortOrder } }),
    timelineEventRepository.count(fileId, where),
  ]);

  return { items: items.map(sanitize), meta: buildPaginationMeta(total, page, limit) };
};
