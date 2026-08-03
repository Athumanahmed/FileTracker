import dayjs from "dayjs";

/** "John Doe" -> "JD" -- used for avatar circles wherever a user has no profile photo. */
export const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

/** e.g. "May 25, 2026 10:45 AM" -- absolute, not relative, for columns like Last Login. */
export const formatDateTime = (value) => (value ? dayjs(value).format("MMM D, YYYY h:mm A") : "Never");

/** e.g. 245000 -> "245 KB" -- attachment/version file sizes are stored in bytes. */
export const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
};
