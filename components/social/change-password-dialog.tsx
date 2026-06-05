"use client";

import { ChangePasswordForm } from "@/components/settings/change-password-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({
  open,
  onOpenChange,
}: ChangePasswordDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">Change password</DialogTitle>
        </DialogHeader>

        <ChangePasswordForm onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
