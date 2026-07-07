import "server-only";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { Store } from "@/models/Store";
import type { StoreDocument } from "@/types/store";

const SESSION_COOKIE = "store_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/store",
  });
}

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return token ?? null;
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/store",
  });
}

export async function createStoreSession(storeId: string): Promise<string> {
  const token = generateSessionToken();
  await connectDB();
  await Store.findByIdAndUpdate(storeId, { sessionToken: token });
  await setSessionCookie(token);
  return token;
}

export async function destroyStoreSession(storeId: string): Promise<void> {
  await connectDB();
  await Store.findByIdAndUpdate(storeId, { $unset: { sessionToken: "" } });
  await clearSessionCookie();
}

function toStoreDocument(store: Record<string, unknown>): StoreDocument {
  return {
    _id: String(store._id),
    name: store.name as string,
    email: store.email as string,
    description: (store.description as string) ?? undefined,
    address: (store.address as string) ?? undefined,
    phone: (store.phone as string) ?? undefined,
    logo: (store.logo as string) ?? undefined,
    createdAt: (store.createdAt as Date).toISOString(),
    updatedAt: (store.updatedAt as Date).toISOString(),
  };
}

export async function getStoreFromSession(): Promise<StoreDocument | null> {
  const token = await getSessionToken();
  if (!token) return null;

  await connectDB();
  const store = await Store.findOne({ sessionToken: token }).lean();
  if (!store) return null;

  return toStoreDocument(store);
}
