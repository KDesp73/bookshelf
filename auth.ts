import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { authConfig } from "@/auth.config";
import { connectDB } from "@/lib/db";
import { isAdminEmail } from "@/lib/auth/admin";
import { ALL_ADMIN_PERMISSIONS } from "@/lib/constants";
import { compactAuthToken } from "@/lib/auth/jwt-token";
import {
  verifyCredentials,
} from "@/lib/auth/verify-credentials";
import { consumeLoginToken } from "@/lib/auth/login-challenge";
import { User } from "@/models/User";
import type { NextAuthConfig } from "next-auth";

const providers: NextAuthConfig["providers"] = [
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
      loginToken: { label: "Login token", type: "text" },
    },
    async authorize(credentials) {
      const loginToken = String(credentials?.loginToken ?? "").trim();
      if (loginToken) {
        try {
          const user = await consumeLoginToken(loginToken);
          if (!user) return null;
          return user;
        } catch (error) {
          console.error("[auth] login token authorize failed:", error);
          return null;
        }
      }

      const email = String(credentials?.email ?? "")
        .trim()
        .toLowerCase();
      const password = String(credentials?.password ?? "");

      if (!email || !password) return null;

      try {
        const result = await verifyCredentials(email, password);
        if (!result.ok) {
          console.error(
            `[auth] credentials rejected for ${email}: ${result.reason}`,
          );
          return null;
        }

        // Email/password sign-in completes only after OTP via loginToken.
        console.error(
          `[auth] credentials rejected for ${email}: otp_required`,
        );
        return null;
      } catch (error) {
        console.error("[auth] credentials authorize failed:", error);
        return null;
      }
    },
  }),
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.unshift(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  );
}

if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.unshift(
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  );
}

export const { handlers, signIn, signOut, auth, unstable_update } = NextAuth({
  ...authConfig,
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === "credentials") return true;
      if (!user.email) return false;

      await connectDB();
      let dbUser = await User.findOne({ email: user.email.toLowerCase() });
      const shouldBeAdmin = isAdminEmail(user.email);

      if (!dbUser) {
        dbUser = await User.create({
          email: user.email.toLowerCase(),
          name: user.name ?? undefined,
          image: user.image ?? undefined,
          isAdmin: shouldBeAdmin,
          adminPermissions: shouldBeAdmin ? ALL_ADMIN_PERMISSIONS : [],
        });
      } else {
        let changed = false;
        if (
          user.image &&
          dbUser.image !== user.image &&
          (!dbUser.avatarType || dbUser.avatarType === "image")
        ) {
          dbUser.image = user.image;
          changed = true;
        }
        if (shouldBeAdmin && !dbUser.isAdmin) {
          dbUser.isAdmin = true;
          changed = true;
        }
        if (dbUser.isAdmin && !shouldBeAdmin && !dbUser.adminPermissions?.length) {
          dbUser.adminPermissions = ALL_ADMIN_PERMISSIONS;
          changed = true;
        }
        if (changed) await dbUser.save();
      }

      user.id = dbUser._id.toString();
      user.username = dbUser.username ?? null;
      user.isAdmin = dbUser.isAdmin ?? false;
      user.adminPermissions = (
        Array.isArray(dbUser.adminPermissions)
          ? dbUser.adminPermissions.slice()
          : shouldBeAdmin
            ? ALL_ADMIN_PERMISSIONS
            : []
      ) as typeof ALL_ADMIN_PERMISSIONS;
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user?.id) {
        token.id = user.id;
        token.username = user.username ?? null;
        token.isAdmin = user.isAdmin === true;
        token.adminPermissions = user.adminPermissions;
        return compactAuthToken(token);
      }

      if (trigger === "update" && session) {
        const update = session as {
          username?: string;
          name?: string;
          user?: { username?: string; name?: string };
        };
        const nextUsername = update.username ?? update.user?.username;
        if (typeof nextUsername === "string") {
          token.username = nextUsername;
        }
        const nextName = update.name ?? update.user?.name;
        if (typeof nextName === "string") {
          token.name = nextName;
        }
        return compactAuthToken(token);
      }

      if (token.id) {
        const lastRefresh = (token as Record<string, unknown>).lastDbRefresh as number | undefined;
        const now = Date.now();
        // Only refresh from the database once every 10 minutes per session.
        if (!lastRefresh || now - lastRefresh > 600_000) {
          try {
            await connectDB();
            const dbUser = await User.findById(token.id)
              .select("username isAdmin email adminPermissions")
              .lean();

            if (dbUser) {
              const isSuper = isAdminEmail(dbUser.email);
              token.isAdmin = isSuper ? true : (dbUser.isAdmin ?? false);
              token.adminPermissions = isSuper
                ? ALL_ADMIN_PERMISSIONS
                : ((dbUser.adminPermissions as typeof ALL_ADMIN_PERMISSIONS) ?? []);
              if (isSuper && !dbUser.isAdmin) {
                await User.findByIdAndUpdate(token.id, { isAdmin: true, adminPermissions: ALL_ADMIN_PERMISSIONS });
              }
              token.username = dbUser.username ?? null;
            }
            (token as Record<string, unknown>).lastDbRefresh = now;
          } catch {
            // Keep session usable if the database is temporarily unavailable.
          }
        }
      }

      return compactAuthToken(token);
    },
  },
});
