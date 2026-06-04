"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn, signOut, unstable_update } from "@/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { isAdminEmail } from "@/lib/auth/admin";
import {
  credentialsErrorMessage,
  verifyCredentials,
} from "@/lib/auth/verify-credentials";
import { isValidUsername, normalizeUsername } from "@/lib/auth/username";
import {
  MIN_PASSWORD_LENGTH,
  validateNewPassword,
} from "@/lib/auth/password";
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
  redirectTo?: string;
  username?: string;
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
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
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

  return { success: true, redirectTo: "/onboarding" };
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

  const verified = await verifyCredentials(email, password);
  if (!verified.ok) {
    return { error: credentialsErrorMessage(verified.reason) };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
      redirectTo,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    console.error("[login] signIn failed after verify:", error);
    return { error: "Sign-in failed. Please try again." };
  }

  return { success: true, redirectTo };
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
  } catch {
    return { error: "Could not save profile. Try again." };
  }

  return { success: true, redirectTo: "/", username };
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

export async function changePasswordAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const auth = await requireUser();
  if (auth.error || !auth.user) {
    return { error: auth.error ?? "Sign in required." };
  }

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword) {
    return { error: "Current password is required." };
  }

  const passwordError = validateNewPassword(newPassword, confirmPassword);
  if (passwordError) {
    return { error: passwordError };
  }

  try {
    await connectDB();
    const user = await User.findById(auth.user.id).select("+passwordHash");

    if (!user?.passwordHash) {
      return {
        error:
          "Your account uses Google or GitHub sign-in and has no password to change.",
      };
    }

    const currentValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!currentValid) {
      return { error: "Current password is incorrect." };
    }

    const sameAsCurrent = await bcrypt.compare(newPassword, user.passwordHash);
    if (sameAsCurrent) {
      return { error: "New password must be different from your current password." };
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
  } catch {
    return { error: "Could not update password. Try again." };
  }

  return { success: true };
}
