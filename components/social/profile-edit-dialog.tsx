"use client";

import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import type { UserProfile } from "@/types/user";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif">Edit profile</DialogTitle>
        </DialogHeader>

        <ProfileSettingsForm
          user={user}
          showCancel
          onCancel={() => onOpenChange(false)}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
