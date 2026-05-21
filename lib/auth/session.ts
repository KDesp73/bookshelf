import "server-only";

import { cookies } from "next/headers";
import {
  SESSION_VALUE,
  signSessionValue,
  verifySessionToken,
} from "@/lib/auth/session-crypto";

const COOKIE_NAME = "bookshelf_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function createSession(): Promise<void> {
  const token = await signSessionValue(SESSION_VALUE);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export function verifyPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD?.trim();
  if (!expected) {
    if (process.env.NODE_ENV === "production") return false;
    return password === "admin";
  }

  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return a.equals(b);
}
