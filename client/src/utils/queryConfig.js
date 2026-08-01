/**
 * Central staleTime policy for React Query hooks -- source of truth so every
 * hook's freshness window is a deliberate, named choice instead of a scattered
 * magic number. Pick the tier by how often the underlying data actually
 * changes, not by how "important" the screen feels.
 */
export const STALE_TIME = {
  // Feeds meant to feel live (e.g. recent activity). Short enough that a
  // revisit within the window skips a refetch, long enough to dedupe bursts.
  REALTIME: 30 * 1000,
  // Aggregates/lists that change as users act (stats, paginated directories).
  // These are also explicitly invalidated on the mutations that affect them
  // (see useCreateUser), so this tier just avoids redundant background
  // refetches on remount/refocus within the window, not correctness.
  SHORT: 60 * 1000,
  // Slow-changing organizational lookup data used to populate dropdowns
  // (departments, units, roles) -- effectively static within a session.
  LONG: 5 * 60 * 1000,
};
