import type { AvatarType } from "@/lib/constants";
import type { ShelfAppearance } from "@/types/shelf";

export interface UserProfile {
  _id: string;
  email: string;
  name?: string;
  image?: string;
  avatarType?: AvatarType;
  username?: string;
  bio?: string;
  shelfAppearance: ShelfAppearance;
  wishlistPublic: boolean;
  favoriteBookIds: string[];
  isAdmin?: boolean;
  isStore?: boolean;
  adminPermissions?: string[];
  storeName?: string;
  storeDescription?: string;
  storeAddress?: string;
  storePhone?: string;
  storeLogo?: string;
  createdAt: string;
}

/** Owner-only account settings (not exposed on public profiles). */
export interface UserSettings extends UserProfile {
  promotionalEmailsOptIn: boolean;
  hasPassword: boolean;
}

export interface AdminUserRow {
  _id: string;
  email: string;
  name?: string;
  username?: string;
  isAdmin: boolean;
  bookCount: number;
  likeCount: number;
  createdAt: string;
}

export interface AdminStats {
  userCount: number;
  bookCount: number;
  likeCount: number;
}

export interface UserListItem {
  _id: string;
  username: string;
  name?: string;
  image?: string;
  avatarType?: AvatarType;
  bio?: string;
  shelfAppearance: ShelfAppearance;
  bookCount: number;
  readCount?: number;
  likeCount: number;
  achievementCount?: number;
  createdAt: string;
  coverUrls?: string[];
}

export interface PaginatedResult<T> {
  items: T[];
  hasMore: boolean;
}

export interface DiscoverFilters {
  search?: string;
  sort?: "likes" | "books" | "recent";
}

export type RankingSort = "overall" | "books_added" | "books_read" | "likes" | "achievements";

/** Public profile snippet for someone who liked a collection. */
export interface CollectionLiker {
  _id: string;
  name?: string;
  username?: string;
  image?: string;
  avatarType?: AvatarType;
  likedAt: string;
}
