"use client";

import { useActionState } from "react";
import { loginAction, type AuthActionState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LoginFormProps {
  nextPath?: string;
}

export function LoginForm({ nextPath }: LoginFormProps) {
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(
    loginAction,
    {},
  );

  return (
    <form
      action={formAction}
      className="mx-auto w-full max-w-sm space-y-4"
    >
      {nextPath ? (
        <input type="hidden" name="next" value={nextPath} />
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="password">Admin password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
