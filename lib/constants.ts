export const AVATAR_TYPES = ["identicon", "initial", "image"] as const;
export type AvatarType = (typeof AVATAR_TYPES)[number];

export const READING_STATUSES = ["Unread", "Reading", "Read"] as const;
export type ReadingStatus = (typeof READING_STATUSES)[number];

export const MAX_FAVORITE_BOOKS = 5;

export const BLOG_REACTION_EMOJIS = ["👍", "❤️", "🎉", "👀", "📚", "🔥"] as const;
export type BlogReactionEmoji = (typeof BLOG_REACTION_EMOJIS)[number];

export function isBlogReactionEmoji(value: string): value is BlogReactionEmoji {
  return BLOG_REACTION_EMOJIS.includes(value as BlogReactionEmoji);
}

export const RATING_VALUES = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5] as const;
export type BookRating = (typeof RATING_VALUES)[number];

export function isValidRating(value: unknown): value is BookRating {
  return (
    typeof value === "number" &&
    RATING_VALUES.includes(value as BookRating)
  );
}

export const ADMIN_PERMISSIONS = {
  MANAGE_USERS: "manage_users",
  MANAGE_NEWS: "manage_news",
  MANAGE_ACHIEVEMENTS: "manage_achievements",
  MANAGE_EMAILS: "manage_emails",
  MANAGE_BOOKS: "manage_books",
  MANAGE_METADATA: "manage_metadata",
  MANAGE_SUGGESTIONS: "manage_suggestions",
  MANAGE_RECOMMENDATIONS: "manage_recommendations",
  MANAGE_STORES: "manage_stores",
  MANAGE_ADS: "manage_ads",
} as const;
export type AdminPermission = (typeof ADMIN_PERMISSIONS)[keyof typeof ADMIN_PERMISSIONS];
export const ALL_ADMIN_PERMISSIONS: AdminPermission[] = Object.values(ADMIN_PERMISSIONS);
export const ADMIN_PERMISSION_LABELS: Record<AdminPermission, string> = {
  manage_users: "Manage users",
  manage_news: "Manage news & blog",
  manage_achievements: "Manage achievements",
  manage_emails: "Send promotional emails",
  manage_books: "Manage all books",
  manage_metadata: "Metadata enrichment",
  manage_suggestions: "Manage suggestions",
  manage_recommendations: "Refresh recommendations",
  manage_stores: "Manage stores",
  manage_ads: "Manage ads",
};

export const SUGGESTION_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
  wont_implement: "Won't implement",
};

export const ACHIEVEMENT_CONDITION_TYPES = [
  "books_added",
  "books_read",
  "books_unread",
  "books_reading",
  "books_rated",
  "books_wishlist",
  "collection_likes",
  "account_age_days",
] as const;
export type AchievementConditionType = (typeof ACHIEVEMENT_CONDITION_TYPES)[number];
