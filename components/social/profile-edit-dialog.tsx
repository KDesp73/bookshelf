"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateProfileAction } from "@/actions/auth";
import type { UserProfile } from "@/types/user";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ProfileEditDialogProps {
  user: UserProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileEditDialog({
  user,
  open,
  onOpenChange,
}: ProfileEditDialogProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateProfileAction, {});

  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
      router.refresh();
    }
  }, [state.success, onOpenChange, router]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">Edit profile</DialogTitle>
        </DialogHeader>

        <form
          key={`${user.name ?? ""}-${user.bio ?? ""}`}
          action={formAction}
          className="space-y-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="profile-name">Name</Label>
            <Input
              id="profile-name"
              name="name"
              defaultValue={user.name ?? ""}
              placeholder="Your display name"
              autoComplete="name"
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
            />
            <p className="text-xs text-stone-500">Max 280 characters.</p>
          </div>

          {state.error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
