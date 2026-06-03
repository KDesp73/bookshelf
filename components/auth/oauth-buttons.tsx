"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

interface OAuthButtonsProps {
  callbackUrl?: string;
}

export function OAuthButtons({ callbackUrl = "/" }: OAuthButtonsProps) {
  return (
    <div className="grid gap-2">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => signIn("google", { callbackUrl })}
      >
        Continue with Google
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => signIn("github", { callbackUrl })}
      >
        Continue with GitHub
      </Button>
    </div>
  );
}
