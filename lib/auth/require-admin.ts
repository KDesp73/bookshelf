import "server-only";

import { isAdmin } from "@/lib/auth/session";

export async function requireAdmin(): Promise<string | null> {
  if (await isAdmin()) return null;
  return "Admin login required.";
}
