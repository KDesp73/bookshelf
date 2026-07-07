import { connectDB } from "@/lib/db";
import { User, type IUser } from "@/models/User";
import type { AvatarType } from "@/lib/constants";
import { getShelfAppearance } from "@/lib/shelf/appearance";
import type { UserProfile } from "@/types/user";

function toUserProfile(user: IUser & { _id: { toString(): string } }): UserProfile {
  return {
    _id: user._id.toString(),
    email: user.email,
    name: user.name ?? undefined,
    image: user.image ?? undefined,
    avatarType: (user.avatarType as AvatarType | undefined) ?? undefined,
    username: user.username ?? undefined,
    bio: user.bio ?? undefined,
    shelfAppearance: getShelfAppearance(user),
    wishlistPublic: user.wishlistPublic === true,
    favoriteBookIds: user.favoriteBookIds ?? [],
    isAdmin: user.isAdmin ?? false,
    isStore: (user as Record<string, unknown>).isStore === true,
    adminPermissions: user.adminPermissions as string[] | undefined,
    storeName: (user as Record<string, unknown>).storeName as string | undefined,
    storeDescription: (user as Record<string, unknown>).storeDescription as string | undefined,
    storeAddress: (user as Record<string, unknown>).storeAddress as string | undefined,
    storePhone: (user as Record<string, unknown>).storePhone as string | undefined,
    storeLogo: (user as Record<string, unknown>).storeLogo as string | undefined,
    storePostalCode: (user as Record<string, unknown>).storePostalCode as string | undefined,
    storeCity: (user as Record<string, unknown>).storeCity as string | undefined,
    storeImages: (user as Record<string, unknown>).storeImages as string[] | undefined,
    storeWebsite: (user as Record<string, unknown>).storeWebsite as string | undefined,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function getUserById(id: string): Promise<UserProfile | null> {
  await connectDB();
  const user = await User.findById(id).lean();
  if (!user) return null;
  return toUserProfile(user as IUser & { _id: { toString(): string } });
}

export async function getUserByUsername(
  username: string,
): Promise<UserProfile | null> {
  await connectDB();
  const user = await User.findOne({
    username: username.trim().toLowerCase(),
  }).lean();
  if (!user) return null;
  return toUserProfile(user as IUser & { _id: { toString(): string } });
}

export async function getUserByEmail(email: string): Promise<UserProfile | null> {
  await connectDB();
  const user = await User.findOne({ email: email.trim().toLowerCase() }).lean();
  if (!user) return null;
  return toUserProfile(user as IUser & { _id: { toString(): string } });
}
