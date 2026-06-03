import "server-only";

import { getSessionUser } from "@/lib/auth/get-session-user";
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
