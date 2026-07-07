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
  isStore: boolean;
  adminPermissions: AdminPermission[];
  storeName?: string;
  storeDescription?: string;
  storeAddress?: string;
  storePhone?: string;
  storePostalCode?: string;
  storeCity?: string;
  storeImages?: string[];
  storeWebsite?: string;
  storeLogo?: string;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  try {
    await connectDB();
    const dbUser = await User.findById(session.user.id)
      .select("avatarType image name username email isAdmin adminPermissions isStore storeName storeDescription storeAddress storePhone storePostalCode storeCity storeImages storeWebsite storeLogo")
      .lean();

    const isAdmin = dbUser?.isAdmin === true || session.user.isAdmin === true;
    const permissions =
      (dbUser?.adminPermissions as AdminPermission[] | undefined) ??
      session.user.adminPermissions;

    return {
      id: session.user.id,
      email: dbUser?.email ?? session.user.email ?? "",
      name: dbUser?.name ?? session.user.name,
      image: dbUser?.image ?? undefined,
      avatarType: (dbUser?.avatarType as AvatarType | undefined) ?? undefined,
      username: dbUser?.username ?? session.user.username,
      isAdmin,
      isStore: (dbUser?.isStore as boolean | undefined) ?? session.user.isStore === true,
      adminPermissions: isAdmin && (!permissions || permissions.length === 0)
        ? ALL_ADMIN_PERMISSIONS
        : (permissions ?? ALL_ADMIN_PERMISSIONS),
      storeName: (dbUser as Record<string, unknown>)?.storeName as string | undefined,
      storeDescription: (dbUser as Record<string, unknown>)?.storeDescription as string | undefined,
      storeAddress: (dbUser as Record<string, unknown>)?.storeAddress as string | undefined,
      storePhone: (dbUser as Record<string, unknown>)?.storePhone as string | undefined,
      storePostalCode: (dbUser as Record<string, unknown>)?.storePostalCode as string | undefined,
      storeCity: (dbUser as Record<string, unknown>)?.storeCity as string | undefined,
      storeImages: (dbUser as Record<string, unknown>)?.storeImages as string[] | undefined,
      storeWebsite: (dbUser as Record<string, unknown>)?.storeWebsite as string | undefined,
      storeLogo: (dbUser as Record<string, unknown>)?.storeLogo as string | undefined,
    };
  } catch {
    const isAdmin = session.user.isAdmin === true;
    const permissions = session.user.adminPermissions;

    return {
      id: session.user.id,
      email: session.user.email ?? "",
      name: session.user.name,
      image: session.user.image ?? undefined,
      username: session.user.username,
      isAdmin,
      isStore: session.user.isStore === true,
      adminPermissions: isAdmin && (!permissions || permissions.length === 0)
        ? ALL_ADMIN_PERMISSIONS
        : (permissions ?? ALL_ADMIN_PERMISSIONS),
    };
  }
}
