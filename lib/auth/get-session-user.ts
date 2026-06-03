import "server-only";

import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import type { AvatarType } from "@/lib/constants";

export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  avatarType?: AvatarType | null;
  username?: string | null;
  isAdmin: boolean;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  await connectDB();
  const dbUser = await User.findById(session.user.id)
    .select("avatarType image name username email isAdmin")
    .lean();

  return {
    id: session.user.id,
    email: dbUser?.email ?? session.user.email ?? "",
    name: dbUser?.name ?? session.user.name,
    image: dbUser?.image ?? undefined,
    avatarType: (dbUser?.avatarType as AvatarType | undefined) ?? undefined,
    username: dbUser?.username ?? session.user.username,
    isAdmin: dbUser?.isAdmin === true || session.user.isAdmin === true,
  };
}
