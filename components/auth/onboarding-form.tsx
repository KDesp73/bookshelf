"use client";

import { useActionState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  completeOnboardingAction,
  type AuthActionState,
} from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function OnboardingForm() {
  const { update } = useSession();
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(
    completeOnboardingAction,
    {},
  );

  useEffect(() => {
    if (!state.success || !state.redirectTo || !state.username) return;

    let cancelled = false;

    async function finish() {
      try {
        await update({ user: { username: state.username } });
      } catch {
        // Server pages read username from the database if the JWT is still stale.
      }
      if (!cancelled) {
        window.location.assign(state.redirectTo!);
      }
    }

    void finish();

    return () => {
      cancelled = true;
    };
  }, [state.success, state.redirectTo, state.username, update]);

  return (
    <form action={formAction} className="mx-auto w-full max-w-sm space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          autoComplete="username"
          pattern="[a-z0-9_-]{3,30}"
          title="3–30 characters: lowercase letters, numbers, hyphens, underscores"
          required
          disabled={pending || state.success}
        />
        <p className="text-xs text-stone-500">
          Your public profile will be at /u/your-username
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="bio">Bio (optional)</Label>
        <Textarea
          id="bio"
          name="bio"
          rows={3}
          maxLength={280}
          disabled={pending || state.success}
        />
      </div>

      {state.error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}

      {state.success ? (
        <p className="text-sm text-stone-500">Taking you to your library…</p>
      ) : (
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Saving…" : "Continue to my library"}
        </Button>
      )}
    </form>
  );
}
