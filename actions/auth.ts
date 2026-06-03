"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn, signOut, unstable_update } from "@/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { claimLegacyBooksForAdmin } from "@/lib/books/legacy";
import { isAdminEmail } from "@/lib/auth/admin";
import { isValidUsername, normalizeUsername } from "@/lib/auth/username";
import { requireUser } from "@/lib/auth/require-user";

export type AuthActionState = {
  error?: string;
};

export async function registerAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

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
    const existing = await User.findOne({ email });
    if (existing) {
      return { error: "An account with this email already exists." };
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await User.create({
      email,
      name: name || undefined,
      passwordHash,
      isAdmin: isAdminEmail(email),
    });
  } catch {
    return { error: "Could not create account. Try again." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/onboarding",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created but sign-in failed. Try logging in." };
    }
    throw error;
  }

  redirect("/onboarding");
}

export async function loginWithCredentialsAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "").trim();

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const redirectTo =
    callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : "/";

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }

  redirect(redirectTo);
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/discover" });
}

export async function completeOnboardingAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const auth = await requireUser();
  if (auth.error || !auth.user) {
    return { error: auth.error ?? "Sign in required." };
  }

  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const bio = String(formData.get("bio") ?? "").trim();

  if (!isValidUsername(username)) {
    return {
      error:
        "Username must be 3–30 characters and use only lowercase letters, numbers, hyphens, and underscores.",
    };
  }

  try {
    await connectDB();

    const existing = await User.findOne({ username });
    if (existing && existing._id.toString() !== auth.user.id) {
      return { error: "This username is already taken." };
    }

    await User.findByIdAndUpdate(auth.user.id, {
      username,
      bio: bio || undefined,
    });

    if (auth.user.isAdmin) {
      await claimLegacyBooksForAdmin(auth.user.id);
    }
  } catch {
    return { error: "Could not save profile. Try again." };
  }

  await unstable_update({ user: { username } });

  redirect("/");
}

export async function updateProfileAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const auth = await requireUser();
  if (auth.error || !auth.user) {
    return { error: auth.error ?? "Sign in required." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();

  try {
    await connectDB();
    await User.findByIdAndUpdate(auth.user.id, {
      name: name || undefined,
      bio: bio || undefined,
    });
  } catch {
    return { error: "Could not update profile." };
  }

  redirect(`/u/${auth.user.username}`);
}
