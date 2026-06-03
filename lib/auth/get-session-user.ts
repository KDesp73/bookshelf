import "server-only";

import { auth } from "@/auth";

export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  username?: string | null;
  isAdmin: boolean;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name,
    image: session.user.image,
    username: session.user.username,
    isAdmin: session.user.isAdmin === true,
  };
}
