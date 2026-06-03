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
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        token.username = user.username ?? null;
        token.isAdmin = user.isAdmin === true;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = String(token.id);
        session.user.username =
          typeof token.username === "string" ? token.username : null;
        session.user.isAdmin = token.isAdmin === true;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
