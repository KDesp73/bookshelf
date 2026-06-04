import "server-only";

import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { isAdminEmail } from "@/lib/auth/admin";
import { User } from "@/models/User";

export type VerifiedUser = {
  id: string;
  email: string;
  name?: string;
  username: string | null;
  isAdmin: boolean;
};

export type VerifyCredentialsResult =
  | { ok: true; user: VerifiedUser }
  | { ok: false; reason: "not_found" | "no_password" | "invalid_password" | "invalid_hash" };

const BCRYPT_HASH = /^\$2[aby]\$\d{2}\$.{53}$/;

export function isBcryptHash(hash: string): boolean {
  return BCRYPT_HASH.test(hash);
}

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<VerifyCredentialsResult> {
  await connectDB();

  const user = await User.findOne({ email }).select("+passwordHash").lean();
  if (!user) {
    return { ok: false, reason: "not_found" };
  }

  if (!user.passwordHash) {
    return { ok: false, reason: "no_password" };
  }

  if (!isBcryptHash(user.passwordHash)) {
    return { ok: false, reason: "invalid_hash" };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { ok: false, reason: "invalid_password" };
  }

  return {
    ok: true,
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name ?? undefined,
      username: user.username ?? null,
      isAdmin: user.isAdmin === true || isAdminEmail(user.email),
    },
  };
}

export function credentialsErrorMessage(
  reason: Exclude<VerifyCredentialsResult, { ok: true }>["reason"],
): string {
  switch (reason) {
    case "not_found":
    case "invalid_password":
      return "Invalid email or password.";
    case "no_password":
      return "This account has no password. Sign in with Google or GitHub if enabled.";
    case "invalid_hash":
      return "This account has an incompatible password format. Reset your password from the profile page after signing in with OAuth, or contact support.";
  }
}
