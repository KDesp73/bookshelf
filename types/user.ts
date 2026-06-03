import type { AvatarType } from "@/lib/constants";

export interface UserProfile {
  _id: string;
  email: string;
  name?: string;
  image?: string;
  avatarType?: AvatarType;
  username?: string;
  bio?: string;
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
  bookCount: number;
  likeCount: number;
  createdAt: string;
}

export interface DiscoverFilters {
  search?: string;
  sort?: "likes" | "books" | "recent";
}
