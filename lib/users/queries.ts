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
    isAdmin: user.isAdmin ?? false,
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
