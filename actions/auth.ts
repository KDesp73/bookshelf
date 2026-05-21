"use server";

import { redirect } from "next/navigation";
import {
  createSession,
  destroySession,
  verifyPassword,
} from "@/lib/auth/session";

export type AuthActionState = {
  error?: string;
};

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const password = String(formData.get("password") ?? "");
  const nextRaw = String(formData.get("next") ?? "").trim();
  const nextPath = nextRaw || undefined;

  if (!password.trim()) {
    return { error: "Password is required." };
  }

  if (!verifyPassword(password)) {
    return { error: "Invalid password." };
  }

  await createSession();

  const safeNext =
    nextPath?.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/";
  redirect(safeNext);
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
