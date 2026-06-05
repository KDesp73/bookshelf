import "server-only";

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { sendLoginCodeEmail } from "@/lib/email/send-login-code";
import { LoginChallenge } from "@/models/LoginChallenge";
import { User } from "@/models/User";
import type { VerifiedUser } from "@/lib/auth/verify-credentials";
import { isAdminEmail } from "@/lib/auth/admin";

const CHALLENGE_COOKIE = "login_challenge";
const CHALLENGE_TTL_MS = 10 * 60 * 1000;
const LOGIN_TOKEN_TTL_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;

function generateCode(): string {
  return String(crypto.randomInt(100_000, 1_000_000));
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function hashValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export async function setLoginChallengeCookie(challengeId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(CHALLENGE_COOKIE, challengeId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: CHALLENGE_TTL_MS / 1000,
    path: "/",
  });
}

export async function getLoginChallengeIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(CHALLENGE_COOKIE)?.value?.trim();
  return value || null;
}

export async function clearLoginChallengeCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CHALLENGE_COOKIE);
}

export async function startEmailLoginChallenge(
  userId: string,
  email: string,
  callbackUrl: string,
): Promise<{ ok: true; challengeId: string } | { ok: false; error: string }> {
  await connectDB();

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS);

  await LoginChallenge.deleteMany({ userId, consumedAt: { $exists: false } });

  const challenge = await LoginChallenge.create({
    userId,
    email,
    codeHash,
    callbackUrl,
    expiresAt,
    lastSentAt: new Date(),
  });

  const sent = await sendLoginCodeEmail(email, code);
  if (!sent.ok) {
    await LoginChallenge.deleteOne({ _id: challenge._id });
    return sent;
  }

  await setLoginChallengeCookie(challenge._id.toString());
  return { ok: true, challengeId: challenge._id.toString() };
}

export async function resendEmailLoginCode(
  challengeId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await connectDB();

  const challenge = await LoginChallenge.findById(challengeId);
  if (!challenge || challenge.consumedAt || challenge.expiresAt < new Date()) {
    return { ok: false, error: "This sign-in session expired. Sign in again." };
  }

  const elapsed = Date.now() - challenge.lastSentAt.getTime();
  if (elapsed < RESEND_COOLDOWN_MS) {
    const seconds = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
    return { ok: false, error: `Wait ${seconds}s before requesting a new code.` };
  }

  const code = generateCode();
  challenge.codeHash = await bcrypt.hash(code, 10);
  challenge.attempts = 0;
  challenge.lastSentAt = new Date();
  challenge.expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS);
  await challenge.save();

  const sent = await sendLoginCodeEmail(challenge.email, code);
  if (!sent.ok) {
    return sent;
  }

  return { ok: true };
}

export async function verifyEmailLoginCode(
  challengeId: string,
  code: string,
): Promise<{ ok: true; loginToken: string } | { ok: false; error: string }> {
  await connectDB();

  const challenge = await LoginChallenge.findById(challengeId);
  if (!challenge || challenge.consumedAt || challenge.expiresAt < new Date()) {
    return { ok: false, error: "This sign-in session expired. Sign in again." };
  }

  if (challenge.attempts >= MAX_ATTEMPTS) {
    return { ok: false, error: "Too many attempts. Sign in again." };
  }

  const normalizedCode = code.replace(/\s/g, "").trim();
  if (!/^\d{6}$/.test(normalizedCode)) {
    return { ok: false, error: "Enter the 6-digit code from your email." };
  }

  const valid = await bcrypt.compare(normalizedCode, challenge.codeHash);
  if (!valid) {
    challenge.attempts += 1;
    await challenge.save();
    const remaining = MAX_ATTEMPTS - challenge.attempts;
    if (remaining <= 0) {
      return { ok: false, error: "Too many attempts. Sign in again." };
    }
    return {
      ok: false,
      error: `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} left.`,
    };
  }

  const loginToken = generateToken();
  challenge.loginTokenHash = hashValue(loginToken);
  challenge.loginTokenExpiresAt = new Date(Date.now() + LOGIN_TOKEN_TTL_MS);
  await challenge.save();

  return { ok: true, loginToken };
}

export async function consumeLoginToken(
  loginToken: string,
): Promise<VerifiedUser | null> {
  await connectDB();

  const tokenHash = hashValue(loginToken.trim());
  const challenge = await LoginChallenge.findOne({
    loginTokenHash: tokenHash,
    loginTokenExpiresAt: { $gt: new Date() },
    consumedAt: { $exists: false },
  });

  if (!challenge) return null;

  const user = await User.findById(challenge.userId).lean();
  if (!user) return null;

  challenge.consumedAt = new Date();
  challenge.loginTokenHash = undefined;
  challenge.loginTokenExpiresAt = undefined;
  await challenge.save();

  await clearLoginChallengeCookie();

  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name ?? undefined,
    username: user.username ?? null,
    isAdmin: user.isAdmin === true || isAdminEmail(user.email),
  };
}

export async function getActiveLoginChallenge(
  challengeId: string,
): Promise<{ email: string; callbackUrl: string } | null> {
  await connectDB();
  const challenge = await LoginChallenge.findById(challengeId).lean();
  if (!challenge || challenge.consumedAt || challenge.expiresAt < new Date()) {
    return null;
  }

  return {
    email: challenge.email,
    callbackUrl: challenge.callbackUrl,
  };
}

export async function userRequiresEmailTwoFactor(userId: string): Promise<boolean> {
  await connectDB();
  const user = await User.findById(userId).select("+passwordHash").lean();
  return Boolean(user?.passwordHash);
}
