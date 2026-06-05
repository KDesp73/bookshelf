"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { updatePromotionalEmailsAction } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PromotionalEmailsToggleProps {
  promotionalEmailsOptIn: boolean;
}

export function PromotionalEmailsToggle({
  promotionalEmailsOptIn: initialOptIn,
}: PromotionalEmailsToggleProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optIn, setOptIn] = useState(initialOptIn);
  const [error, setError] = useState<string | null>(null);

  function setPreference(nextOptIn: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await updatePromotionalEmailsAction(nextOptIn);
      if (!result.success) {
        setError(result.error ?? "Could not update preferences.");
        return;
      }
      setOptIn(result.data.promotionalEmailsOptIn);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3 border-t border-stone-200/80 pt-4 dark:border-stone-700">
      <div className="flex items-start gap-3">
        <Mail className="mt-0.5 h-4 w-4 shrink-0 text-stone-500" />
        <div>
          <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
            Promotional emails
          </p>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            {optIn
              ? "You will receive occasional updates about BookShelf features and reading community news."
              : "You will not receive promotional emails. Security and account emails still apply."}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={optIn ? "default" : "outline"}
          disabled={pending || optIn}
          onClick={() => setPreference(true)}
          className={cn(optIn && "pointer-events-none")}
        >
          Opt in
        </Button>
        <Button
          type="button"
          size="sm"
          variant={!optIn ? "default" : "outline"}
          disabled={pending || !optIn}
          onClick={() => setPreference(false)}
          className={cn(!optIn && "pointer-events-none")}
        >
          Opt out
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
