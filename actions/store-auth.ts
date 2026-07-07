"use server";

import { connectDB } from "@/lib/db";
import { Store } from "@/models/Store";
import {
  hashPassword,
  verifyPassword,
  createStoreSession,
  destroyStoreSession,
  getStoreFromSession,
  clearSessionCookie,
} from "@/lib/store/auth";

export type StoreAuthState = {
  error?: string;
  success?: boolean;
  redirectTo?: string;
};

export async function registerStoreAction(
  _prevState: StoreAuthState,
  formData: FormData,
): Promise<StoreAuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!name) return { error: "Store name is required." };
  if (!email) return { error: "Email is required." };
  if (!password) return { error: "Password is required." };
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  try {
    await connectDB();
    const existing = await Store.findOne({ email });
    if (existing) {
      return { error: "A store with this email already exists." };
    }

    const passwordHash = await hashPassword(password);
    await Store.create({ name, email, passwordHash });
  } catch {
    return { error: "Could not create store account. Try again." };
  }

  return { success: true, redirectTo: "/store/login" };
}

export async function loginStoreAction(
  _prevState: StoreAuthState,
  formData: FormData,
): Promise<StoreAuthState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  try {
    await connectDB();
    const store = await Store.findOne({ email }).select("+passwordHash");
    if (!store) {
      return { error: "Invalid email or password." };
    }

    const valid = await verifyPassword(password, store.passwordHash);
    if (!valid) {
      return { error: "Invalid email or password." };
    }

    await createStoreSession(store._id.toString());
  } catch {
    return { error: "Could not sign in. Try again." };
  }

  return { success: true, redirectTo: "/store/dashboard" };
}

export async function logoutStoreAction(): Promise<void> {
  const store = await getStoreFromSession();
  if (store) {
    await destroyStoreSession(store._id);
  } else {
    await clearSessionCookie();
  }
}
