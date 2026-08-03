import { EventEmitter } from "node:events";

/**
 * Single process-wide domain event bus. Workflow actions publish; other
 * modules subscribe independently (Timeline now; Notifications/Reports in
 * later phases) -- neither side imports the other, so Workflow never
 * calls Notification/Timeline code directly, per the roadmap's
 * Event-Driven Architecture: "Workflow publishes events... Timeline
 * subscribes... Notifications subscribes... Reports subscribes."
 *
 * All events go through one channel rather than per-type channels --
 * Node's EventEmitter has no wildcard subscription, and a single channel
 * lets a subscriber (like Timeline) react to every event type without
 * registering a listener per type.
 */
const bus = new EventEmitter();
bus.setMaxListeners(50);

const CHANNEL = "domain-event";

/** @param {{ type: string, fileId: string, actorId?: string|null, sourceType: string, sourceId?: string|null, title: string, description?: string|null }} event */
export const publish = (event) => {
  bus.emit(CHANNEL, event);
};

/** A subscriber failing must never break the action that published the event -- errors are caught and logged, not thrown back at the publisher. */
export const subscribe = (handler) => {
  bus.on(CHANNEL, (event) => {
    Promise.resolve(handler(event)).catch((err) => {
      console.error("Domain event subscriber failed:", err);
    });
  });
};
