"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn, signOut, unstable_update } from "@/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { claimLegacyBooksForAdmin } from "@/lib/books/legacy";
import { isAdminEmail } from "@/lib/auth/admin";
import { isValidUsername, normalizeUsername } from "@/lib/auth/username";
import { requireUser } from "@/lib/auth/require-user";
import {
  AVATAR_TYPES,
  type AvatarType,
} from "@/lib/constants";
import {
  isAllowedAvatarMime,
  MAX_AVATAR_BYTES,
} from "@/lib/users/avatar";

export type AuthActionState = {
  error?: string;
  success?: boolean;
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
  await signOut({ redirectTo: "/" });
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

    await claimLegacyBooksForAdmin(auth.user.id);
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

  if (!auth.user.username) {
    return { error: "Complete onboarding before editing your profile." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const avatarTypeRaw = String(formData.get("avatarType") ?? "identicon");
  const avatarFile = formData.get("avatarFile");

  if (bio.length > 280) {
    return { error: "Bio must be 280 characters or fewer." };
  }

  if (!AVATAR_TYPES.includes(avatarTypeRaw as AvatarType)) {
    return { error: "Invalid profile picture type." };
  }

  const avatarType = avatarTypeRaw as AvatarType;
  let imageUpdate: string | undefined;

  if (avatarType === "image") {
    if (avatarFile instanceof File && avatarFile.size > 0) {
      if (!isAllowedAvatarMime(avatarFile.type)) {
        return { error: "Use a JPEG, PNG, WebP, or GIF image." };
      }

      if (avatarFile.size > MAX_AVATAR_BYTES) {
        return { error: "Image must be 512 KB or smaller." };
      }

      const buffer = Buffer.from(await avatarFile.arrayBuffer());
      imageUpdate = `data:${avatarFile.type};base64,${buffer.toString("base64")}`;
    } else if (!auth.user.image) {
      return { error: "Choose a photo to upload." };
    }
  }

  try {
    await connectDB();

    const setFields: Record<string, unknown> = {
      name: name || undefined,
      bio: bio || undefined,
      avatarType,
    };

    if (avatarType === "image" && imageUpdate) {
      setFields.image = imageUpdate;
    }

    const updateQuery: Record<string, unknown> = { $set: setFields };
    if (avatarType !== "image") {
      updateQuery.$unset = { image: "" };
    }

    await User.findByIdAndUpdate(auth.user.id, updateQuery);
  } catch {
    return { error: "Could not update profile." };
  }

  let nextImage: string | null = null;
  if (avatarType === "image") {
    nextImage = imageUpdate ?? auth.user.image ?? null;
  }

  await unstable_update({
    user: {
      name: name || undefined,
      image: nextImage,
    },
  });
  revalidatePath(`/u/${auth.user.username}`);

  return { success: true };
}
