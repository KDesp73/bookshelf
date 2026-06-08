import "server-only";

import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { ALL_ADMIN_PERMISSIONS } from "@/lib/constants";
import type { AvatarType, AdminPermission } from "@/lib/constants";

export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  avatarType?: AvatarType | null;
  username?: string | null;
  isAdmin: boolean;
  adminPermissions: AdminPermission[];
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  try {
    await connectDB();
    const dbUser = await User.findById(session.user.id)
      .select("avatarType image name username email isAdmin adminPermissions")
      .lean();

    return {
      id: session.user.id,
      email: dbUser?.email ?? session.user.email ?? "",
      name: dbUser?.name ?? session.user.name,
      image: dbUser?.image ?? undefined,
      avatarType: (dbUser?.avatarType as AvatarType | undefined) ?? undefined,
      username: dbUser?.username ?? session.user.username,
      isAdmin: dbUser?.isAdmin === true || session.user.isAdmin === true,
      adminPermissions:
        (dbUser?.adminPermissions as AdminPermission[] | undefined) ??
        session.user.adminPermissions ??
        ALL_ADMIN_PERMISSIONS,
    };
  } catch {
    return {
      id: session.user.id,
      email: session.user.email ?? "",
      name: session.user.name,
      image: session.user.image ?? undefined,
      username: session.user.username,
      isAdmin: session.user.isAdmin === true,
      adminPermissions: session.user.adminPermissions ?? ALL_ADMIN_PERMISSIONS,
    };
  }
}
