import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { connectDB } from "@/lib/db";
import { isAdminEmail } from "@/lib/auth/admin";
import { User } from "@/models/User";
import type { NextAuthConfig } from "next-auth";

const providers: NextAuthConfig["providers"] = [
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = String(credentials?.email ?? "")
        .trim()
        .toLowerCase();
      const password = String(credentials?.password ?? "");

      if (!email || !password) return null;

      try {
        await connectDB();
        const user = await User.findOne({ email }).select("+passwordHash").lean();
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
          username: user.username ?? null,
          isAdmin: user.isAdmin ?? false,
        };
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
        if (changed) await dbUser.save();
      }

      user.id = dbUser._id.toString();
      user.username = dbUser.username ?? null;
      user.isAdmin = dbUser.isAdmin ?? false;
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user?.id) {
        token.id = user.id;
        token.username = user.username ?? null;
        token.isAdmin = user.isAdmin === true;
        return token;
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
        return token;
      }

      if (token.id) {
        try {
          await connectDB();
          const dbUser = await User.findById(token.id)
            .select("username isAdmin email")
            .lean();

          if (dbUser) {
            if (isAdminEmail(dbUser.email) && !dbUser.isAdmin) {
              await User.findByIdAndUpdate(token.id, { isAdmin: true });
              token.isAdmin = true;
            } else {
              token.isAdmin = dbUser.isAdmin ?? false;
            }
            token.username = dbUser.username ?? null;
          }
        } catch {
          // Keep session usable if the database is temporarily unavailable.
        }
      }

      return token;
    },
  },
});
