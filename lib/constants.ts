export const DEFAULT_USER_ID =
  process.env.BOOKSHELF_USER_ID?.trim() || "default-user";

export const READING_STATUSES = ["Unread", "Reading", "Read"] as const;
export type ReadingStatus = (typeof READING_STATUSES)[number];
