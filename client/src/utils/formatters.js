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
