import type { JWT } from "next-auth/jwt";

/** Drop fields that can bloat the session cookie (Vercel limit ~4KB). */
export function compactAuthToken(token: JWT): JWT {
  delete token.picture;
  delete token.image;
  return token;
}
