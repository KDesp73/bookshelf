"use client";

import { signIn } from "next-auth/react";
import type { OAuthProviderId } from "@/lib/auth/oauth-providers";
import { Button } from "@/components/ui/button";

interface OAuthButtonsProps {
  providers: OAuthProviderId[];
  callbackUrl?: string;
}

const LABELS: Record<OAuthProviderId, string> = {
  google: "Continue with Google",
  github: "Continue with GitHub",
};

export function OAuthButtons({
  providers,
  callbackUrl = "/",
}: OAuthButtonsProps) {
  if (providers.length === 0) return null;

  return (
    <div className="grid gap-2">
      {providers.map((provider) => (
        <Button
          key={provider}
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => signIn(provider, { callbackUrl })}
        >
          {LABELS[provider]}
        </Button>
      ))}
    </div>
  );
}
