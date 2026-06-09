import type { DefaultSession } from "next-auth";
import type { AdminPermission } from "@/lib/constants";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username?: string | null;
      isAdmin?: boolean;
      adminPermissions?: AdminPermission[];
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    username?: string | null;
    isAdmin?: boolean;
    adminPermissions?: AdminPermission[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username?: string | null;
    isAdmin?: boolean;
    adminPermissions?: AdminPermission[];
  }
}
