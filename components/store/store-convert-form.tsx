"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { convertToStoreAction, updateStoreInfoAction } from "@/actions/store-settings";
import type { StoreSettingsState } from "@/actions/store-settings";
import type { SessionUser } from "@/lib/auth/get-session-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface StoreConvertFormProps {
  user: SessionUser;
}

export function StoreConvertForm({ user }: StoreConvertFormProps) {
  const router = useRouter();
  const { update } = useSession();
  const [isStore, setIsStore] = useState(user.isStore);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const action = isStore ? updateStoreInfoAction : convertToStoreAction;

    try {
      const result: StoreSettingsState = await action({}, formData);
      if (result.error) {
        setError(result.error);
        setPending(false);
        return;
      }
      setSuccess(true);
      if (!isStore) {
        setIsStore(true);
        await update();
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Try again.");
    }

    setPending(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="storeName">
          Store name {isStore ? "" : "(required to convert)"}
        </Label>
        <Input
          id="storeName"
          name="storeName"
          required
          disabled={pending}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="storeDescription">Description (optional)</Label>
        <Textarea
          id="storeDescription"
          name="storeDescription"
          rows={3}
          disabled={pending}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="storeAddress">Address (optional)</Label>
        <Input
          id="storeAddress"
          name="storeAddress"
          disabled={pending}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="storePhone">Phone (optional)</Label>
        <Input
          id="storePhone"
          name="storePhone"
          type="tel"
          disabled={pending}
        />
      </div>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      {success ? (
        <p className="text-sm text-green-600 dark:text-green-400">
          {isStore
            ? "Store information updated."
            : "Account converted to store! You can now manage books and ads from the store dashboard."}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending
          ? "Saving\u2026"
          : isStore
            ? "Update store info"
            : "Convert to store account"}
      </Button>
    </form>
  );
}
