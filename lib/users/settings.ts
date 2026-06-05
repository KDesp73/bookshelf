import "server-only";

import { connectDB } from "@/lib/db";
import { userHasPassword } from "@/lib/auth/password";
import { getUserById } from "@/lib/users/queries";
import { User } from "@/models/User";
import type { UserSettings } from "@/types/user";

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const profile = await getUserById(userId);
  if (!profile) return null;

  await connectDB();
  const user = await User.findById(userId)
    .select("promotionalEmailsOptIn")
    .lean();

  const hasPassword = await userHasPassword(userId);

  return {
    ...profile,
    promotionalEmailsOptIn: user?.promotionalEmailsOptIn === true,
    hasPassword,
  };
}
