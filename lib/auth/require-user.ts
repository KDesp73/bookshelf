import "server-only";

import { getSessionUser } from "@/lib/auth/get-session-user";
import type { SessionUser } from "@/lib/auth/get-session-user";

export async function requireUser(): Promise<
  { user: SessionUser; error: null } | { user: null; error: string }
> {
  const user = await getSessionUser();
  if (!user) {
    return { user: null, error: "Sign in required." };
  }
  return { user, error: null };
}

export async function requireUserWithUsername(): Promise<
  { user: SessionUser & { username: string }; error: null } | { user: null; error: string }
> {
  const result = await requireUser();
  if (result.error || !result.user) {
    return { user: null, error: result.error ?? "Sign in required." };
  }

  if (!result.user.username) {
    return { user: null, error: "Complete onboarding to choose a username." };
  }

  return {
    user: { ...result.user, username: result.user.username },
    error: null,
  };
}
