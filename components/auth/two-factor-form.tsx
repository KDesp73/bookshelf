"use client";

import Link from "next/link";
import { useState } from "react";
import {
  resendLoginCodeAction,
  verifyLoginCodeAction,
} from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TwoFactorFormProps {
  callbackUrl: string;
  maskedEmail?: string | null;
}

export function TwoFactorForm({ callbackUrl, maskedEmail }: TwoFactorFormProps) {
  const [pending, setPending] = useState(false);
  const [resendPending, setResendPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    formData.set("callbackUrl", callbackUrl);

    try {
      const result = await verifyLoginCodeAction({}, formData);

      if (result.error) {
        setError(result.error);
        setPending(false);
        return;
      }

      window.location.assign(result.redirectTo ?? callbackUrl);
    } catch {
      setError("Could not verify code. Try again.");
      setPending(false);
    }
  }

  async function handleResend() {
    setError(null);
    setResent(false);
    setResendPending(true);

    try {
      const result = await resendLoginCodeAction();
      if (result.error) {
        setError(result.error);
        setResendPending(false);
        return;
      }
      setResent(true);
      setResendPending(false);
    } catch {
      setError("Could not resend code. Try again.");
      setResendPending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm space-y-6">
      <div className="text-center">
        <p className="text-sm text-stone-600 dark:text-stone-400">
          We sent a 6-digit code
          {maskedEmail ? (
            <>
              {" "}
              to <span className="font-medium text-stone-800 dark:text-stone-200">{maskedEmail}</span>
            </>
          ) : (
            " to your email"
          )}
          .
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="code">Verification code</Label>
          <Input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="123456"
            required
            disabled={pending}
            className="text-center text-lg tracking-[0.3em]"
          />
        </div>

        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : null}
        {resent ? (
          <p className="text-sm text-green-700 dark:text-green-400">
            A new code was sent.
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Verifying…" : "Continue"}
        </Button>
      </form>

      <div className="flex flex-col items-center gap-2 text-sm text-stone-500">
        <button
          type="button"
          onClick={handleResend}
          disabled={pending || resendPending}
          className="font-medium text-amber-800 hover:underline disabled:opacity-60 dark:text-amber-300"
        >
          {resendPending ? "Sending…" : "Resend code"}
        </button>
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-medium text-amber-800 hover:underline dark:text-amber-300"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
