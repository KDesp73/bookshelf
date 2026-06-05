"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateProfileAction } from "@/actions/auth";
import type { UserProfile } from "@/types/user";
import { AvatarPicker } from "@/components/social/avatar-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ProfileSettingsFormProps {
  user: UserProfile;
  onSuccess?: () => void;
  showCancel?: boolean;
  onCancel?: () => void;
}

export function ProfileSettingsForm({
  user,
  onSuccess,
  showCancel = false,
  onCancel,
}: ProfileSettingsFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateProfileAction, {});

  useEffect(() => {
    if (state.success) {
      router.refresh();
      onSuccess?.();
    }
  }, [state.success, onSuccess, router]);

  return (
    <form
      key={`${user.name ?? ""}-${user.bio ?? ""}-${user.avatarType ?? ""}-${user.image ?? ""}`}
      action={formAction}
      className="space-y-4"
    >
      <AvatarPicker user={user} disabled={pending} />

      <div className="grid gap-2">
        <Label htmlFor="profile-name">Name</Label>
        <Input
          id="profile-name"
          name="name"
          defaultValue={user.name ?? ""}
          placeholder="Your display name"
          autoComplete="name"
          disabled={pending}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="profile-bio">Bio</Label>
        <Textarea
          id="profile-bio"
          name="bio"
          rows={3}
          maxLength={280}
          defaultValue={user.bio ?? ""}
          placeholder="A short intro for your public profile"
          disabled={pending}
        />
        <p className="text-xs text-stone-500">Max 280 characters.</p>
      </div>

      {state.error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-400">
          Profile updated.
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        {showCancel ? (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={pending}
          >
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </form>
  );
}
