import "server-only";

import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export const MIN_PASSWORD_LENGTH = 8;

export function validateNewPassword(
  password: string,
  confirmPassword: string,
): string | null {
  if (!password) return "New password is required.";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (password !== confirmPassword) {
    return "New passwords do not match.";
  }
  return null;
}

export async function userHasPassword(userId: string): Promise<boolean> {
  await connectDB();
  const user = await User.findById(userId).select("+passwordHash").lean();
  return Boolean(user?.passwordHash);
}
