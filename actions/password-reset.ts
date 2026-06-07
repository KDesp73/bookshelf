"use server";

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { PasswordResetToken } from "@/models/PasswordResetToken";
import { sendPasswordResetEmail } from "@/lib/email/send-password-reset";
import { validateNewPassword } from "@/lib/auth/password";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function requestPasswordResetAction(
  _prev: ActionResult<null> | null,
  formData: FormData,
): Promise<ActionResult<null>> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email) {
    return { success: false, error: "Email is required." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Please enter a valid email address." };
  }

  await connectDB();

  const user = await User.findOne({ email }).select("+passwordHash");

  if (!user || !user.passwordHash) {
    return {
      success: true,
      data: null,
    };
  }

  await PasswordResetToken.deleteMany({
    userId: user._id.toString(),
    consumedAt: { $exists: false },
  });

  const token = generateToken();
  const tokenHash = hashToken(token);

  await PasswordResetToken.create({
    userId: user._id.toString(),
    email: user.email,
    tokenHash,
    expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
  });

  const sent = await sendPasswordResetEmail(user.email, token);
  if (!sent.ok) {
    return { success: false, error: sent.error };
  }

  return { success: true, data: null };
}

export async function resetPasswordAction(
  _prev: ActionResult<null> | null,
  formData: FormData,
): Promise<ActionResult<null>> {
  const token = String(formData.get("token") ?? "").trim();
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!token) {
    return { success: false, error: "Reset token is missing." };
  }

  const passwordError = validateNewPassword(newPassword, confirmPassword);
  if (passwordError) {
    return { success: false, error: passwordError };
  }

  await connectDB();

  const tokenHash = hashToken(token);
  const resetToken = await PasswordResetToken.findOne({
    tokenHash,
    expiresAt: { $gt: new Date() },
    consumedAt: { $exists: false },
  });

  if (!resetToken) {
    return {
      success: false,
      error: "This reset link is invalid or has expired. Request a new one.",
    };
  }

  const user = await User.findById(resetToken.userId);
  if (!user) {
    return { success: false, error: "User no longer exists." };
  }

  const sameAsCurrent =
    user.passwordHash &&
    (await bcrypt.compare(newPassword, user.passwordHash));
  if (sameAsCurrent) {
    return {
      success: false,
      error: "New password must be different from your current password.",
    };
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();

  resetToken.consumedAt = new Date();
  await resetToken.save();

  return { success: true, data: null };
}
