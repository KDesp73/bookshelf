import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config. Used by middleware only — no Node.js modules.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        token.username = user.username ?? null;
        token.isAdmin = user.isAdmin === true;
        token.adminPermissions = Array.isArray(user.adminPermissions) ? user.adminPermissions.slice() : user.adminPermissions;
      }
      delete token.picture;
      delete token.image;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = String(token.id);
        session.user.username =
          typeof token.username === "string" ? token.username : null;
        session.user.isAdmin = token.isAdmin === true;
        session.user.isStore = token.isStore === true;
        session.user.adminPermissions = token.adminPermissions;
        // Avatars are loaded from the database, not stored in the JWT cookie.
        delete session.user.image;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
