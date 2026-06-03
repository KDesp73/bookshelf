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
  isAdmin?: boolean;
  createdAt: string;
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
  likeCount: number;
  createdAt: string;
}

export interface DiscoverFilters {
  search?: string;
  sort?: "likes" | "books" | "recent";
}
