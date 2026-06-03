import { AVATAR_TYPES, type AvatarType } from "@/lib/constants";

export interface AvatarUser {
  _id: string;
  name?: string | null;
  username?: string | null;
  image?: string | null;
  avatarType?: AvatarType | null;
}

export function resolveAvatarType(user: AvatarUser): AvatarType {
  if (user.avatarType && AVATAR_TYPES.includes(user.avatarType)) {
    return user.avatarType;
  }
  if (user.image) return "image";
  return "identicon";
}

export function getInitial(user: AvatarUser): string {
  const source = user.name?.trim() || user.username?.trim() || "?";
  return source[0]!.toUpperCase();
}

export const MAX_AVATAR_BYTES = 512 * 1024;
export const ALLOWED_AVATAR_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export function isAllowedAvatarMime(type: string): boolean {
  return ALLOWED_AVATAR_MIME_TYPES.includes(
    type as (typeof ALLOWED_AVATAR_MIME_TYPES)[number],
  );
}
