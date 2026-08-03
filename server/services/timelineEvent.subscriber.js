import { subscribe } from "../utils/eventBus.js";
import * as timelineEventRepository from "../repositories/timelineEvent.repository.js";

/**
 * Timeline's write side: turns every published domain event into a
 * TimelineEvent row. This is deliberately the only thing this phase
 * builds -- the read/query API (GET .../timeline) is Phase 7's own
 * deliverable, built on top of the rows this subscriber has been
 * populating since Phase 6.
 */
export const registerTimelineSubscriber = () => {
  subscribe((event) =>
    timelineEventRepository.create({
      fileId: event.fileId,
      eventType: event.type,
      title: event.title,
      description: event.description ?? null,
      sourceType: event.sourceType,
      sourceId: event.sourceId ?? null,
      actorId: event.actorId ?? null,
      occurredAt: new Date(),
    }),
  );
};
