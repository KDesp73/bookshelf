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

export const ACHIEVEMENT_CONDITION_TYPES = [
  "books_added",
  "books_read",
  "books_rated",
  "collection_likes",
] as const;
export type AchievementConditionType = (typeof ACHIEVEMENT_CONDITION_TYPES)[number];
