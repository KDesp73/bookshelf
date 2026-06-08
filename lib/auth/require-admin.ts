import "server-only";

import { getSessionUser } from "@/lib/auth/get-session-user";
import { isAdminEmail } from "@/lib/auth/admin";
import { ALL_ADMIN_PERMISSIONS } from "@/lib/constants";
import type { AdminPermission } from "@/lib/constants";
import type { SessionUser } from "@/lib/auth/get-session-user";

export async function requireAdmin(): Promise<
  { user: SessionUser; error: null } | { user: null; error: string }
> {
  const user = await getSessionUser();
  if (!user) {
    return { user: null, error: "Sign in required." };
  }
  if (!user.isAdmin) {
    return { user: null, error: "Admin access required." };
  }
  return { user, error: null };
}

function userHasPermission(user: SessionUser, permission: AdminPermission): boolean {
  if (isAdminEmail(user.email)) return true;
  return user.adminPermissions.includes(permission);
}

export async function requirePermission(
  permission: AdminPermission,
): Promise<{ user: SessionUser; error: null } | { user: null; error: string }> {
  const result = await requireAdmin();
  if (result.error || !result.user) return result;

  if (!userHasPermission(result.user, permission)) {
    return { user: null, error: "You do not have permission for this action." };
  }

  return result as { user: SessionUser; error: null };
}
