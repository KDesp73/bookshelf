"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

interface SessionSyncRedirectProps {
  username: string;
  href?: string;
}

/**
 * Refreshes the JWT with the username from the database, then navigates with a
 * full page load so middleware sees the updated session cookie.
 */
export function SessionSyncRedirect({
  username,
  href = "/",
}: SessionSyncRedirectProps) {
  const { update } = useSession();

  useEffect(() => {
    let cancelled = false;

    async function syncAndGo() {
      try {
        await update({ user: { username } });
      } catch {
        // Still navigate — server pages read username from the database.
      }
      if (!cancelled) {
        window.location.assign(href);
      }
    }

    void syncAndGo();

    return () => {
      cancelled = true;
    };
  }, [username, href, update]);

  return (
    <p className="text-center text-sm text-stone-500">Taking you to your library…</p>
  );
}
